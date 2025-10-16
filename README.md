# AI JIRA - AI-Powered Project Management with Dependency Tracking

A modern JIRA clone that combines traditional project management with AI-powered insights and dependency visualization. Built for the SWSX Sydney Hackathon.

## 🚀 Features

### Core Features
- **Project Management**: Create and manage multiple projects with tickets
- **SCRUM Board**: Drag-and-drop Kanban board with status columns
- **Backlog Management**: Organize tickets before they enter the workflow
- **People Management**: Team member management with @mention support

### AI-Powered Features
- **Dependency Graph Visualization**: Interactive graph showing ticket dependencies
- **AI Summarization**: Get AI-powered summaries of decision history from dependent tickets
- **ADR (Architecture Decision Record) Support**: Structured context, decision, and consequences tracking
- **Auto-Translate Placeholder**: Framework for meeting-to-ticket AI generation

### Technical Features
- **Modern UI**: Built with React, Tailwind CSS, and Lucide React icons
- **Real-time Updates**: Live status updates and notifications
- **Responsive Design**: Works on desktop and mobile devices
- **Type Safety**: Built with modern JavaScript and proper error handling

## 🏗️ Architecture

### Backend
- **Node.js + Express**: RESTful API server
- **PostgreSQL**: Database with Drizzle ORM
- **OpenAI Integration**: GPT-4 powered AI summarization
- **CORS Enabled**: Cross-origin resource sharing for frontend

### Frontend
- **React 19**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **React Flow**: Interactive dependency graph visualization
- **Axios**: HTTP client for API communication

### Database Schema
- **Projects**: Project management
- **Tickets**: Individual work items with ADR fields
- **People**: Team member management
- **Dependencies**: Many-to-many ticket dependency relationships
- **Assignments**: Many-to-many ticket-to-people relationships

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/ai_jira
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=development
   ```

4. **Set up the database**:
   - Create a PostgreSQL database named `ai_jira`
   - Run the database migrations (you'll need to set up Drizzle migrations)

5. **Start the backend server**:
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## 📱 Usage

### Creating Your First Project
1. Go to the home page
2. Click "Create Project"
3. Enter project name and description
4. Click "Create Project"

### Managing Tickets
1. Navigate to your project
2. Switch between "Backlog" and "SCRUM Board" tabs
3. Create tickets with ADR structure (Context, Decision, Consequences)
4. Assign people to tickets
5. Move tickets through status columns

### Using AI Features
1. **Dependency Graph**: Click "See Dependencies" on any ticket to view the interactive graph
2. **AI Summarization**: Click "Summarize" to get AI-powered insights from dependent tickets
3. **People Management**: Add team members with usernames for @mention support

### ADR (Architecture Decision Record) Structure
Each ticket follows the ADR pattern:
- **Context**: What is the problem we're trying to solve?
- **Decision**: What is the decision we're making?
- **Consequences**: What are the consequences of this decision?

## 🔧 API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project

### Tickets
- `GET /api/projects/:projectId/tickets` - Get tickets for a project
- `POST /api/projects/:projectId/tickets` - Create a new ticket
- `PUT /api/tickets/:ticketId` - Update a ticket
- `GET /api/tickets/:ticketId` - Get ticket details

### Dependencies
- `GET /api/tickets/:ticketId/dependencies` - Get ticket dependencies
- `POST /api/tickets/:ticketId/dependencies` - Create a dependency

### AI Features
- `POST /api/tickets/:ticketId/summarize` - Generate AI summary

### People
- `GET /api/people` - Get all people
- `POST /api/people` - Create a new person

## 🎯 Hackathon Goals Achieved

✅ **JIRA Clone**: Complete project management with tickets, projects, and status tracking  
✅ **Dependency Tracking**: Visual dependency graphs with React Flow  
✅ **AI Integration**: OpenAI-powered decision summarization  
✅ **ADR Support**: Structured decision record keeping  
✅ **Modern UI**: Beautiful, responsive interface  
✅ **People Management**: Team member and @mention support  
✅ **SCRUM Board**: Kanban-style workflow management  

## 🚀 Future Enhancements

- **Real-time Collaboration**: WebSocket integration for live updates
- **Meeting Integration**: Actual auto-translate from meeting recordings
- **Advanced AI**: More sophisticated AI features and insights
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Project metrics and reporting
- **Integration APIs**: Connect with other tools (Slack, GitHub, etc.)

## 🤝 Contributing

This is a hackathon project, but contributions are welcome! Please feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is created for the SWSX Sydney Hackathon and is available under the MIT License.

---

**Built with ❤️ for the SWSX Sydney Hackathon**
