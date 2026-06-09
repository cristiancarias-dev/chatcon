import { request } from "../shared/http";

export function getRoles() {
  return request("/roles/");
}

export function getRole(id) {
  return request(`/roles/${id}`);
}

export function createRole(data) {
  return request("/roles/", {
    method: "POST",
    body: JSON.stringify(data),
  });
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

export function updateRolePermissions(id, permissionIds) {
  return request(`/roles/${id}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permission_ids: permissionIds }),
  });
}

export function getPermissions() {
  return request("/permissions/");
}
