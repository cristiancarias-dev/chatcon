import { request } from "../shared/http";

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
