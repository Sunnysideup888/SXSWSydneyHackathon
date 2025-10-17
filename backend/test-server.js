const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', port: port });
});

app.listen(port, () => {
    console.log(`Test server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
});

module.exports = app;
