import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getContacts, countContacts, deleteContact } from "./useContacts";
import { useAuth } from "../context/AuthContext";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function ContactList() {
  const { isAdmin } = useAuth();
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
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4 flex animate-slide-up flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} contact{total !== 1 ? "s" : ""} registered
          </p>
        </div>
        {isAdmin && (
          <Link to="/contacts/new" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Contact
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3 animate-slide-up">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search contacts..."
          className="input-field max-w-sm pl-9"
        />
      </div>

      <ErrorAlert message={error} />

      {/* Contact list */}
      <div className="animate-slide-up space-y-1">
        {contacts.length === 0 ? (
          <div className="bubble py-12 text-center">
            <p className="text-3xl">📞</p>
            <p className="mt-2 text-sm font-medium text-gray-900">No contacts yet</p>
            <p className="mt-1 text-sm text-gray-500">
              {search ? "No contacts match your search." : "Get started by creating your first contact."}
            </p>
            {!search && isAdmin && (
              <Link to="/contacts/new" className="btn-primary mt-3 inline-flex">
                Create Contact
              </Link>
            )}
          </div>
        ) : (
          contacts.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-primary-200"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="avatar h-10 w-10 text-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${c.is_active ? "bg-green-400" : "bg-gray-400"}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 truncate text-sm">{c.name}</p>
                  <span className={`text-xs font-medium ${c.is_active ? "text-green-600" : "text-gray-400"}`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{c.phone}</p>
                {c.assigned_agent && (
                  <p className="text-xs text-primary-600 mt-0.5">
                    Agent: {c.assigned_agent.name}
                  </p>
                )}
              </div>

              {/* Actions */}
              {isAdmin && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Link
                    to={`/contacts/${c.id}/edit`}
                    className="btn-ghost text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="btn-ghost text-red-500 hover:text-red-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between animate-fade-in">
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
