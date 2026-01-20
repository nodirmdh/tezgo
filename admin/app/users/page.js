import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import { getUsers } from "../../lib/mockApi";

export default async function UsersPage() {
  const users = await getUsers();
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
