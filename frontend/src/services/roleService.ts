import { request } from "./http";
import type { RoleCreate, RoleRead, RoleUpdate, RoleWithPermissions } from "../types";

export const roleService = {
  getAll(): Promise<RoleWithPermissions[] | null> {
    return request("/roles/");
  },

  getById(id: number): Promise<RoleWithPermissions | null> {
    return request(`/roles/${id}`);
  },

  create(data: RoleCreate): Promise<RoleRead | null> {
    return request("/roles/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: RoleUpdate): Promise<RoleRead | null> {
    return request(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<null> {
    return request(`/roles/${id}`, { method: "DELETE" });
  },

  updatePermissions(id: number, permissionIds: number[]): Promise<RoleWithPermissions | null> {
    return request(`/roles/${id}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },
};
