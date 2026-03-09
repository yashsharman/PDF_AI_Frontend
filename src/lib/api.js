const DEFAULT_BASE = "http://localhost:8000";

// Trim trailing slashes so we can safely append paths.
const cleanBase = (value) => value.replace(/\/$/, "");

export const API_BASE = cleanBase(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE,
);

export async function authSignin(email, password) {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Sign in failed.");
  return data;
}

export async function authSignup(email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Sign up failed.");
  return data;
}

export async function authMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Invalid session.");
  return res.json();
}

export async function authSignout(token) {
  await fetch(`${API_BASE}/auth/signout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getUserDocuments(username) {
  const res = await fetch(
    `${API_BASE}/user-documents?username=${encodeURIComponent(username)}`,
  );
  if (!res.ok) throw new Error("Failed to load documents.");
  return res.json();
}

export async function deleteDocument(username, fileName) {
  const res = await fetch(`${API_BASE}/delete-document`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, file_name: fileName }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to delete document.");
  return data;
}
