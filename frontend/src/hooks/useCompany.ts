import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "../services/companyService";
import type { CompanyUpdate } from "../types";

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: () => companyService.getMyCompany(),
    retry: false,
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyUpdate) => companyService.updateMyCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
}
