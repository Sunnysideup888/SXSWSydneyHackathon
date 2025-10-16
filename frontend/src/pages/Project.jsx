import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Plus, 
    Brain, 
    List, 
    Kanban, 
    CheckCircle, 
    Clock, 
    Play, 
    Eye,
    X,
    User
} from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const Project = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('backlog');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAutoTranslateModal, setShowAutoTranslateModal] = useState(false);
    const [newTicket, setNewTicket] = useState({
        title: '',
        context: '',
        decision: '',
        consequences: '',
        peopleIds: []
    });

    const statusColumns = [
        { key: 'Backlog', label: 'Backlog', icon: List, color: 'slate' },
        { key: 'To Do', label: 'To Do', icon: Clock, color: 'blue' },
        { key: 'In Progress', label: 'In Progress', icon: Play, color: 'yellow' },
        { key: 'In Review', label: 'In Review', icon: Eye, color: 'purple' },
        { key: 'Done', label: 'Done', icon: CheckCircle, color: 'emerald' }
    ];

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const [projectRes, ticketsRes, peopleRes] = await Promise.all([
                apiClient.get(`/projects/${projectId}`),
                apiClient.get(`/projects/${projectId}/tickets`),
                apiClient.get('/people')
            ]);
            
            setProject(projectRes.data);
            setTickets(ticketsRes.data);
            setPeople(peopleRes.data);
        } catch (error) {
            console.error('Error fetching project data:', error);
            toast.error('Failed to load project data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const response = await apiClient.post(`/projects/${projectId}/tickets`, {
                ...newTicket,
                isAiGenerated: false
            });
            setTickets([response.data, ...tickets]);
            setNewTicket({
                title: '',
                context: '',
                decision: '',
                consequences: '',
                peopleIds: []
            });
            setShowCreateModal(false);
            toast.success('Ticket created successfully!');
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Failed to create ticket');
        }
    };

    const handleUpdateTicketStatus = async (ticketId, newStatus) => {
        try {
            await apiClient.put(`/tickets/${ticketId}`, { status: newStatus });
            setTickets(tickets.map(ticket => 
                ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
            ));
            toast.success('Ticket status updated!');
        } catch (error) {
            console.error('Error updating ticket status:', error);
            toast.error('Failed to update ticket status');
        }
    };

    const handleAcceptAiTicket = async (ticketId) => {
        try {
            await apiClient.put(`/tickets/${ticketId}`, { isAiGenerated: false });
            setTickets(tickets.map(ticket => 
                ticket.id === ticketId ? { ...ticket, isAiGenerated: false } : ticket
            ));
            toast.success('AI ticket accepted!');
        } catch (error) {
            console.error('Error accepting AI ticket:', error);
            toast.error('Failed to accept AI ticket');
        }
    };

    const handleRejectAiTicket = async (ticketId) => {
        try {
            await apiClient.delete(`/tickets/${ticketId}`);
            setTickets(tickets.filter(ticket => ticket.id !== ticketId));
            toast.success('AI ticket rejected!');
        } catch (error) {
            console.error('Error rejecting AI ticket:', error);
            toast.error('Failed to reject AI ticket');
        }
    };

    const getTicketsByStatus = (status) => {
        return tickets.filter(ticket => ticket.status === status);
    };

    const getStatusColor = (color) => {
        const colors = {
            slate: 'bg-slate-100 text-slate-800 border-slate-200',
            blue: 'bg-blue-100 text-blue-800 border-blue-200',
            yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            purple: 'bg-purple-100 text-purple-800 border-purple-200',
            emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200'
        };
        return colors[color] || colors.slate;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <span className="ml-3 text-slate-600">Loading project...</span>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-slate-600">Project not found</h2>
                    <Link to="/" className="text-emerald-600 hover:text-emerald-700">Back to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">{project.name}</h1>
                {project.description && (
                    <p className="text-slate-600">{project.description}</p>
                )}
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('backlog')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'backlog'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <List className="w-4 h-4 inline mr-2" />
                            Backlog
                        </button>
                        <button
                            onClick={() => setActiveTab('board')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'board'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <Kanban className="w-4 h-4 inline mr-2" />
                            SCRUM Board
                        </button>
                    </nav>
                </div>
            </div>

            {/* Backlog View */}
            {activeTab === 'backlog' && (
                <div className="space-y-6">
                    {/* Backlog Actions */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">Backlog</h2>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowAutoTranslateModal(true)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Brain className="w-4 h-4 mr-2" />
                                Auto-Translate
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Ticket
                            </button>
                        </div>
                    </div>

                    {/* Backlog Tickets */}
                    <div className="space-y-4">
                        {getTicketsByStatus('Backlog').map((ticket) => (
                            <div
                                key={ticket.id}
                                className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-slate-800">
                                                {ticket.title}
                                            </h3>
                                            {ticket.isAiGenerated && (
                                                <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                    <Brain className="w-3 h-3 mr-1" />
                                                    AI Generated
                                                </div>
                                            )}
                                        </div>
                                        
                                        {ticket.context && (
                                            <p className="text-sm text-slate-600 mb-2">
                                                <strong>Context:</strong> {ticket.context}
                                            </p>
                                        )}
                                        
                                        {ticket.decision && (
                                            <p className="text-sm text-slate-600 mb-2">
                                                <strong>Decision:</strong> {ticket.decision}
                                            </p>
                                        )}
                                        
                                        {ticket.consequences && (
                                            <p className="text-sm text-slate-600 mb-2">
                                                <strong>Consequences:</strong> {ticket.consequences}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {ticket.isAiGenerated && (
                                            <>
                                                <button
                                                    onClick={() => handleAcceptAiTicket(ticket.id)}
                                                    className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-lg hover:bg-emerald-200 transition-colors"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRejectAiTicket(ticket.id)}
                                                    className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        
                                        <Link
                                            to={`/tickets/${ticket.id}`}
                                            className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            View Details
                                        </Link>
                                        
                                        <button
                                            onClick={() => handleUpdateTicketStatus(ticket.id, 'To Do')}
                                            className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            Move to To Do
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {getTicketsByStatus('Backlog').length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-lg">
                                <List className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-600 mb-2">No tickets in backlog</h3>
                                <p className="text-slate-500">Create your first ticket to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SCRUM Board View */}
            {activeTab === 'board' && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-slate-800">SCRUM Board</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {statusColumns.map((column) => {
                            const columnTickets = getTicketsByStatus(column.key);
                            const Icon = column.icon;
                            
                            return (
                                <div key={column.key} className="bg-slate-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-2">
                                            <Icon className="w-4 h-4 text-slate-600" />
                                            <h3 className="font-medium text-slate-800">{column.label}</h3>
                                        </div>
                                        <span className="text-sm text-slate-500 bg-white px-2 py-1 rounded-full">
                                            {columnTickets.length}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {columnTickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() => window.location.href = `/tickets/${ticket.id}`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="text-sm font-medium text-slate-800 line-clamp-2">
                                                        {ticket.title}
                                                    </h4>
                                                    {ticket.isAiGenerated && (
                                                        <Brain className="w-3 h-3 text-blue-600 flex-shrink-0 ml-2" />
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>#{ticket.id}</span>
                                                    <div className="flex items-center space-x-1">
                                                        <User className="w-3 h-3" />
                                                        <span>0</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {columnTickets.length === 0 && (
                                            <div className="text-center py-8 text-slate-400">
                                                <Icon className="w-8 h-8 mx-auto mb-2" />
                                                <p className="text-xs">No tickets</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowCreateModal(false)} />
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <form onSubmit={handleCreateTicket}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="w-full">
                                            <h3 className="text-lg font-medium text-slate-900 mb-4">
                                                Create New Ticket
                                            </h3>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Title *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={newTicket.title}
                                                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="Enter ticket title"
                                                        required
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Context (ADR)
                                                    </label>
                                                    <textarea
                                                        value={newTicket.context}
                                                        onChange={(e) => setNewTicket({ ...newTicket, context: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="What is the context and problem we're trying to solve?"
                                                        rows={3}
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Decision (ADR)
                                                    </label>
                                                    <textarea
                                                        value={newTicket.decision}
                                                        onChange={(e) => setNewTicket({ ...newTicket, decision: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="What is the decision we're making?"
                                                        rows={3}
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Consequences (ADR)
                                                    </label>
                                                    <textarea
                                                        value={newTicket.consequences}
                                                        onChange={(e) => setNewTicket({ ...newTicket, consequences: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="What are the consequences of this decision?"
                                                        rows={3}
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Assign People
                                                    </label>
                                                    <select
                                                        multiple
                                                        value={newTicket.peopleIds}
                                                        onChange={(e) => setNewTicket({ 
                                                            ...newTicket, 
                                                            peopleIds: Array.from(e.target.selectedOptions, option => parseInt(option.value))
                                                        })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    >
                                                        {people.map((person) => (
                                                            <option key={person.id} value={person.id}>
                                                                {person.name} (@{person.username})
                                                            </option>
                                                        ))}
                                                    </select>
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
                                        Create Ticket
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

            {/* Auto-Translate Modal */}
            {showAutoTranslateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowAutoTranslateModal(false)} />
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="w-full">
                                        <div className="flex items-center mb-4">
                                            <Brain className="w-6 h-6 text-blue-600 mr-3" />
                                            <h3 className="text-lg font-medium text-slate-900">
                                                AI Auto-Translate
                                            </h3>
                                        </div>
                                        
                                        <p className="text-sm text-slate-600 mb-4">
                                            This feature will use AI to listen to your meetings and automatically generate tickets based on the discussion. 
                                            This is a placeholder for the actual implementation.
                                        </p>
                                        
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-800">
                                                <strong>Coming Soon:</strong> Screen sharing integration, real-time meeting transcription, 
                                                and AI-powered ticket generation will be available in a future update.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={() => setShowAutoTranslateModal(false)}
                                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Project;
