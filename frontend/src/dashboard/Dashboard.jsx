import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { request } from "../shared/http";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    request("/users/me")
      .then(setUser)
      .catch((err) => setError(err.message));
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <ErrorAlert message={error} />
      </div>
    );
  }

  if (!user) return <Loading />;

  const canAccessAdmin =
    user.is_superuser || user.roles?.some((r) => r.name === "admin");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Prueba App</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome, {user.name}!
              </h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
          <hr className="my-6 border-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="mt-1 text-gray-900">{user.name}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-gray-900">{user.email}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">User ID</p>
              <p className="mt-1 text-gray-900">{user.id}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-1 text-green-600">Active</p>
            </div>
          </div>
          {canAccessAdmin && (
            <>
              <hr className="my-6 border-gray-200" />
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Administration</h3>
                <div className="flex gap-4">
                  <Link
                    to="/users"
                    className="flex-1 rounded-lg border border-gray-200 p-4 text-center hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium text-indigo-600">Manage Users</p>
                    <p className="mt-1 text-xs text-gray-400">Create, edit, delete users</p>
                  </Link>
                  <Link
                    to="/roles"
                    className="flex-1 rounded-lg border border-gray-200 p-4 text-center hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium text-indigo-600">Manage Roles</p>
                    <p className="mt-1 text-xs text-gray-400">Configure roles and permissions</p>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
