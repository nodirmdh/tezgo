import Link from "next/link";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import RoleGate from "../components/RoleGate";
import { CreateUserModal, DeleteUserModal, UpdateUserModal } from "./components/UserModals";
import { revalidatePath } from "next/cache";
import { getUsers } from "../../lib/dataApi";
import { apiRequest } from "../../lib/serverApi";
import { getServerLocale } from "../../lib/i18n.server";
import { t, translateRole, translateStatus } from "../../lib/i18n";

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
  const locale = getServerLocale();
  const users = await getUsers({
    q: searchParams?.q,
    role: searchParams?.role,
    status: searchParams?.status
  });
  return (
    <main>
      <PageHeader
        titleKey="pages.users.title"
        descriptionKey="pages.users.description"
      />
      <div className="toolbar">
        <div className="toolbar-title">{t(locale, "common.actions")}</div>
        <div className="toolbar-actions">
          <CreateUserModal onCreate={createUser} />
          <RoleGate allow={["admin"]}>
            <UpdateUserModal onUpdate={updateUser} />
            <DeleteUserModal onDelete={deleteUser} />
          </RoleGate>
        </div>
      </div>
      <form method="get">
        <Toolbar titleKey="pages.users.filters" actionLabel={null}>
          <input
            className="input"
            name="q"
            placeholder={t(locale, "pages.users.searchPlaceholder")}
            defaultValue={searchParams?.q}
          />
          <select className="select" name="role" defaultValue={searchParams?.role}>
            <option value="">{t(locale, "pages.users.allRoles")}</option>
            {["client", "courier", "partner", "admin", "support"].map((item) => (
              <option key={item} value={item}>
                {translateRole(locale, item)}
              </option>
            ))}
          </select>
          <select className="select" name="status" defaultValue={searchParams?.status}>
            <option value="">{t(locale, "pages.users.allStatuses")}</option>
            {["active", "blocked"].map((item) => (
              <option key={item} value={item}>
                {translateStatus(locale, item)}
              </option>
            ))}
          </select>
          <button className="button" type="submit">
            {t(locale, "common.apply")}
          </button>
        </Toolbar>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>{t(locale, "users.table.tgId")}</th>
            <th>{t(locale, "users.table.username")}</th>
            <th>{t(locale, "users.table.role")}</th>
            <th>{t(locale, "users.table.status")}</th>
            <th>{t(locale, "users.table.id")}</th>
            <th>{t(locale, "users.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.tg_id}</td>
              <td>{user.username}</td>
              <td>{translateRole(locale, user.role)}</td>
              <td>
                <span className="badge">{translateStatus(locale, user.status)}</span>
              </td>
              <td>{user.id}</td>
              <td>
                <Link className="link-button" href={`/users/${user.id}`}>
                  {t(locale, "common.view")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
