const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function downloadTemplate(model) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/tools/${model}/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to download template");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${model}-template.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importFile(model, file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/tools/${model}/import`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error("Import failed");
    return null;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Import failed");
  }
  if (!res.ok) {
    throw new Error(data.detail || "Import failed");
  }
  return data;
}
