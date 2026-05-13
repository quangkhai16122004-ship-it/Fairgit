import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";
import { useAuth } from "../app/AuthProvider";
import { useLang } from "../app/LanguageContext";
import { translations as T, tr } from "../lib/translations";

export function AppLayout() {
  const nav = useNavigate();
  const { state, setGuest } = useAuth();
  const { lang, toggle } = useLang();

  async function onLogout() {
    try {
      await logout();
    } finally {
      setGuest();
      nav("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white border-r">
          <div className="p-4 font-semibold text-lg">FairGit</div>
          <nav className="px-2 space-y-1">
            <NavItem to="/">{tr(T.nav.dashboard, lang)}</NavItem>

            {state.status === "authed" && (state.role === "admin" || state.role === "manager") && (
              <>
                <NavItem to="/projects">{tr(T.nav.projects, lang)}</NavItem>
                <NavItem to="/runs">{tr(T.nav.runs, lang)}</NavItem>
              </>
            )}

            {state.status === "authed" && state.role === "admin" && (
              <NavItem to="/users">{tr(T.nav.users, lang)}</NavItem>
            )}

            <NavItem to="/results">{tr(T.nav.results, lang)}</NavItem>
            <NavItem to="/profile">{tr(T.nav.profile, lang)}</NavItem>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {/* Topbar */}
          <header className="h-14 bg-white border-b flex items-center justify-between px-4">
            <div className="text-sm text-gray-600">{tr(T.nav.teamAnalytics, lang)}</div>

            <div className="flex items-center gap-3">
              {state.status === "authed" && (
                <div className="text-xs text-gray-600">
                  {state.email} • {state.role}
                </div>
              )}

              <button
                onClick={toggle}
                className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
                title={lang === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}
              >
                {tr(T.nav.langToggle, lang)}
              </button>

              <button className="text-sm underline" onClick={onLogout}>
                {tr(T.nav.logout, lang)}
              </button>
            </div>
          </header>

          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm ${
          isActive ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
