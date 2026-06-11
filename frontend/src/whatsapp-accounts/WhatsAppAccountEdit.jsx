import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAccount, updateAccount } from "./useWhatsAppAccounts";
import WhatsAppAccountForm from "./WhatsAppAccountForm";
import ErrorAlert from "../shared/ErrorAlert";
import Loading from "../shared/Loading";
import { Link } from "react-router-dom";

export default function WhatsAppAccountEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAccount(id)
      .then(setAccount)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(data) {
    setError("");
    setSaving(true);
    try {
      await updateAccount(id, data);
      navigate("/whatsapp-accounts");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 animate-slide-up">
        <Link
          to="/whatsapp-accounts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to accounts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Account</h1>
        <p className="mt-1 text-sm text-gray-500">{account?.name}</p>
      </div>

      <ErrorAlert message={error} />

      <WhatsAppAccountForm initial={account} onSave={handleSave} saving={saving} />
    </div>
  );
}
