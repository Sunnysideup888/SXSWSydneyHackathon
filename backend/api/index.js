require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { drizzle } = require('drizzle-orm/node-postgres');
const { neon } = require('@neondatabase/serverless');


const app = express();
const port = 3001;

const apiRouter = express.Router();

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

app.use(cors());
app.use(express.json());

apiRouter.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

apiRouter.get('/tickets', async (req, res) => {
    const { data, error } = await db.select().from(tickets);

    if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json(data);
});

app.get('/api/tickets', async (req, res) => {
    const { data, error } = await supabase
        .from('tickets')
        .select('*');

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json(data);
});


if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

module.exports = app;