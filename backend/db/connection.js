const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

// Create the connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/ai_jira';
const client = postgres(connectionString);
const db = drizzle(client);

module.exports = { db, client };
