require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('../db/connection');
const { projects, tickets, people, ticketsToPeople, ticketDependencies } = require('../db/schema');
const { eq, and, or, desc, asc } = require('drizzle-orm');
const OpenAI = require('openai');

const app = express();
const port = 3001;

const apiRouter = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// Health check
apiRouter.get('/', (req, res) => {
    res.json({ message: 'AI JIRA API is running!' });
});

// Projects endpoints
apiRouter.get('/projects', async (req, res) => {
    try {
        const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
        res.json(allProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

apiRouter.post('/projects', async (req, res) => {
    try {
        const { name, description } = req.body;
        const newProject = await db.insert(projects).values({
            name,
            description,
        }).returning();
        res.status(201).json(newProject[0]);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Tickets endpoints
apiRouter.get('/projects/:projectId/tickets', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { status } = req.query;
        
        let query = db.select().from(tickets).where(eq(tickets.projectId, projectId));
        
        if (status) {
            query = query.where(and(eq(tickets.projectId, projectId), eq(tickets.status, status)));
        }
        
        const projectTickets = await query.orderBy(desc(tickets.createdAt));
        res.json(projectTickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

apiRouter.post('/projects/:projectId/tickets', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, context, decision, consequences, isAiGenerated, peopleIds } = req.body;
        
        const newTicket = await db.insert(tickets).values({
            projectId: parseInt(projectId),
            title,
            context,
            decision,
            consequences,
            isAiGenerated: isAiGenerated || false,
        }).returning();

        // Add people to ticket if provided
        if (peopleIds && peopleIds.length > 0) {
            const ticketPeople = peopleIds.map(personId => ({
                ticketId: newTicket[0].id,
                personId: parseInt(personId)
            }));
            await db.insert(ticketsToPeople).values(ticketPeople);
        }

        res.status(201).json(newTicket[0]);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

apiRouter.put('/tickets/:ticketId', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { title, context, decision, consequences, status, peopleIds } = req.body;
        
        const updatedTicket = await db.update(tickets)
            .set({
                title,
                context,
                decision,
                consequences,
                status,
                updatedAt: new Date(),
            })
            .where(eq(tickets.id, parseInt(ticketId)))
            .returning();

        // Update people assignments if provided
        if (peopleIds !== undefined) {
            // Remove existing assignments
            await db.delete(ticketsToPeople).where(eq(ticketsToPeople.ticketId, parseInt(ticketId)));
            
            // Add new assignments
            if (peopleIds.length > 0) {
                const ticketPeople = peopleIds.map(personId => ({
                    ticketId: parseInt(ticketId),
                    personId: parseInt(personId)
                }));
                await db.insert(ticketsToPeople).values(ticketPeople);
            }
        }

        res.json(updatedTicket[0]);
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

// Dependencies endpoints
apiRouter.get('/tickets/:ticketId/dependencies', async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        // Get tickets this ticket depends on
        const dependencies = await db
            .select({
                id: tickets.id,
                title: tickets.title,
                status: tickets.status,
                isAiGenerated: tickets.isAiGenerated,
            })
            .from(ticketDependencies)
            .innerJoin(tickets, eq(ticketDependencies.dependsOnTicketId, tickets.id))
            .where(eq(ticketDependencies.ticketId, parseInt(ticketId)));

        // Get tickets that depend on this ticket
        const dependents = await db
            .select({
                id: tickets.id,
                title: tickets.title,
                status: tickets.status,
                isAiGenerated: tickets.isAiGenerated,
            })
            .from(ticketDependencies)
            .innerJoin(tickets, eq(ticketDependencies.ticketId, tickets.id))
            .where(eq(ticketDependencies.dependsOnTicketId, parseInt(ticketId)));

        res.json({ dependencies, dependents });
    } catch (error) {
        console.error('Error fetching dependencies:', error);
        res.status(500).json({ error: 'Failed to fetch dependencies' });
    }
});

apiRouter.post('/tickets/:ticketId/dependencies', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { dependsOnTicketId } = req.body;
        
        const newDependency = await db.insert(ticketDependencies).values({
            ticketId: parseInt(ticketId),
            dependsOnTicketId: parseInt(dependsOnTicketId),
        }).returning();

        res.status(201).json(newDependency[0]);
    } catch (error) {
        console.error('Error creating dependency:', error);
        res.status(500).json({ error: 'Failed to create dependency' });
    }
});

// AI Summarization endpoint
apiRouter.post('/tickets/:ticketId/summarize', async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        // Get the current ticket
        const currentTicket = await db.select().from(tickets).where(eq(tickets.id, parseInt(ticketId)));
        
        if (currentTicket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Get all dependencies
        const { dependencies } = await db
            .select({
                id: tickets.id,
                title: tickets.title,
                context: tickets.context,
                decision: tickets.decision,
                consequences: tickets.consequences,
                status: tickets.status,
            })
            .from(ticketDependencies)
            .innerJoin(tickets, eq(ticketDependencies.dependsOnTicketId, tickets.id))
            .where(eq(ticketDependencies.ticketId, parseInt(ticketId)));

        // Prepare context for AI
        const contextText = dependencies.map(dep => 
            `Ticket #${dep.id}: ${dep.title}\nContext: ${dep.context || 'N/A'}\nDecision: ${dep.decision || 'N/A'}\nConsequences: ${dep.consequences || 'N/A'}\nStatus: ${dep.status}`
        ).join('\n\n');

        const prompt = `Based on the following ticket dependencies, provide a comprehensive summary of the decisions made and their context:

Current Ticket: #${currentTicket[0].id} - ${currentTicket[0].title}

Dependencies:
${contextText}

Please provide:
1. A summary of key decisions made in previous tickets
2. The context and reasoning behind these decisions
3. Any potential impacts or considerations for the current ticket
4. Recommendations based on the dependency chain

Format the response in a clear, structured way.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000,
        });

        res.json({ 
            summary: completion.choices[0].message.content,
            dependenciesCount: dependencies.length 
        });
    } catch (error) {
        console.error('Error generating AI summary:', error);
        res.status(500).json({ error: 'Failed to generate AI summary' });
    }
});

// People endpoints
apiRouter.get('/people', async (req, res) => {
    try {
        const allPeople = await db.select().from(people).orderBy(asc(people.name));
        res.json(allPeople);
    } catch (error) {
        console.error('Error fetching people:', error);
        res.status(500).json({ error: 'Failed to fetch people' });
    }
});

apiRouter.post('/people', async (req, res) => {
    try {
        const { name, email, username } = req.body;
        const newPerson = await db.insert(people).values({
            name,
            email,
            username,
        }).returning();
        res.status(201).json(newPerson[0]);
    } catch (error) {
        console.error('Error creating person:', error);
        res.status(500).json({ error: 'Failed to create person' });
    }
});

// Get ticket with people
apiRouter.get('/tickets/:ticketId', async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        const ticket = await db.select().from(tickets).where(eq(tickets.id, parseInt(ticketId)));
        
        if (ticket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Get assigned people
        const assignedPeople = await db
            .select({
                id: people.id,
                name: people.name,
                email: people.email,
                username: people.username,
            })
            .from(ticketsToPeople)
            .innerJoin(people, eq(ticketsToPeople.personId, people.id))
            .where(eq(ticketsToPeople.ticketId, parseInt(ticketId)));

        res.json({ ...ticket[0], assignedPeople });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ error: 'Failed to fetch ticket' });
    }
});

app.use('/api', apiRouter);

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`AI JIRA API running on http://localhost:${port}`);
    });
}

module.exports = app;