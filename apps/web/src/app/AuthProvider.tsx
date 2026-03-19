import React from "react";
import { me as apiMe } from "../lib/auth";

type Role = "admin" | "manager" | "member";

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authed"; email: string; role: Role };

const AuthCtx = React.createContext<{
  state: AuthState;
  setAuthed: (email: string, role: Role) => void;
  setGuest: () => void;
}>({
  state: { status: "loading" },
  setAuthed: () => {},
  setGuest: () => {},
});

export function useAuth() {
  return React.useContext(AuthCtx);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ status: "loading" });

  React.useEffect(() => {
    apiMe()
      .then((r) => setState({ status: "authed", email: r.email, role: r.role }))
      .catch(() => setState({ status: "guest" }));
  }, []);

  const setAuthed = (email: string, role: Role) => setState({ status: "authed", email, role });
  const setGuest = () => setState({ status: "guest" });

  return <AuthCtx.Provider value={{ state, setAuthed, setGuest }}>{children}</AuthCtx.Provider>;
}