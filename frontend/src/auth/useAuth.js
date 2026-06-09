import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../shared/http";

export default function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    request("/users/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  function login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((data) => {
      localStorage.setItem("token", data.access_token);
      return request("/users/me");
    }).then(setUser);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  }

  return { user, loading, login, logout };
}
