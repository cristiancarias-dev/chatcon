import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRole, updateRole, getPermissions, updateRolePermissions } from "./useRoles";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function RoleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "" });
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    async function load() {
      try {
        const [role, perms] = await Promise.all([getRole(id), getPermissions()]);
        setForm({ name: role.name, description: role.description || "" });
        setAllPermissions(perms);
        setSelectedPermIds(role.permissions?.map((p) => p.id) || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  function togglePerm(permId) {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateRole(id, form);
      await updateRolePermissions(id, selectedPermIds);
      navigate("/roles");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/roles" className="text-sm text-gray-500 hover:text-gray-700">&larr; Roles</Link>
            <h1 className="text-xl font-bold text-gray-900">Edit Role</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ErrorAlert message={error} />
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {allPermissions.map((perm) => (
                <label key={perm.id} className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <input type="checkbox" checked={selectedPermIds.includes(perm.id)} onChange={() => togglePerm(perm.id)}
                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{perm.codename}</span>
                    {perm.description && <p className="text-xs text-gray-400">{perm.description}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
            <Link to="/roles" className="rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
