import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('elyn_token'));

  const axiosConfig = useCallback(() => {
    const config = { withCredentials: true, headers: {} };
    const t = token || localStorage.getItem('elyn_token');
    if (t) config.headers['Authorization'] = `Bearer ${t}`;
    return config;
  }, [token]);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, axiosConfig());
      setUser(data);
    } catch {
      setUser(null);
      localStorage.removeItem('elyn_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [axiosConfig]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
      if (data.token) {
        localStorage.setItem('elyn_token', data.token);
        setToken(data.token);
      }
      setUser(data);
      return { success: true };
    } catch (e) {
      return { success: false, error: formatApiErrorDetail(e.response?.data?.detail) };
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/register`, { username, email, password }, { withCredentials: true });
      if (data.token) {
        localStorage.setItem('elyn_token', data.token);
        setToken(data.token);
      }
      setUser(data);
      return { success: true };
    } catch (e) {
      return { success: false, error: formatApiErrorDetail(e.response?.data?.detail) };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, axiosConfig());
    } catch {}
    localStorage.removeItem('elyn_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, token, axiosConfig }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
