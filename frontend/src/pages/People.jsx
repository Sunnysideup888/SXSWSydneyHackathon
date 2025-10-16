import { useState, useEffect } from 'react';
import { Plus, User, Mail, AtSign, X } from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const People = () => {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPerson, setNewPerson] = useState({
        name: '',
        email: '',
        username: ''
    });

    useEffect(() => {
        fetchPeople();
    }, []);

    const fetchPeople = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/people');
            setPeople(response.data);
        } catch (error) {
            console.error('Error fetching people:', error);
            toast.error('Failed to load people');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePerson = async (e) => {
        e.preventDefault();
        try {
            const response = await apiClient.post('/people', newPerson);
            setPeople([response.data, ...people]);
            setNewPerson({ name: '', email: '', username: '' });
            setShowCreateModal(false);
            toast.success('Person added successfully!');
        } catch (error) {
            console.error('Error creating person:', error);
            toast.error('Failed to add person');
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <span className="ml-3 text-slate-600">Loading people...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">People</h1>
                <p className="text-slate-600">Manage team members and their @mentions</p>
            </div>

            {/* Actions */}
            <div className="mb-6">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Person
                </button>
            </div>

            {/* People List */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                {people.length === 0 ? (
                    <div className="text-center py-12">
                        <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">No people yet</h3>
                        <p className="text-slate-500 mb-6">Add team members to enable @mentions in tickets.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Person
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {people.map((person) => (
                            <div key={person.id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <span className="text-lg font-medium text-emerald-800">
                                            {person.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-slate-800">
                                            {person.name}
                                        </h3>
                                        <div className="flex items-center space-x-4 mt-1">
                                            {person.email && (
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    {person.email}
                                                </div>
                                            )}
                                            {person.username && (
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <AtSign className="w-4 h-4 mr-2" />
                                                    @{person.username}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="text-sm text-slate-500">
                                        ID: {person.id}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Person Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowCreateModal(false)} />
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleCreatePerson}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="w-full">
                                            <h3 className="text-lg font-medium text-slate-900 mb-4">
                                                Add New Person
                                            </h3>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={newPerson.name}
                                                        onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="Enter full name"
                                                        required
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={newPerson.email}
                                                        onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="Enter email address"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Username (for @mentions) *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={newPerson.username}
                                                        onChange={(e) => setNewPerson({ ...newPerson, username: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="Enter username (e.g., johndoe)"
                                                        required
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
                                        Add Person
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

export default People;
