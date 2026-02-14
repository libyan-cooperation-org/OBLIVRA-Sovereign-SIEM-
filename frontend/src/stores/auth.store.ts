import { createSignal } from "solid-js";
import type { User } from "../types";

const [user, setUser] = createSignal<User | null>({
    id: "u1",
    username: "admin",
    role: "admin"
});
const [isAuthenticated, setIsAuthenticated] = createSignal(true);

export const authStore = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    logout: () => {
        setUser(null);
        setIsAuthenticated(false);
    }
};
