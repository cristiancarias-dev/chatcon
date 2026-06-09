import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRoles, deleteRole } from "./useRoles";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function RoleList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      await deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex animate-slide-up items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="mt-1 text-sm text-gray-500">
            {roles.length} role{roles.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Link to="/roles/new" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Role
        </Link>
      </div>

      <ErrorAlert message={error} />

      {/* Table */}
      <div className="animate-slide-up overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Permissions</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {roles.map((role, i) => (
                <tr
                  key={role.id}
                  className="transition-colors hover:bg-gray-50"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-gray-400">#{role.id}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 text-xs font-bold text-white">
                        {role.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{role.description || <span className="text-gray-300">—</span>}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={role.permissions?.length > 0 ? "badge-blue" : "badge-gray"}>
                      {role.permissions?.length || 0} permission{role.permissions?.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      to={`/roles/${role.id}/edit`}
                      className="btn-ghost text-primary-600 hover:text-primary-700"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="btn-ghost text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <p className="text-4xl">🛡️</p>
                      <p className="mt-3 text-sm font-medium text-gray-900">No roles yet</p>
                      <p className="mt-1 text-sm text-gray-500">Create roles to manage user permissions.</p>
                      <Link to="/roles/new" className="btn-primary mt-4">
                        Create Role
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
