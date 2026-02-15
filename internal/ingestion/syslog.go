package ingestion

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// StartSyslogServer starts a Syslog server listening on the configured port.
func (m *Manager) StartSyslogServer() error {
	addr := fmt.Sprintf(":%d", m.cfg.SyslogPort)

	// UDP Listener
	udpAddr, err := net.ResolveUDPAddr("udp", addr)
	if err != nil {
		return err
	}
	udpConn, err := net.ListenUDP("udp", udpAddr)
	if err != nil {
		return err
	}

	m.wg.Add(1)
	go m.serveUDP(udpConn)

	// TCP Listener
	tcpListener, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}

	m.wg.Add(1)
	go m.serveTCP(tcpListener)

	log.Printf("Syslog server listening on UDP/TCP %s", addr)
	return nil
}

func (m *Manager) serveUDP(conn *net.UDPConn) {
	defer m.wg.Done()
	defer conn.Close()
	buf := make([]byte, 65535)

	for {
		select {
		case <-m.bgCtx.Done():
			return
		default:
			conn.SetReadDeadline(time.Now().Add(1 * time.Second))
			n, remoteAddr, err := conn.ReadFromUDP(buf)
			if err != nil {
				if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
					continue
				}
				log.Printf("UDP read error: %v", err)
				return
			}

			m.processRaw(string(buf[:n]), remoteAddr.IP.String())
		}
	}
}

func (m *Manager) serveTCP(listener net.Listener) {
	defer m.wg.Done()
	defer listener.Close()

	for {
		select {
		case <-m.bgCtx.Done():
			return
		default:
			conn, err := listener.Accept()
			if err != nil {
				log.Printf("TCP accept error: %v", err)
				continue
			}
			go m.handleTCPConn(conn)
		}
	}
}

func (m *Manager) handleTCPConn(conn net.Conn) {
	defer conn.Close()
	scanner := bufio.NewScanner(conn)
	remoteAddr := conn.RemoteAddr().(*net.TCPAddr)

	for scanner.Scan() {
		m.processRaw(scanner.Text(), remoteAddr.IP.String())
	}
}

func (m *Manager) processRaw(raw string, host string) {
	// Simple syslog parser (RFC3164/basic)
	// Example: <34>Oct 11 22:14:15 mymachine su: 'su root' failed for lonvick on /dev/pts/8

	msg := strings.TrimSpace(raw)
	if msg == "" {
		return
	}

	ev := &models.Event{
		ID:        uuid.NewString(),
		Timestamp: time.Now(),
		Source:    "syslog",
		Host:      host,
		Severity:  models.SeverityInfo, // Default
		Message:   msg,
		Raw:       raw,
	}

	// Basic priority parsing
	if strings.HasPrefix(msg, "<") {
		end := strings.Index(msg, ">")
		if end > 0 && end < 5 {
			// Extract priority and map to severity (omitted for brevity in this core setup)
			ev.Message = strings.TrimSpace(msg[end+1:])
		}
	}

	m.Ingest(ev)
}
