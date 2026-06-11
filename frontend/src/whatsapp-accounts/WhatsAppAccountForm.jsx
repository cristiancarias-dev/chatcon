import { useState } from "react";

export default function WhatsAppAccountForm({ initial, onSave, saving }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    phone_number_id: initial?.phone_number_id || "",
    phone_number: initial?.phone_number || "",
    business_account_id: initial?.business_account_id || "",
    access_token: "",
    api_version: initial?.api_version || "v22.0",
    is_active: initial?.is_active ?? true,
    default_template_name: initial?.default_template_name || "",
  });

  function handleChange(field) {
    return (e) => {
      const value = field === "is_active" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (initial && !payload.access_token) {
      delete payload.access_token;
    }
    onSave(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="bubble max-w-2xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Account Name</label>
        <input
          type="text"
          value={form.name}
          onChange={handleChange("name")}
          required
          placeholder="e.g. Main WhatsApp, Backup Line"
          className="input-field mt-1"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number ID</label>
          <input
            type="text"
            value={form.phone_number_id}
            onChange={handleChange("phone_number_id")}
            required
            placeholder="e.g. 1234567890"
            className="input-field mt-1 font-mono"
          />
          <p className="mt-1 text-xs text-gray-400">From Meta Business Manager</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="text"
            value={form.phone_number}
            onChange={handleChange("phone_number")}
            required
            placeholder="e.g. 521234567890"
            className="input-field mt-1 font-mono"
          />
          <p className="mt-1 text-xs text-gray-400">Full WhatsApp number with country code</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          WABA ID <span className="text-xs text-gray-400">(WhatsApp Business Account ID)</span>
        </label>
        <input
          type="text"
          value={form.business_account_id}
          onChange={handleChange("business_account_id")}
          placeholder="e.g. 123456789012345"
          className="input-field mt-1 font-mono"
        />
        <p className="mt-1 text-xs text-gray-400">From Meta Business Manager — needed for template management & webhook subscription</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Access Token {initial && <span className="text-xs text-gray-400">(leave empty to keep current)</span>}
        </label>
        <input
          type="password"
          value={form.access_token}
          onChange={handleChange("access_token")}
          required={!initial}
          placeholder={initial ? "Enter new token or leave empty" : "Permanent WhatsApp Access Token"}
          className="input-field mt-1 font-mono"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">API Version</label>
          <input
            type="text"
            value={form.api_version}
            onChange={handleChange("api_version")}
            placeholder="v22.0"
            className="input-field mt-1 font-mono"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange("is_active")}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Default Template <span className="text-xs text-gray-400">(for auto-fallback when 24h window expires)</span>
        </label>
        <input
          type="text"
          value={form.default_template_name}
          onChange={handleChange("default_template_name")}
          placeholder="e.g. hello_world"
          className="input-field mt-1 font-mono"
        />
        <p className="mt-1 text-xs text-gray-400">Name of the template in Meta Business Manager</p>
      </div>
      <div className="flex items-center gap-3 border-t border-gray-100 pt-6">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving..." : initial ? "Update Account" : "Create Account"}
        </button>
      </div>
    </form>
  );
}
