import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createTemplate } from "./useWhatsAppAccounts";
import ErrorAlert from "../shared/ErrorAlert";
import { Link } from "react-router-dom";

export default function WhatsAppTemplateCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    language: "en_US",
    category: "MARKETING",
    body: "",
    headerFormat: "NONE",
    headerText: "",
    footer: "",
  });

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const components = [];

    if (form.headerFormat !== "NONE") {
      const hdr = { type: "HEADER", format: form.headerFormat };
      if (form.headerFormat === "TEXT" && form.headerText) {
        hdr.text = form.headerText;
      }
      components.push(hdr);
    }

    if (form.body) {
      components.push({ type: "BODY", text: form.body, example: { body_text: [[]] } });
    }

    if (form.footer) {
      components.push({ type: "FOOTER", text: form.footer });
    }

    setSaving(true);
    try {
      await createTemplate(id, {
        name: form.name,
        language: form.language,
        category: form.category,
        components,
      });
      navigate(`/whatsapp-accounts/${id}/templates`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 animate-slide-up">
        <Link
          to={`/whatsapp-accounts/${id}/templates`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to templates
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Template</h1>
        <p className="mt-1 text-sm text-gray-500">Create a message template on Meta</p>
      </div>

      <ErrorAlert message={error} />

      <form onSubmit={handleSubmit} className="bubble max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Template Name</label>
          <input
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            required
            placeholder="e.g. order_confirmation"
            className="input-field mt-1 font-mono"
          />
          <p className="mt-1 text-xs text-gray-400">Only lowercase letters, numbers, and underscores</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <select value={form.language} onChange={handleChange("language")} className="input-field mt-1">
              <option value="en_US">English (US)</option>
              <option value="en">English (GB)</option>
              <option value="es">Spanish</option>
              <option value="es_MX">Spanish (Mexico)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select value={form.category} onChange={handleChange("category")} className="input-field mt-1">
              <option value="MARKETING">Marketing</option>
              <option value="UTILITY">Utility</option>
              <option value="AUTHENTICATION">Authentication</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Header</label>
          <select value={form.headerFormat} onChange={handleChange("headerFormat")} className="input-field mt-1">
            <option value="NONE">No header</option>
            <option value="TEXT">Text</option>
          </select>
          {form.headerFormat === "TEXT" && (
            <input
              type="text"
              value={form.headerText}
              onChange={handleChange("headerText")}
              placeholder="Header text"
              className="input-field mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Body <span className="text-xs text-gray-400">(use &#123;&#123;1&#125;&#125; for variables)</span>
          </label>
          <textarea
            value={form.body}
            onChange={handleChange("body")}
            required
            rows={4}
            placeholder="Hi {{1}}, your order #{{2}} has been confirmed!"
            className="input-field mt-1 font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Footer</label>
          <input
            type="text"
            value={form.footer}
            onChange={handleChange("footer")}
            placeholder="Footer text (optional)"
            className="input-field mt-1"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 pt-6">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Creating..." : "Create Template"}
          </button>
          <Link to={`/whatsapp-accounts/${id}/templates`} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
