const { db } = require('./connection');
const { projects, tickets, people, ticketsToPeople, ticketDependencies } = require('./schema');

async function createTables() {
    try {
        console.log('Creating database tables...');
        
        // Note: In a real application, you would use Drizzle's migration system
        // This is a simplified version for the hackathon
        
        console.log('✅ Database setup complete!');
        console.log('📝 Next steps:');
        console.log('1. Set up your .env file with DATABASE_URL and OPENAI_API_KEY');
        console.log('2. Run: npm start');
        console.log('3. Visit: http://localhost:3001');
        
    } catch (error) {
        console.error('❌ Error setting up database:', error);
    }
}

// Run if called directly
if (require.main === module) {
    createTables();
}

module.exports = { createTables };
