import { createSignal } from "solid-js";
import { api, type BackendUser } from "../services/api";

export interface User {
  id: string;
  username: string;
  role: "admin" | "analyst" | "viewer";
}

function fromBackend(u: BackendUser): User {
  return {
    id: u.ID,
    username: u.Username,
    role: (u.Role as User["role"]) ?? "viewer",
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
// Seed with a "guest" state — real identity is fetched on startup or after login
const [user, setUser] = createSignal<User | null>(null);
const [isAuthenticated, setIsAuthenticated] = createSignal(false);
const [loading, setLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

// ─── Actions ──────────────────────────────────────────────────────────────────
const login = async (username: string, password: string): Promise<boolean> => {
  setLoading(true);
  setError(null);
  try {
    const ok = await api.login(username, password);
    if (ok) {
      // Fetch the real user object after successful login
      const u = await api.getCurrentUser();
      if (u) {
        setUser(fromBackend(u));
        setIsAuthenticated(true);
        return true;
      }
    }
    setError("Invalid username or password");
    return false;
  } catch (e: any) {
    setError(e?.message ?? "Login failed");
    return false;
  } finally {
    setLoading(false);
  }
};

const logout = async () => {
  await api.logout();
  setUser(null);
  setIsAuthenticated(false);
};

// Try to restore session on startup (will succeed if Go already has a session)
const restoreSession = async () => {
  try {
    const u = await api.getCurrentUser();
    if (u) {
      setUser(fromBackend(u));
      setIsAuthenticated(true);
    }
  } catch {
    // Not logged in — that's fine, will show login screen or allow guest
    // For now we auto-auth in dev since the backend seeds admin on startup
    setUser({ id: "u1", username: "admin", role: "admin" });
    setIsAuthenticated(true);
  }
};

// Kick off session restore immediately
restoreSession();

export const authStore = {
  user,
  isAuthenticated,
  loading,
  error,
  login,
  logout,
  restoreSession,
};
