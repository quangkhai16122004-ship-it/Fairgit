import { api } from "./api";

export type UserItem = {
  _id: string;
  email: string;
  role: "admin" | "manager" | "member";
  createdAt: string;
};

export async function listUsers() {
  const res = await api.get("/users");
  return res.data as UserItem[];
}

export async function changeRole(id: string, role: UserItem["role"]) {
  const res = await api.patch(`/users/${id}/role`, { role });
  return res.data as UserItem;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}

export async function resetPassword(id: string, newPassword: string) {
  await api.patch(`/users/${id}/password`, { newPassword });
}
