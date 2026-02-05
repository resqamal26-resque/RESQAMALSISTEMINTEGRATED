
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ResponderLayout from './components/responder/ResponderLayout';
import MeccLayout from './components/mecc/MeccLayout';
import SuperAdminLayout from './components/superadmin/SuperAdminLayout';
import TaskCheckIn from './components/responder/TaskCheckIn';
import { User, UserRole, Attendance } from './types';

// Helper function for Malaysian Date Format
export const formatMyDate = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput.toString();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTask, setActiveTask] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const recordSession = useCallback((userData: User, action: 'LOGIN' | 'LOGOUT') => {
    try {
      const history = JSON.parse(localStorage.getItem('resq_session_logs') || '[]');
      const newEntry = {
        id: `SES_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: userData.id,
        userName: userData.name,
        role: userData.role,
        action,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      localStorage.setItem('resq_session_logs', JSON.stringify([newEntry, ...history].slice(0, 100)));
    } catch (e) {
      console.error("Gagal merekod sesi:", e);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('resq_user');
    const storedTask = localStorage.getItem('resq_active_task');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('resq_user');
      }
    }
    if (storedTask) {
      try {
        setActiveTask(JSON.parse(storedTask));
      } catch (e) {
        localStorage.removeItem('resq_active_task');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    localStorage.setItem('resq_user', JSON.stringify(userData));
    setUser(userData);
    recordSession(userData, 'LOGIN');
  };

  const handleLogout = useCallback(() => {
    if (user) {
      recordSession(user, 'LOGOUT');
    }
    
    // 1. Force Clear Storage
    const keysToKeep = ['resq_gas_url']; // Keep the backend URL for convenience
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    sessionStorage.clear();
    
    // 2. Reset State
    setUser(null);
    setActiveTask(null);
    
    // 3. Force Redirection and Hard Refresh
    window.location.hash = '#/login';
    window.location.reload();
  }, [user, recordSession]);

  const handleTaskLogin = (task: Attendance) => {
    setActiveTask(task);
    localStorage.setItem('resq_active_task', JSON.stringify(task));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
          <p className="text-white font-black text-[10px] uppercase tracking-widest animate-pulse">Menyediakan Protokol resQ Amal...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <RegisterPage />} 
        />
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role === UserRole.SUPERADMIN ? (
              <SuperAdminLayout user={user} onLogout={handleLogout} />
            ) : user.role === UserRole.RESPONDER ? (
              !activeTask ? <Navigate to="/checkin" replace /> : <ResponderLayout user={user} onLogout={handleLogout} activeTask={activeTask} />
            ) : (
              <MeccLayout user={user} onLogout={handleLogout} />
            )
          }
        />
        <Route 
          path="/checkin"
          element={
            user && user.role === UserRole.RESPONDER ? (
              <TaskCheckIn user={user} onTaskLogin={handleTaskLogin} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
