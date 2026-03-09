import { useState } from "react";
import { authSignin, authSignup } from "../lib/api";

export default function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(null); // 'signin' | 'signup' | null

  function clearMessages() {
    setError("");
    setInfo("");
  }

  async function handleSignIn(e) {
    e.preventDefault();
    if (!email.trim() || !password || loading) return;
    setLoading("signin");
    clearMessages();
    try {
      const data = await authSignin(email.trim(), password);
      onAuth(data.email, data.access_token);
    } catch (err) {
      setError(err.message || "Sign in failed.");
    } finally {
      setLoading(null);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (!email.trim() || !password || loading) return;
    setLoading("signup");
    clearMessages();
    try {
      const data = await authSignup(email.trim(), password);
      if (data.access_token) {
        onAuth(data.email, data.access_token);
      } else {
        setInfo(
          data.message || "Please check your email to confirm your account.",
        );
      }
    } catch (err) {
      setError(err.message || "Sign up failed.");
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;
  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Logo */}
        <div className="modal-logo">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 3v5h5M10 12h4M10 15.5h2.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="18" cy="18" r="1" fill="currentColor" />
            <path
              d="M18 14v2M16 16h2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="modal-title">
          PDF<span className="accent">AI</span>
        </h1>
        <p className="modal-subtitle">Your intelligent document assistant</p>

        <form className="modal-form" onSubmit={handleSignIn} noValidate>
          <label className="modal-label" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            className={`modal-input${error ? " modal-input--error" : ""}`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearMessages();
            }}
            placeholder="you@example.com"
            autoFocus
            autoComplete="email"
            disabled={busy}
          />

          <label className="modal-label" htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            className={`modal-input${error ? " modal-input--error" : ""}`}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearMessages();
            }}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={busy}
          />

          {error && <span className="modal-error">{error}</span>}
          {info && (
            <span
              style={{
                fontSize: "12px",
                color: "var(--accent)",
                textAlign: "left",
                lineHeight: 1.5,
              }}
            >
              {info}
            </span>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              type="submit"
              className="modal-btn"
              style={{ flex: 1 }}
              disabled={busy || !canSubmit}
            >
              {loading === "signin" ? "Signing in…" : "Sign In"}
            </button>
            <button
              type="button"
              className="modal-btn"
              style={{
                flex: 1,
                background: "transparent",
                color: "var(--accent)",
                border: "1px solid rgba(74,142,255,0.45)",
              }}
              onClick={handleSignUp}
              disabled={busy || !canSubmit}
            >
              {loading === "signup" ? "Signing up…" : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
