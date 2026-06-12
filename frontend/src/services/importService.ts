import { request } from "./http";

export const importService = {
  downloadTemplate(model: string): Promise<null> {
    return request(`/tools/${model}/template`);
  },

  async importCsv(model: string, file: File): Promise<any> {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/tools/${model}/import`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return null;
    }
    const text = await res.text();
    if (!text) return null;
    const data = JSON.parse(text);
    if (!res.ok) {
      throw new Error(data.detail || "Import failed");
    }
    return data;
  },
};
