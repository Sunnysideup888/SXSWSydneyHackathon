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
        dependencies: '',
        status: 'queued'
    })
    const [showAddTaskModal, setShowAddTaskModal] = useState(false)
    const [taskActions, setTaskActions] = useState({}) // Track accept/reject actions
    const [dependencySuggestions, setDependencySuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [dependenciesInput, setDependenciesInput] = useState('')

    // Load project and backlog data from localStorage
    useEffect(() => {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const projectData = projects.find(p => p.id === parseInt(projectId))
        
        if (projectData) {
            setProject(projectData)
            setBacklog(projectData.backlog || [])
        }
    }, [projectId])

    // Sync dependenciesInput with newTask.dependencies
    useEffect(() => {
        setDependenciesInput(newTask.dependencies)
    }, [newTask.dependencies])

    const generateTicketHash = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let hash = ''
        for (let i = 0; i < 6; i++) {
            hash += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return hash
    }

    const handleAddTask = () => {
        if (!newTask.title.trim()) return

        const task = {
            id: Date.now(),
            hash: generateTicketHash(),
            title: newTask.title,
            context: newTask.context,
            decision: newTask.decision,
            consequences: newTask.consequences,
            people: newTask.people.split(',').map(p => p.trim()).filter(p => p),
            dependencies: newTask.dependencies.split(',').map(d => d.trim()).filter(d => d),
            status: newTask.status,
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

        // Reset form and close modal
        setNewTask({
            title: '',
            context: '',
            decision: '',
            consequences: '',
            people: '',
            dependencies: '',
            status: 'queued'
        })
        setDependenciesInput('')
        setShowSuggestions(false)
        setShowAddTaskModal(false)
    }

    const handleAutoTranslate = () => {
        // Simulate AI-generated task
        const aiTask = {
            id: Date.now(),
            hash: generateTicketHash(),
            title: 'AI Generated Task - Meeting Discussion',
            context: 'This task was generated from meeting transcript analysis',
            decision: 'AI determined this task is needed based on discussion points',
            consequences: 'Implementing this will improve team workflow',
            people: ['AI Assistant'],
            dependencies: [],
            status: 'queued',
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

        // Track the action for visual feedback
        setTaskActions(prev => ({ ...prev, [taskId]: 'accepted' }))
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

        // Track the action for visual feedback
        setTaskActions(prev => ({ ...prev, [taskId]: 'rejected' }))
    }

    const handleDeleteTask = (taskId) => {
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'queued': return 'bg-gray-100 text-gray-700 border-gray-200'
            case 'in_dev': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'in_test': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'in_review': return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'completed': return 'bg-green-100 text-green-700 border-green-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'queued': return 'Queued'
            case 'in_dev': return 'In Dev'
            case 'in_test': return 'In Test'
            case 'in_review': return 'In Review'
            case 'completed': return 'Completed'
            default: return 'Queued'
        }
    }

    const handleDependenciesInput = (value) => {
        setDependenciesInput(value)
        setNewTask({...newTask, dependencies: value})
        
        // Check if user is typing (no @ prefix needed)
        if (value.length > 0) {
            // Split by comma to get the last part being typed
            const parts = value.split(',')
            const lastPart = parts[parts.length - 1].trim()
            
            if (lastPart.length > 0) {
                // Filter tasks that match the input
                const suggestions = backlog.filter(task => 
                    task.title.toLowerCase().includes(lastPart.toLowerCase()) ||
                    task.hash.toLowerCase().includes(lastPart.toLowerCase())
                ).map(task => ({
                    hash: task.hash,
                    title: task.title,
                    fullMatch: `#${task.hash}`,
                    displayText: task.title
                }))
                
                setDependencySuggestions(suggestions)
                setShowSuggestions(suggestions.length > 0)
            } else {
                setShowSuggestions(false)
            }
        } else {
            setShowSuggestions(false)
        }
    }

    const selectSuggestion = (suggestion) => {
        // Split by comma to get all parts except the last one being typed
        const parts = dependenciesInput.split(',')
        const beforeLastPart = parts.slice(0, -1).join(',')
        const newValue = beforeLastPart + (beforeLastPart ? ', ' : '') + suggestion.fullMatch + ', '
        
        setDependenciesInput(newValue)
        setNewTask({...newTask, dependencies: newValue})
        setShowSuggestions(false)
    }

    const handleClickOutside = (e) => {
        if (!e.target.closest('.dependencies-container')) {
            setShowSuggestions(false)
        }
    }

    // Add click outside listener
    useEffect(() => {
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

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
                            <button 
                                onClick={() => navigate(`/project/${projectId}/scrum`)}
                                className="w-full text-left p-3 rounded-xl bg-white/10 border border-slate-200/30 text-slate-600 hover:bg-white/20 transition-colors"
                            >
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
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowAddTaskModal(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-medium hover:from-slate-700 hover:to-slate-800 transition-all duration-300"
                                    >
                                        + Add Task
                                    </button>
                                    <button
                                        onClick={handleAutoTranslate}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-xl font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300"
                                    >
                                        Auto-Translate
                                    </button>
                                </div>
                            </div>


                            {/* Task List */}
                            <div className="space-y-2">
                                {backlog.map((task) => (
                                    <div key={task.id} className={`bg-white/40 rounded-lg p-3 border border-slate-200/50 transition-all duration-300 ${
                                        taskActions[task.id] === 'accepted' ? 'opacity-60 bg-green-50/40' : 
                                        taskActions[task.id] === 'rejected' ? 'opacity-60 bg-red-50/40' : ''
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-base font-semibold text-slate-800">
                                                        {task.title}{task.hash && (
                                                            <span className="text-slate-500 font-normal"> (#{task.hash})</span>
                                                        )}
                                                    </h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(task.status)}`}>
                                                        {getStatusLabel(task.status)}
                                                    </span>
                                                    {task.is_ai_generated && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                                                            AI Transcribed
                                                        </span>
                                                    )}
                                                    {taskActions[task.id] === 'accepted' && (
                                                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                                            AI
                                                        </span>
                                                    )}
                                                    {taskActions[task.id] === 'rejected' && (
                                                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                                            Rejected
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                                    {task.context && <span>Context: {task.context.substring(0, 50)}...</span>}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                                    {task.people.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                            </svg>
                                                            {task.people.join(', ')}
                                                        </span>
                                                    )}
                                                    {task.dependencies.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                            </svg>
                                                            <span>
                                                                {task.dependencies.map(dep => {
                                                                    // Find the task by hash
                                                                    const depTask = backlog.find(t => t.hash === dep.replace('#', ''))
                                                                    return depTask ? `${depTask.title} (${dep})` : dep
                                                                }).join(', ')}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                {task.is_ai_generated && !taskActions[task.id] && (
                                                    <>
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
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="px-3 py-1 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors hover:cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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

            {/* Add Task Modal */}
            {showAddTaskModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200/50 p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Add New Task</h2>
                            <button
                                onClick={() => setShowAddTaskModal(false)}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="relative dependencies-container">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Dependencies (start typing to search tickets)</label>
                                <input
                                    type="text"
                                    value={dependenciesInput}
                                    onChange={(e) => handleDependenciesInput(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                    placeholder="meeting, bug fix, ABC123"
                                />
                                {showSuggestions && dependencySuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {dependencySuggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                onClick={() => selectSuggestion(suggestion)}
                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                                            >
                                                <div className="font-medium text-slate-800">{suggestion.title}</div>
                                                <div className="text-sm text-slate-500">#{suggestion.hash}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                <select
                                    value={newTask.status}
                                    onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                >
                                    <option value="queued">Queued</option>
                                    <option value="in_dev">In Dev</option>
                                    <option value="in_test">In Test</option>
                                    <option value="in_review">In Review</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={handleAddTask}
                                className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-medium hover:from-slate-700 hover:to-slate-800 transition-all duration-300"
                            >
                                Add Task
                            </button>
                            <button
                                onClick={() => setShowAddTaskModal(false)}
                                className="px-6 py-3 bg-white/50 text-slate-700 rounded-xl font-medium hover:bg-white/70 transition-all duration-300 border border-slate-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProjectPage
