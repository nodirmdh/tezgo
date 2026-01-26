import { apiRequest } from "./serverApi";
import { clients as mockClients } from "./mockData";

const normalizeClient = (client) => ({
  id: client?.id ?? client?.user_id ?? null,
  name: client?.name ?? client?.full_name ?? "-",
  phone: client?.phone ?? "-",
  status: client?.status ?? "active",
  tg_id: client?.tg_id ?? null,
  username: client?.username ?? null,
  created_at: client?.created_at ?? null,
  updated_at: client?.updated_at ?? null,
  crm_note: client?.crm_note ?? null,
  crm_updated_at: client?.crm_updated_at ?? null,
  subscriptions: client?.subscriptions ?? null
});

const mockClient = (id) => {
  const parsedId = Number(id);
  const found = mockClients.find((item) => item.id === parsedId);
  if (found) {
    return found;
  }
  return { id: parsedId, name: "Client", phone: "-", status: "active" };
};

export const getClientProfile = async (id) => {
  try {
    const response = await apiRequest(`/api/clients/${id}`);
    if (!response.ok) {
      return { error: null, client: normalizeClient(mockClient(id)) };
    }
    const payload = await response.json();
    return { error: null, client: normalizeClient(payload) };
  } catch {
    return { error: null, client: normalizeClient(mockClient(id)) };
  }
};
