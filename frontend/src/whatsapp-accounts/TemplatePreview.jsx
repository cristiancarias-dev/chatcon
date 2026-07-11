function replaceVars(text, bodyExamples, varCount) {
  if (!text || varCount === 0) return text;
  let result = text;
  for (let i = 1; i <= varCount; i++) {
    const val = bodyExamples[i]?.[0] || `{{${i}}}`;
    result = result.replace(new RegExp(`\\{\\{${i}\\}\\}`, "g"), val);
  }
  return result;
}

export default function TemplatePreview({
  headerFormat = "NONE",
  headerText = "",
  headerMediaUrl = "",
  body = "",
  bodyExamples = {},
  varCount = 0,
  footer = "",
  buttons = [],
}) {
  const displayBody = replaceVars(body, bodyExamples, varCount);

  return (
    <div className="rounded-2xl bg-[#E5DDD5] p-3 shadow-sm">
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {(headerFormat !== "NONE" || body) && (
          <div className="p-3">
            {headerFormat === "TEXT" && headerText && (
              <p className="text-sm font-semibold text-gray-900 mb-2">{headerText}</p>
            )}
            {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat) && (
              <div className="mb-2 rounded-lg bg-gray-100 h-32 flex items-center justify-center text-gray-400 text-xs">
                {headerMediaUrl ? (
                  <img src={headerMediaUrl} alt="Header" className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <span>{headerFormat}</span>
                )}
              </div>
            )}
            {body && (
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{displayBody}</p>
            )}
            {footer && <p className="mt-1.5 text-xs text-gray-400">{footer}</p>}
          </div>
        )}
        {buttons.filter((b) => b.text.trim()).length > 0 && (
          <div className="border-t border-gray-100">
            {buttons
              .filter((b) => b.text.trim())
              .map((btn, i) => (
                <button
                  key={i}
                  className="w-full py-2.5 text-center text-sm text-blue-600 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  disabled
                >
                  {btn.text}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
