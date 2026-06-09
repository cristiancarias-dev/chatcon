import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUsers, deleteUser } from "./useUsers";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function UserList() {
  const navigate = useNavigate();
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    load();
  }, [navigate]);

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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Users</h1>
          </div>
          <Link
            to="/users/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            New User
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <ErrorAlert message={error} />
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Roles</th>
                <th className="px-6 py-3 font-medium">Superuser</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{user.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {user.roles?.map((r) => r.name).join(", ") || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={user.is_superuser ? "text-yellow-600" : "text-gray-300"}>&#9733;</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/users/${user.id}/edit`} className="text-indigo-600 hover:text-indigo-800">Edit</Link>
                    <button onClick={() => handleDelete(user.id)} className="ml-3 text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
