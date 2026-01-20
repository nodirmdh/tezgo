import PageHeader from "../components/PageHeader";

const users = [
  { id: "TG-1021", username: "@aziza", status: "active", role: "Client" },
  { id: "TG-874", username: "@jamshid", status: "blocked", role: "Courier" },
  { id: "TG-322", username: "@admin", status: "active", role: "Admin" }
];

export default function UsersPage() {
  return (
    <main>
      <PageHeader
        title="Users"
        description="Список пользователей Telegram и их статусы."
      />
      <table className="table">
        <thead>
          <tr>
            <th>TG ID</th>
            <th>Username</th>
            <th>Роль</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <span className="badge">{user.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
