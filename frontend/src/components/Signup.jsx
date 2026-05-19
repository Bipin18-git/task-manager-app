import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Member' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // API call to our FastAPI backend
      await api.post('/signup', formData);
      navigate('/login'); // Signup ke baad seedha login page par
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Email might exist.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100 mt-10 mb-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2 text-sm">Join the Task Manager</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center mb-4 font-medium">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" name="name" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              onChange={handleChange} placeholder="John Doe" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email ID</label>
            <input 
              type="email" name="email" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              onChange={handleChange} placeholder="email@example.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" name="password" required minLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              onChange={handleChange} placeholder="••••••••" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Role</label>
            <select 
              name="role"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              onChange={handleChange}
              value={formData.role}
            >
              <option value="Member">Member (Can view/update tasks)</option>
              <option value="Admin">Admin (Can create projects/tasks)</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md mt-2">
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}