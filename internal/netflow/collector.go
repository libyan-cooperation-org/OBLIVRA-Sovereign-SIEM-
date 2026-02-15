package netflow

import (
	"context"
	"encoding/binary"
	"fmt"
	"log"
	"net"
	"sort"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// IngestFunc is the callback to send parsed events to the pipeline.
type IngestFunc func(ctx context.Context, ev *models.Event) error

// flowRecord is a lightweight in-memory record for stats.
type flowRecord struct {
	SrcIP   string
	DstIP   string
	SrcPort uint16
	DstPort uint16
	Proto   uint8
	Bytes   uint64
	Packets uint64
	SeenAt  time.Time
}

// Collector listens for Netflow v5 UDP packets and tracks stats.
type Collector struct {
	port   int
	ingest IngestFunc

	// Counters
	totalFlows  atomic.Int64
	bytesIn     atomic.Int64
	bytesOut    atomic.Int64

	// Ring buffer for top-talker queries (last 1000 flows)
	mu      sync.Mutex
	recent  []*flowRecord
	ringCap int
}

func NewCollector(port int, ingest IngestFunc) *Collector {
	return &Collector{
		port:    port,
		ingest:  ingest,
		ringCap: 1000,
	}
}

// Start opens the UDP listener and begins processing packets.
func (c *Collector) Start(ctx context.Context) error {
	addr := net.UDPAddr{
		Port: c.port,
		IP:   net.ParseIP("0.0.0.0"),
	}

	conn, err := net.ListenUDP("udp", &addr)
	if err != nil {
		return fmt.Errorf("netflow: failed to listen: %w", err)
	}

	log.Printf("Netflow Collector listening on UDP %d", c.port)

	go func() {
		defer conn.Close()
		buf := make([]byte, 4096)

		for {
			select {
			case <-ctx.Done():
				return
			default:
				conn.SetReadDeadline(time.Now().Add(1 * time.Second))
				n, remoteAddr, err := conn.ReadFromUDP(buf)
				if err != nil {
					continue
				}
				c.handlePacket(ctx, buf[:n], remoteAddr.IP.String())
			}
		}
	}()

	return nil
}

// handlePacket parses a Netflow v5 packet.
func (c *Collector) handlePacket(ctx context.Context, data []byte, sourceHost string) {
	if len(data) < 24 {
		return
	}

	version := binary.BigEndian.Uint16(data[0:2])
	if version != 5 {
		return
	}

	count := binary.BigEndian.Uint16(data[2:4])

	for i := 0; i < int(count); i++ {
		offset := 24 + (i * 48)
		if offset+48 > len(data) {
			break
		}

		record := data[offset : offset+48]
		srcIP := net.IP(record[0:4]).String()
		dstIP := net.IP(record[4:8]).String()
		srcPort := binary.BigEndian.Uint16(record[32:34])
		dstPort := binary.BigEndian.Uint16(record[34:36])
		proto := record[38]
		bytes := uint64(binary.BigEndian.Uint32(record[20:24]))
		packets := uint64(binary.BigEndian.Uint32(record[16:20]))

		// Update counters
		c.totalFlows.Add(1)
		srcIsPrivate := isPrivateIP(srcIP)
		dstIsPrivate := isPrivateIP(dstIP)
		if srcIsPrivate && !dstIsPrivate {
			c.bytesOut.Add(int64(bytes))
		} else if !srcIsPrivate && dstIsPrivate {
			c.bytesIn.Add(int64(bytes))
		}

		// Append to ring buffer
		c.mu.Lock()
		c.recent = append(c.recent, &flowRecord{
			SrcIP: srcIP, DstIP: dstIP,
			SrcPort: srcPort, DstPort: dstPort,
			Proto: proto, Bytes: bytes, Packets: packets,
			SeenAt: time.Now(),
		})
		if len(c.recent) > c.ringCap {
			c.recent = c.recent[len(c.recent)-c.ringCap:]
		}
		c.mu.Unlock()

		ev := &models.Event{
			ID:        uuid.NewString(),
			Timestamp: time.Now(),
			Source:    "netflow",
			Host:      sourceHost,
			Severity:  models.SeverityInfo,
			Category:  "network",
			Message:   fmt.Sprintf("Flow: %s:%d -> %s:%d (Proto: %d)", srcIP, srcPort, dstIP, dstPort, proto),
			Fields: map[string]interface{}{
				"src_ip":   srcIP,
				"dst_ip":   dstIP,
				"src_port": srcPort,
				"dst_port": dstPort,
				"proto":    proto,
				"bytes":    bytes,
				"packets":  packets,
			},
		}

		_ = c.ingest(ctx, ev)
	}
}

// Stats returns high-level counters for the dashboard.
func (c *Collector) Stats() map[string]interface{} {
	c.mu.Lock()
	activeFlows := len(c.recent)
	// Count unique external IPs in ring
	extIPs := make(map[string]struct{})
	for _, f := range c.recent {
		if !isPrivateIP(f.DstIP) {
			extIPs[f.DstIP] = struct{}{}
		}
		if !isPrivateIP(f.SrcIP) {
			extIPs[f.SrcIP] = struct{}{}
		}
	}
	c.mu.Unlock()

	return map[string]interface{}{
		"total_flows":  c.totalFlows.Load(),
		"bytes_in":     c.bytesIn.Load(),
		"bytes_out":    c.bytesOut.Load(),
		"active_flows": activeFlows,
		"external_ips": len(extIPs),
	}
}

// TopTalkers returns the top N flows by byte volume from the ring buffer.
func (c *Collector) TopTalkers(limit int) []map[string]interface{} {
	c.mu.Lock()
	// Aggregate by src+dst pair
	type key struct{ src, dst string }
	agg := make(map[key]*flowRecord)
	for _, f := range c.recent {
		k := key{f.SrcIP, f.DstIP}
		if existing, ok := agg[k]; ok {
			existing.Bytes += f.Bytes
			existing.Packets += f.Packets
		} else {
			cp := *f
			agg[k] = &cp
		}
	}
	c.mu.Unlock()

	// Sort by bytes desc
	var sorted []*flowRecord
	for _, v := range agg {
		sorted = append(sorted, v)
	}
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Bytes > sorted[j].Bytes })

	if limit > len(sorted) {
		limit = len(sorted)
	}

	result := make([]map[string]interface{}, 0, limit)
	for _, f := range sorted[:limit] {
		protoName := protoName(f.Proto)
		result = append(result, map[string]interface{}{
			"src_ip":   f.SrcIP,
			"dst_ip":   f.DstIP,
			"src_port": f.SrcPort,
			"dst_port": f.DstPort,
			"protocol": protoName,
			"bytes":    f.Bytes,
			"packets":  f.Packets,
		})
	}
	return result
}

func isPrivateIP(ip string) bool {
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return false
	}
	private := []string{"10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8"}
	for _, cidr := range private {
		_, network, _ := net.ParseCIDR(cidr)
		if network.Contains(parsed) {
			return true
		}
	}
	return false
}

func protoName(proto uint8) string {
	switch proto {
	case 6:
		return "TCP"
	case 17:
		return "UDP"
	case 1:
		return "ICMP"
	case 89:
		return "OSPF"
	default:
		return fmt.Sprintf("PROTO-%d", proto)
	}
}
