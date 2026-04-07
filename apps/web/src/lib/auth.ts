import { api } from "./api";

export type Role = "admin" | "manager" | "member";
export type Me = { email: string; role: Role };

export async function login(email: string, password: string) {
  const res = await api.post("/auth/login", { email, password });
  return res.data as { ok: true; email: string; role: Role };
}

export async function register(email: string, password: string) {
  const res = await api.post("/auth/register", { email, password });
  return res.data as { ok: true; email: string; role: Role };
}

export async function me() {
  const res = await api.get("/auth/me");
  return res.data as { ok: true; email: string; role: Role };
}

export async function logout() {
  const res = await api.post("/auth/logout");
  return res.data as { ok: true };
}
