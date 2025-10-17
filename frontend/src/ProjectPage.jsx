import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function ProjectPage() {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const [project, setProject] = useState(null)
    const [backlog, setBacklog] = useState([])
    const [newTask, setNewTask] = useState({
        title: '',
        context: '',
        decision: '',
        consequences: '',
        people: '',
        dependencies: ''
    })

    // Load project and backlog data from localStorage
    useEffect(() => {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const projectData = projects.find(p => p.id === parseInt(projectId))
        
        if (projectData) {
            setProject(projectData)
            setBacklog(projectData.backlog || [])
        }
    }, [projectId])

    const handleAddTask = () => {
        if (!newTask.title.trim()) return

        const task = {
            id: Date.now(),
            title: newTask.title,
            context: newTask.context,
            decision: newTask.decision,
            consequences: newTask.consequences,
            people: newTask.people.split(',').map(p => p.trim()).filter(p => p),
            dependencies: newTask.dependencies.split(',').map(d => d.trim()).filter(d => d),
            status: 'backlog',
            is_ai_generated: false,
            created_at: new Date().toISOString()
        }

        const updatedBacklog = [...backlog, task]
        setBacklog(updatedBacklog)

        // Update localStorage
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProjects = projects.map(p => 
            p.id === parseInt(projectId) 
                ? { ...p, backlog: updatedBacklog }
                : p
        )
        localStorage.setItem('projects', JSON.stringify(updatedProjects))

        // Reset form
        setNewTask({
            title: '',
            context: '',
            decision: '',
            consequences: '',
            people: '',
            dependencies: ''
        })
    }

    const handleAutoTranslate = () => {
        // Simulate AI-generated task
        const aiTask = {
            id: Date.now(),
            title: 'AI Generated Task - Meeting Discussion',
            context: 'This task was generated from meeting transcript analysis',
            decision: 'AI determined this task is needed based on discussion points',
            consequences: 'Implementing this will improve team workflow',
            people: ['AI Assistant'],
            dependencies: [],
            status: 'backlog',
            is_ai_generated: true,
            created_at: new Date().toISOString()
        }

        const updatedBacklog = [...backlog, aiTask]
        setBacklog(updatedBacklog)

        // Update localStorage
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProjects = projects.map(p => 
            p.id === parseInt(projectId) 
                ? { ...p, backlog: updatedBacklog }
                : p
        )
        localStorage.setItem('projects', JSON.stringify(updatedProjects))
    }

    const handleAcceptTask = (taskId) => {
        const updatedBacklog = backlog.map(task => 
            task.id === taskId ? { ...task, is_ai_generated: false } : task
        )
        setBacklog(updatedBacklog)

        // Update localStorage
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProjects = projects.map(p => 
            p.id === parseInt(projectId) 
                ? { ...p, backlog: updatedBacklog }
                : p
        )
        localStorage.setItem('projects', JSON.stringify(updatedProjects))
    }

    const handleRejectTask = (taskId) => {
        const updatedBacklog = backlog.filter(task => task.id !== taskId)
        setBacklog(updatedBacklog)

        // Update localStorage
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProjects = projects.map(p => 
            p.id === parseInt(projectId) 
                ? { ...p, backlog: updatedBacklog }
                : p
        )
        localStorage.setItem('projects', JSON.stringify(updatedProjects))
    }

    if (!project) {
        return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
            <div className="text-slate-600">Loading project...</div>
        </div>
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            {/* Background blur effects */}
            <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236B7280' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            
            <div className="flex h-screen">
                {/* Left Sidebar - Navigation */}
                <div className="w-80 bg-white/20 backdrop-blur-xl border-r border-slate-200/50 p-6">
                    <div className="flex items-center mb-8">
                        <button 
                            onClick={() => navigate('/')}
                            className="mr-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Voltreon</h1>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Navigation</h2>
                        <div className="space-y-2">
                            <button className="w-full text-left p-3 rounded-xl bg-white/30 border border-slate-200/50 text-slate-800 font-medium">
                                Backlog
                            </button>
                            <button className="w-full text-left p-3 rounded-xl bg-white/10 border border-slate-200/30 text-slate-600 hover:bg-white/20 transition-colors">
                                SCRUM Board
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-slate-800 mb-2">{project.name}</h1>
                            <p className="text-slate-600">{project.description}</p>
                        </div>

                        {/* Backlog Section */}
                        <div className="bg-white/30 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold text-slate-800">Backlog</h2>
                                <button
                                    onClick={handleAutoTranslate}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-xl font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300"
                                >
                                    Auto-Translate
                                </button>
                            </div>

                            {/* Add Task Form */}
                            <div className="bg-white/40 rounded-xl p-6 mb-6 border border-slate-200/50">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Task</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                                        <input
                                            type="text"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                            placeholder="Task title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">People (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={newTask.people}
                                            onChange={(e) => setNewTask({...newTask, people: e.target.value})}
                                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                            placeholder="@john, @jane"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Context</label>
                                        <textarea
                                            value={newTask.context}
                                            onChange={(e) => setNewTask({...newTask, context: e.target.value})}
                                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                            rows="3"
                                            placeholder="Why is this needed?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Decision</label>
                                        <textarea
                                            value={newTask.decision}
                                            onChange={(e) => setNewTask({...newTask, decision: e.target.value})}
                                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                            rows="3"
                                            placeholder="What was decided?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Consequences</label>
                                        <textarea
                                            value={newTask.consequences}
                                            onChange={(e) => setNewTask({...newTask, consequences: e.target.value})}
                                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                            rows="3"
                                            placeholder="What are the consequences?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Dependencies (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={newTask.dependencies}
                                            onChange={(e) => setNewTask({...newTask, dependencies: e.target.value})}
                                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                            placeholder="@ticket#123, @ticket#456"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddTask}
                                    className="mt-4 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-medium hover:from-slate-700 hover:to-slate-800 transition-all duration-300"
                                >
                                    Add Task
                                </button>
                            </div>

                            {/* Task List */}
                            <div className="space-y-4">
                                {backlog.map((task) => (
                                    <div key={task.id} className="bg-white/40 rounded-xl p-4 border border-slate-200/50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
                                                    {task.is_ai_generated && (
                                                        <span className="px-2 py-1 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-xs rounded-full">
                                                            AI Generated
                                                        </span>
                                                    )}
                                                </div>
                                                {task.context && (
                                                    <p className="text-slate-600 text-sm mb-2"><strong>Context:</strong> {task.context}</p>
                                                )}
                                                {task.decision && (
                                                    <p className="text-slate-600 text-sm mb-2"><strong>Decision:</strong> {task.decision}</p>
                                                )}
                                                {task.consequences && (
                                                    <p className="text-slate-600 text-sm mb-2"><strong>Consequences:</strong> {task.consequences}</p>
                                                )}
                                                {task.people.length > 0 && (
                                                    <p className="text-slate-600 text-sm mb-2"><strong>People:</strong> {task.people.join(', ')}</p>
                                                )}
                                                {task.dependencies.length > 0 && (
                                                    <p className="text-slate-600 text-sm"><strong>Dependencies:</strong> {task.dependencies.join(', ')}</p>
                                                )}
                                            </div>
                                            {task.is_ai_generated && (
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleAcceptTask(task.id)}
                                                        className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectTask(task.id)}
                                                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {backlog.length === 0 && (
                                    <div className="text-center py-12 text-slate-500">
                                        <p>No tasks in backlog yet. Add your first task above!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectPage
