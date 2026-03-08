const DEFAULT_BASE = "http://localhost:8000";

// Trim trailing slashes so we can safely append paths.
const cleanBase = (value) => value.replace(/\/$/, "");

export const API_BASE = cleanBase(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE,
);
