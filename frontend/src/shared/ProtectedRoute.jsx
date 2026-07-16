import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  useEffect(() => {
    if (!loading && token && requireAdmin && !isAdmin) {
      navigate("/dashboard");
    }
  }, [loading, token, requireAdmin, isAdmin, navigate]);

  if (!token || loading) return null;
  if (requireAdmin && !isAdmin) return null;

  return children;
}
