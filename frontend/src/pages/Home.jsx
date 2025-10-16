import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Brain, Users, TrendingUp } from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const Home = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/tasks');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const response = await apiClient.post('/projects', newProject);
            setProjects([response.data, ...projects]);
            setNewProject({ name: '', description: '' });
            setShowCreateModal(false);
            toast.success('Project created successfully!');
        } catch (error) {
            console.log("ERROR WITH THE BACKEND " + error.response.data);
            console.error('Error creating project:', error);
            toast.error('Failed to create project');
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                    Welcome to Vaultreon
                </h1>
                <p className="text-slate-600">
                    Create simple to use SCRUM boards while not getting lost in the weeds. See dependencies for tickets, and get AI-powered insights and summaries.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <FolderOpen className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">Total Projects</p>
                            <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Brain className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">AI Generated</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {projects.filter(p => p.isAiGenerated).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">Active Projects</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {projects.filter(p => p.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800">Your Projects</h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Project
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            <span className="ml-3 text-slate-600">Loading projects...</span>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-slate-400 mb-4">
                                <FolderOpen className="w-16 h-16 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-600 mb-2">No projects yet</h3>
                            <p className="text-slate-500 mb-6">Create your first project to get started with AI-powered project management.</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Project
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    to={`/projects/${project.id}`}
                                    className="group block p-6 bg-slate-50 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-emerald-100 rounded-lg">
                                                <FolderOpen className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                                                    {project.name}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    Created {new Date(project.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {project.isAiGenerated && (
                                            <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                <Brain className="w-3 h-3 mr-1" />
                                                AI
                                            </div>
                                        )}
                                    </div>
                                    
                                    {project.description && (
                                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}
                                    
                                    <div className="flex items-center text-sm text-slate-500">
                                        <Users className="w-4 h-4 mr-1" />
                                        <span>0 tickets</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowCreateModal(false)} />
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleCreateProject}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="w-full">
                                            <h3 className="text-lg font-medium text-slate-900 mb-4">
                                                Create New Project
                                            </h3>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Project Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={newProject.name}
                                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="Enter project name"
                                                        required
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Description (Optional)
                                                    </label>
                                                    <textarea
                                                        value={newProject.description}
                                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="Enter project description"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Create Project
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
