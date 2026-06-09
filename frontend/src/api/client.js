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

export function getUsers() {
  return request("/users/");
}

export function getUser(id) {
  return request(`/users/${id}`);
}

export function updateUser(id, data) {
  return request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id) {
  return request(`/users/${id}`, { method: "DELETE" });
}

export function updateUserRoles(id, roleIds) {
  return request(`/users/${id}/roles`, {
    method: "PUT",
    body: JSON.stringify(roleIds),
  });
}

export function getRoles() {
  return request("/roles/");
}

export function createRole(data) {
  return request("/roles/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getRole(id) {
  return request(`/roles/${id}`);
}

export function updateRole(id, data) {
  return request(`/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteRole(id) {
  return request(`/roles/${id}`, { method: "DELETE" });
}

export function getRolePermissions(id) {
  return request(`/roles/${id}/permissions`);
}

export function updateRolePermissions(id, permissionIds) {
  return request(`/roles/${id}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permission_ids: permissionIds }),
  });
}

export function getPermissions() {
  return request("/permissions/");
}
