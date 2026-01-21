"use client";

import { useLocale } from "./LocaleProvider";

export default function ConfirmDialog({
  open,
  title,
  titleKey = "confirm.title",
  description,
  confirmLabel,
  confirmLabelKey = "confirm.confirm",
  cancelLabel,
  cancelLabelKey = "confirm.cancel",
  onConfirm,
  onCancel
}) {
  const { t } = useLocale();
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title || t(titleKey)}</div>
          <button className="modal-close" type="button" onClick={onCancel}>
            x
          </button>
        </div>
        {description ? <div className="helper-text">{description}</div> : null}
        <div className="modal-actions">
          <button className="button" type="button" onClick={onConfirm}>
            {confirmLabel || t(confirmLabelKey)}
          </button>
          <button className="button ghost" type="button" onClick={onCancel}>
            {cancelLabel || t(cancelLabelKey)}
          </button>
        </div>
      </div>
    </div>
  );
}
