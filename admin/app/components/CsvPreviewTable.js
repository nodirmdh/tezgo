"use client";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
};

const formatObject = (data) => {
  if (!data) return "-";
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join(", ");
};

export default function CsvPreviewTable({ rows }) {
  if (!rows?.length) {
    return <div className="empty-state">No preview rows</div>;
  }

  return (
    <table className="table compact">
      <thead>
        <tr>
          <th>Row</th>
          <th>Item</th>
          <th>Old</th>
          <th>New</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.previewId || "preview"}-${row.rowNumber}-${row.itemId || "item"}`}>
            <td>{row.rowNumber}</td>
            <td>{row.itemLabel || row.itemId}</td>
            <td>{row.oldSummary || formatObject(row.old)}</td>
            <td>{row.newSummary || formatObject(row.new)}</td>
            <td>
              <div className="table-actions">
                <span className="badge">{row.status}</span>
                {row.message ? <span className="helper-text">{row.message}</span> : null}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
