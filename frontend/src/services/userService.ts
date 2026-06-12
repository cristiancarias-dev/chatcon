import { request } from "./http";
import type { UserCreate, UserRead, UserUpdate, UserWithRoles } from "../types";

export const userService = {
  getAll(skip = 0, limit = 100): Promise<UserWithRoles[] | null> {
    return request(`/users/?skip=${skip}&limit=${limit}`);
  },

  getById(id: number): Promise<UserWithRoles | null> {
    return request(`/users/${id}`);
  },

  getMe(): Promise<UserWithRoles | null> {
    return request("/users/me");
  },

  update(id: number, data: UserUpdate): Promise<UserRead | null> {
    return request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  updateMe(data: UserUpdate): Promise<UserRead | null> {
    return request("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<null> {
    return request(`/users/${id}`, { method: "DELETE" });
  },

  updateRoles(id: number, roleIds: number[]): Promise<UserWithRoles | null> {
    return request(`/users/${id}/roles`, {
      method: "PUT",
      body: JSON.stringify(roleIds),
    });
  },
};
