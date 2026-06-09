import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getContact, updateContact, assignContact, getAssignableAgents } from "./useContacts";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function ContactEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    is_active: true,
  });
  const [agents, setAgents] = useState([]);
  const [assignedAgentId, setAssignedAgentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [contact, agentsList] = await Promise.all([
          getContact(id),
          getAssignableAgents(),
        ]);
        setForm({
          name: contact.name,
          phone: contact.phone,
          email: contact.email || "",
          notes: contact.notes || "",
          is_active: contact.is_active,
        });
        setAssignedAgentId(contact.assigned_agent_id);
        setAgents(agentsList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = { ...form };
      if (!body.email) body.email = null;
      if (!body.notes) body.notes = null;
      await updateContact(id, body);
      await assignContact(id, assignedAgentId);
      navigate("/contacts");
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Contact</h1>
        <p className="mt-1 text-sm text-gray-500">Update contact details and assignment.</p>
      </div>

      <ErrorAlert message={error} />

      <form onSubmit={handleSubmit} className="bubble max-w-2xl space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="input-field mt-1.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone *</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              className="input-field mt-1.5"
            />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field mt-1.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned Agent</label>
            <select
              value={assignedAgentId ?? ""}
              onChange={(e) => setAssignedAgentId(e.target.value ? Number(e.target.value) : null)}
              className="input-field mt-1.5"
            >
              <option value="">— Unassigned —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="input-field mt-1.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 transition-all hover:border-primary-200 has-[:checked]:border-primary-300 has-[:checked]:bg-primary-50">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 pt-6">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : "Save Changes"}
          </button>
          <button type="button" onClick={() => navigate("/contacts")} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
