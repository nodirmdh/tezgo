import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";

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
      <Toolbar title="Фильтры пользователей">
        <input className="input" placeholder="Поиск по TG ID или username" />
        <select className="select">
          <option>Все роли</option>
          <option>Client</option>
          <option>Courier</option>
          <option>Partner</option>
          <option>Admin</option>
          <option>Support</option>
        </select>
      </Toolbar>
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
