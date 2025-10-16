require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3001;

const apiRouter = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

apiRouter.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

apiRouter.get('/tasks', async (req, res) => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*');

    if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json(data);
});

app.use('/api', apiRouter);

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

module.exports = app;