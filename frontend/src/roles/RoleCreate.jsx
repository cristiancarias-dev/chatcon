import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRole, getPermissions, updateRolePermissions } from "./useRoles";
import ErrorAlert from "../shared/ErrorAlert";

export default function RoleCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "" });
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPermissions().then(setAllPermissions).catch(() => {});
  }, []);

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
      const role = await createRole(form);
      if (selectedPermIds.length > 0) {
        await updateRolePermissions(role.id, selectedPermIds);
      }
      navigate("/roles");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-900">New Role</h1>
        <p className="mt-1 text-sm text-gray-500">Create a new role with specific permissions.</p>
      </div>

      <ErrorAlert message={error} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="bubble max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            placeholder="e.g. editor, moderator"
            className="input-field mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
            placeholder="What does this role do?"
            className="input-field mt-1" />
        </div>

        {allPermissions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {allPermissions.map((perm) => (
                <label key={perm.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-all hover:border-primary-200 hover:bg-primary-50 has-[:checked]:border-primary-300 has-[:checked]:bg-primary-50">
                  <input type="checkbox" checked={selectedPermIds.includes(perm.id)} onChange={() => togglePerm(perm.id)}
                    className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{perm.codename}</span>
                    {perm.description && <p className="text-xs text-gray-400">{perm.description}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-gray-100 pt-6">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : "Create Role"}
          </button>
          <button type="button" onClick={() => navigate("/roles")} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
