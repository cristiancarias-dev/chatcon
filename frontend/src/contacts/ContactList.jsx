import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getContacts, countContacts, deleteContact } from "./useContacts";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function ContactList() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  async function load() {
    try {
      setError("");
      setLoading(true);
      const [data, cnt] = await Promise.all([
        getContacts({ skip: page * pageSize, limit: pageSize, search: search || undefined }),
        countContacts({ search: search || undefined }),
      ]);
      setContacts(data);
      setTotal(cnt.count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, search]);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      await deleteContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  if (loading) return <Loading />;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex animate-slide-up flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} contact{total !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Link to="/contacts/new" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Contact
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4 animate-slide-up">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by name or phone..."
          className="input-field max-w-sm"
        />
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
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Agent</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contacts.map((c, i) => (
                <tr key={c.id} className="transition-colors hover:bg-gray-50" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-400">#{c.id}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">{c.phone}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">{c.email || <span className="text-gray-300">—</span>}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {c.assigned_agent ? (
                      <span className="badge-blue">{c.assigned_agent.name}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={c.is_active ? "badge-green" : "badge-red"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link to={`/contacts/${c.id}/edit`} className="btn-ghost text-primary-600 hover:text-primary-700">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(c.id)} className="btn-ghost text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <p className="text-4xl">📞</p>
                      <p className="mt-3 text-sm font-medium text-gray-900">No contacts yet</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {search ? "No contacts match your search." : "Get started by creating your first contact."}
                      </p>
                      {!search && (
                        <Link to="/contacts/new" className="btn-primary mt-4">
                          Create Contact
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between animate-fade-in">
          <p className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
