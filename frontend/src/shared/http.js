const API_BASE = "/api";

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned HTML instead of JSON (status ${res.status}). Check if the backend is running.`
    );
  }
  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}
