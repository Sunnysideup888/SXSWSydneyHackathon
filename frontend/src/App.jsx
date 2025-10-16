import apiClient from "./api/apiClient.js";
import { useState, useEffect } from 'react'

function App() {
    const [tasks, setTasks] = useState([])
    const [message, setMessage] = useState("Loading...")

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await apiClient.get('api/tasks')
                console.log(res.data)

                if (Array.isArray(res.data)) {
                    setTasks(res.data)
                    setMessage('')
                } else {
                    setMessage('Failed to load tasks')
                }
            } catch (err) {
                setMessage(`Error connecting to API ${err.data}`)
            }
        }

        fetchTasks()
    }, []);

    return (
        <>
            <p className="flex flex-row p-4 bg-amber-50 mb-2">Hackathon Tasks</p>
            {message && <p className="text-center">{message}</p>}

            <ul className="space-y-3">
                {tasks.map(task => (
                    <li
                        key={task.id}
                        className={`p-4 rounded-md flex items-center transition-all ${
                            task.is_complete ? 'bg-green-50' : 'bg-red-50'
                        }`}
                    >
                        {task.title}
                    </li>
                ))}
            </ul>
        </>
    )
}

export default App
