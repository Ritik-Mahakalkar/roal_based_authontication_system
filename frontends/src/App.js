import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

const API = axios.create({ baseURL: 'http://localhost:4000' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await API.post('/login', form);
      localStorage.setItem('token', res.data.token);
      const profile = await API.get('/profile');
      localStorage.setItem('user', JSON.stringify(profile.data));
      navigate('/profile');
    } catch (err) {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4 shadow" style={{ width: '22rem' }}>
        <h3 className="text-center mb-4">Login</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  useEffect(() => {
    API.get('/profile')
      .then(res => setUser(res.data))
      .catch(() => {
        setUser(null);
        navigate('/');
      });
  }, [navigate]);

  if (!user) return <div className="text-center mt-5">Loading...</div>;

  return (
 
<div  className='mainContainer'>
    <div className="container mt-5">
      <div className="card p-4 shadow-sm">
        <h3 className="mb-3">Welcome, User!</h3>
        <p><strong>User Name : </strong>{user.username}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Created At:</strong> {user.created_at}</p>
        <div className="my-3">
          <a href="/admin" className="btn btn-outline-primary me-2">Admin</a>
          <a href="/editor" className="btn btn-outline-secondary me-2">Editor</a>
          <a href="/viewer" className="btn btn-outline-success">Viewer</a>
        </div>
        <button onClick={handleLogout} className="btn btn-danger logout_button">
          Logout
        </button>
      </div>
    </div>
    </div>
  );
};

const ProtectedRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" />;
  return children;
};

const RolePage = ({ role }) => (
  <div className="container mt-5 text-center">
    <h2 className="text-success">{role} Access Granted</h2>
  </div>
);

const Unauthorized = () => (
  <div className="container mt-5 text-center">
    <h2 className="text-danger">Unauthorized Access</h2>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><RolePage role="Admin" /></ProtectedRoute>} />
        <Route path="/editor" element={<ProtectedRoute roles={['Admin', 'Editor']}><RolePage role="Editor" /></ProtectedRoute>} />
        <Route path="/viewer" element={<ProtectedRoute roles={['Admin', 'Editor', 'Viewer']}><RolePage role="Viewer" /></ProtectedRoute>} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </Router>
  );
}

export default App;
