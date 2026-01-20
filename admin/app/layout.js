export const metadata = {
  title: "Kungrad Admin",
  description: "Admin panel for Kungrad Delivery Platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
