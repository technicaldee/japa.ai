import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const signin = async (data) => {
    const res = await authApi.signin(data);
    localStorage.setItem("token", res.token);
    setUser(res.user);
    return res;
  };

  const signup = async (data) => {
    const res = await authApi.signup(data);
    localStorage.setItem("token", res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
