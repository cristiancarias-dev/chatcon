import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useWhatsAppTemplate, useUpdateTemplate } from "../hooks/useWhatsAppTemplates";
import { LANGUAGES, TEMPLATE_CATEGORIES } from "../types";
import TemplatePreview from "./TemplatePreview";

function extractVariableCount(text) {
  const matches = text.match(/\{\{(\d+)\}\}/g);
  if (!matches) return 0;
  return Math.max(...matches.map((m) => parseInt(m.replace(/\D/g, ""))));
}

function parseComponents(componentsStr) {
  try {
    const components = JSON.parse(componentsStr || "[]");
    if (!Array.isArray(components)) return { header: {}, body: "", footer: "", buttons: [] };

    let header = {};
    let body = "";
    let bodyExamples = {};
    let footer = "";
    let buttons = [];

    for (const comp of components) {
      if (comp.type === "HEADER") {
        header = comp;
      } else if (comp.type === "BODY") {
        body = comp.text || "";
        if (comp.example?.body_text?.[0]) {
          const examples = comp.example.body_text[0];
          const count = extractVariableCount(body);
          for (let i = 1; i <= count; i++) {
            bodyExamples[i] = [examples[i - 1] || ""];
          }
        }
      } else if (comp.type === "FOOTER") {
        footer = comp.text || "";
      } else if (comp.type === "BUTTONS" && comp.buttons) {
        buttons = comp.buttons.map((b) => ({
          type: b.type,
          text: b.text || "",
          url: b.example?.[0] || "",
          phone_number: b.example || "",
        }));
      }
    }

    return { header, body, bodyExamples, footer, buttons };
  } catch {
    return { header: {}, body: "", bodyExamples: {}, footer: "", buttons: [] };
  }
}

