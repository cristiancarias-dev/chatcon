import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, updateUser, updateUserRoles } from "./useUsers";
import { request } from "../shared/http";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", is_active: true, is_superuser: false, password: "" });
  const [allRoles, setAllRoles] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [user, roles] = await Promise.all([getUser(id), request("/roles/")]);
        setForm({ name: user.name, email: user.email, is_active: user.is_active, is_superuser: user.is_superuser, password: "" });
        setAllRoles(roles);
        setSelectedRoleIds(user.roles?.map((r) => r.id) || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function toggleRole(roleId) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      await updateUser(id, body);
      await updateUserRoles(id, selectedRoleIds);
      navigate("/users");
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
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        <p className="mt-1 text-sm text-gray-500">Update user details and permissions.</p>
      </div>

      <ErrorAlert message={error} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="bubble max-w-2xl space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="input-field mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="input-field mt-1" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Leave blank to keep current"
            className="input-field mt-1" />
          <p className="mt-1 text-xs text-gray-400">Leave blank to keep current password.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Settings</label>
          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 transition-all hover:border-primary-200 has-[:checked]:border-primary-300 has-[:checked]:bg-primary-50">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 transition-all hover:border-primary-200 has-[:checked]:border-primary-300 has-[:checked]:bg-primary-50">
              <input type="checkbox" checked={form.is_superuser} onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-gray-700">Superuser</span>
            </label>
          </div>
        </div>

        {allRoles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Roles</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {allRoles.map((role) => (
                <label key={role.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-all hover:border-primary-200 hover:bg-primary-50 has-[:checked]:border-primary-300 has-[:checked]:bg-primary-50">
                  <input type="checkbox" checked={selectedRoleIds.includes(role.id)} onChange={() => toggleRole(role.id)}
                    className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{role.name}</span>
                    {role.description && <p className="text-xs text-gray-400">{role.description}</p>}
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
          <button type="button" onClick={() => navigate("/users")} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
