import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../lib/auth";
import { useAuth } from "../app/AuthProvider";
import { toErrorMessage } from "../lib/errorMessage";

export function RegisterPage() {
  const nav = useNavigate();
  const { state, setAuthed } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state.status === "authed") nav("/", { replace: true });
  }, [state, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("Mật khẩu nhập lại không khớp");
      }

      const r = await register(email, password);
      setAuthed(r.email, r.role);
      nav("/", { replace: true });
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Register failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border rounded-2xl p-6">
        <h1 className="text-xl font-semibold">Create account</h1>
        <p className="text-sm text-gray-600 mt-1">Đăng ký tài khoản mới để sử dụng FairGit</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="text-xs text-gray-500">
            Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button disabled={loading} className="w-full rounded-lg px-3 py-2 bg-black text-white disabled:opacity-60">
            {loading ? "Creating..." : "Create account"}
          </button>

          <div className="text-sm text-gray-600 text-center">
            Đã có tài khoản?{" "}
            <Link to="/login" className="underline">
              Sign in
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
