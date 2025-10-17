import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Projects API
export const projectsAPI = {
    getAll: () => {
        console.log('API Call: GET /api/projects')
        return apiClient.get('/api/projects')
    },
    create: (data) => {
        console.log('API Call: POST /api/projects', data)
        return apiClient.post('/api/projects', data)
    },
    delete: (id) => {
        console.log('API Call: DELETE /api/projects/' + id)
        return apiClient.delete(`/api/projects/${id}`)
    }
}

// Tickets API
export const ticketsAPI = {
    getAll: () => {
        console.log('API Call: GET /api/tickets')
        return apiClient.get('/api/tickets')
    },
    getByProject: (projectId) => {
        console.log('API Call: GET /api/tickets?projectId=' + projectId)
        return apiClient.get(`/api/tickets?projectId=${projectId}`)
    },
    getById: (id) => {
        console.log('API Call: GET /api/tickets/' + id)
        return apiClient.get(`/api/tickets/${id}`)
    },
    create: (data) => {
        console.log('API Call: POST /api/tickets', data)
        return apiClient.post('/api/tickets', data)
    },
    update: (id, data) => {
        console.log('API Call: PUT /api/tickets/' + id, data)
        return apiClient.put(`/api/tickets/${id}`, data)
    },
    delete: (id) => {
        console.log('API Call: DELETE /api/tickets/' + id)
        return apiClient.delete(`/api/tickets/${id}`)
    },
    summarize: (id) => {
        console.log('API Call: POST /api/tickets/' + id + '/summarize')
        return apiClient.post(`/api/tickets/${id}/summarize`)
    }
}

// People API
export const peopleAPI = {
    getAll: () => {
        console.log('API Call: GET /api/people')
        return apiClient.get('/api/people')
    },
    create: (data) => {
        console.log('API Call: POST /api/people', data)
        return apiClient.post('/api/people', data)
    },
    delete: (id) => {
        console.log('API Call: DELETE /api/people/' + id)
        return apiClient.delete(`/api/people/${id}`)
    }
}

// Ticket-People assignments
export const ticketPeopleAPI = {
    assign: (ticketId, personId) => {
        console.log('API Call: POST /api/tickets/' + ticketId + '/people', { personId })
        return apiClient.post(`/api/tickets/${ticketId}/people`, { personId })
    },
    unassign: (ticketId, personId) => {
        console.log('API Call: DELETE /api/tickets/' + ticketId + '/people/' + personId)
        return apiClient.delete(`/api/tickets/${ticketId}/people/${personId}`)
    }
}

// Ticket dependencies
export const ticketDependenciesAPI = {
    add: (ticketId, dependsOnTicketId) => {
        console.log('API Call: POST /api/tickets/' + ticketId + '/dependencies', { dependsOnTicketId })
        return apiClient.post(`/api/tickets/${ticketId}/dependencies`, { dependsOnTicketId })
    },
    remove: (ticketId, dependsOnTicketId) => {
        console.log('API Call: DELETE /api/tickets/' + ticketId + '/dependencies/' + dependsOnTicketId)
        return apiClient.delete(`/api/tickets/${ticketId}/dependencies/${dependsOnTicketId}`)
    }
}

export default apiClient;