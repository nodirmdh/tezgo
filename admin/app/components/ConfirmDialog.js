"use client";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "РџРѕРґС‚РІРµСЂРґРёС‚СЊ",
  cancelLabel = "РћС‚РјРµРЅР°",
  onConfirm,
  onCancel
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" type="button" onClick={onCancel}>
            Г—
          </button>
        </div>
        {description ? <div className="helper-text">{description}</div> : null}
        <div className="modal-actions">
          <button className="button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="button ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
