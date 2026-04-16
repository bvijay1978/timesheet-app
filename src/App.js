import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, LogOut, User, Play, Pause, RotateCcw } from 'lucide-react';

export default function TimesheetApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [timesheets, setTimesheets] = useState({});
  const [currentProject, setCurrentProject] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [runningTimer, setRunningTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('timesheetUsers');
    const savedTimesheets = localStorage.getItem('timesheetData');
    
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      setUsers(parsedUsers);
      if (parsedUsers.length > 0) {
        setCurrentUser(parsedUsers[0]);
      }
    }
    
    if (savedTimesheets) {
      setTimesheets(JSON.parse(savedTimesheets));
    }
  }, []);

  // Save users to localStorage
  useEffect(() => {
    localStorage.setItem('timesheetUsers', JSON.stringify(users));
  }, [users]);

  // Save timesheets to localStorage
  useEffect(() => {
    localStorage.setItem('timesheetData', JSON.stringify(timesheets));
  }, [timesheets]);

  // Timer interval
  useEffect(() => {
    let interval;
    if (runningTimer) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [runningTimer]);

  const addUser = () => {
    if (newUserName.trim()) {
      const newUser = { id: Date.now(), name: newUserName };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      if (!currentUser) {
        setCurrentUser(newUser);
      }
      setNewUserName('');
    }
  };

  const switchUser = (user) => {
    if (runningTimer) {
      alert('Please stop the timer before switching users');
      return;
    }
    setCurrentUser(user);
    setCurrentProject('');
  };

  const deleteUser = (userId) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    
    // Remove user's timesheets
    const updatedTimesheets = { ...timesheets };
    delete updatedTimesheets[userId];
    setTimesheets(updatedTimesheets);
    
    // Switch to another user if current was deleted
    if (currentUser?.id === userId) {
      setCurrentUser(updatedUsers.length > 0 ? updatedUsers[0] : null);
      setCurrentProject('');
    }
  };

  const addProject = () => {
    if (newProjectName.trim() && currentUser) {
      if (!timesheets[currentUser.id]) {
        timesheets[currentUser.id] = {};
      }
      timesheets[currentUser.id][newProjectName] = 0;
      setTimesheets({ ...timesheets });
      setCurrentProject(newProjectName);
      setNewProjectName('');
    }
  };

  const startTimer = () => {
    if (currentProject && currentUser) {
      setRunningTimer(currentProject);
      setTimerSeconds(0);
    }
  };

  const pauseTimer = () => {
    if (runningTimer && currentUser) {
      const currentTime = timesheets[currentUser.id][runningTimer] || 0;
      timesheets[currentUser.id][runningTimer] = currentTime + timerSeconds;
      setTimesheets({ ...timesheets });
      setRunningTimer(null);
      setTimerSeconds(0);
    }
  };

  const resetTimer = () => {
    setRunningTimer(null);
    setTimerSeconds(0);
  };

  const deleteProject = (projectName) => {
    if (currentUser) {
      const updatedProjects = { ...timesheets[currentUser.id] };
      delete updatedProjects[projectName];
      timesheets[currentUser.id] = updatedProjects;
      setTimesheets({ ...timesheets });
      if (currentProject === projectName) {
        setCurrentProject('');
      }
      if (runningTimer === projectName) {
        setRunningTimer(null);
      }
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getUserProjects = () => {
    return currentUser ? (timesheets[currentUser.id] || {}) : {};
  };

  const getTotalHours = () => {
    const projects = getUserProjects();
    const total = Object.values(projects).reduce((sum, time) => sum + time, 0);
    return (total / 3600).toFixed(2);
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f0f9ff, #e0e7ff)', padding: '2rem' }}>
        <div style={{ maxWidth: '28rem', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Clock style={{ width: '3rem', height: '3rem', color: '#4f46e5' }} />
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', color: '#1f2937', marginBottom: '2rem' }}>Timesheet</h1>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Create or Select User
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addUser()}
                  placeholder="Enter your name"
                  style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box' }}
                />
              </div>
              <button
                onClick={addUser}
                style={{ width: '100%', background: '#4f46e5', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
              >
                <Plus style={{ width: '1.25rem', height: '1.25rem', display: 'inline', marginRight: '0.5rem' }} />
                Create User
              </button>
            </div>

            {users.length > 0 && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>Existing Users:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setCurrentUser(user)}
                      style={{ width: '100%', textAlign: 'left', padding: '0.5rem 1rem', background: '#f3f4f6', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', color: '#1f2937', fontWeight: '500' }}
                    >
                      <User style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                      {user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const projects = getUserProjects();
  const hasProjects = Object.keys(projects).length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f0f9ff, #e0e7ff)', padding: '2rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                <Clock style={{ width: '2rem', height: '2rem', color: '#4f46e5', marginRight: '0.75rem' }} />
                Timesheet
              </h1>
              <p style={{ fontSize: '1.125rem', color: '#4b5563', marginTop: '0.25rem' }}>
                <User style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                {currentUser.name}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#4b5563' }}>Total Hours</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#4f46e5' }}>{getTotalHours()}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Projects List */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>Projects</h2>
              
              {hasProjects ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {Object.entries(projects).map(([projectName, totalTime]) => (
                    <div
                      key={projectName}
                      onClick={() => setCurrentProject(projectName)}
                      style={{ padding: '1rem', borderRadius: '0.375rem', cursor: 'pointer', background: currentProject === projectName ? '#e0e7ff' : '#f9fafb', border: currentProject === projectName ? '2px solid #4f46e5' : '2px solid transparent' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: '600', color: '#1f2937' }}>{projectName}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>
                            {formatTime(totalTime)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(projectName);
                            }}
                            style={{ padding: '0.5rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            <Trash2 style={{ width: '1.25rem', height: '1.25rem' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>No projects yet. Create one to get started!</p>
              )}

              <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  New Project
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addProject()}
                    placeholder="Project name"
                    style={{ flex: 1, padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={addProject}
                    style={{ background: '#4f46e5', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
                  >
                    <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Timer & User Management */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Timer */}
            {currentProject && (
              <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>Timer</h3>
                <div style={{ background: '#f3f4f6', borderRadius: '0.375rem', padding: '1.5rem', marginBottom: '1rem' }}>
                  <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>Current Project</p>
                  <p style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>{currentProject}</p>
                  <div style={{ fontSize: '2.25rem', fontWeight: 'bold', textAlign: 'center', color: '#4f46e5', fontFamily: 'monospace', marginBottom: '1rem' }}>
                    {runningTimer ? formatTime(timerSeconds) : '00:00:00'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {!runningTimer ? (
                    <button
                      onClick={startTimer}
                      style={{ width: '100%', background: '#16a34a', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Play style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      style={{ width: '100%', background: '#ca8a04', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Pause style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                      Save & Pause
                    </button>
                  )}
                  {runningTimer && (
                    <button
                      onClick={resetTimer}
                      style={{ width: '100%', background: '#4b5563', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <RotateCcw style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* User Management */}
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>Users</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {users.map(user => (
                  <div
                    key={user.id}
                    style={{ padding: '0.75rem', borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: user.id === currentUser.id ? '#e0e7ff' : '#f9fafb', border: user.id === currentUser.id ? '2px solid #4f46e5' : '2px solid transparent' }}
                  >
                    <button
                      onClick={() => switchUser(user)}
                      style={{ textAlign: 'left', flex: 1, fontWeight: '500', color: '#1f2937', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      {user.name}
                      {user.id === currentUser.id && <span style={{ color: '#4f46e5' }}> (current)</span>}
                    </button>
                    {users.length > 1 && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        style={{ padding: '0.25rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setCurrentProject('');
                }}
                style={{ width: '100%', background: '#dc2626', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <LogOut style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}