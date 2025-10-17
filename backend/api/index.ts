import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tickets, projects, people, ticketsToPeople } from '../db/schema/schema';
import { eq, and } from 'drizzle-orm';


const app = express();
const port = 3001;

const apiRouter = express.Router();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

app.use(cors());
app.use(express.json());

apiRouter.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

// Projects routes
app.get('/api/projects', async (req, res) => {
    try {
        const data = await db.select().from(projects);
        res.status(200).json(data);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const [newProject] = await db.insert(projects).values({
            name,
            description: description || null,
        }).returning();

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

// People routes
app.get('/api/people', async (req, res) => {
    try {
        const data = await db.select().from(people);
        res.status(200).json(data);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/people', async (req, res) => {
    try {
        const { name, email } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const [newPerson] = await db.insert(people).values({
            name,
            email: email || null,
        }).returning();

        res.status(201).json(newPerson);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ticket-People assignment routes
app.post('/api/tickets/:ticketId/people', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { personId } = req.body;
        
        if (!personId) {
            return res.status(400).json({ error: 'personId is required' });
        }

        // Check if ticket and person exist
        const ticket = await db.select().from(tickets).where(eq(tickets.id, parseInt(ticketId))).limit(1);
        const person = await db.select().from(people).where(eq(people.id, parseInt(personId))).limit(1);

        if (ticket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        if (person.length === 0) {
            return res.status(404).json({ error: 'Person not found' });
        }

        // Check if assignment already exists
        const existingAssignment = await db.select()
            .from(ticketsToPeople)
            .where(and(
                eq(ticketsToPeople.ticketId, parseInt(ticketId)),
                eq(ticketsToPeople.personId, parseInt(personId))
            ))
            .limit(1);

        if (existingAssignment.length > 0) {
            return res.status(409).json({ error: 'Person is already assigned to this ticket' });
        }

        // Assign person to ticket
        const [assignment] = await db.insert(ticketsToPeople).values({
            ticketId: parseInt(ticketId),
            personId: parseInt(personId),
        }).returning();

        res.status(201).json(assignment);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tickets/:ticketId/people/:personId', async (req, res) => {
    try {
        const { ticketId, personId } = req.params;
        
        // Remove person from ticket
        const deletedAssignment = await db.delete(ticketsToPeople)
            .where(and(
                eq(ticketsToPeople.ticketId, parseInt(ticketId)),
                eq(ticketsToPeople.personId, parseInt(personId))
            ))
            .returning();

        if (deletedAssignment.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.status(200).json({ message: 'Person removed from ticket successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific ticket with people
app.get('/api/tickets/:ticketId', async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        // Get ticket details
        const ticket = await db.select().from(tickets)
            .where(eq(tickets.id, parseInt(ticketId)))
            .limit(1);

        if (ticket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Get people assigned to this ticket
        const ticketPeople = await db.select({
            personId: people.id,
            personName: people.name,
            personEmail: people.email,
        })
        .from(ticketsToPeople)
        .innerJoin(people, eq(ticketsToPeople.personId, people.id))
        .where(eq(ticketsToPeople.ticketId, parseInt(ticketId)));

        // Get project details
        const project = await db.select().from(projects)
            .where(eq(projects.id, ticket[0].projectId))
            .limit(1);

        // Combine ticket data with people and project
        const ticketWithDetails = {
            ...ticket[0],
            project: project[0],
            people: ticketPeople
        };

        res.status(200).json(ticketWithDetails);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Tickets routes
app.get('/api/tickets', async (req, res) => {
    try {
        const data = await db.select().from(tickets);
        res.status(200).json(data);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tickets', async (req, res) => {
    try {
        const { projectId, title, content, decision, consequences, status, isAiGenerated } = req.body;
        
        if (!projectId || !title) {
            return res.status(400).json({ error: 'projectId and title are required' });
        }

        const [newTicket] = await db.insert(tickets).values({
            projectId: parseInt(projectId),
            title,
            content: content || null,
            decision: decision || null,
            consequences: consequences || null,
            status: status || 'To Do',
            isAiGenerated: isAiGenerated || false,
        }).returning();

        res.status(201).json(newTicket);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});


if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;