import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRoles, deleteRole } from "./useRoles";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function RoleList() {
  const navigate = useNavigate();
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    load();
  }, [navigate]);

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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Roles</h1>
          </div>
          <Link to="/roles/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            New Role
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <ErrorAlert message={error} />
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Permissions</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{role.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{role.name}</td>
                  <td className="px-6 py-4 text-gray-500">{role.description || "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{role.permissions?.length || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/roles/${role.id}/edit`} className="text-indigo-600 hover:text-indigo-800">Edit</Link>
                    <button onClick={() => handleDelete(role.id)} className="ml-3 text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No roles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
