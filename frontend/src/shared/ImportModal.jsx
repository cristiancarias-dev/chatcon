import { useState, useRef } from "react";
import { downloadTemplate, importFile } from "./useImport";

const modelLabels = {
  users: { title: "Import Users", template: "users-template.csv" },
  roles: { title: "Import Roles", template: "roles-template.csv" },
};

export default function ImportModal({ model, onClose, onComplete }) {
  const labels = modelLabels[model] || {
    title: `Import ${model}`,
    template: `${model}-template.csv`,
  };
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleFileSelect(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
      const rows = lines.slice(1, 6).map((line) =>
        line.split(",").map((c) => c.trim())
      );
      setPreview({ headers, rows, total: lines.length - 1 });
    };
    reader.readAsText(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      inputRef.current.files = e.dataTransfer.files;
      handleFileSelect({ target: { files: [f] } });
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const res = await importFile(model, file);
      setResult(res);
      if (onComplete) onComplete(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  async function handleDownload() {
    try {
      await downloadTemplate(model);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl animate-slide-up rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{labels.title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Result view */}
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-800">Import complete</p>
                  <p className="text-sm text-green-600">
                    {result.created} created, {result.errors} errors out of {result.total} rows
                  </p>
                </div>
              </div>
              {result.details?.filter((d) => d.error).length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-red-700">Errors</p>
                  {result.details.filter((d) => d.error).map((d, i) => (
                    <p key={i} className="text-xs text-red-600">
                      Line {d.line}: {d.error}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={onClose} className="btn-primary">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Download template */}
              <div>
                <button onClick={handleDownload} className="btn-secondary text-sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download CSV Template
                </button>
                <p className="mt-1.5 text-xs text-gray-400">
                  Fill in the template with your data, then upload it below.
                </p>
              </div>

              {/* Upload zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  file
                    ? "border-primary-300 bg-primary-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {file ? (
                  <div>
                    <p className="text-lg">📄</p>
                    <p className="mt-2 font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl">📂</p>
                    <p className="mt-2 font-medium text-gray-700">
                      Drop your CSV file here
                    </p>
                    <p className="text-sm text-gray-400">or click to browse</p>
                  </div>
                )}
              </div>

              {/* Preview */}
              {preview && (
                <div className="rounded-lg border border-gray-200">
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
                    <p className="text-xs font-medium text-gray-500">
                      Preview ({preview.total} rows)
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          {preview.headers.map((h) => (
                            <th key={h} className="px-3 py-2 font-medium text-gray-500">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-gray-700">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="btn-primary"
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importing...
                </span>
              ) : (
                "Import"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}