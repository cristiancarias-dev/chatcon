import { useMutation } from "@tanstack/react-query";
import { importService } from "../services/importService";

export function useImportCsv() {
  return useMutation({
    mutationFn: ({ model, file }: { model: string; file: File }) =>
      importService.importCsv(model, file),
  });
}
