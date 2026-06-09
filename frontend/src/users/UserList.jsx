import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers, deleteUser } from "./useUsers";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex animate-slide-up items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            {users.length} user{users.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Link to="/users/new" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New User
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
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Roles</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Superuser</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-gray-50"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-gray-400">#{user.id}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={user.is_active ? "badge-green" : "badge-red"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
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
                  <td className="whitespace-nowrap px-6 py-4">
                    {user.is_superuser ? (
                      <span className="badge-yellow">Yes</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
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
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <p className="text-4xl">👥</p>
                      <p className="mt-3 text-sm font-medium text-gray-900">No users yet</p>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating your first user.</p>
                      <Link to="/users/new" className="btn-primary mt-4">
                        Create User
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
