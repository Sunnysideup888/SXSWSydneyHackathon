import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import ProjectPage from './ProjectPage'

function HomePage() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState([])

    useEffect(() => {
        // Load projects from localStorage
        const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]')
        if (savedProjects.length === 0) {
            // Initialize with default projects if none exist
            const defaultProjects = [
                { id: 1, name: "Sprint 1", description: "Q1 Feature Development", ticketCount: 12, backlog: [] },
                { id: 2, name: "Sprint 2", description: "Q2 Product Launch", ticketCount: 8, backlog: [] },
                { id: 3, name: "Yearly Push", description: "Annual Platform Upgrade", ticketCount: 25, backlog: [] }
            ]
            setProjects(defaultProjects)
            localStorage.setItem('projects', JSON.stringify(defaultProjects))
        } else {
            setProjects(savedProjects)
        }
    }, [])

    const handleCreateProject = () => {
        const newProjectName = prompt("Enter project name:")
        if (newProjectName) {
            const newProject = {
                id: Date.now(),
                name: newProjectName,
                description: "New project",
                ticketCount: 0,
                backlog: []
            }
            const updatedProjects = [...projects, newProject]
            setProjects(updatedProjects)
            localStorage.setItem('projects', JSON.stringify(updatedProjects))
        }
    }

    const handleProjectClick = (projectId) => {
        navigate(`/project/${projectId}`)
    }

    return (
        <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            {/* Background blur effects */}
            <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236B7280' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            
            <div className="flex h-screen">
                {/* Left Sidebar - Projects */}
                <div className="w-80 bg-white/20 backdrop-blur-xl border-r border-slate-200/50 p-6">
                    <div className="flex items-center mb-8">
                        <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Voltreon</h1>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Projects</h2>
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleProjectClick(project.id)}
                                className="group p-4 rounded-xl bg-white/30 hover:bg-white/40 border border-slate-200/50 hover:border-slate-300/60 transition-all duration-300 cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-slate-800 font-medium group-hover:text-slate-600 transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-slate-600 text-sm mt-1">{project.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                            {project.ticketCount} tickets
                                        </span>
                                        <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center max-w-2xl">
                        {/* Welcome Section */}
                        <div className="mb-12">
                            <div className="w-24 h-24 bg-gradient-to-r from-slate-400 to-slate-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-slate-400/25">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h1 className="text-6xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Voltreon
                            </h1>
                            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                                AI-powered SCRUM boards.<br />
                                Create intelligent tickets with dependency tracking and summaries
                            </p>
                        </div>

                        {/* Create Project Button */}
                        <button
                            onClick={handleCreateProject}
                            className="group relative inline-flex items-center px-8 py-4 bg-white/40 backdrop-blur-xl border border-slate-200/60 rounded-2xl text-slate-800 font-semibold text-lg hover:bg-white/50 hover:border-slate-300/70 transition-all duration-300 shadow-2xl hover:shadow-slate-400/25"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-400/20 to-slate-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="relative">Create New Project</span>
                        </button>

                        {/* Feature highlights */}
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white/30 backdrop-blur-xl rounded-2xl border border-slate-200/50">
                                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-slate-800 font-semibold mb-2">AI-Generated Tickets</h3>
                                <p className="text-slate-600 text-sm">Automatically create tickets from meeting transcripts</p>
                            </div>

                            <div className="p-6 bg-white/30 backdrop-blur-xl rounded-2xl border border-slate-200/50">
                                <div className="w-12 h-12 bg-gradient-to-r from-slate-400 to-slate-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <h3 className="text-slate-800 font-semibold mb-2">Dependency Graph</h3>
                                <p className="text-slate-600 text-sm">Visualize ticket relationships and dependencies</p>
                            </div>

                            <div className="p-6 bg-white/30 backdrop-blur-xl rounded-2xl border border-slate-200/50">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h3 className="text-slate-800 font-semibold mb-2">AI Summaries</h3>
                                <p className="text-slate-600 text-sm">Get intelligent insights from past decisions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/project/:projectId" element={<ProjectPage />} />
            </Routes>
        </Router>
    )
}

export default App
