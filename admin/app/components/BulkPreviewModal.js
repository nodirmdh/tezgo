"use client";

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal modal-wide">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" type="button" onClick={onClose}>
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function BulkPreviewModal({
  open,
  title,
  warning,
  previewRows,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  confirmDisabled,
  summary
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="modal-body">
        {warning ? <div className="banner warning">{warning}</div> : null}
        <div className="helper-text">
          Previewing first {previewRows.length} rows.
        </div>
        <table className="table compact">
          <thead>
            <tr>
              <th>Item</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>
                  <div className="bulk-preview-changes">
                    {row.changes.map((change, index) => (
                      <div key={`${row.id}-${index}`} className="bulk-preview-row">
                        <span className="bulk-preview-label">{change.label}</span>
                        <span className="bulk-preview-old">{change.from}</span>
                        <span className="bulk-preview-arrow">→</span>
                        <span className="bulk-preview-new">{change.to}</span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="auth-field">
          <label htmlFor="bulkReason">Reason</label>
          <input
            id="bulkReason"
            className="input"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Reason for bulk change"
          />
        </div>
        {summary ? <div className="helper-text">{summary}</div> : null}
      </div>
      <div className="modal-actions">
        <button className="button" type="button" onClick={onConfirm} disabled={confirmDisabled}>
          Confirm
        </button>
        <button className="button ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
