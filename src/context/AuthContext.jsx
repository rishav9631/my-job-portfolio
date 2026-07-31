import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://jobtracker-backend-9dlp.onrender.com';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = localStorage.getItem('mailapp_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${BASE_URL}/api/v1/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        localStorage.removeItem('mailapp_token');
      }
    } catch {
      localStorage.removeItem('mailapp_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      username,
      password
    });

    if (res.data.success) {
      localStorage.setItem('mailapp_token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    localStorage.removeItem('mailapp_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

