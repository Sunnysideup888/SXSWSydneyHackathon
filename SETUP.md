# Quick Setup Guide

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
```

**Environment Variables (Optional):**
Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/ai_jira
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
PORT=3001
```

**Start Backend:**
```bash
npm start
```
Backend will run on `http://localhost:3001`

### 2. Frontend Setup
```bash
cd frontend
npm install
```

**Environment Variables (Optional):**
Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3001
```

**Start Frontend:**
```bash
npm run dev
```
Frontend will run on `http://localhost:5174` (or next available port)

## 🎯 Features Working Without Database

The app will work with mock data even without a database setup. You can:
- Create and view projects
- Create tickets with ADR structure
- Use the SCRUM board
- View dependency graphs
- Use basic summarization (without AI)

## 🤖 AI Features

For full AI functionality:
1. Get an OpenAI API key from https://platform.openai.com/
2. Add it to your backend `.env` file
3. Restart the backend server

## 📊 Database Setup (Optional)

For persistent data storage:
1. Install PostgreSQL
2. Create a database named `ai_jira`
3. Add the connection string to your `.env` file
4. The app will automatically create tables on first run

## 🎉 Ready to Go!

Visit `http://localhost:5174` to start using AI JIRA!
