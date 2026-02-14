package syslog

import (
	"testing"
)

func TestSyslogParser_Parse(t *testing.T) {
	p := New()
	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		// RFC3164 - Real Samples
		{"RFC3164_SSH_Success", "<34>Oct 11 22:14:15 host sshd[123]: Accepted password for root from 192.168.1.1 port 5678 ssh2", false},
		{"RFC3164_SSH_Fail", "<37>Oct 11 22:15:10 host sshd[123]: Failed password for invalid user admin from 10.0.0.5 port 1234 ssh2", false},
		{"RFC3164_Kernel_Boot", "<0>Oct 11 22:00:01 localhost kernel: [0.000000] Linux version 5.15.0-generic", false},
		{"RFC3164_Cron", "<78>Oct 11 22:17:01 host CRON[456]: (root) CMD (   cd / && run-parts --report /etc/cron.hourly)", false},
		{"RFC3164_Sudo", "<38>Oct 11 22:18:12 host sudo: pam_unix(sudo:session): session opened for user root by admin(uid=0)", false},
		{"RFC3164_Auth_Error", "<35>Oct 11 22:19:05 host auth: login: PAM failure, access denied", false},
		{"RFC3164_USB_Insert", "<6>Oct 11 22:20:00 host kernel: [1234.56] usb 1-1: new high-speed USB device number 2 using xhci_hcd", false},
		{"RFC3164_Nginx_Start", "<30>Oct 11 22:21:10 host nginx: starting nginx/1.18.0", false},
		{"RFC3164_Systemd_Notify", "<30>Oct 11 22:22:01 host systemd[1]: Started Periodic Background Migration Service.", false},
		{"RFC3164_Ghost_Login", "<34>Oct 11 22:23:15 host login[999]: pam_unix(login:session): session opened for user guest by (uid=0)", false},

		// RFC5424 - Real Samples
		{"RFC5424_Standard", "<34>1 2023-10-11T22:14:15.000Z host app - - - Message", false},
		{"RFC5424_With_PID", "<165>1 2023-10-11T22:14:15.000Z mymachine.example.com evntslog 1024 ID47 [exampleSDID@32473 iut=\"3\" eventSource=\"Application\" eventID=\"1011\"] BOMAn application event log entry...", false},
		{"RFC5424_Cisco_Nexus", "<189>1 2023-10-11T22:16:01.123Z nexus01 %ETHPORT-5-IF_UP: Interface Ethernet1/1 is up", false},
		{"RFC5424_Docker", "<30>1 2023-10-11T22:17:10.555Z docker-host container-v1 2234 - - Connection received from 172.17.0.5", false},
		{"RFC5424_Nginx_Edge", "<190>1 2023-10-11T22:18:05.111Z reverse-proxy nginx - - [audit@123 status=\"200\"] GET /api/v1/health HTTP/1.1", false},
		{"RFC5424_K8s_API", "<134>1 2023-10-11T22:19:00.000Z k8s-master kube-apiserver - - - User system:serviceaccount:default:deployer authorized", false},
		{"RFC5424_Postgres", "<131>1 2023-10-11T22:20:15.888Z db-srv postgres 5567 - - FATAL:  password authentication failed for user \"monitor\"", false},
		{"RFC5424_Redis", "<134>1 2023-10-11T22:21:30.000Z cache-srv redis - - - Accepted connection 127.0.0.1:45672", false},
		{"RFC5424_Gitlab", "<30>1 2023-10-11T22:22:45.000Z git-srv gitlab-workhorse - - - 200 GET /user/repo.git", false},
		{"RFC5424_Systemd_Core", "<30>1 2023-10-11T22:23:59.999Z node-01 systemd 1 - - Reached target Multi-User System.", false},

		// Edge Cases
		{"Edge_Empty_Message", "<34>Oct 11 22:14:15 host tag: ", false},
		{"Edge_No_Space_Tag", "<34>Oct 11 22:14:15 host tag:message", false},
		{"Edge_Long_Host", "<34>Oct 11 22:14:15 very-long-hostname-that-might-break-regex.internal.corp tag: msg", false},
		{"Edge_Strange_Chars", "<34>Oct 11 22:14:15 host tag: msg with symbols !@#$%^&*()_+", false},
		{"Edge_Max_PRI", "<191>Oct 11 22:14:15 host tag: max pri", false},
		{"Edge_Zero_PRI", "<0>Oct 11 22:14:15 host tag: zero pri", false},
		{"Edge_Min_Time", "<34>Jan  1 00:00:00 host tag: new year", false},
		{"Edge_Leap_Year_Attempt", "<34>Feb 29 12:00:00 host tag: leap day", false},
		{"Edge_IPv6_Host", "<34>Oct 11 22:14:15 [2001:db8::1] tag: ipv6 source", false},
		{"Edge_No_Tag_Content", "<34>Oct 11 22:14:15 host : message with empty tag", false},

		// Multiversion / Variants
		{"Variant_Ubuntu_22", "<30>Oct 11 22:30:01 ubuntu-22 systemd[1]: Session 1.1 of user root opened.", false},
		{"Variant_CentOS_7", "<34>Oct 11 22:31:15 centos-7 rsyslogd: [origin software=\"rsyslogd\" swVersion=\"8.24.0\"] restart", false},
		{"Variant_Debian_11", "<34>Oct 11 22:32:05 debian-11 sshd[445]: Disconnected from authenticating user root 1.1.1.1 port 123 [preauth]", false},
		{"Variant_FreeBSD", "<34>Oct 11 22:33:45 freebsd newsyslog[123]: logfile turned over", false},
		{"Variant_Alpine", "<30>Oct 11 22:34:22 alpine crond[55]: USER root pid 56 cmd run-parts /etc/periodic/15min", false},
		{"Variant_Solaris", "<34>Oct 11 22:35:10 solaris-host genunix: [ID 123456 kern.notice] /proc/1234 terminated", false},
		{"Variant_RHEL_9", "<30>Oct 11 22:36:01 rhel-9 systemd[1]: Starting Update info about binary formats...", false},
		{"Variant_BusyBox", "<34>Oct 11 22:37:12 busybox init: starting pid 123, tty '': '/etc/init.d/rcS'", false},
		{"Variant_Cisco_IOS", "<189>Oct 11 22:38:05 cisco-switch 123: %LINEPROTO-5-UPDOWN: Line protocol on Interface FastEthernet0/1, changed state to up", false},
		{"Variant_Generic_Device", "<13>Oct 11 22:39:44 unknown-dev device_id=445 action=block", false},

		// Adversarial
		{"Adversarial_XSS", "<34>Oct 11 22:14:15 host tag: <script>alert(1)</script>", false},
		{"Adversarial_SQLI", "<34>Oct 11 22:14:15 host tag: ' OR 1=1 --", false},
		{"Adversarial_Path_Traversal", "<34>Oct 11 22:14:15 host tag: ../../../etc/passwd", false},
		{"Adversarial_Null_Byte", "<34>Oct 11 22:14:15 host tag: message\x00hidden", false},
		{"Adversarial_Long_Message", "<34>Oct 11 22:14:15 host tag: " + string(make([]byte, 1024)), false},
		{"Adversarial_CRLF_Injection", "<34>Oct 11 22:14:15 host tag: line1\r\nline2", false},
		{"Adversarial_Format_String", "<34>Oct 11 22:14:15 host tag: %s%s%s%s%s", false},
		{"Adversarial_Command_Injection", "<34>Oct 11 22:14:15 host tag: ; rm -rf /", false},
		{"Adversarial_Heavy_Escape", "<34>Oct 11 22:14:15 host tag: \\\"}\\\\'; drop table logs; --", false},
		{"Adversarial_Unicode_Flood", "<34>Oct 11 22:14:15 host tag: ☠️🔥🚨🛑🧨💣", false},

		// Errors
		{"Error_No_Header", "This is just a random string", true},
		{"Error_No_Time", "<34> host tag: message", true},
		{"Error_Bad_PRI", "<not-a-number>Oct 11 22:14:15 host tag: msg", true},
		{"Error_Incomplete", "<34>Oct 11", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := p.Parse(tt.raw)
			if (err != nil) != tt.wantErr {
				t.Errorf("SyslogParser.Parse() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestSyslogParser_CanParse(t *testing.T) {
	p := New()
	if !p.CanParse("<34>Oct 11...") {
		t.Error("CanParse failed for valid syslog header")
	}
	if p.CanParse("invalid") {
		t.Error("CanParse passed for invalid syslog header")
	}
}
