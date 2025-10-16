import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Home from './pages/Home';
import Project from './pages/Project';
import TicketDetail from './pages/TicketDetail';
import People from './pages/People';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-slate-50">
                <Toaster 
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                    }}
                />
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/projects/:projectId" element={<Project />} />
                        <Route path="/tickets/:ticketId" element={<TicketDetail />} />
                        <Route path="/people" element={<People />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            </div>
        </Router>
    );
}

export default App;
