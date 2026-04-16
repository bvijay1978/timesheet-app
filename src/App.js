import React, { useState, useEffect } from 'react';
import { auth, database } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  ref,
  set,
  get,
  remove,
  onValue,
  push,
  update
} from 'firebase/database';
import { LogOut, Plus, Trash2, Clock, CheckCircle, Search } from 'lucide-react';

export default function TimesheetApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [tasks, setTasks] = useState({});
  const [timesheets, setTimesheets] = useState({});
  const [userRole, setUserRole] = useState(null);

  // Auth state
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('employee');

  // Manager views
  const [managerView, setManagerView] = useState('dashboard');

  // Task management for Manager
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Log Time
  const [logTimeMode, setLogTimeMode] = useState('existing');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [newTaskForLogging, setNewTaskForLogging] = useState('');
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');

  // Historical search
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [searchResults, setSearchResults] = useState({});

  // Load auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUsersLoaded(false);
        
        try {
          const userRef = ref(database, `users/${currentUser.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const role = snapshot.val().role;
            setUserRole(role);
          }
        } catch (error) {
          console.error('Error getting user role:', error);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUsersLoaded(false);
        setUsers({});
        setTasks({});
        setTimesheets({});
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load all users
  useEffect(() => {
    if (!user) {
      setUsersLoaded(false);
      return;
    }

    const usersRef = ref(database, 'users');
    let unsubscribeListener = null;

    get(usersRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          setUsers(snapshot.val());
        } else {
          setUsers({});
        }
        setUsersLoaded(true);
      })
      .catch((error) => {
        console.error('Error in get():', error);
        setUsers({});
        setUsersLoaded(true);
      });

    unsubscribeListener = onValue(
      usersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUsers(snapshot.val());
        } else {
          setUsers({});
        }
      }
    );

    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, [user]);

  // Load tasks
  useEffect(() => {
    if (!user) {
      setTasks({});
      return;
    }

    const tasksRef = ref(database, 'tasks');
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      setTasks(snapshot.exists() ? snapshot.val() : {});
    });

    return unsubscribe;
  }, [user]);

  // Load timesheets
  useEffect(() => {
    if (!user) {
      setTimesheets({});
      return;
    }

    const timesheetsRef = ref(database, 'timesheets');
    const unsubscribe = onValue(timesheetsRef, (snapshot) => {
      setTimesheets(snapshot.exists() ? snapshot.val() : {});
    });

    return unsubscribe;
  }, [user]);

  // Auth functions
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await set(ref(database, `users/${uid}`), {
        email,
        name,
        role,
        createdAt: new Date().toISOString()
      });

      setEmail('');
      setPassword('');
      setName('');
      setRole('employee');
      setAuthMode('login');
      alert('Account created! Please log in.');
    } catch (error) {
      alert('Error signing up: ' + error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      alert('Error logging in: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert('Error logging out: ' + error.message);
    }
  };

  // Task functions
  const createTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedEmployeeId) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const tasksRef = ref(database, 'tasks');
      const newTaskRef = push(tasksRef);
      await set(newTaskRef, {
        title: newTaskTitle,
        assignedTo: selectedEmployeeId,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        completed: false,
        completedAt: null,
        approvedBy: null,
        approvedAt: null
      });

      setNewTaskTitle('');
      setSelectedEmployeeId('');
      alert('Task assigned successfully!');
    } catch (error) {
      alert('Error creating task: ' + error.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await remove(ref(database, `tasks/${taskId}`));
    } catch (error) {
      alert('Error deleting task: ' + error.message);
    }
  };

  // Mark task as completed
  const markTaskCompleted = async (taskId) => {
    try {
      await update(ref(database, `tasks/${taskId}`), {
        completed: true,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      alert('Error completing task: ' + error.message);
    }
  };

  // Approve task
  const approveTask = async (taskId) => {
    try {
      await update(ref(database, `tasks/${taskId}`), {
        approvedBy: user.uid,
        approvedAt: new Date().toISOString()
      });
    } catch (error) {
      alert('Error approving task: ' + error.message);
    }
  };

  // Helper functions
  const convertToMinutes = (hours, minutes) => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    return h * 60 + m;
  };

  const convertFromMinutes = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  // Log time
  const logTime = async (e) => {
    e.preventDefault();
    let taskIdToUse = selectedTaskId;

    if (logTimeMode === 'new') {
      if (!newTaskForLogging.trim()) {
        alert('Please enter a task title');
        return;
      }

      try {
        const tasksRef = ref(database, 'tasks');
        const newTaskRef = push(tasksRef);
        await set(newTaskRef, {
          title: newTaskForLogging,
          assignedTo: user.uid,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          completed: false,
          completedAt: null,
          approvedBy: null,
          approvedAt: null
        });
        taskIdToUse = newTaskRef.key;
      } catch (error) {
        alert('Error creating task: ' + error.message);
        return;
      }
    } else {
      if (!selectedTaskId) {
        alert('Please select a task');
        return;
      }
    }

    if (hoursInput === '' && minutesInput === '') {
      alert('Please enter time');
      return;
    }

    const totalMinutes = convertToMinutes(hoursInput, minutesInput);
    if (totalMinutes === 0) {
      alert('Please enter at least 1 minute');
      return;
    }

    try {
      const timesheetsRef = ref(database, 'timesheets');
      const newTimesheetRef = push(timesheetsRef);
      await set(newTimesheetRef, {
        userId: user.uid,
        taskId: taskIdToUse,
        totalMinutes: totalMinutes,
        timeSpent: convertFromMinutes(totalMinutes),
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        approved: false,
        approvedAt: null,
        approvedBy: null
      });

      setHoursInput('');
      setMinutesInput('');
      setSelectedTaskId('');
      setNewTaskForLogging('');
      setLogTimeMode('existing');
      alert('Time logged successfully!');
    } catch (error) {
      alert('Error logging time: ' + error.message);
    }
  };

  // Approve timesheet
  const approveTimesheet = async (timesheetId) => {
    try {
      await update(ref(database, `timesheets/${timesheetId}`), {
        approved: true,
        approvedBy: user.uid,
        approvedAt: new Date().toISOString()
      });
    } catch (error) {
      alert('Error approving timesheet: ' + error.message);
    }
  };

  const deleteTimesheet = async (timesheetId) => {
    try {
      await remove(ref(database, `timesheets/${timesheetId}`));
    } catch (error) {
      alert('Error deleting timesheet entry: ' + error.message);
    }
  };

  // Helper functions
  const getEmployeeName = (uid) => {
    return users[uid]?.name || 'Unknown';
  };

  const getTaskTitle = (taskId) => {
    return tasks[taskId]?.title || 'Unknown Task';
  };

  const getEmployeeTimesheets = () => {
    if (!user) return {};
    return Object.entries(timesheets || {})
      .filter(([_, sheet]) => sheet.userId === user.uid)
      .reduce((acc, [id, sheet]) => ({ ...acc, [id]: sheet }), {});
  };

  // GET ALL TASKS ASSIGNED TO THIS USER
  const getTasksForEmployee = () => {
    if (!user) return {};
    return Object.entries(tasks || {})
      .filter(([_, task]) => task.assignedTo === user.uid)
      .reduce((acc, [id, task]) => ({ ...acc, [id]: task }), {});
  };

  // GET ONLY INCOMPLETE TASKS FOR EMPLOYEE
  const getTasksForEmployeeNotCompleted = () => {
    if (!user) return {};
    return Object.entries(tasks || {})
      .filter(([_, task]) => task.assignedTo === user.uid && !task.completed)
      .reduce((acc, [id, task]) => ({ ...acc, [id]: task }), {});
  };

  const getTotalTime = (taskId = null) => {
    let entries = Object.values(timesheets || {});
    if (taskId) {
      entries = entries.filter(sheet => sheet.taskId === taskId);
    }
    const totalMinutes = entries.reduce((sum, sheet) => sum + (sheet.totalMinutes || 0), 0);
    return convertFromMinutes(totalMinutes);
  };

  // Get this week's timesheets
  const getThisWeeksTimesheets = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    return Object.entries(timesheets || {})
      .filter(([_, sheet]) => {
        const sheetDate = new Date(sheet.date);
        return sheetDate >= weekStart;
      })
      .reduce((acc, [id, sheet]) => ({ ...acc, [id]: sheet }), {});
  };

  // Search historical timesheets
  const searchHistoricalTimesheets = () => {
    if (!searchStartDate || !searchEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(searchStartDate);
    const end = new Date(searchEndDate);
    end.setHours(23, 59, 59, 999);

    const results = Object.entries(timesheets || {})
      .filter(([_, sheet]) => {
        const sheetDate = new Date(sheet.date);
        return sheetDate >= start && sheetDate <= end;
      })
      .reduce((acc, [id, sheet]) => ({ ...acc, [id]: sheet }), {});

    setSearchResults(results);
  };

  const getTimesheetsForManager = () => {
    if (userRole !== 'admin') return {};
    if (managerView === 'history') {
      return searchResults;
    }
    return getThisWeeksTimesheets();
  };

  const getEmployeesList = () => {
    const employees = [];
    for (const [uid, userData] of Object.entries(users || {})) {
      if (userData?.role === 'employee' || (userRole === 'admin' && uid === user.uid)) {
        employees.push({ uid, name: userData.name });
      }
    }
    return employees;
  };

  const getActiveTasks = () => {
    return Object.entries(tasks || {})
      .filter(([_, task]) => !task.completed || !task.approvedBy)
      .length;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #f0f9ff, #e0e7ff)' }}>
        <p style={{ fontSize: '1.25rem', color: '#4f46e5' }}>Loading...</p>
      </div>
    );
  }

  // Auth Screen
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f0f9ff, #e0e7ff)', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '2rem', maxWidth: '28rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', color: '#1f2937', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Clock style={{ width: '2rem', height: '2rem', color: '#4f46e5' }} />
            Timesheet
          </h1>

          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
            <button
              onClick={() => setAuthMode('login')}
              style={{ marginRight: '1rem', padding: '0.5rem 1rem', background: authMode === 'login' ? '#4f46e5' : '#f3f4f6', color: authMode === 'login' ? 'white' : '#1f2937', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500' }}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              style={{ padding: '0.5rem 1rem', background: authMode === 'signup' ? '#4f46e5' : '#f3f4f6', color: authMode === 'signup' ? 'white' : '#1f2937', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500' }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {authMode === 'signup' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box', fontSize: '1rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Account Type</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box', fontSize: '1rem' }}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Manager</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box', fontSize: '1rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box', fontSize: '1rem' }}
              />
            </div>

            <button
              type="submit"
              style={{ width: '100%', background: '#4f46e5', color: 'white', fontWeight: '600', padding: '0.75rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            >
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Wait for users to load
  if (!usersLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #f0f9ff, #e0e7ff)' }}>
        <p style={{ fontSize: '1.25rem', color: '#4f46e5' }}>Loading team data...</p>
      </div>
    );
  }

  const myTasks = getTasksForEmployee();
  const myTasksNotCompleted = getTasksForEmployeeNotCompleted();
  const myTimesheets = getEmployeeTimesheets();
  const allTimesheets = getTimesheetsForManager();
  const employeesList = getEmployeesList();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f0f9ff, #e0e7ff)', padding: '2rem' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>Timesheet System</h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              {users[user.uid]?.name} <span style={{ color: '#4f46e5', fontWeight: '500' }}>({userRole === 'admin' ? 'Manager' : 'Employee'})</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: '#dc2626', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LogOut style={{ width: '1rem', height: '1rem' }} />
            Logout
          </button>
        </div>

        {/* Manager View Toggle */}
        {userRole === 'admin' && (
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setManagerView('dashboard')}
              style={{ padding: '0.5rem 1rem', background: managerView === 'dashboard' ? '#4f46e5' : '#f3f4f6', color: managerView === 'dashboard' ? 'white' : '#1f2937', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500' }}
            >
              This Week
            </button>
            <button
              onClick={() => setManagerView('history')}
              style={{ padding: '0.5rem 1rem', background: managerView === 'history' ? '#4f46e5' : '#f3f4f6', color: managerView === 'history' ? 'white' : '#1f2937', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Search style={{ width: '1rem', height: '1rem' }} />
              Search History
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {/* Manager Section */}
          {userRole === 'admin' && managerView === 'dashboard' && (
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', margin: '0 0 1rem 0' }}>Manager Controls</h2>

              <form onSubmit={createTask} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>Assign Task</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title"
                    style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
                  />
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
                  >
                    <option value="">Select Employee ({employeesList.filter(e => e.uid !== user.uid).length})</option>
                    {employeesList.filter(e => e.uid !== user.uid).map((emp) => (
                      <option key={emp.uid} value={emp.uid}>{emp.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    style={{ background: '#4f46e5', color: 'white', fontWeight: '600', padding: '0.75rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
                    Assign Task
                  </button>
                </div>
              </form>

              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>Pending Completion</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                {Object.entries(tasks).filter(([_, t]) => !t.completed).length === 0 ? (
                  <p style={{ color: '#6b7280' }}>All tasks completed!</p>
                ) : (
                  Object.entries(tasks).map(([taskId, task]) => {
                    if (task.completed) return null;
                    return (
                      <div key={taskId} style={{ background: '#fff7ed', padding: '1rem', borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem 0' }}>{task.title}</p>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>→ {getEmployeeName(task.assignedTo)}</p>
                        </div>
                        <button
                          onClick={() => deleteTask(taskId)}
                          style={{ padding: '0.5rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 style={{ width: '1.25rem', height: '1.25rem' }} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>Pending Approval</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {Object.entries(tasks).filter(([_, t]) => t.completed && !t.approvedBy).length === 0 ? (
                  <p style={{ color: '#6b7280' }}>No tasks pending approval</p>
                ) : (
                  Object.entries(tasks).map(([taskId, task]) => {
                    if (!task.completed || task.approvedBy) return null;
                    return (
                      <div key={taskId} style={{ background: '#dbeafe', padding: '1rem', borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem 0' }}>{task.title}</p>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>→ {getEmployeeName(task.assignedTo)}</p>
                        </div>
                        <button
                          onClick={() => approveTask(taskId)}
                          style={{ padding: '0.5rem', color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Search History for Manager */}
          {userRole === 'admin' && managerView === 'history' && (
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', margin: '0 0 1rem 0' }}>Search Timesheets</h2>
              <form onSubmit={(e) => { e.preventDefault(); searchHistoricalTimesheets(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Start Date</label>
                  <input
                    type="date"
                    value={searchStartDate}
                    onChange={(e) => setSearchStartDate(e.target.value)}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>End Date</label>
                  <input
                    type="date"
                    value={searchEndDate}
                    onChange={(e) => setSearchEndDate(e.target.value)}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{ background: '#4f46e5', color: 'white', fontWeight: '600', padding: '0.75rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
                >
                  Search
                </button>
              </form>
            </div>
          )}

          {/* Work Logging Section */}
          <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', margin: '0 0 1rem 0' }}>Log Work & Time</h2>

            <form onSubmit={logTime} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>Select or Create Task</h3>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setLogTimeMode('existing')}
                  style={{ flex: 1, padding: '0.5rem 1rem', background: logTimeMode === 'existing' ? '#4f46e5' : '#f3f4f6', color: logTimeMode === 'existing' ? 'white' : '#1f2937', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500' }}
                >
                  Use Existing
                </button>
                <button
                  type="button"
                  onClick={() => setLogTimeMode('new')}
                  style={{ flex: 1, padding: '0.5rem 1rem', background: logTimeMode === 'new' ? '#4f46e5' : '#f3f4f6', color: logTimeMode === 'new' ? 'white' : '#1f2937', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500' }}
                >
                  Create New
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {logTimeMode === 'existing' ? (
                  <>
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
                    >
                      <option value="">Select Task ({Object.keys(myTasks).length} assigned)</option>
                      {Object.entries(myTasks).map(([taskId, task]) => {
                        const isCompleted = task.completed;
                        return (
                          <option key={taskId} value={taskId}>
                            {task.title} {isCompleted ? '(Completed)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {Object.keys(myTasks).length === 0 && (
                      <p style={{ fontSize: '0.875rem', color: '#f59e0b', fontStyle: 'italic' }}>
                        📭 No tasks assigned yet. Ask your manager to assign one!
                      </p>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    value={newTaskForLogging}
                    onChange={(e) => setNewTaskForLogging(e.target.value)}
                    placeholder="Enter task title"
                    style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
                  />
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={hoursInput}
                      onChange={(e) => setHoursInput(e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutesInput}
                      onChange={(e) => setMinutesInput(e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ background: '#16a34a', color: 'white', fontWeight: '600', padding: '0.75rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
                  Log Time
                </button>
              </div>
            </form>

            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>My Tasks (Pending)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {Object.entries(myTasksNotCompleted).length === 0 ? (
                <p style={{ color: '#6b7280' }}>No pending tasks</p>
              ) : (
                Object.entries(myTasksNotCompleted).map(([taskId, task]) => (
                  <div key={taskId} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem 0' }}>{task.title}</p>
                      <p style={{ fontSize: '0.875rem', color: '#4f46e5', margin: '0.25rem 0 0 0' }}>{getTotalTime(taskId)} logged</p>
                    </div>
                    <button
                      onClick={() => markTaskCompleted(taskId)}
                      style={{ padding: '0.5rem', color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      title="Mark as completed"
                    >
                      <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>My Time Entries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {Object.entries(myTimesheets).length === 0 ? (
                <p style={{ color: '#6b7280' }}>No time entries yet</p>
              ) : (
                Object.entries(myTimesheets).map(([sheetId, sheet]) => (
                  <div key={sheetId} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem 0' }}>{getTaskTitle(sheet.taskId)}</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>{sheet.date} • {sheet.timeSpent}</p>
                      <p style={{ fontSize: '0.75rem', color: sheet.approved ? '#16a34a' : '#f59e0b', fontWeight: '500', margin: '0.25rem 0 0 0' }}>
                        {sheet.approved ? '✓ Approved' : '⏳ Pending'}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTimesheet(sheetId)}
                      style={{ padding: '0.5rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 style={{ width: '1.25rem', height: '1.25rem' }} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Manager Dashboard - Team Timesheets */}
          {userRole === 'admin' && (
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
                {managerView === 'dashboard' ? 'This Week\'s Timesheets' : 'Search Results'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }}>
                {Object.entries(allTimesheets).length === 0 ? (
                  <p style={{ color: '#6b7280' }}>No timesheets to show</p>
                ) : (
                  Object.entries(allTimesheets).map(([sheetId, sheet]) => (
                    <div key={sheetId} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.375rem', borderLeft: `4px solid ${sheet.approved ? '#16a34a' : '#f59e0b'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem 0' }}>{getTaskTitle(sheet.taskId)}</p>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>By: {getEmployeeName(sheet.userId)}</p>
                          <p style={{ fontSize: '0.875rem', color: '#4f46e5', fontWeight: '500', margin: '0' }}>{sheet.date} • {sheet.timeSpent}</p>
                        </div>
                        {!sheet.approved && (
                          <button
                            onClick={() => approveTimesheet(sheetId)}
                            style={{ padding: '0.5rem', color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            title="Approve timesheet"
                          >
                            <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '0.375rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Total Hours</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', margin: '0.5rem 0 0 0' }}>
                    {convertFromMinutes(Object.values(allTimesheets).reduce((sum, s) => sum + (s.totalMinutes || 0), 0))}
                  </p>
                </div>
                <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.375rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Pending Tasks</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', margin: '0.5rem 0 0 0' }}>{getActiveTasks()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}