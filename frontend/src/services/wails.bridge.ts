// This file bridges the frontend with the Wails Go backend.
// In a real Wails app, these would be imported from "wailsjs/go/main/App"

export const WailsBridge = {
    async GetAgents() {
        // Fallback or actual Wails call
        return (window as any).go?.main?.App?.GetAgents?.() || [];
    },
    async GetAlerts() {
        return (window as any).go?.main?.App?.GetAlerts?.() || [];
    },
    async SendCommand(agentId: string, cmd: string) {
        return (window as any).go?.main?.App?.SendCommand?.(agentId, cmd) || { success: false };
    },
    // Add more bridge methods as needed
};

export const APIClient = {
    // Standard HTTP client for external APIs if needed
    async fetch(url: string, options?: RequestInit) {
        const response = await fetch(url, options);
        return response.json();
    }
};
