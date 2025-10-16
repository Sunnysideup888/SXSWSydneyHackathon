require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3001;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
console.log(supabaseUrl, supabaseKey)
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'This test is a test if the backend works' });
});

app.get('/tasks', async (req, res) => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*');

    console.log('This is the data ' + JSON.stringify(data, null, 2))
    console.log('This is the error ' + error)

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