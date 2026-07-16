import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../shared/http";
import { useAuth } from "../context/AuthContext";
import Loading from "../shared/Loading";

const statCards = [
  { label: "Total Users", value: "--", icon: "👥" },
  { label: "Active Users", value: "--", icon: "✅" },
  { label: "Roles", value: "--", icon: "🛡️" },
  { label: "Permissions", value: "--", icon: "🔑" },
];

export default function Dashboard() {
  const { isAdmin } = useAuth();
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
    <div className="p-4 lg:p-6">
      {/* Welcome section */}
      <div className="mb-5 animate-slide-up">
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user.name}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">Here&apos;s what&apos;s happening with your application.</p>
      </div>

      {/* Stats grid */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat, i) => (
          <div
            key={stat.label}
            className="animate-slide-up overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-2xl font-bold text-primary-600">{stat.value}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-base">
                {stat.icon}
              </span>
            </div>
            <div className="px-4 py-2">
              <span className="text-xs font-medium text-gray-600">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* User profile + Admin quick links */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <div className="bubble lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="avatar h-12 w-12 text-base ring-2 ring-primary-100">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-100">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Status</p>
              <p className="mt-0.5">
                <span className="badge-green">Active</span>
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-100">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Superuser</p>
              <p className="mt-0.5">
                <span className={user.is_superuser ? "badge-yellow" : "badge-gray"}>
                  {user.is_superuser ? "Yes" : "No"}
                </span>
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-100 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Roles</p>
              <p className="mt-0.5 text-sm font-medium text-gray-900">
                {user.roles?.length ? user.roles.map((r) => r.name).join(", ") : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Admin quick links */}
        {isAdmin && (
          <div className="bubble">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/users"
                className="flex items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 transition-all hover:border-primary-200 hover:bg-primary-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-base">
                  👥
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-400">Create, edit, delete</p>
                </div>
              </Link>
              <Link
                to="/roles"
                className="flex items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 transition-all hover:border-primary-200 hover:bg-primary-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-base">
                  🛡️
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Manage Roles</p>
                  <p className="text-xs text-gray-400">Configure permissions</p>
                </div>
              </Link>
              <Link
                to="/contacts"
                className="flex items-center gap-2.5 rounded-lg border-2 border-dashed border-gray-200 px-3 py-2.5 transition-all hover:border-primary-300 hover:bg-primary-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-base">
                  💬
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">View Contacts</p>
                  <p className="text-xs text-gray-400">Manage your contacts</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
