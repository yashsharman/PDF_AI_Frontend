import { useState } from "react";

export default function UsernameModal({ onSubmit }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter a username to continue");
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-logo">
          {/* Document + sparkle icon */}
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

        <form onSubmit={handleSubmit} className="modal-form">
          <label className="modal-label" htmlFor="username-input">
            Username
          </label>
          <input
            id="username-input"
            className={`modal-input${error ? " modal-input--error" : ""}`}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            placeholder="e.g. alex_chen"
            autoFocus
            autoComplete="off"
            maxLength={64}
          />
          {error && <span className="modal-error">{error}</span>}
          <button type="submit" className="modal-btn">
            Continue →
          </button>
        </form>
      </div>
    </div>
  );
}
