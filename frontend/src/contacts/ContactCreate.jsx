import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createContact, getAssignableAgents } from "./useContacts";
import ErrorAlert from "../shared/ErrorAlert";

export default function ContactCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    assigned_agent_id: null,
  });
  const [agents, setAgents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAssignableAgents().then(setAgents).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = { ...form };
      if (!body.email) delete body.email;
      if (!body.notes) delete body.notes;
      if (!body.assigned_agent_id) body.assigned_agent_id = null;
      await createContact(body);
      navigate("/contacts");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-900">New Contact</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new contact to the system.</p>
      </div>

      <ErrorAlert message={error} />

      <form onSubmit={handleSubmit} className="card-hover animate-slide-up max-w-2xl space-y-6 p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="John Doe"
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone *</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              placeholder="+521234567890"
              className="input-field mt-1"
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
              placeholder="john@example.com"
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned Agent</label>
            <select
              value={form.assigned_agent_id ?? ""}
              onChange={(e) => setForm({ ...form, assigned_agent_id: e.target.value ? Number(e.target.value) : null })}
              className="input-field mt-1"
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
            placeholder="Any additional information..."
            className="input-field mt-1"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 pt-6">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : "Create Contact"}
          </button>
          <button type="button" onClick={() => navigate("/contacts")} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
