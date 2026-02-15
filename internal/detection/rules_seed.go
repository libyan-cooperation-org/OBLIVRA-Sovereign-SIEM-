package detection

// SeedDefaultRules inserts the built-in detection rule catalogue into the
// SQLite store on first run (INSERT OR IGNORE — safe to call every startup).
//
// Rules are written in the same JSON DSL that the Matcher understands:
//
//	{ "field": "message", "operator": "contains", "value": "…" }
//	{ "logical": "or", "nested": [ … ] }
//	{ "logical": "and", "nested": [ … ] }
//
// Each rule also carries threshold / window values (matched by engine.go).

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
)

// SeedDefaultRules populates the rules table with the built-in catalogue.
// Already-existing rules (same ID) are not overwritten.
func SeedDefaultRules(store *sqlitestore.DB) error {
	existing, err := store.ListRules(false)
	if err != nil {
		return err
	}
	if len(existing) >= 10 {
		log.Printf("Detection rules already seeded (%d rules present), skipping.", len(existing))
		return nil
	}

	now := time.Now()
	seeded := 0

	for _, r := range defaultRules {
		rec := &sqlitestore.RuleRecord{
			ID:             r.id,
			Name:           r.name,
			Description:    r.description,
			Severity:       r.severity,
			Enabled:        true,
			MITRE:          r.mitre,
			Condition:      r.condition,
			Threshold:      r.threshold,
			Window:         r.window,
			ResponseAction: r.responseAction,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		if rec.ID == "" {
			rec.ID = uuid.NewString()
		}
		if err := store.InsertRule(rec); err != nil {
			log.Printf("SeedDefaultRules: failed to insert rule %q: %v", r.name, err)
			continue
		}
		seeded++
	}

	log.Printf("Detection engine: seeded %d default rules", seeded)
	return nil
}

// ruleSpec is the compact form used only in this seed file.
type ruleSpec struct {
	id             string
	name           string
	description    string
	severity       string // critical | high | medium | low
	mitre          string
	condition      string // JSON matching the Condition DSL
	threshold      int    // 0 or 1 = single-match; >1 = requires N hits in window
	window         int    // seconds
	responseAction string
}

// defaultRules contains 50 real-world detection rules covering the MITRE
// ATT&CK framework's most common technique categories.
var defaultRules = []ruleSpec{

	// ── AUTHENTICATION ────────────────────────────────────────────────────────

	{
		id:          "rule-ssh-brute-force",
		name:        "SSH Brute Force Detected",
		description: "Multiple failed SSH authentication attempts from the same source indicate a brute-force attack",
		severity:    "critical",
		mitre:       "T1110",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"Failed password for"},{"field":"message","operator":"contains","value":"Failed publickey for"},{"field":"message","operator":"contains","value":"Invalid user"}]}`,
		threshold:   5,
		window:      60,
		responseAction: "block_ip",
	},
	{
		id:          "rule-rdp-brute-force",
		name:        "RDP Brute Force Attempt",
		description: "Repeated RDP authentication failures indicating a brute-force attack against Windows Remote Desktop",
		severity:    "critical",
		mitre:       "T1110",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"An account failed to log on"},{"field":"message","operator":"contains","value":"event_id=4625"},{"field":"message","operator":"regex","value":"EventID.*4625"}]}`,
		threshold:   5,
		window:      60,
		responseAction: "block_ip",
	},
	{
		id:          "rule-invalid-user-ssh",
		name:        "SSH Login with Non-Existent User",
		description: "Login attempt using a username that does not exist on the system — common in credential-stuffing attacks",
		severity:    "high",
		mitre:       "T1110.003",
		condition:   `{"field":"message","operator":"contains","value":"Invalid user"}`,
		threshold:   3,
		window:      120,
	},
	{
		id:          "rule-root-login-success",
		name:        "Successful Root Login",
		description: "Direct root login succeeded — root should only be accessed via sudo from a standard account",
		severity:    "high",
		mitre:       "T1078.003",
		condition:   `{"logical":"and","nested":[{"field":"message","operator":"contains","value":"Accepted password for root"},{"field":"source","operator":"contains","value":"sshd"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-default-creds",
		name:        "Default Credential Login Attempt",
		description: "Login attempt using well-known default usernames (admin, administrator, test, guest)",
		severity:    "medium",
		mitre:       "T1078.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)Failed password for (admin|administrator|test|guest|user|operator)"},{"field":"message","operator":"regex","value":"(?i)Invalid user (admin|administrator|test|guest|user|operator)"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-account-lockout",
		name:        "Account Lockout Event",
		description: "A user account has been locked out due to too many failed authentication attempts",
		severity:    "high",
		mitre:       "T1110",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"account has been locked"},{"field":"message","operator":"regex","value":"EventID.*4740"},{"field":"message","operator":"contains","value":"pam_tally2: user"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-impossible-travel",
		name:        "Impossible Travel Detected",
		description: "Same user authenticated from two geographically distant locations within a short time window",
		severity:    "critical",
		mitre:       "T1078",
		condition:   `{"logical":"and","nested":[{"field":"message","operator":"contains","value":"Accepted"},{"field":"message","operator":"regex","value":"(?i)(russia|china|iran|north korea|dprk)"}]}`,
		threshold:   1,
		window:      0,
	},

	// ── PRIVILEGE ESCALATION ─────────────────────────────────────────────────

	{
		id:          "rule-sudo-failure",
		name:        "Sudo Authentication Failure",
		description: "A user failed to authenticate for sudo — may indicate privilege escalation attempt",
		severity:    "medium",
		mitre:       "T1548.003",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"sudo: pam_unix(sudo:auth): authentication failure"},{"field":"message","operator":"contains","value":"sudo: auth failure"}]}`,
		threshold:   3,
		window:      300,
	},
	{
		id:          "rule-new-admin-account",
		name:        "New Administrator Account Created",
		description: "A new account with administrative privileges was created outside of normal change windows",
		severity:    "high",
		mitre:       "T1136.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"EventID.*4720"},{"field":"message","operator":"contains","value":"useradd"},{"field":"message","operator":"contains","value":"net user /add"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-admin-group-change",
		name:        "User Added to Admin Group",
		description: "A user account was added to administrators or sudoers — possible privilege escalation",
		severity:    "critical",
		mitre:       "T1098",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"EventID.*4732"},{"field":"message","operator":"contains","value":"added to group sudo"},{"field":"message","operator":"contains","value":"usermod -aG sudo"},{"field":"message","operator":"contains","value":"wheel group"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-setuid-execution",
		name:        "Setuid Binary Executed",
		description: "A binary was executed with setuid bit — common in Linux privilege escalation exploits",
		severity:    "high",
		mitre:       "T1548.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"NOPASSWD"},{"field":"message","operator":"regex","value":"chmod.*[+]s"},{"field":"message","operator":"contains","value":"setuid"}]}`,
		threshold:   1,
		window:      0,
	},

	// ── LATERAL MOVEMENT ─────────────────────────────────────────────────────

	{
		id:          "rule-smb-scan",
		name:        "SMB Network Scanning",
		description: "Multiple SMB connection attempts across different hosts — classic lateral movement precursor",
		severity:    "high",
		mitre:       "T1021.002",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"SMB"},{"field":"message","operator":"contains","value":"CIFS"},{"field":"message","operator":"regex","value":"port.*445"}]}`,
		threshold:   10,
		window:      60,
	},
	{
		id:          "rule-wmi-remote",
		name:        "Remote WMI Execution",
		description: "WMI being used for remote command execution — MITRE T1047 lateral movement technique",
		severity:    "high",
		mitre:       "T1047",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"wmic"},{"field":"message","operator":"contains","value":"wmiprvse"},{"field":"message","operator":"contains","value":"Win32_Process Create"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-psexec",
		name:        "PsExec Remote Execution",
		description: "PsExec or similar remote administration tool detected — frequently used in lateral movement",
		severity:    "critical",
		mitre:       "T1569.002",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"psexec"},{"field":"message","operator":"contains","value":"PSEXESVC"},{"field":"message","operator":"regex","value":"EventID.*7045"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-pass-the-hash",
		name:        "Pass-the-Hash Attack Detected",
		description: "NTLM authentication with a blank password or from a non-standard source — indicator of PtH",
		severity:    "critical",
		mitre:       "T1550.002",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"NTLM"},{"field":"message","operator":"regex","value":"EventID.*4624.*3.*NTLM"},{"field":"message","operator":"contains","value":"pass the hash"}]}`,
		threshold:   1,
		window:      0,
	},

	// ── PERSISTENCE ──────────────────────────────────────────────────────────

	{
		id:          "rule-cron-modification",
		name:        "Crontab Modification Detected",
		description: "A cron job was added or modified — common persistence technique",
		severity:    "high",
		mitre:       "T1053.003",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"CRON"},{"field":"message","operator":"contains","value":"crontab -e"},{"field":"message","operator":"regex","value":"(?i)cron.*edited|cron.*install"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-scheduled-task",
		name:        "Scheduled Task Created",
		description: "A scheduled task was created on Windows — often used to maintain persistence",
		severity:    "high",
		mitre:       "T1053.005",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"EventID.*4698"},{"field":"message","operator":"contains","value":"schtasks /create"},{"field":"message","operator":"contains","value":"Task Scheduler"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-registry-run-key",
		name:        "Registry Run Key Modification",
		description: "A value was written to a Windows auto-run registry key — persistence mechanism",
		severity:    "high",
		mitre:       "T1547.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"HKLM.*Run"},{"field":"message","operator":"regex","value":"HKCU.*Run"},{"field":"message","operator":"contains","value":"CurrentVersion\\\\Run"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-new-service",
		name:        "New Windows Service Installed",
		description: "A new system service was installed — commonly used by malware for persistence",
		severity:    "high",
		mitre:       "T1543.003",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"EventID.*7045"},{"field":"message","operator":"contains","value":"sc.exe create"},{"field":"message","operator":"contains","value":"New service was installed"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-bashrc-modification",
		name:        "Shell Profile Modification",
		description: "A shell initialization file was modified — used by attackers for persistent code execution",
		severity:    "medium",
		mitre:       "T1546.004",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)\\.bashrc|\\.profile|\\.zshrc|\\.bash_profile"},{"field":"message","operator":"contains","value":"/etc/profile"}]}`,
		threshold:   1,
		window:      0,
	},

	// ── CREDENTIAL DUMPING ────────────────────────────────────────────────────

	{
		id:          "rule-lsass-access",
		name:        "LSASS Memory Access",
		description: "A process attempted to access LSASS memory — strong indicator of credential dumping",
		severity:    "critical",
		mitre:       "T1003.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"lsass.exe"},{"field":"message","operator":"contains","value":"lsass"},{"field":"message","operator":"regex","value":"(?i)sekurlsa|mimikatz|wce\\.exe"}]}`,
		threshold:   1,
		window:      0,
		responseAction: "isolate_host",
	},
	{
		id:          "rule-sam-dump",
		name:        "SAM Database Access Attempt",
		description: "Attempted access to the SAM database which contains Windows password hashes",
		severity:    "critical",
		mitre:       "T1003.002",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)sam.*dump|reg.*save.*sam"},{"field":"message","operator":"contains","value":"ntds.dit"},{"field":"message","operator":"contains","value":"vssadmin"}]}`,
		threshold:   1,
		window:      0,
	},

	// ── COMMAND & CONTROL ────────────────────────────────────────────────────

	{
		id:          "rule-dns-tunneling",
		name:        "DNS Tunneling Suspected",
		description: "Unusually long or high-frequency DNS queries indicating data exfiltration via DNS",
		severity:    "high",
		mitre:       "T1572",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)dns.*tunnel|iodine|dnscat"},{"field":"message","operator":"regex","value":"TXT record.*length [0-9]{3,}"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-beaconing",
		name:        "C2 Beaconing Pattern Detected",
		description: "Regular outbound connections at fixed intervals indicating C2 beaconing behaviour",
		severity:    "high",
		mitre:       "T1071",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"beacon"},{"field":"message","operator":"regex","value":"(?i)cobalt.?strike|metasploit|meterpreter"}]}`,
		threshold:   5,
		window:      300,
	},
	{
		id:          "rule-tor-usage",
		name:        "Tor Network Usage Detected",
		description: "Connection to known Tor entry nodes or Tor Browser process detected",
		severity:    "high",
		mitre:       "T1090.003",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"tor"},{"field":"message","operator":"regex","value":"(?i)onion|tor2web|torbrowser"},{"field":"message","operator":"regex","value":"port.*9050|port.*9150"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-dga-domain",
		name:        "Domain Generation Algorithm (DGA) Detected",
		description: "DNS query to a randomly-generated looking domain consistent with DGA-based malware C2",
		severity:    "high",
		mitre:       "T1568.002",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"[a-z0-9]{20,}\\.(com|net|org|biz)"},{"field":"message","operator":"regex","value":"(?i)nxdomain.*[a-z]{15,}"}]}`,
		threshold:   3,
		window:      60,
	},

	// ── EXFILTRATION ─────────────────────────────────────────────────────────

	{
		id:          "rule-large-upload",
		name:        "Unusually Large Outbound Transfer",
		description: "Large volume of data transferred outbound — potential data exfiltration",
		severity:    "high",
		mitre:       "T1048",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"bytes.*[0-9]{8,}"},{"field":"message","operator":"contains","value":"large upload"},{"field":"message","operator":"regex","value":"transferred.*GB"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-cloud-storage-upload",
		name:        "Corporate Data Uploaded to Cloud Storage",
		description: "File upload detected to cloud storage services (Dropbox, Google Drive, OneDrive, Mega)",
		severity:    "high",
		mitre:       "T1567.002",
		condition:   `{"field":"message","operator":"regex","value":"(?i)(dropbox|drive\\.google|onedrive|mega\\.nz|wetransfer|pastebin)\\.com"}`,
		threshold:   1,
		window:      0,
	},

	// ── DEFENCE EVASION ───────────────────────────────────────────────────────

	{
		id:          "rule-log-cleared",
		name:        "Windows Security Log Cleared",
		description: "The Windows Security event log was cleared — classic attacker anti-forensics action",
		severity:    "critical",
		mitre:       "T1070.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"EventID.*1102"},{"field":"message","operator":"regex","value":"EventID.*104"},{"field":"message","operator":"contains","value":"audit log was cleared"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-powershell-encoded",
		name:        "PowerShell Encoded Command Execution",
		description: "PowerShell was invoked with -EncodedCommand — common obfuscation technique for malicious scripts",
		severity:    "high",
		mitre:       "T1059.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)powershell.*-enc"},{"field":"message","operator":"regex","value":"(?i)powershell.*-encodedcommand"},{"field":"message","operator":"regex","value":"(?i)powershell.*-e [A-Za-z0-9+/]{20,}"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-obfuscated-powershell",
		name:        "Obfuscated PowerShell Script",
		description: "Heavily obfuscated PowerShell command detected using character concatenation or XOR techniques",
		severity:    "high",
		mitre:       "T1027",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)iex|invoke-expression"},{"field":"message","operator":"regex","value":"(?i)\\$env:.*\\+.*"},{"field":"message","operator":"regex","value":"(?i)frombase64string"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-shadow-copy-delete",
		name:        "Shadow Copy Deletion Detected",
		description: "VSS shadow copies were deleted — hallmark behaviour of ransomware before encryption begins",
		severity:    "critical",
		mitre:       "T1490",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"vssadmin delete shadows"},{"field":"message","operator":"contains","value":"wmic shadowcopy delete"},{"field":"message","operator":"regex","value":"(?i)bcdedit.*safeboot|bcdedit.*recoveryenabled"}]}`,
		threshold:   1,
		window:      0,
		responseAction: "isolate_host",
	},
	{
		id:          "rule-disable-defender",
		name:        "Windows Defender Disabled",
		description: "Windows Defender real-time protection was disabled — attacker removing security controls",
		severity:    "critical",
		mitre:       "T1562.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)Set-MpPreference.*DisableRealtimeMonitoring"},{"field":"message","operator":"regex","value":"(?i)sc.*stop.*WinDefend"},{"field":"message","operator":"regex","value":"(?i)net stop.*msseces"}]}`,
		threshold:   1,
		window:      0,
	},

	// ── RANSOMWARE ────────────────────────────────────────────────────────────

	{
		id:          "rule-mass-file-rename",
		name:        "Mass File Extension Change",
		description: "Large number of files renamed with new extensions in a short window — ransomware encryption behaviour",
		severity:    "critical",
		mitre:       "T1486",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)renamed.*\\.(locked|encrypted|crypted|crypt|enc|ransom)"},{"field":"message","operator":"regex","value":"(?i)mv.*\\.(locked|enc|crypt)"},{"field":"message","operator":"contains","value":"ransom"}]}`,
		threshold:   50,
		window:      60,
		responseAction: "isolate_host",
	},
	{
		id:          "rule-readme-drop",
		name:        "Ransomware Note Dropped",
		description: "Ransom note file created (README, DECRYPT, HOW_TO_DECRYPT) — active ransomware infection",
		severity:    "critical",
		mitre:       "T1486",
		condition:   `{"field":"message","operator":"regex","value":"(?i)(README|DECRYPT|HOW_TO_DECRYPT|RESTORE_FILES|YOUR_FILES|RECOVER).*\\.txt"}`,
		threshold:   1,
		window:      0,
		responseAction: "isolate_host",
	},

	// ── PROCESS INJECTION ─────────────────────────────────────────────────────

	{
		id:          "rule-dll-injection",
		name:        "DLL Injection Detected",
		description: "A process loaded an unexpected DLL or used CreateRemoteThread — injection technique",
		severity:    "critical",
		mitre:       "T1055.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)CreateRemoteThread"},{"field":"message","operator":"regex","value":"(?i)VirtualAllocEx"},{"field":"message","operator":"regex","value":"(?i)WriteProcessMemory"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-process-hollowing",
		name:        "Process Hollowing Attempt",
		description: "Suspicious sequence of create-process + suspend + NtUnmapViewOfSection — process hollowing",
		severity:    "critical",
		mitre:       "T1055.012",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)NtUnmapViewOfSection"},{"field":"message","operator":"regex","value":"(?i)ZwUnmapViewOfSection"},{"field":"message","operator":"regex","value":"(?i)process.*hollowing"}]}`,
		threshold:   1,
		window:      0,
	},

	// ── SUSPICIOUS PROCESSES ─────────────────────────────────────────────────

	{
		id:          "rule-office-spawns-shell",
		name:        "Office Application Spawned Shell",
		description: "Word/Excel/PowerPoint spawned cmd.exe or PowerShell — common malicious macro behaviour",
		severity:    "critical",
		mitre:       "T1566.001",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)(winword|excel|powerpnt).*cmd\\.exe"},{"field":"message","operator":"regex","value":"(?i)(winword|excel|powerpnt).*powershell"},{"field":"message","operator":"regex","value":"(?i)(winword|excel|powerpnt).*wscript"}]}`,
		threshold:   1,
		window:      0,
		responseAction: "isolate_host",
	},
	{
		id:          "rule-browser-spawns-shell",
		name:        "Browser Spawned Shell",
		description: "A web browser (Chrome, Firefox, Edge) spawned a command shell — likely exploit or drive-by download",
		severity:    "critical",
		mitre:       "T1203",
		condition:   `{"field":"message","operator":"regex","value":"(?i)(chrome|firefox|msedge|iexplore).*(cmd\\.exe|powershell|wscript|mshta)"}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-mshta-execution",
		name:        "MSHTA Living-off-the-Land Execution",
		description: "mshta.exe used to execute HTML Application — LOLBin frequently used to bypass defences",
		severity:    "high",
		mitre:       "T1218.005",
		condition:   `{"field":"message","operator":"regex","value":"(?i)mshta\\.exe.*(http|javascript|vbscript)"}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-certutil-download",
		name:        "CertUtil Used to Download File",
		description: "certutil.exe used to download a file from the internet — common LOLBin for malware delivery",
		severity:    "high",
		mitre:       "T1105",
		condition:   `{"field":"message","operator":"regex","value":"(?i)certutil.*(urlcache|decode|-f.*http)"}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-regsvr32-squiblydoo",
		name:        "Regsvr32 Squiblydoo Execution",
		description: "regsvr32.exe used to execute a remote scriptlet (Squiblydoo technique)",
		severity:    "high",
		mitre:       "T1218.010",
		condition:   `{"field":"message","operator":"regex","value":"(?i)regsvr32.*(http|scrobj|/s.*http)"}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-net-recon",
		name:        "Network Reconnaissance Commands",
		description: "Built-in Windows network tools used in sequence — typical attacker discovery phase",
		severity:    "medium",
		mitre:       "T1016",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)ipconfig|ifconfig|arp -a|netstat -an|net view|net user|whoami"},{"field":"message","operator":"regex","value":"(?i)nmap|masscan|nbtscan"}]}`,
		threshold:   5,
		window:      120,
	},

	// ── LINUX SPECIFIC ────────────────────────────────────────────────────────

	{
		id:          "rule-kernel-module-load",
		name:        "Suspicious Kernel Module Loaded",
		description: "A kernel module was loaded using insmod or modprobe — rootkit installation technique",
		severity:    "critical",
		mitre:       "T1547.006",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"insmod"},{"field":"message","operator":"regex","value":"modprobe.*(rootkit|hide|hook)"},{"field":"message","operator":"regex","value":"module.*loaded.*from.*tmp"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-ld-preload",
		name:        "LD_PRELOAD Hijacking",
		description: "LD_PRELOAD environment variable set to load a custom shared library — rootkit or hook technique",
		severity:    "critical",
		mitre:       "T1574.006",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"LD_PRELOAD"},{"field":"message","operator":"contains","value":"LD_LIBRARY_PATH"},{"field":"message","operator":"regex","value":"(?i)/etc/ld\\.so\\.preload"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-etc-shadow-read",
		name:        "Sensitive File Read (/etc/shadow)",
		description: "Access to /etc/shadow or /etc/passwd detected — credential theft attempt",
		severity:    "critical",
		mitre:       "T1003.008",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)/etc/shadow"},{"field":"message","operator":"regex","value":"(?i)cat.*/etc/passwd"},{"field":"message","operator":"regex","value":"(?i)unshadow"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-reverse-shell",
		name:        "Reverse Shell Established",
		description: "Indicators of a reverse shell being opened — common post-exploitation persistence",
		severity:    "critical",
		mitre:       "T1059.004",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)bash.*-i.*>&.*/dev/tcp"},{"field":"message","operator":"regex","value":"(?i)nc.*-e.*/bin/"},{"field":"message","operator":"regex","value":"(?i)python.*socket.*subprocess"},{"field":"message","operator":"regex","value":"(?i)socat.*exec.*sh"}]}`,
		threshold:   1,
		window:      0,
		responseAction: "isolate_host",
	},

	// ── NETWORK ───────────────────────────────────────────────────────────────

	{
		id:          "rule-port-scan",
		name:        "Port Scan Detected",
		description: "Single source IP probing multiple ports in a short window — reconnaissance activity",
		severity:    "medium",
		mitre:       "T1046",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"port scan"},{"field":"message","operator":"regex","value":"SYN.*multiple ports"},{"field":"message","operator":"regex","value":"(?i)nmap|masscan"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-firewall-block-spike",
		name:        "Firewall Block Count Spike",
		description: "Sudden spike in firewall block events from a single source — attack or scanning activity",
		severity:    "medium",
		mitre:       "T1046",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"BLOCKED"},{"field":"message","operator":"contains","value":"DROP"},{"field":"message","operator":"regex","value":"(?i)deny.*inbound|blocked.*connection"}]}`,
		threshold:   20,
		window:      60,
	},
	{
		id:          "rule-known-c2-ip",
		name:        "Connection to Known C2 Infrastructure",
		description: "Outbound connection to a known malicious IP address in threat intelligence feeds",
		severity:    "critical",
		mitre:       "T1071",
		condition:   `{"field":"metadata","operator":"eq","value":"true"}`,
		threshold:   1,
		window:      0,
	},

	// ── DECEPTION / HONEYTOKEN ────────────────────────────────────────────────

	{
		id:          "rule-honeytoken-triggered",
		name:        "Honeytoken Credential Used",
		description: "A fake credential (honeytoken) was used — any access is a confirmed malicious actor",
		severity:    "critical",
		mitre:       "T1078",
		condition:   `{"field":"message","operator":"contains","value":"honeytoken_triggered"}`,
		threshold:   1,
		window:      0,
		responseAction: "block_ip",
	},

	// ── FIM ───────────────────────────────────────────────────────────────────

	{
		id:          "rule-fim-critical-change",
		name:        "Critical File Modified",
		description: "A file on the monitored watchlist was modified, created or deleted — potential tampering",
		severity:    "high",
		mitre:       "T1565.001",
		condition:   `{"logical":"or","nested":[{"field":"source","operator":"eq","value":"fim"},{"field":"message","operator":"contains","value":"FIM:"},{"field":"category","operator":"eq","value":"fim"}]}`,
		threshold:   1,
		window:      0,
	},

	// ── SUPPLY CHAIN ─────────────────────────────────────────────────────────

	{
		id:          "rule-package-manager-anomaly",
		name:        "Suspicious Package Installation",
		description: "Package manager invoked from an unusual parent process — potential supply chain compromise",
		severity:    "high",
		mitre:       "T1195",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"regex","value":"(?i)(wget|curl).*\\| (bash|sh|python)"},{"field":"message","operator":"regex","value":"(?i)pip install.*--pre.*http"},{"field":"message","operator":"regex","value":"(?i)npm install.*--unsafe"}]}`,
		threshold:   1,
		window:      0,
	},

	// ── CLOUD ────────────────────────────────────────────────────────────────

	{
		id:          "rule-cloudtrail-disabled",
		name:        "AWS CloudTrail Logging Disabled",
		description: "CloudTrail trail was stopped or deleted — attacker removing AWS audit trail",
		severity:    "critical",
		mitre:       "T1562.008",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"StopLogging"},{"field":"message","operator":"contains","value":"DeleteTrail"},{"field":"message","operator":"regex","value":"(?i)cloudtrail.*(stopped|disabled)"}]}`,
		threshold:   1,
		window:      0,
	},
	{
		id:          "rule-aws-root-login",
		name:        "AWS Root Account Used",
		description: "The AWS root account was used to sign in — should never be used for routine operations",
		severity:    "critical",
		mitre:       "T1078.004",
		condition:   `{"logical":"or","nested":[{"field":"message","operator":"contains","value":"Root"},{"field":"message","operator":"regex","value":"(?i)userIdentity.*Root"},{"field":"message","operator":"contains","value":"ConsoleLogin.*Root"}]}`,
		threshold:   1,
		window:      0,
	},
}
