import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tickets, projects, people, ticketsToPeople, ticketDependencies, ticketStatusEnum } from '../db/schema/schema';
import { eq, and } from 'drizzle-orm';
import { Agent, createClient } from '@relevanceai/sdk';

const app = express();
const port = 3001;

const apiRouter = express.Router();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

// Initialize Relevance AI client
const relevanceClient = createClient({
  apiKey: process.env.RELEVANCE_API_KEY || '',
  region: 'f1db6c' as any, // Your region
  project: process.env.RELEVANCE_PROJECT_ID || '',
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Body:`, req.body);
    next();
});

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
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get specific project with tickets
app.get('/api/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Get project details
        const project = await db.select().from(projects)
            .where(eq(projects.id, parseInt(projectId)))
            .limit(1);

        if (project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get tickets for this project
        const projectTickets = await db.select({
            id: tickets.id,
            title: tickets.title,
            content: tickets.content,
            decision: tickets.decision,
            consequences: tickets.consequences,
            status: tickets.status,
            isAiGenerated: tickets.isAiGenerated,
            createdAt: tickets.createdAt,
        })
        .from(tickets)
        .where(eq(tickets.projectId, parseInt(projectId)));

        // Combine project data with tickets
        const projectWithTickets = {
            ...project[0],
            tickets: projectTickets
        };

        res.status(200).json(projectWithTickets);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// Update project
app.put('/api/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description } = req.body;
        
        // Check if project exists
        const existingProject = await db.select().from(projects)
            .where(eq(projects.id, parseInt(projectId)))
            .limit(1);

        if (existingProject.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Prepare update data (only include fields that are provided)
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        updateData.updatedAt = new Date();

        // Update project
        const [updatedProject] = await db.update(projects)
            .set(updateData)
            .where(eq(projects.id, parseInt(projectId)))
            .returning();

        res.status(200).json(updatedProject);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// Delete project
app.delete('/api/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const deletedProject = await db.delete(projects)
            .where(eq(projects.id, parseInt(projectId)))
            .returning();

        if (deletedProject.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get ticket dependency graph
app.get('/api/tickets/:ticketId/dependency-graph', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const sourceTicketId = parseInt(ticketId);

        // Check if ticket exists
        const ticket = await db.select().from(tickets)
            .where(eq(tickets.id, sourceTicketId))
            .limit(1);

        if (ticket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Recursive function to get all upstream dependencies
        const getUpstreamDependencies = async (ticketId: number, visited = new Set<number>()): Promise<any[]> => {
            if (visited.has(ticketId)) {
                return []; // Prevent infinite loops
            }
            visited.add(ticketId);
            
            const dependencies = await db.select({
                dependsOnTicketId: tickets.id,
                dependsOnTitle: tickets.title,
                dependsOnStatus: tickets.status,
                dependsOnContent: tickets.content, 
                dependsOnDecision: tickets.decision,
                dependsOnConsequences: tickets.consequences,
                dependsOnIsAiGenerated: tickets.isAiGenerated,
                dependsOnCreatedAt: tickets.createdAt,
            })
            .from(ticketDependencies)
            .innerJoin(tickets, eq(ticketDependencies.dependsOnTicketId, tickets.id))
            .where(eq(ticketDependencies.ticketId, ticketId));
            
            const result: any[] = [];
            for (const dep of dependencies) {
                const subDeps = await getUpstreamDependencies(dep.dependsOnTicketId, visited);
                result.push({
                    ...dep,
                    dependencies: subDeps
                });
            }
            return result;
        };

        // Recursive function to get all downstream dependents
        const getDownstreamDependents = async (ticketId: number, visited = new Set<number>()): Promise<any[]> => {
            if (visited.has(ticketId)) {
                return []; // Prevent infinite loops
            }
            visited.add(ticketId);
            
            const dependents = await db.select({
                dependentTicketId: tickets.id,
                dependentTitle: tickets.title,
                dependentStatus: tickets.status,
                dependentContent: tickets.content,
                dependentDecision: tickets.decision,
                dependentConsequences: tickets.consequences,
                dependentIsAiGenerated: tickets.isAiGenerated,
                dependentCreatedAt: tickets.createdAt,
            })
            .from(ticketDependencies)
            .innerJoin(tickets, eq(ticketDependencies.ticketId, tickets.id))
            .where(eq(ticketDependencies.dependsOnTicketId, ticketId));
            
            const result: any[] = [];
            for (const dep of dependents) {
                const subDeps = await getDownstreamDependents(dep.dependentTicketId, visited);
                result.push({
                    ...dep,
                    dependents: subDeps
                });
            }
            return result;
        };

        // Helper function to count all nested dependencies
        const countAllDependencies = (dependencies: any[]): number => {
            let count = 0;
            for (const dep of dependencies) {
                count += 1; // Count this dependency
                count += countAllDependencies(dep.dependencies || []); // Count nested dependencies
            }
            return count;
        };

        // Helper function to count all nested dependents
        const countAllDependents = (dependents: any[]): number => {
            let count = 0;
            for (const dep of dependents) {
                count += 1; // Count this dependent
                count += countAllDependents(dep.dependents || []); // Count nested dependents
            }
            return count;
        };

        // Get all dependencies and dependents
        const upstreamDependencies = await getUpstreamDependencies(sourceTicketId);
        const downstreamDependents = await getDownstreamDependents(sourceTicketId);

        // Get direct dependencies and dependents for the main ticket
        const directDependencies = await db.select({
            dependsOnTicketId: tickets.id,
            dependsOnTitle: tickets.title,
            dependsOnStatus: tickets.status,
            dependsOnContent: tickets.content,
            dependsOnDecision: tickets.decision,
            dependsOnConsequences: tickets.consequences,
            dependsOnIsAiGenerated: tickets.isAiGenerated,
            dependsOnCreatedAt: tickets.createdAt,
        })
        .from(ticketDependencies)
        .innerJoin(tickets, eq(ticketDependencies.dependsOnTicketId, tickets.id))
        .where(eq(ticketDependencies.ticketId, sourceTicketId));

        const directDependents = await db.select({
            dependentTicketId: tickets.id,
            dependentTitle: tickets.title,
            dependentStatus: tickets.status,
            dependentContent: tickets.content,
            dependentDecision: tickets.decision,
            dependentConsequences: tickets.consequences,
            dependentIsAiGenerated: tickets.isAiGenerated,
            dependentCreatedAt: tickets.createdAt,
        })
        .from(ticketDependencies)
        .innerJoin(tickets, eq(ticketDependencies.ticketId, tickets.id))
        .where(eq(ticketDependencies.dependsOnTicketId, sourceTicketId));

        // Build the complete dependency graph
        const dependencyGraph = {
            ticket: {
                id: ticket[0].id,
                title: ticket[0].title,
                status: ticket[0].status,
                content: ticket[0].content,
                decision: ticket[0].decision,
                consequences: ticket[0].consequences,
                isAiGenerated: ticket[0].isAiGenerated,
                createdAt: ticket[0].createdAt,
            },
            directDependencies: directDependencies,
            directDependents: directDependents,
            allUpstreamDependencies: upstreamDependencies,
            allDownstreamDependents: downstreamDependents,
            summary: {
                totalUpstream: countAllDependencies(upstreamDependencies),
                totalDownstream: countAllDependents(downstreamDependents),
                directDependenciesCount: directDependencies.length,
                directDependentsCount: directDependents.length,
            }
        };

        res.status(200).json(dependencyGraph);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/tickets', async (req, res) => {
    console.log('Backend: POST /api/tickets', req.body);
    console.log('Backend: Request headers:', req.headers);
    console.log('Backend: Content-Type:', req.get('Content-Type'));
    
    try {
        if (!req.body) {
            return res.status(400).json({ error: 'Request body is required' });
        }
        
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
        res.status(500).json({ error: (error as Error).message });
    }
});

// Update ticket
app.put('/api/tickets/:ticketId', async (req, res) => {
    console.log('Backend: PUT /api/tickets/' + req.params.ticketId, req.body);
    try {
        const { ticketId } = req.params;
        const { 
            projectId, 
            title, 
            content, 
            decision, 
            consequences, 
            status, 
            isAiGenerated 
        } = req.body;
        
        // Check if ticket exists
        const existingTicket = await db.select().from(tickets)
            .where(eq(tickets.id, parseInt(ticketId)))
            .limit(1);

        if (existingTicket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Prepare update data (only include fields that are provided)
        const updateData: any = {};
        if (projectId !== undefined) updateData.projectId = parseInt(projectId);
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (decision !== undefined) updateData.decision = decision;
        if (consequences !== undefined) updateData.consequences = consequences;
        if (status !== undefined) updateData.status = status;
        if (isAiGenerated !== undefined) updateData.isAiGenerated = isAiGenerated;

        // Update ticket
        const [updatedTicket] = await db.update(tickets)
            .set(updateData)
            .where(eq(tickets.id, parseInt(ticketId)))
            .returning();

        console.log('Backend: Updated ticket', updatedTicket);
        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// Delete ticket
app.delete('/api/tickets/:ticketId', async (req, res) => {
    console.log('Backend: DELETE /api/tickets/' + req.params.ticketId);
    try {
        const { ticketId } = req.params;
        
        const deletedTicket = await db.delete(tickets)
            .where(eq(tickets.id, parseInt(ticketId)))
            .returning();

        if (deletedTicket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        console.log('Backend: Deleted ticket', deletedTicket[0]);
        res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// Relevance AI - Ticket Summarization
app.post('/api/tickets/:ticketId/summarize', async (req, res) => {
    console.log('Backend: POST /api/tickets/' + req.params.ticketId + '/summarize');
    try {
        const { ticketId } = req.params;
        
        // Get the main ticket
        const ticket = await db.select().from(tickets)
            .where(eq(tickets.id, parseInt(ticketId)))
            .limit(1);

        if (ticket.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Get dependencies (tickets this ticket depends on)
        const dependencies = await db.select({
            dependsOnTicketId: tickets.id,
            dependsOnTitle: tickets.title,
            dependsOnStatus: tickets.status,
            dependsOnContent: tickets.content,
            dependsOnDecision: tickets.decision,
            dependsOnConsequences: tickets.consequences,
            dependsOnIsAiGenerated: tickets.isAiGenerated,
            dependsOnCreatedAt: tickets.createdAt,
        })
        .from(ticketDependencies)
        .innerJoin(tickets, eq(ticketDependencies.dependsOnTicketId, tickets.id))
        .where(eq(ticketDependencies.ticketId, parseInt(ticketId)));

        // Get dependents (tickets that depend on this ticket)
        const dependents = await db.select({
            dependentTicketId: tickets.id,
            dependentTitle: tickets.title,
            dependentStatus: tickets.status,
            dependentContent: tickets.content,
            dependentDecision: tickets.decision,
            dependentConsequences: tickets.consequences,
            dependentIsAiGenerated: tickets.isAiGenerated,
            dependentCreatedAt: tickets.createdAt,
        })
        .from(ticketDependencies)
        .innerJoin(tickets, eq(ticketDependencies.ticketId, tickets.id))
        .where(eq(ticketDependencies.dependsOnTicketId, parseInt(ticketId)));

        // Get all upstream dependencies (recursive)
        const getAllUpstreamDependencies = async (ticketIds: number[]): Promise<any[]> => {
            if (ticketIds.length === 0) return [];
            
            const upstreamDeps = await db.select({
                dependsOnTicketId: tickets.id,
                dependsOnTitle: tickets.title,
                dependsOnStatus: tickets.status,
                dependsOnContent: tickets.content,
                dependsOnDecision: tickets.decision,
                dependsOnConsequences: tickets.consequences,
                dependsOnIsAiGenerated: tickets.isAiGenerated,
                dependsOnCreatedAt: tickets.createdAt,
            })
            .from(ticketDependencies)
            .innerJoin(tickets, eq(ticketDependencies.dependsOnTicketId, tickets.id))
            .where(eq(ticketDependencies.ticketId, ticketIds[0]!));

            const upstreamTicketIds = upstreamDeps.map(dep => dep.dependsOnTicketId);
            const deeperDeps = await getAllUpstreamDependencies(upstreamTicketIds);
            
            return [...upstreamDeps, ...deeperDeps];
        };

        const allUpstreamDependencies = await getAllUpstreamDependencies([parseInt(ticketId)]);

        // Prepare the data for the AI agent
        const ticketData = {
            ticket: ticket[0],
            directDependencies: dependencies,
            directDependents: dependents,
            allUpstreamDependencies: allUpstreamDependencies
        };

        console.log('Backend: Calling Relevance AI agent with data:', JSON.stringify(ticketData, null, 2));

        // Get the Sage agent
        const sageAgent = await Agent.get('466fb74b-f420-4961-b403-b3334a3e9ff4', relevanceClient);
        
        // Send the ticket data to the agent
        const task = await sageAgent.sendMessage(JSON.stringify(ticketData));
        
        // Wait for the agent response
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                task.unsubscribe();
                reject(new Error('Agent response timeout'));
            }, 30000); // 30 second timeout

            task.addEventListener('message', ({ detail: { message } }) => {
                if (message.isAgent()) {
                    clearTimeout(timeout);
                    task.unsubscribe();
                    console.log('Backend: Agent response:', message.text);
                    resolve(res.status(200).json({ 
                        summary: message.text,
                        ticketId: parseInt(ticketId)
                    }));
                }
            });

            task.addEventListener('error', ({ detail: { message } }) => {
                clearTimeout(timeout);
                task.unsubscribe();
                console.error('Backend: Agent error:', message.lastError);
                reject(new Error('Agent error: ' + message.lastError));
            });
        });

    } catch (error) {
        console.error('Database/Agent error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;