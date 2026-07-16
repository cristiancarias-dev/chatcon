import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authService, type RegisterCompanyRequest } from "../services/authService";
import { setOnUnauthorized } from "../services/http";
import type { UserWithRoles } from "../types";

interface AuthContextType {
  user: UserWithRoles | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterCompanyRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      navigate("/login");
    });
    return () => setOnUnauthorized(null);
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = !!user?.is_superuser || !!user?.roles?.some((r) => r.name === "admin");

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    if (!data) throw new Error("Login failed");
    localStorage.setItem("token", data.access_token);
    const me = await authService.getMe();
    setUser(me);
    navigate("/dashboard");
  }, [navigate]);

  const register = useCallback(async (data: RegisterCompanyRequest) => {
    await authService.registerCompany(data);
    const tokenData = await authService.login({ email: data.email, password: data.password });
    if (!tokenData) throw new Error("Auto-login failed");
    localStorage.setItem("token", tokenData.access_token);
    const me = await authService.getMe();
    setUser(me);
    navigate("/dashboard");
  }, [navigate]);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
