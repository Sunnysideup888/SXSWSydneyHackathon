require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

const apiRouter = express.Router();

// In-memory data storage (for demo purposes)
let projects = [
    {
        id: 1,
        name: "Sprint 1",
        description: "First sprint of the AI JIRA project",
        createdAt: new Date().toISOString(),
        isAiGenerated: false
    },
    {
        id: 2,
        name: "Sprint 2", 
        description: "Second sprint with advanced features",
        createdAt: new Date().toISOString(),
        isAiGenerated: true
    }
];

let tickets = [
    {
        id: 1,
        projectId: 1,
        title: "Set up project structure",
        context: "We need to establish the basic project architecture",
        decision: "Use React + Express + PostgreSQL stack",
        consequences: "Fast development, good community support",
        status: "Done",
        isAiGenerated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 2,
        projectId: 1,
        title: "Implement dependency tracking",
        context: "Users need to see how tickets relate to each other",
        decision: "Use React Flow for visualization",
        consequences: "Interactive graphs, better project understanding",
        status: "In Progress",
        isAiGenerated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

let people = [
    {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe"
    },
    {
        id: 2,
        name: "Jane Smith", 
        email: "jane@example.com",
        username: "janesmith"
    }
];

let ticketDependencies = [
    {
        ticketId: 2,
        dependsOnTicketId: 1
    }
];

let nextId = {
    projects: 3,
    tickets: 3,
    people: 3
};

app.use(cors());
app.use(express.json());

// Health check
apiRouter.get('/', (req, res) => {
    res.json({ message: 'AI JIRA API is running!' });
});

// Projects endpoints
apiRouter.get('/projects', (req, res) => {
    try {
        res.json(projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

apiRouter.get('/projects/:projectId', (req, res) => {
    try {
        const { projectId } = req.params;
        const project = projects.find(p => p.id === parseInt(projectId));
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

apiRouter.post('/projects', (req, res) => {
    try {
        const { name, description } = req.body;
        const newProject = {
            id: nextId.projects++,
            name,
            description,
            createdAt: new Date().toISOString(),
            isAiGenerated: false
        };
        projects.push(newProject);
        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Tickets endpoints
apiRouter.get('/projects/:projectId/tickets', (req, res) => {
    try {
        const { projectId } = req.params;
        const { status } = req.query;
        
        let projectTickets = tickets.filter(ticket => ticket.projectId === parseInt(projectId));
        
        if (status) {
            projectTickets = projectTickets.filter(ticket => ticket.status === status);
        }
        
        res.json(projectTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

apiRouter.post('/projects/:projectId/tickets', (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, context, decision, consequences, isAiGenerated, peopleIds } = req.body;
        
        const newTicket = {
            id: nextId.tickets++,
            projectId: parseInt(projectId),
            title,
            context,
            decision,
            consequences,
            isAiGenerated: isAiGenerated || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'Backlog'
        };
        
        tickets.push(newTicket);
        res.status(201).json(newTicket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

apiRouter.put('/tickets/:ticketId', (req, res) => {
    try {
        const { ticketId } = req.params;
        const { title, context, decision, consequences, status } = req.body;
        
        const ticketIndex = tickets.findIndex(t => t.id === parseInt(ticketId));
        if (ticketIndex === -1) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        tickets[ticketIndex] = {
            ...tickets[ticketIndex],
            title,
            context,
            decision,
            consequences,
            status,
            updatedAt: new Date().toISOString()
        };
        
        res.json(tickets[ticketIndex]);
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

// Dependencies endpoints
apiRouter.get('/tickets/:ticketId/dependencies', (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticketIdNum = parseInt(ticketId);
        
        // Get tickets this ticket depends on
        const dependencies = ticketDependencies
            .filter(dep => dep.ticketId === ticketIdNum)
            .map(dep => {
                const ticket = tickets.find(t => t.id === dep.dependsOnTicketId);
                return ticket ? {
                    id: ticket.id,
                    title: ticket.title,
                    status: ticket.status,
                    isAiGenerated: ticket.isAiGenerated
                } : null;
            })
            .filter(Boolean);

        // Get tickets that depend on this ticket
        const dependents = ticketDependencies
            .filter(dep => dep.dependsOnTicketId === ticketIdNum)
            .map(dep => {
                const ticket = tickets.find(t => t.id === dep.ticketId);
                return ticket ? {
                    id: ticket.id,
                    title: ticket.title,
                    status: ticket.status,
                    isAiGenerated: ticket.isAiGenerated
                } : null;
            })
            .filter(Boolean);

        res.json({ dependencies, dependents });
    } catch (error) {
        console.error('Error fetching dependencies:', error);
        res.status(500).json({ error: 'Failed to fetch dependencies' });
    }
});

apiRouter.post('/tickets/:ticketId/dependencies', (req, res) => {
    try {
        const { ticketId } = req.params;
        const { dependsOnTicketId } = req.body;
        
        const newDependency = {
            ticketId: parseInt(ticketId),
            dependsOnTicketId: parseInt(dependsOnTicketId)
        };
        
        ticketDependencies.push(newDependency);
        res.status(201).json(newDependency);
    } catch (error) {
        console.error('Error creating dependency:', error);
        res.status(500).json({ error: 'Failed to create dependency' });
    }
});

// Basic Summarization endpoint (no AI)
apiRouter.post('/tickets/:ticketId/summarize', (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticketIdNum = parseInt(ticketId);
        
        // Get the current ticket
        const currentTicket = tickets.find(t => t.id === ticketIdNum);
        
        if (!currentTicket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Get all dependencies
        const dependencies = ticketDependencies
            .filter(dep => dep.ticketId === ticketIdNum)
            .map(dep => tickets.find(t => t.id === dep.dependsOnTicketId))
            .filter(Boolean);

        const basicSummary = `Dependency Summary for Ticket #${currentTicket.id} - ${currentTicket.title}

Dependencies Found: ${dependencies.length}

${dependencies.length > 0 ? 'Dependent Tickets:' : 'No dependencies found.'}
${dependencies.map(dep => 
    `• #${dep.id}: ${dep.title} (${dep.status})
  Context: ${dep.context || 'Not specified'}
  Decision: ${dep.decision || 'Not specified'}
  Consequences: ${dep.consequences || 'Not specified'}`
).join('\n\n')}

This is a basic summary. For AI-powered insights, the full version would require OpenAI integration.`;

        res.json({ 
            summary: basicSummary,
            dependenciesCount: dependencies.length,
            aiEnabled: false
        });
    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

// People endpoints
apiRouter.get('/people', (req, res) => {
    try {
        res.json(people.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
        console.error('Error fetching people:', error);
        res.status(500).json({ error: 'Failed to fetch people' });
    }
});

apiRouter.post('/people', (req, res) => {
    try {
        const { name, email, username } = req.body;
        const newPerson = {
            id: nextId.people++,
            name,
            email,
            username
        };
        people.push(newPerson);
        res.status(201).json(newPerson);
    } catch (error) {
        console.error('Error creating person:', error);
        res.status(500).json({ error: 'Failed to create person' });
    }
});

// Get ticket with people
apiRouter.get('/tickets/:ticketId', (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticketIdNum = parseInt(ticketId);
        
        const ticket = tickets.find(t => t.id === ticketIdNum);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // For now, return empty assigned people array
        res.json({ ...ticket, assignedPeople: [] });
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