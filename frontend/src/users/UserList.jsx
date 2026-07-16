import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers, deleteUser } from "./useUsers";
import { useAuth } from "../context/AuthContext";
import { downloadTemplate } from "../shared/useImport";
import ImportModal from "../shared/ImportModal";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function UserList() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showImport, setShowImport] = useState(false);

  async function load() {
    try {
      setError("");
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="p-4 lg:p-6">
      {showImport && (
        <ImportModal
          model="users"
          onClose={() => setShowImport(false)}
          onComplete={load}
        />
      )}

      {/* Header */}
      <div className="mb-4 flex animate-slide-up flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {users.length} user{users.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => downloadTemplate("users")} className="btn-secondary text-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Template
            </button>
            <button onClick={() => setShowImport(true)} className="btn-secondary text-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Import
            </button>
            <Link to="/users/new" className="btn-primary">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New User
            </Link>
          </div>
        )}
      </div>

      <ErrorAlert message={error} />

      {/* Table */}
      <div className="animate-slide-up overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Roles</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Superuser</th>
                {isAdmin && (
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-gray-50"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="avatar h-8 w-8 text-[10px]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={user.is_active ? "badge-green" : "badge-red"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.length
                        ? user.roles.map((r) => (
                            <span key={r.id} className="badge-blue">
                              {r.name}
                            </span>
                          ))
                        : <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {user.is_superuser ? (
                      <span className="badge-yellow">Yes</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/users/${user.id}/edit`}
                        className="btn-ghost text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="btn-ghost text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-12 text-center">
                    <div className="mx-auto max-w-sm">
                      <p className="text-3xl">👥</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">No users yet</p>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating your first user.</p>
                      {isAdmin && (
                        <Link to="/users/new" className="btn-primary mt-3">
                          Create User
                        </Link>
                      )}
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
