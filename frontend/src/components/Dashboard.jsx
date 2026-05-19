import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, CheckCircle, Clock, AlertCircle, Calendar, User } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [userRole, setUserRole] = useState('');
  
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
    } catch (e) {
      navigate('/login');
    }
    fetchProjects();
    fetchUsers();
  }, [navigate]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
      if (res.data.length > 0) {
        if (!selectedProjectId) {
            setSelectedProjectId(res.data[0].id);
            setTasks(res.data[0].tasks || []);
        } else {
            const current = res.data.find(p => p.id === selectedProjectId);
            if (current) setTasks(current.tasks || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/');
      setTeamUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch team members", error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectTitle) return;
    try {
      await api.post('/projects/', { title: newProjectTitle, description: "New Project" });
      setNewProjectTitle('');
      fetchProjects();
    } catch (error) {
      alert("Error: Only Admins can create projects.");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !selectedProjectId) return;
    try {
      await api.post(`/projects/${selectedProjectId}/tasks/`, { 
          title: newTaskTitle,
          status: "To Do",
          due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
          assigned_to: newTaskAssignee ? parseInt(newTaskAssignee) : null
      });
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskAssignee('');
      fetchProjects();
    } catch (error) {
      alert("Error: Only Admins can create and assign tasks.");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      fetchProjects(); 
    } catch (error) {
      alert("Permission Denied: You can only update tasks assigned to you.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Task Manager</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${userRole === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {userRole}
          </span>
        </div>
        <button onClick={handleLogout} className="flex items-center text-gray-500 hover:text-red-600 transition font-medium">
          <LogOut size={18} className="mr-2" /> Logout
        </button>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Your Projects</h2>
          
          {userRole === 'Admin' && (
            <form onSubmit={handleCreateProject} className="mb-6">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1 focus-within:ring-2 focus-within:ring-blue-500 transition">
                <input type="text" value={newProjectTitle} onChange={(e) => setNewProjectTitle(e.target.value)} placeholder="New Project..." className="w-full bg-transparent border-none outline-none text-sm px-2 py-1" />
                <button type="submit" className="bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 transition">
                  <Plus size={16} />
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1">
            {projects.map(p => (
              <button key={p.id} onClick={() => { setSelectedProjectId(p.id); setTasks(p.tasks || []); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${selectedProjectId === p.id ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:bg-gray-100 border border-transparent'}`}>
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
          {projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <AlertCircle size={48} className="mb-4 text-gray-300" />
              <p>No projects found. {userRole === 'Admin' && 'Create one from the sidebar!'}</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              
              {userRole === 'Admin' && selectedProjectId && (
                <form onSubmit={handleCreateTask} className="mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center">
                  <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="What needs to be done?" className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-600">
                    <option value="">Assign to...</option>
                    {teamUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
                  <button type="submit" className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900 transition flex items-center font-medium">
                    <Plus size={18} className="mr-1" /> Add
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-100/60 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center text-gray-700 font-bold mb-4">
                    <AlertCircle size={18} className="mr-2 text-gray-500" /> To Do ({todoTasks.length})
                  </div>
                  <div className="space-y-3">
                    {todoTasks.map(task => <TaskCard key={task.id} task={task} users={teamUsers} onStatusChange={handleStatusChange} />)}
                  </div>
                </div>

                <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center text-blue-700 font-bold mb-4">
                    <Clock size={18} className="mr-2" /> In Progress ({inProgressTasks.length})
                  </div>
                  <div className="space-y-3">
                    {inProgressTasks.map(task => <TaskCard key={task.id} task={task} users={teamUsers} onStatusChange={handleStatusChange} />)}
                  </div>
                </div>

                <div className="bg-green-50/60 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center text-green-700 font-bold mb-4">
                    <CheckCircle size={18} className="mr-2" /> Done ({doneTasks.length})
                  </div>
                  <div className="space-y-3">
                    {doneTasks.map(task => <TaskCard key={task.id} task={task} users={teamUsers} onStatusChange={handleStatusChange} />)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, users, onStatusChange }) {
  const assignee = users.find(u => u.id === task.assigned_to);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${isOverdue ? 'border-red-300' : 'border-gray-200'} hover:shadow-md transition relative`}>
      {isOverdue && (
        <span className="absolute top-2 right-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
          Overdue
        </span>
      )}
      
      <h3 className="font-semibold text-gray-800 text-sm mb-2 pr-12">{task.title}</h3>
      
      <div className="flex items-center text-xs text-gray-500 mb-1">
        <User size={12} className="mr-1" />
        {assignee ? assignee.name : 'Unassigned'}
      </div>
      
      {task.due_date && (
        <div className={`flex items-center text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'} mb-3`}>
          <Calendar size={12} className="mr-1" />
          {new Date(task.due_date).toLocaleDateString()}
        </div>
      )}
      
      <div className="pt-3 border-t border-gray-100 mt-2">
        <select 
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-600 cursor-pointer"
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
    </div>
  );
}