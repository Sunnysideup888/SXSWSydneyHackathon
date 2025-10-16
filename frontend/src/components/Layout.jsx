import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Home, 
    FolderOpen, 
    Plus, 
    Menu, 
    X,
    Brain,
    Users,
    Settings
} from 'lucide-react';
import apiClient from '../api/apiClient';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await apiClient.get('/projects');
                setProjects(response.data);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                        <Brain className="w-8 h-8 text-emerald-600" />
                        <span className="text-xl font-bold text-slate-800">AI JIRA</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="mt-6 px-3">
                    <div className="space-y-1">
                        <Link
                            to="/"
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                isActive('/') 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Home className="w-5 h-5 mr-3" />
                            Home
                        </Link>

                        <div className="pt-4">
                            <div className="flex items-center px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Projects
                            </div>
                            
                            {loading ? (
                                <div className="px-3 py-2 text-sm text-slate-500">Loading projects...</div>
                            ) : (
                                <div className="space-y-1">
                                    {projects.map((project) => (
                                        <Link
                                            key={project.id}
                                            to={`/projects/${project.id}`}
                                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                isActive(`/projects/${project.id}`)
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <FolderOpen className="w-4 h-4 mr-3" />
                                            {project.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <div className="space-y-1">
                                <Link
                                    to="/people"
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        isActive('/people')
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Users className="w-5 h-5 mr-3" />
                                    People
                                </Link>
                                <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                    <Settings className="w-5 h-5 mr-3" />
                                    Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <div className="bg-white shadow-sm border-b border-slate-200">
                    <div className="flex items-center justify-between h-16 px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1" />
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
