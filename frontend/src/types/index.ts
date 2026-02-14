export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface Alert {
    id: string;
    title: string;
    source: string;
    severity: AlertSeverity;
    timestamp: string;
    status: "open" | "investigating" | "resolved" | "false_positive";
    mitre: string;
    count: number;
}

export interface Case {
    id: string;
    title: string;
    severity: AlertSeverity;
    status: "open" | "in_progress" | "resolved" | "closed";
    assignee: string;
    created: string;
    updated: string;
    alertCount: number;
    description: string;
}

export interface Agent {
    id: string;
    hostname: string;
    ip: string;
    os: string;
    status: "online" | "offline" | "throttled";
    version: string;
    eps: number;
    lastSeen: string;
    protocol: "grpc" | "http";
}

export interface LogEvent {
    id: string;
    timestamp: string;
    source: string;
    level: "CRITICAL" | "ERROR" | "WARN" | "INFO" | "DEBUG";
    message: string;
    host: string;
    fields: Record<string, any>;
}

export interface Asset {
    id: string;
    hostname: string;
    ip: string;
    type: "server" | "workstation" | "firewall" | "router" | "iot";
    criticality: "crown_jewel" | "high" | "medium" | "low";
    os: string;
    owner: string;
    lastSeen: string;
}

export interface User {
    id: string;
    username: string;
    role: "admin" | "analyst" | "viewer";
    avatar?: string;
}
