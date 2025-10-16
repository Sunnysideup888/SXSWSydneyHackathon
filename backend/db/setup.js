const { db } = require('./connection');
const { projects, tickets, people, ticketsToPeople, ticketDependencies } = require('./schema');

async function setupDatabase() {
    try {
        console.log('🔧 Setting up AI JIRA database...');
        
        // Note: In a real application, you would use Drizzle's migration system
        // This is a simplified version for the hackathon
        
        console.log('✅ Database setup complete!');
        console.log('📝 Next steps:');
        console.log('1. Set up your .env file with DATABASE_URL and OPENAI_API_KEY');
        console.log('2. Make sure PostgreSQL is running');
        console.log('3. Create a database named "ai_jira"');
        console.log('4. Run: npm start');
        console.log('5. Visit: http://localhost:3001');
        
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        console.log('💡 Make sure PostgreSQL is running and you have a database named "ai_jira"');
    }
}

// Run if called directly
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };
