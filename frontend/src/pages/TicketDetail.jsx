import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Brain, 
    Users, 
    GitBranch, 
    CheckCircle, 
    Clock,
    Play,
    Eye,
    FileText,
    Lightbulb,
    AlertTriangle
} from 'lucide-react';
import ReactFlow, { 
    Controls, 
    Background, 
    MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const TicketDetail = () => {
    const { ticketId } = useParams();
    const [ticket, setTicket] = useState(null);
    const [dependencies, setDependencies] = useState({ dependencies: [], dependents: [] });
    const [aiSummary, setAiSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDependencyGraph, setShowDependencyGraph] = useState(false);
    const [showAiSummary, setShowAiSummary] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);

    useEffect(() => {
        fetchTicketData();
    }, [ticketId]);

    const fetchTicketData = async () => {
        try {
            setLoading(true);
            const [ticketRes, dependenciesRes] = await Promise.all([
                apiClient.get(`/tickets/${ticketId}`),
                apiClient.get(`/tickets/${ticketId}/dependencies`)
            ]);
            
            setTicket(ticketRes.data);
            setDependencies(dependenciesRes.data);
        } catch (error) {
            console.error('Error fetching ticket data:', error);
            toast.error('Failed to load ticket data');
        } finally {
            setLoading(false);
        }
    };

    const handleAiSummarize = async () => {
        try {
            setSummaryLoading(true);
            const response = await apiClient.post(`/tickets/${ticketId}/summarize`);
            setAiSummary(response.data);
            setShowAiSummary(true);
            toast.success('AI summary generated!');
        } catch (error) {
            console.error('Error generating AI summary:', error);
            toast.error('Failed to generate AI summary');
        } finally {
            setSummaryLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        const icons = {
            'Backlog': Clock,
            'To Do': Clock,
            'In Progress': Play,
            'In Review': Eye,
            'Done': CheckCircle
        };
        return icons[status] || Clock;
    };

    const getStatusColor = (status) => {
        const colors = {
            'Backlog': 'bg-slate-100 text-slate-800',
            'To Do': 'bg-blue-100 text-blue-800',
            'In Progress': 'bg-yellow-100 text-yellow-800',
            'In Review': 'bg-purple-100 text-purple-800',
            'Done': 'bg-emerald-100 text-emerald-800'
        };
        return colors[status] || colors['Backlog'];
    };

    const createDependencyGraph = () => {
        const nodes = [];
        const edges = [];

        // Add current ticket as center node
        nodes.push({
            id: ticketId,
            type: 'default',
            position: { x: 250, y: 150 },
            data: { 
                label: `#${ticket.id} - ${ticket.title}`,
                status: ticket.status,
                isCurrent: true
            },
            style: {
                background: '#10b981',
                color: 'white',
                border: '2px solid #059669',
                borderRadius: '8px',
                fontWeight: 'bold'
            }
        });

        // Add dependency nodes (tickets this ticket depends on)
        dependencies.dependencies.forEach((dep, index) => {
            const nodeId = `dep-${dep.id}`;
            nodes.push({
                id: nodeId,
                type: 'default',
                position: { x: 50, y: 50 + (index * 100) },
                data: { 
                    label: `#${dep.id} - ${dep.title}`,
                    status: dep.status,
                    isDependency: true
                },
                style: {
                    background: '#3b82f6',
                    color: 'white',
                    border: '2px solid #2563eb',
                    borderRadius: '8px'
                }
            });

            // Add edge from dependency to current ticket
            edges.push({
                id: `dep-${dep.id}-to-${ticketId}`,
                source: nodeId,
                target: ticketId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 }
            });
        });

        // Add dependent nodes (tickets that depend on this ticket)
        dependencies.dependents.forEach((dep, index) => {
            const nodeId = `dependent-${dep.id}`;
            nodes.push({
                id: nodeId,
                type: 'default',
                position: { x: 450, y: 50 + (index * 100) },
                data: { 
                    label: `#${dep.id} - ${dep.title}`,
                    status: dep.status,
                    isDependent: true
                },
                style: {
                    background: '#f59e0b',
                    color: 'white',
                    border: '2px solid #d97706',
                    borderRadius: '8px'
                }
            });

            // Add edge from current ticket to dependent
            edges.push({
                id: `${ticketId}-to-dependent-${dep.id}`,
                source: ticketId,
                target: nodeId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#f59e0b', strokeWidth: 2 }
            });
        });

        return { nodes, edges };
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <span className="ml-3 text-slate-600">Loading ticket...</span>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-slate-600">Ticket not found</h2>
                    <Link to="/" className="text-emerald-600 hover:text-emerald-700">Back to Home</Link>
                </div>
            </div>
        );
    }

    const { nodes, edges } = createDependencyGraph();
    const StatusIcon = getStatusIcon(ticket.status);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                    <Link 
                        to={`/projects/${ticket.projectId}`}
                        className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Project
                    </Link>
                </div>
                
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">
                            #{ticket.id} - {ticket.title}
                        </h1>
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                                <StatusIcon className="w-4 h-4 mr-2" />
                                {ticket.status}
                            </div>
                            {ticket.isAiGenerated && (
                                <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                    <Brain className="w-4 h-4 mr-2" />
                                    AI Generated
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowDependencyGraph(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <GitBranch className="w-4 h-4 mr-2" />
                            See Dependencies
                        </button>
                        <button
                            onClick={handleAiSummarize}
                            disabled={summaryLoading}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            <Brain className="w-4 h-4 mr-2" />
                            {summaryLoading ? 'Summarizing...' : 'Summarize'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Ticket Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* ADR Context */}
                    {ticket.context && (
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <div className="flex items-center mb-4">
                                <FileText className="w-5 h-5 text-slate-600 mr-2" />
                                <h3 className="text-lg font-semibold text-slate-800">Context</h3>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap">{ticket.context}</p>
                        </div>
                    )}

                    {/* ADR Decision */}
                    {ticket.decision && (
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <div className="flex items-center mb-4">
                                <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
                                <h3 className="text-lg font-semibold text-slate-800">Decision</h3>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap">{ticket.decision}</p>
                        </div>
                    )}

                    {/* ADR Consequences */}
                    {ticket.consequences && (
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <div className="flex items-center mb-4">
                                <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                                <h3 className="text-lg font-semibold text-slate-800">Consequences</h3>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap">{ticket.consequences}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Assigned People */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <div className="flex items-center mb-4">
                            <Users className="w-5 h-5 text-slate-600 mr-2" />
                            <h3 className="text-lg font-semibold text-slate-800">Assigned People</h3>
                        </div>
                        {ticket.assignedPeople && ticket.assignedPeople.length > 0 ? (
                            <div className="space-y-2">
                                {ticket.assignedPeople.map((person) => (
                                    <div key={person.id} className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-emerald-800">
                                                {person.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{person.name}</p>
                                            <p className="text-xs text-slate-500">@{person.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm">No one assigned</p>
                        )}
                    </div>

                    {/* Dependencies Summary */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <div className="flex items-center mb-4">
                            <GitBranch className="w-5 h-5 text-slate-600 mr-2" />
                            <h3 className="text-lg font-semibold text-slate-800">Dependencies</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-2">Depends on ({dependencies.dependencies.length})</p>
                                {dependencies.dependencies.length > 0 ? (
                                    <div className="space-y-2">
                                        {dependencies.dependencies.map((dep) => (
                                            <div key={dep.id} className="flex items-center space-x-2 text-sm">
                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(dep.status).split(' ')[0]}`}></div>
                                                <Link 
                                                    to={`/tickets/${dep.id}`}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    #{dep.id} - {dep.title}
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">No dependencies</p>
                                )}
                            </div>
                            
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-2">Dependents ({dependencies.dependents.length})</p>
                                {dependencies.dependents.length > 0 ? (
                                    <div className="space-y-2">
                                        {dependencies.dependents.map((dep) => (
                                            <div key={dep.id} className="flex items-center space-x-2 text-sm">
                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(dep.status).split(' ')[0]}`}></div>
                                                <Link 
                                                    to={`/tickets/${dep.id}`}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    #{dep.id} - {dep.title}
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">No dependents</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dependency Graph Modal */}
            {showDependencyGraph && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowDependencyGraph(false)} />
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-slate-900">
                                        Dependency Graph - #{ticket.id}
                                    </h3>
                                    <button
                                        onClick={() => setShowDependencyGraph(false)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <div className="h-96 border border-slate-200 rounded-lg">
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        fitView
                                        attributionPosition="bottom-left"
                                    >
                                        <Controls />
                                        <Background />
                                        <MiniMap />
                                    </ReactFlow>
                                </div>
                                
                                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                                            <span>Current Ticket</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                            <span>Dependencies</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                            <span>Dependents</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Summary Modal */}
            {showAiSummary && aiSummary && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowAiSummary(false)} />
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <Brain className="w-6 h-6 text-purple-600 mr-3" />
                                        <h3 className="text-lg font-medium text-slate-900">
                                            AI Summary - #{ticket.id}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setShowAiSummary(false)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-slate-600">
                                        Based on {aiSummary.dependenciesCount} dependency ticket(s)
                                    </p>
                                </div>
                                
                                <div className="prose max-w-none">
                                    <div className="whitespace-pre-wrap text-slate-700">
                                        {aiSummary.summary}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketDetail;
