export namespace config {
	
	export class ForensicsConfig {
	    enable_merkle: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ForensicsConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enable_merkle = source["enable_merkle"];
	    }
	}
	export class UIConfig {
	    port: number;
	    theme: string;
	
	    static createFrom(source: any = {}) {
	        return new UIConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.port = source["port"];
	        this.theme = source["theme"];
	    }
	}
	export class StorageConfig {
	    base_path: string;
	    retention_days: number;
	
	    static createFrom(source: any = {}) {
	        return new StorageConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.base_path = source["base_path"];
	        this.retention_days = source["retention_days"];
	    }
	}
	export class IngestionConfig {
	    syslog_port: number;
	    hec_port: number;
	    hec_token: string;
	    grpc_port: number;
	
	    static createFrom(source: any = {}) {
	        return new IngestionConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.syslog_port = source["syslog_port"];
	        this.hec_port = source["hec_port"];
	        this.hec_token = source["hec_token"];
	        this.grpc_port = source["grpc_port"];
	    }
	}
	export class Config {
	    ingestion: IngestionConfig;
	    storage: StorageConfig;
	    ui: UIConfig;
	    forensics: ForensicsConfig;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ingestion = this.convertValues(source["ingestion"], IngestionConfig);
	        this.storage = this.convertValues(source["storage"], StorageConfig);
	        this.ui = this.convertValues(source["ui"], UIConfig);
	        this.forensics = this.convertValues(source["forensics"], ForensicsConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	

}

export namespace graph {
	
	export class Edge {
	    from: string;
	    to: string;
	    action: string;
	
	    static createFrom(source: any = {}) {
	        return new Edge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.from = source["from"];
	        this.to = source["to"];
	        this.action = source["action"];
	    }
	}
	export class Node {
	    id: string;
	    type: string;
	    label: string;
	
	    static createFrom(source: any = {}) {
	        return new Node(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.label = source["label"];
	    }
	}
	export class Graph {
	    nodes: Node[];
	    edges: Edge[];
	
	    static createFrom(source: any = {}) {
	        return new Graph(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodes = this.convertValues(source["nodes"], Node);
	        this.edges = this.convertValues(source["edges"], Edge);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace models {
	
	export class Alert {
	    id: string;
	    event_id: string;
	    rule_id: string;
	    // Go type: time
	    timestamp: any;
	    severity: string;
	    title: string;
	    summary: string;
	    status: string;
	    assignee: string;
	    host: string;
	    metadata: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new Alert(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.event_id = source["event_id"];
	        this.rule_id = source["rule_id"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.severity = source["severity"];
	        this.title = source["title"];
	        this.summary = source["summary"];
	        this.status = source["status"];
	        this.assignee = source["assignee"];
	        this.host = source["host"];
	        this.metadata = source["metadata"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Event {
	    id: string;
	    // Go type: time
	    timestamp: any;
	    source: string;
	    host: string;
	    user: string;
	    severity: string;
	    category: string;
	    message: string;
	    raw: string;
	    fields: Record<string, any>;
	    metadata: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new Event(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.source = source["source"];
	        this.host = source["host"];
	        this.user = source["user"];
	        this.severity = source["severity"];
	        this.category = source["category"];
	        this.message = source["message"];
	        this.raw = source["raw"];
	        this.fields = source["fields"];
	        this.metadata = source["metadata"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SavedSearch {
	    id: string;
	    name: string;
	    query: string;
	    created_by: string;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new SavedSearch(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.query = source["query"];
	        this.created_by = source["created_by"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace sqlitestore {
	
	export class AgentRecord {
	    ID: string;
	    Hostname: string;
	    IP: string;
	    OS: string;
	    Version: string;
	    Status: string;
	    EPS: number;
	    Protocol: string;
	    // Go type: time
	    LastSeen: any;
	
	    static createFrom(source: any = {}) {
	        return new AgentRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Hostname = source["Hostname"];
	        this.IP = source["IP"];
	        this.OS = source["OS"];
	        this.Version = source["Version"];
	        this.Status = source["Status"];
	        this.EPS = source["EPS"];
	        this.Protocol = source["Protocol"];
	        this.LastSeen = this.convertValues(source["LastSeen"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AssetRecord {
	    ID: string;
	    Hostname: string;
	    IP: string;
	    OS: string;
	    Type: string;
	    Criticality: string;
	    Owner: string;
	    // Go type: time
	    LastSeen: any;
	    Tags: string;
	
	    static createFrom(source: any = {}) {
	        return new AssetRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Hostname = source["Hostname"];
	        this.IP = source["IP"];
	        this.OS = source["OS"];
	        this.Type = source["Type"];
	        this.Criticality = source["Criticality"];
	        this.Owner = source["Owner"];
	        this.LastSeen = this.convertValues(source["LastSeen"], null);
	        this.Tags = source["Tags"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AuditRecord {
	    ID: string;
	    UserID: string;
	    Action: string;
	    TargetType: string;
	    TargetID: string;
	    Details: string;
	    // Go type: time
	    Timestamp: any;
	
	    static createFrom(source: any = {}) {
	        return new AuditRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.UserID = source["UserID"];
	        this.Action = source["Action"];
	        this.TargetType = source["TargetType"];
	        this.TargetID = source["TargetID"];
	        this.Details = source["Details"];
	        this.Timestamp = this.convertValues(source["Timestamp"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CaseRecord {
	    ID: string;
	    Title: string;
	    Description: string;
	    Severity: string;
	    Status: string;
	    Assignee: string;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    AlertCount: number;
	
	    static createFrom(source: any = {}) {
	        return new CaseRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Title = source["Title"];
	        this.Description = source["Description"];
	        this.Severity = source["Severity"];
	        this.Status = source["Status"];
	        this.Assignee = source["Assignee"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.AlertCount = source["AlertCount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RuleRecord {
	    ID: string;
	    Name: string;
	    Description: string;
	    Severity: string;
	    Enabled: boolean;
	    MITRE: string;
	    Condition: string;
	    Threshold: number;
	    Window: number;
	    ResponseAction: string;
	    ResponseParams: string;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new RuleRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Name = source["Name"];
	        this.Description = source["Description"];
	        this.Severity = source["Severity"];
	        this.Enabled = source["Enabled"];
	        this.MITRE = source["MITRE"];
	        this.Condition = source["Condition"];
	        this.Threshold = source["Threshold"];
	        this.Window = source["Window"];
	        this.ResponseAction = source["ResponseAction"];
	        this.ResponseParams = source["ResponseParams"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UserRecord {
	    ID: string;
	    Username: string;
	    PasswordHash: string;
	    Role: string;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new UserRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Username = source["Username"];
	        this.PasswordHash = source["PasswordHash"];
	        this.Role = source["Role"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace storage {
	
	export class StorageStats {
	    badger_lsm_bytes: number;
	    badger_vlog_bytes: number;
	    sqlite_path: string;
	
	    static createFrom(source: any = {}) {
	        return new StorageStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.badger_lsm_bytes = source["badger_lsm_bytes"];
	        this.badger_vlog_bytes = source["badger_vlog_bytes"];
	        this.sqlite_path = source["sqlite_path"];
	    }
	}

}

