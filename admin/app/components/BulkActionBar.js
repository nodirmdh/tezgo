"use client";

export default function BulkActionBar({
  selectedCount,
  actions,
  selectedAction,
  onActionChange,
  onApply,
  disabled,
  children
}) {
  if (!selectedCount) return null;

  return (
    <div className="bulk-action-bar">
      <div className="bulk-action-summary">
        Selected: <strong>{selectedCount}</strong>
      </div>
      <div className="bulk-action-controls">
        <select
          className="select"
          value={selectedAction}
          onChange={(event) => onActionChange(event.target.value)}
          aria-label="Bulk action"
        >
          <option value="">Select action</option>
          {actions.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>
        <button className="button" type="button" onClick={onApply} disabled={disabled}>
          Apply
        </button>
      </div>
      {children ? <div className="bulk-action-extra">{children}</div> : null}
    </div>
  );
}
