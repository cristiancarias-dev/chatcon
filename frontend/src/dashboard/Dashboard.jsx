import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../shared/http";
import Loading from "../shared/Loading";

const statCards = [
  { label: "Total Users", value: "--", color: "from-blue-500 to-blue-600", icon: "👥" },
  { label: "Active Users", value: "--", color: "from-green-500 to-green-600", icon: "✅" },
  { label: "Roles", value: "--", color: "from-purple-500 to-purple-600", icon: "🛡️" },
  { label: "Permissions", value: "--", color: "from-amber-500 to-amber-600", icon: "🔑" },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({ users: 0, active: 0, roles: 0, permissions: 0 });

  useEffect(() => {
    request("/users/me").then(setUser).catch(() => {});
    Promise.all([
      request("/users/").catch(() => []),
      request("/roles/").catch(() => []),
    ]).then(([users, roles]) => {
      setCounts({
        users: users.length || 0,
        active: users.filter((u) => u.is_active).length || 0,
        roles: roles.length || 0,
        permissions: roles.reduce((acc, r) => acc + (r.permissions?.length || 0), 0),
      });
    });
  }, []);

  if (!user) return <Loading />;

  const displayStats = [
    { ...statCards[0], value: counts.users },
    { ...statCards[1], value: counts.active },
    { ...statCards[2], value: counts.roles },
    { ...statCards[3], value: counts.permissions },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome section */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name}
        </h1>
        <p className="mt-1 text-gray-500">Here&apos;s what&apos;s happening with your application.</p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat) => (
          <div
            key={stat.label}
            className="card-hover animate-slide-up overflow-hidden p-0"
          >
            <div className={`bg-gradient-to-r ${stat.color} px-5 py-4`}>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-medium text-gray-600">{stat.label}</span>
              <span className="text-lg">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* User profile + Admin quick links */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="card-hover animate-slide-up p-6 lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xl font-bold text-white shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">User ID</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{user.id}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Status</p>
              <p className="mt-1">
                <span className="badge-green">Active</span>
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Superuser</p>
              <p className="mt-1">
                <span className={user.is_superuser ? "badge-yellow" : "badge-gray"}>
                  {user.is_superuser ? "Yes" : "No"}
                </span>
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Roles</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {user.roles?.length ? user.roles.map((r) => r.name).join(", ") : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Admin quick links */}
        <div className="card-hover animate-slide-up p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              to="/users"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-200 hover:bg-primary-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-lg">
                👥
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Manage Users</p>
                <p className="text-xs text-gray-400">Create, edit, delete</p>
              </div>
            </Link>
            <Link
              to="/roles"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-200 hover:bg-primary-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-lg">
                🛡️
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Manage Roles</p>
                <p className="text-xs text-gray-400">Configure permissions</p>
              </div>
            </Link>
            <Link
              to="/users/new"
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-lg">
                ➕
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New User</p>
                <p className="text-xs text-gray-400">Add a new user</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
