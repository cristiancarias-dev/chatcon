import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    getMe()
      .then(setUser)
      .catch((err) => setError(err.message));
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "100px auto", padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>
      <p>Email: {user.email}</p>
      <p>ID: {user.id}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
