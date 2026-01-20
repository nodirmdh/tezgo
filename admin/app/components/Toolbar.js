export default function Toolbar({ title, actionLabel = "Добавить", children }) {
  return (
    <div className="toolbar">
      <div className="toolbar-title">{title}</div>
      <div className="toolbar-actions">
        {children}
        <button className="button" type="button">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
