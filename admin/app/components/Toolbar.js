export default function Toolbar({ title, actionLabel = "Р”РѕР±Р°РІРёС‚СЊ", children }) {
  return (
    <div className="toolbar">
      <div className="toolbar-title">{title}</div>
      <div className="toolbar-actions">
        {children}
        {actionLabel ? (
          <button className="button" type="button">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
