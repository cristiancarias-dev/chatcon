import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAccounts, deleteAccount, subscribeWebhook } from "./useWhatsAppAccounts";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function WhatsAppAccountList() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribing, setSubscribing] = useState(null);

  async function load() {
    try {
      setError("");
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this WhatsApp account?")) return;
    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubscribe(id) {
    setSubscribing(id);
    setError("");
    try {
      const result = await subscribeWebhook(id);
      alert("Webhook subscribed successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubscribing(null);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex animate-slide-up flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/whatsapp-accounts/new" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Account
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} />

      <div className="animate-slide-up overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Phone Number</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">WABA ID</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Token</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {accounts.map((acc, i) => (
                <tr
                  key={acc.id}
                  className="transition-colors hover:bg-gray-50"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-gray-400">#{acc.id}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-white">
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{acc.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-700">{acc.phone_number}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-500">{acc.business_account_id || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-400">{acc.access_token_preview}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={acc.is_active ? "badge-green" : "badge-gray"}>
                      {acc.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/whatsapp-accounts/${acc.id}/edit`}
                        className="btn-ghost text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </Link>
                      {acc.business_account_id && (
                        <>
                          <Link
                            to={`/whatsapp-accounts/${acc.id}/templates`}
                            className="btn-ghost text-emerald-600 hover:text-emerald-700"
                          >
                            Templates
                          </Link>
                          <button
                            onClick={() => handleSubscribe(acc.id)}
                            disabled={subscribing === acc.id}
                            className="btn-ghost text-blue-600 hover:text-blue-700"
                          >
                            {subscribing === acc.id ? "..." : "Subscribe"}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="btn-ghost text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <p className="text-4xl">📱</p>
                      <p className="mt-3 text-sm font-medium text-gray-900">No WhatsApp accounts</p>
                      <p className="mt-1 text-sm text-gray-500">Add a WhatsApp Business account to start sending messages.</p>
                      <Link to="/whatsapp-accounts/new" className="btn-primary mt-4">
                        Add Account
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
