import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  }, [id]);

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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
        <p className="mt-1 text-sm text-gray-500">Update role details and permissions.</p>
      </div>

      <ErrorAlert message={error} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-hover animate-slide-up max-w-2xl space-y-6 p-8">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="input-field mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
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
                Saving...
              </>
            ) : "Save Changes"}
          </button>
          <button type="button" onClick={() => navigate("/roles")} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
