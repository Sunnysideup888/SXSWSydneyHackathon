import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tickets, projects } from '../db/schema/schema';


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


if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;