import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CommentProvider } from './context/CommentContext';
import Thread from './components/Thread/Thread';
import AuthTabs from './components/Auth/AuthTabs';
import { Moon, Sun } from 'lucide-react';
import './index.css';

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <CommentProvider>
        <div className="app-container">
          <header className="app-header">
            <div className="logo-container">
               <h1>CommentSystem</h1>
               <div className="badge">Pro</div>
            </div>
            
            <div className="header-controls">
               <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <AuthTabs />
            </div>
          </header>
          
          <main className="app-main">
            <Thread />
          </main>
        </div>
      </CommentProvider>
    </AuthProvider>
  );
};

export default App;
