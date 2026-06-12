import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService } from "../services/roleService";
import type { RoleCreate, RoleUpdate } from "../types";

const ROLES_KEY = "roles";

export function useRoles() {
  return useQuery({
    queryKey: [ROLES_KEY],
    queryFn: () => roleService.getAll(),
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: [ROLES_KEY, id],
    queryFn: () => roleService.getById(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RoleCreate) => roleService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoleUpdate }) =>
      roleService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roleService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: number; permissionIds: number[] }) =>
      roleService.updatePermissions(id, permissionIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}
