import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/userService";
import type { UserUpdate } from "../types";

const USERS_KEY = "users";

export function useUsers(skip = 0, limit = 100) {
  return useQuery({
    queryKey: [USERS_KEY, { skip, limit }],
    queryFn: () => userService.getAll(skip, limit),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: [USERS_KEY, id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      userService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  });
}

export function useUpdateUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleIds }: { id: number; roleIds: number[] }) =>
      userService.updateRoles(id, roleIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  });
}
