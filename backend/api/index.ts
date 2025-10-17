import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tickets, projects, people, ticketsToPeople, ticketDependencies } from '../db/schema/schema';
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
    console.log('Backend: GET /api/projects');
    try {
        const data = await db.select().from(projects);
        console.log('Backend: Found', data.length, 'projects');
        res.status(200).json(data);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/projects', async (req, res) => {
    console.log('Backend: POST /api/projects', req.body);
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const [newProject] = await db.insert(projects).values({
            name,
            description: description || null,
        }).returning();

        console.log('Backend: Created project', newProject);
        res.status(201).json(newProject);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedProject = await db.delete(projects)
            .where(eq(projects.id, parseInt(id)))
            .returning();

        if (deletedProject.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

// People routes
app.get('/api/people', async (req, res) => {
    console.log('Backend: GET /api/people');
    try {
        const data = await db.select().from(people);
        console.log('Backend: Found', data.length, 'people');
        res.status(200).json(data);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/people', async (req, res) => {
    console.log('Backend: POST /api/people', req.body);
    try {
        const { name, email } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const [newPerson] = await db.insert(people).values({
            name,
            email: email || null,
        }).returning();

        console.log('Backend: Created person', newPerson);
        res.status(201).json(newPerson);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/people/:id', async (req, res) => {
    console.log('Backend: DELETE /api/people/' + req.params.id);
    try {
        const { id } = req.params;
        
        const deletedPerson = await db.delete(people)
            .where(eq(people.id, parseInt(id)))
            .returning();

        if (deletedPerson.length === 0) {
            return res.status(404).json({ error: 'Person not found' });
        }

        console.log('Backend: Deleted person', deletedPerson[0]);
        res.status(200).json({ message: 'Person deleted successfully' });
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

        // Get dependencies (tickets this ticket depends on)
        const dependencies = await db.select({
            dependsOnTicketId: tickets.id,
            dependsOnTitle: tickets.title,
            dependsOnStatus: tickets.status,
        })
        .from(ticketDependencies)
        .innerJoin(tickets, eq(ticketDependencies.dependsOnTicketId, tickets.id))
        .where(eq(ticketDependencies.ticketId, parseInt(ticketId)));

        // Get dependents (tickets that depend on this ticket)
        const dependents = await db.select({
            dependentTicketId: tickets.id,
            dependentTitle: tickets.title,
            dependentStatus: tickets.status,
        })
        .from(ticketDependencies)
        .innerJoin(tickets, eq(ticketDependencies.ticketId, tickets.id))
        .where(eq(ticketDependencies.dependsOnTicketId, parseInt(ticketId)));

        // Get project details
        const project = await db.select().from(projects)
            .where(eq(projects.id, ticket[0].projectId))
            .limit(1);

        // Combine ticket data with people, dependencies, and project
        const ticketWithDetails = {
            ...ticket[0],
            project: project[0],
            people: ticketPeople,
            dependencies: dependencies,
            dependents: dependents
        };

        res.status(200).json(ticketWithDetails);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ticket dependency routes
app.post('/api/tickets/:ticketId/dependencies', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { dependsOnTicketId } = req.body;
        
        if (!dependsOnTicketId) {
            return res.status(400).json({ error: 'dependsOnTicketId is required' });
        }

        const sourceTicketId = parseInt(ticketId);
        const targetTicketId = parseInt(dependsOnTicketId);

        // Prevent self-dependency
        if (sourceTicketId === targetTicketId) {
            return res.status(400).json({ error: 'A ticket cannot depend on itself' });
        }

        // Check if both tickets exist
        const sourceTicket = await db.select().from(tickets).where(eq(tickets.id, sourceTicketId)).limit(1);
        const targetTicket = await db.select().from(tickets).where(eq(tickets.id, targetTicketId)).limit(1);

        if (sourceTicket.length === 0) {
            return res.status(404).json({ error: 'Source ticket not found' });
        }
        if (targetTicket.length === 0) {
            return res.status(404).json({ error: 'Target ticket not found' });
        }

        // Check if dependency already exists
        const existingDependency = await db.select()
            .from(ticketDependencies)
            .where(and(
                eq(ticketDependencies.ticketId, sourceTicketId),
                eq(ticketDependencies.dependsOnTicketId, targetTicketId)
            ))
            .limit(1);

        if (existingDependency.length > 0) {
            return res.status(409).json({ error: 'Dependency already exists' });
        }

        // Check for circular dependency
        const circularCheck = await db.select()
            .from(ticketDependencies)
            .where(and(
                eq(ticketDependencies.ticketId, targetTicketId),
                eq(ticketDependencies.dependsOnTicketId, sourceTicketId)
            ))
            .limit(1);

        if (circularCheck.length > 0) {
            return res.status(400).json({ error: 'Circular dependency detected' });
        }

        // Create dependency
        const [dependency] = await db.insert(ticketDependencies).values({
            ticketId: sourceTicketId,
            dependsOnTicketId: targetTicketId,
        }).returning();

        res.status(201).json({
            ...dependency,
            message: 'Dependency created successfully'
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tickets/:ticketId/dependencies/:dependsOnTicketId', async (req, res) => {
    try {
        const { ticketId, dependsOnTicketId } = req.params;
        
        const sourceTicketId = parseInt(ticketId);
        const targetTicketId = parseInt(dependsOnTicketId);
        
        // Remove dependency
        const deletedDependency = await db.delete(ticketDependencies)
            .where(and(
                eq(ticketDependencies.ticketId, sourceTicketId),
                eq(ticketDependencies.dependsOnTicketId, targetTicketId)
            ))
            .returning();

        if (deletedDependency.length === 0) {
            return res.status(404).json({ error: 'Dependency not found' });
        }

        res.status(200).json({ message: 'Dependency removed successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Tickets routes
app.get('/api/tickets', async (req, res) => {
    console.log('Backend: GET /api/tickets');
    try {
        const data = await db.select().from(tickets);
        console.log('Backend: Found', data.length, 'tickets');
        res.status(200).json(data);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tickets', async (req, res) => {
    console.log('Backend: POST /api/tickets', req.body);
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

        console.log('Backend: Created ticket', newTicket);
        res.status(201).json(newTicket);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tickets/:id', async (req, res) => {
    console.log('Backend: PUT /api/tickets/' + req.params.id, req.body);
    try {
        const { id } = req.params;
        const { projectId, title, content, decision, consequences, status, isAiGenerated } = req.body;
        
        const [updatedTicket] = await db.update(tickets)
            .set({
                projectId: projectId ? parseInt(projectId) : undefined,
                title,
                content,
                decision,
                consequences,
                status,
                isAiGenerated,
            })
            .where(eq(tickets.id, parseInt(id)))
            .returning();

        if (!updatedTicket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        console.log('Backend: Updated ticket', updatedTicket);
        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tickets/:id', async (req, res) => {
    console.log('Backend: DELETE /api/tickets/' + req.params.id);
    try {
        const { id } = req.params;
        
        const deletedTicket = await db.delete(tickets)
            .where(eq(tickets.id, parseInt(id)))
            .returning();

        if (deletedTicket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        console.log('Backend: Deleted ticket', deletedTicket[0]);
        res.status(200).json({ message: 'Ticket deleted successfully' });
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