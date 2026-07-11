import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getTemplates,
  refreshTemplates,
  syncTemplates,
  deleteTemplate,
  getAccount,
} from "./useWhatsAppAccounts";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function WhatsAppTemplateList() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setLoading(true);
      const [acct, tmpls] = await Promise.all([getAccount(id), getTemplates(id)]);
      setAccount(acct);
      setTemplates(tmpls || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    try {
      const data = await refreshTemplates(id);
      setTemplates(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError("");
    try {
      const data = await syncTemplates(id);
      setTemplates(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(templateId, name) {
    if (!window.confirm(`Delete template "${name}"?`)) return;
    try {
      await deleteTemplate(id, templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err) {
      setError(err.message);
    }
  }

  function getStatusBadge(status) {
    const colors = {
      APPROVED: "badge-green",
      PENDING: "badge-yellow",
      REJECTED: "badge-red",
      DELETED: "badge-gray",
      PAUSED: "badge-gray",
      LIMITED: "badge-red",
    };
    return colors[status] || "badge-gray";
  }

  if (loading) return <Loading />;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex animate-slide-up flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/whatsapp-accounts"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to accounts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="mt-1 text-sm text-gray-500">{account?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary">
            {refreshing ? "Refreshing..." : "Sync from Meta"}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary text-orange-600 hover:text-orange-700"
          >
            {syncing ? "Cleaning..." : "Clean Orphans"}
          </button>
          <Link to={`/whatsapp-accounts/${id}/templates/new`} className="btn-primary">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Template
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} />

      <div className="animate-slide-up overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Language
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {templates.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    {t.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">{t.language}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">{t.category}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={getStatusBadge(t.status)}>{t.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      to={`/whatsapp-accounts/${id}/templates/${t.id}/edit`}
                      className="btn-ghost text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="btn-ghost ml-2 text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-4xl">📋</p>
                    <p className="mt-3 text-sm font-medium text-gray-900">No templates</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Sync from Meta or create a new template.
                    </p>
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
