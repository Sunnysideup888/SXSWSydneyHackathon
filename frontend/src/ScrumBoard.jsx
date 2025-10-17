import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function ScrumBoard() {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const [project, setProject] = useState(null)
    const [tasks, setTasks] = useState([])

    // Load project and tasks data from localStorage
    useEffect(() => {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const projectData = projects.find(p => p.id === parseInt(projectId))
        
        if (projectData) {
            setProject(projectData)
            setTasks(projectData.backlog || [])
        }
    }, [projectId])

    const updateTaskStatus = (taskId, newStatus) => {
        const updatedTasks = tasks.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
        )
        setTasks(updatedTasks)

        // Update localStorage
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProjects = projects.map(p => 
            p.id === parseInt(projectId) 
                ? { ...p, backlog: updatedTasks }
                : p
        )
        localStorage.setItem('projects', JSON.stringify(updatedProjects))
    }

    const handleDeleteTask = (taskId) => {
        const updatedTasks = tasks.filter(task => task.id !== taskId)
        setTasks(updatedTasks)

        // Update localStorage
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProjects = projects.map(p => 
            p.id === parseInt(projectId) 
                ? { ...p, backlog: updatedTasks }
                : p
        )
        localStorage.setItem('projects', JSON.stringify(updatedProjects))
    }

    const getStatusColor = (status) => {
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'To Do': return 'To Do'
            case 'In Progress': return 'In Progress'
            case 'In Review': return 'In Review'
            case 'Done': return 'Done'
            default: return 'To Do'
        }
    }

    const getColumnTasks = (status) => {
        return tasks.filter(task => task.status === status)
    }

    const getColumnColor = (status) => {
        return 'bg-gray-50 border-gray-200'
    }

    const getColumnHeaderColor = (status) => {
        return 'bg-gray-100 text-gray-800'
    }

    if (!project) {
        return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
            <div className="text-slate-600">Loading project...</div>
        </div>
    }

    const statuses = ['To Do', 'In Progress', 'In Review', 'Done']

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
                            <button 
                                onClick={() => navigate(`/project/${projectId}`)}
                                className="w-full text-left p-3 rounded-xl bg-white/10 border border-slate-200/30 text-slate-600 hover:bg-white/20 transition-colors"
                            >
                                Backlog
                            </button>
                            <button className="w-full text-left p-3 rounded-xl bg-white/30 border border-slate-200/50 text-slate-800 font-medium">
                                SCRUM Board
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content - Scrum Board */}
                <div className="flex-1 p-8 overflow-x-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-slate-800 mb-2">{project.name} - SCRUM Board</h1>
                        <p className="text-slate-600">Drag and drop tasks between columns to update their status</p>
                    </div>

                    <div className="flex gap-4 min-w-max">
                        {statuses.map((status) => (
                            <div key={status} className={`flex-1 min-w-64 rounded-2xl border-2 ${getColumnColor(status)}`}>
                                {/* Column Header */}
                                <div className={`p-4 rounded-t-2xl ${getColumnHeaderColor(status)}`}>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">{getStatusLabel(status)}</h2>
                                        <span className="text-sm opacity-75">
                                            {getColumnTasks(status).length} tasks
                                        </span>
                                    </div>
                                </div>

                                {/* Tasks */}
                                <div className="p-3 space-y-2 min-h-96">
                                    {getColumnTasks(status).map((task) => (
                                        <div key={task.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 shadow-sm">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-sm font-semibold text-slate-800 flex-1">
                                                    {task.title}{task.hash && (
                                                        <span className="text-slate-500 font-normal"> (#{task.hash})</span>
                                                    )}
                                                </h3>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="mb-2">
                                                <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(task.status)}`}>
                                                    {getStatusLabel(task.status)}
                                                </span>
                                                {task.isAiGenerated && (
                                                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                                                        AI Transcribed
                                                    </span>
                                                )}
                                            </div>

                                            {/* Content */}
                                            {task.content && (
                                                <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                                    {task.content}
                                                </p>
                                            )}

                                            {/* People and Dependencies */}
                                            <div className="space-y-1">
                                                {task.people.length > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                        </svg>
                                                        <span>{task.people.join(', ')}</span>
                                                    </div>
                                                )}
                                                {task.dependencies.length > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                        </svg>
                                                        <span>
                                                            {task.dependencies.map(dep => {
                                                                // Find the task by hash
                                                                const depTask = tasks.find(t => t.hash === dep.replace('#', ''))
                                                                return depTask ? `${depTask.title} (${dep})` : dep
                                                            }).join(', ')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status Change Buttons */}
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {statuses.filter(s => s !== status).map((newStatus) => (
                                                    <button
                                                        key={newStatus}
                                                        onClick={() => updateTaskStatus(task.id, newStatus)}
                                                        className="px-2 py-1 text-xs bg-white/50 hover:bg-white/80 border border-slate-200 rounded transition-colors"
                                                    >
                                                        → {getStatusLabel(newStatus)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {getColumnTasks(status).length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            No tasks in {getStatusLabel(status).toLowerCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ScrumBoard
