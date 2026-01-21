export default function Loading() {
  return (
    <main>
      <div className="form-grid">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="skeleton-row" />
        ))}
      </div>
    </main>
  );
}