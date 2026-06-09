const API_BASE = "/api";

async function request(endpoint, options = {}) {
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
  const text = await res.text();
  if (!text) {
    throw new Error("Empty response from server");
  }
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

export function register(email, password, name) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, name: "" }),
  });
}

export function getMe() {
  return request("/users/me");
}
