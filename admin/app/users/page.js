import Link from "next/link";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import RoleGate from "../components/RoleGate";
import { CreateUserModal, DeleteUserModal, UpdateUserModal } from "./components/UserModals";
import { revalidatePath } from "next/cache";
import { getUsers } from "../../lib/dataApi";
import { apiRequest } from "../../lib/serverApi";

async function createUser(formData) {
  "use server";
  const tgId = formData.get("tg_id");
  if (!tgId) {
    return;
  }

  const payload = {
    tg_id: tgId,
    username: formData.get("username") || null,
    status: formData.get("status") || "active",
    role: formData.get("role") || "client"
  };

  await apiRequest("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  revalidatePath("/users");
}

async function updateUser(formData) {
  "use server";
  const id = formData.get("id");
  if (!id) {
    return;
  }

  const payload = {
    username: formData.get("username") || null,
    status: formData.get("status") || null,
    role: formData.get("role") || null
  };

  await apiRequest(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  revalidatePath("/users");
}

async function deleteUser(formData) {
  "use server";
  const id = formData.get("id");
  if (!id) {
    return;
  }

  await apiRequest(`/api/users/${id}`, { method: "DELETE" });
  revalidatePath("/users");
}

export default async function UsersPage({ searchParams }) {
  const users = await getUsers({
    q: searchParams?.q,
    role: searchParams?.role,
    status: searchParams?.status
  });
  return (
    <main>
      <PageHeader
        title="Users"
        description="РЎРїРёСЃРѕРє РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ Telegram Рё РёС… СЃС‚Р°С‚СѓСЃС‹."
      />
      <div className="toolbar">
        <div className="toolbar-title">Р”РµР№СЃС‚РІРёСЏ</div>
        <div className="toolbar-actions">
          <CreateUserModal onCreate={createUser} />
          <RoleGate allow={["admin"]}>
            <UpdateUserModal onUpdate={updateUser} />
            <DeleteUserModal onDelete={deleteUser} />
          </RoleGate>
        </div>
      </div>
      <form method="get">
        <Toolbar title="Р¤РёР»СЊС‚СЂС‹ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№" actionLabel={null}>
          <input
            className="input"
            name="q"
            placeholder="РџРѕРёСЃРє РїРѕ TG ID РёР»Рё username"
            defaultValue={searchParams?.q}
          />
          <select className="select" name="role" defaultValue={searchParams?.role}>
            <option value="">Р’СЃРµ СЂРѕР»Рё</option>
            <option value="client">client</option>
            <option value="courier">courier</option>
            <option value="partner">partner</option>
            <option value="admin">admin</option>
            <option value="support">support</option>
          </select>
          <select className="select" name="status" defaultValue={searchParams?.status}>
            <option value="">Р’СЃРµ СЃС‚Р°С‚СѓСЃС‹</option>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
          </select>
          <button className="button" type="submit">
            РџСЂРёРјРµРЅРёС‚СЊ
          </button>
        </Toolbar>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>TG ID</th>
            <th>Username</th>
            <th>Р РѕР»СЊ</th>
            <th>РЎС‚Р°С‚СѓСЃ</th>
            <th>ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.tg_id}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <span className="badge">{user.status}</span>
              </td>
              <td>{user.id}</td>
              <td>
                <Link className="link-button" href={`/users/${user.id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