export default function WhatsAppTemplateEdit() {
  const { id, templateId } = useParams();
  const navigate = useNavigate();
  const { data: template, isLoading } = useWhatsAppTemplate(parseInt(id), parseInt(templateId));
  const updateMutation = useUpdateTemplate();

  const [form, setForm] = useState({
    language: "en_US",
    category: "MARKETING",
    allow_category_change: true,
    headerFormat: "NONE",
    headerText: "",
    headerMediaUrl: "",
    body: "",
    footer: "",
  });
  const [bodyExamples, setBodyExamples] = useState({});
  const [buttons, setButtons] = useState([]);
  const [error, setError] = useState("");

  const varCount = useMemo(() => extractVariableCount(form.body), [form.body]);

  useEffect(() => {
    if (template) {
      const parsed = parseComponents(template.components);
      setForm({
        language: template.language,
        category: template.category,
        allow_category_change: true,
        headerFormat: parsed.header.format || "NONE",
        headerText: parsed.header.text || "",
        headerMediaUrl: parsed.header.example?.header_handle?.[0] || "",
        body: parsed.body,
        footer: parsed.footer,
      });
      setBodyExamples(parsed.bodyExamples);
      setButtons(parsed.buttons);
    }
  }, [template]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleBodyExampleChange(varIndex, exampleIndex, value) {
    setBodyExamples((prev) => {
      const current = prev[varIndex] || [];
      const updated = [...current];
      updated[exampleIndex] = value;
      return { ...prev, [varIndex]: updated };
    });
  }

  function addButton() {
    setButtons((prev) => [...prev, { type: "QUICK_REPLY", text: "" }]);
  }

  function updateButton(index, field, value) {
    setButtons((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  }

  function removeButton(index) {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  }

  function buildComponents() {
    const components = [];

    if (form.headerFormat !== "NONE") {
      const hdr = { type: "HEADER", format: form.headerFormat };
      if (form.headerFormat === "TEXT") {
        hdr.text = form.headerText;
      }
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(form.headerFormat) && form.headerMediaUrl) {
        hdr.example = { header_handle: [form.headerMediaUrl] };
      }
      components.push(hdr);
    }

    if (form.body) {
      const bodyComp = { type: "BODY", text: form.body };
      if (varCount > 0) {
        const bodyTextExamples = [];
        for (let i = 1; i <= varCount; i++) {
          const ex = bodyExamples[i];
          bodyTextExamples.push([ex && ex.length > 0 ? ex[0] || "" : ""]);
        }
        bodyComp.example = { body_text: [bodyTextExamples] };
      }
      components.push(bodyComp);
    }

    if (form.footer) {
      components.push({ type: "FOOTER", text: form.footer });
    }

    if (buttons.length > 0) {
      const btns = buttons
        .filter((b) => b.text.trim())
        .map((b) => {
          const btn = { type: b.type, text: b.text };
          if (b.type === "URL" && b.url) {
            btn.example = [b.url];
          }
          if (b.type === "PHONE_NUMBER" && b.phone_number) {
            btn.example = b.phone_number;
          }
          return btn;
        });
      if (btns.length > 0) {
        components.push({ type: "BUTTONS", buttons: btns });
      }
    }

    return components;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.body.trim()) {
      setError("Body text is required");
      return;
    }

    const components = buildComponents();

    updateMutation.mutate(
      {
        accountId: parseInt(id),
        templateId: parseInt(templateId),
        data: { ...form, components },
      },
      {
        onSuccess: () => navigate(`/whatsapp-accounts/${id}/templates`),
        onError: (err) => setError(err.message || "Failed to update template"),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6 text-center text-gray-500">
        Template not found.
        <Link to={`/whatsapp-accounts/${id}/templates`} className="ml-2 text-blue-600 hover:underline">
          Go back
        </Link>
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Template: {template.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Status:{" "}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              template.status === "APPROVED"
                ? "bg-green-100 text-green-800"
                : template.status === "REJECTED"
                ? "bg-red-100 text-red-800"
                : template.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {template.status}
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} className="bubble max-w-2xl space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Template Name</label>
            <input
              type="text"
              value={template.name}
              disabled
              className="input-field mt-1 font-mono bg-gray-50 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">Name cannot be changed after creation</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Language</label>
              <select value={form.language} onChange={handleChange("language")} className="input-field mt-1">
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select value={form.category} onChange={handleChange("category")} className="input-field mt-1">
                {TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0) + c.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allow_category_change"
              checked={form.allow_category_change}
              onChange={(e) => setForm((prev) => ({ ...prev, allow_category_change: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="allow_category_change" className="text-sm text-gray-600">
              Allow Meta to change category if needed
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Header</label>
            <select value={form.headerFormat} onChange={handleChange("headerFormat")} className="input-field">
              <option value="NONE">No header</option>
              <option value="TEXT">Text</option>
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Document</option>
            </select>
            {form.headerFormat === "TEXT" && (
              <input
                type="text"
                value={form.headerText}
                onChange={handleChange("headerText")}
                placeholder="Header text"
                maxLength={60}
                className="input-field mt-2"
              />
            )}
            {["IMAGE", "VIDEO", "DOCUMENT"].includes(form.headerFormat) && (
              <input
                type="url"
                value={form.headerMediaUrl}
                onChange={handleChange("headerMediaUrl")}
                placeholder="Media URL (https://...)"
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

          {varCount > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Variable Examples</label>
              {Array.from({ length: varCount }, (_, i) => (
                <div key={i}>
                  <span className="text-xs text-gray-500">&#123;&#123;{i + 1}&#125;&#125;</span>
                  <input
                    type="text"
                    value={bodyExamples[i + 1]?.[0] || ""}
                    onChange={(e) => handleBodyExampleChange(i + 1, 0, e.target.value)}
                    placeholder={`Example for variable ${i + 1}`}
                    className="input-field mt-1"
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Footer</label>
            <input
              type="text"
              value={form.footer}
              onChange={handleChange("footer")}
              placeholder="Footer text (optional, max 60 chars)"
              maxLength={60}
              className="input-field mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Buttons</label>
              {buttons.length < 3 && (
                <button type="button" onClick={addButton} className="text-xs text-blue-600 hover:text-blue-800">
                  + Add button
                </button>
              )}
            </div>
            <div className="mt-2 space-y-3">
              {buttons.map((btn, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={btn.type}
                      onChange={(e) => updateButton(i, "type", e.target.value)}
                      className="input-field flex-1"
                    >
                      <option value="QUICK_REPLY">Quick Reply</option>
                      <option value="URL">URL</option>
                      <option value="PHONE_NUMBER">Phone Number</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeButton(i)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={btn.text}
                    onChange={(e) => updateButton(i, "text", e.target.value)}
                    placeholder="Button text"
                    className="input-field mt-2"
                  />
                  {btn.type === "URL" && (
                    <input
                      type="url"
                      value={btn.url || ""}
                      onChange={(e) => updateButton(i, "url", e.target.value)}
                      placeholder="Sample URL (https://example.com/{{1}})"
                      className="input-field mt-2"
                    />
                  )}
                  {btn.type === "PHONE_NUMBER" && (
                    <input
                      type="tel"
                      value={btn.phone_number || ""}
                      onChange={(e) => updateButton(i, "phone_number", e.target.value)}
                      placeholder="Sample phone (e.g. +1234567890)"
                      className="input-field mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-gray-100 pt-6">
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
            <Link to={`/whatsapp-accounts/${id}/templates`} className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>

        <div className="hidden xl:block">
          <div className="sticky top-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">Preview</h3>
            <TemplatePreview
              headerFormat={form.headerFormat}
              headerText={form.headerText}
              headerMediaUrl={form.headerMediaUrl}
              body={form.body}
              bodyExamples={bodyExamples}
              varCount={varCount}
              footer={form.footer}
              buttons={buttons}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
