import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const AuthTabs = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, register, user, logout } = useContext(AuthContext);

  if (user) {
    return (
      <div className="user-profile">
        <span>Welcome, <strong style={{color: 'var(--primary-color)'}}>{user.username}</strong></span>
        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>Login</button>
        <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>Register</button>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-inputs">
           <input 
             type="text" 
             placeholder="Username" 
             value={username} 
             onChange={(e) => setUsername(e.target.value)} 
             required 
           />
           <input 
             type="password" 
             placeholder="Password" 
             value={password} 
             onChange={(e) => setPassword(e.target.value)} 
             required 
           />
           <button type="submit" className="btn-submit-auth">
             {isLogin ? 'Go' : 'Go'}
           </button>
        </div>
        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
};

export default AuthTabs;
