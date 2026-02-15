package forensics

import (
	"fmt"
	"sort"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// TimelineEntry represents a single step in the attack chain.
type TimelineEntry struct {
	Timestamp string `json:"timestamp"`
	Action    string `json:"action"`
	Host      string `json:"host"`
	Details   string `json:"details"`
}

// TimelineBuilder reconstructs the sequence of events during an incident.
type TimelineBuilder struct{}

func NewTimelineBuilder() *TimelineBuilder {
	return &TimelineBuilder{}
}

// Build creates a human-readable timeline from raw events.
func (tb *TimelineBuilder) Build(events []*models.Event) []TimelineEntry {
	// Sort by timestamp
	sort.Slice(events, func(i, j int) bool {
		return events[i].Timestamp.Before(events[j].Timestamp)
	})

	timeline := []TimelineEntry{}
	for _, e := range events {
		entry := TimelineEntry{
			Timestamp: e.Timestamp.Format("2006-01-02 15:04:05"),
			Host:      e.Host,
		}

		switch e.Category {
		case "Process_Create":
			entry.Action = "Process Execution"
			entry.Details = fmt.Sprintf("Process %s started by %s", e.Fields["process"], e.Fields["parent_process"])
		case "File_Modify":
			entry.Action = "File Modification"
			entry.Details = fmt.Sprintf("File %s was modified", e.Fields["path"])
		case "Network_Connect":
			entry.Action = "Network Connection"
			entry.Details = fmt.Sprintf("Connected to %s:%v", e.Fields["dest_ip"], e.Fields["dest_port"])
		default:
			entry.Action = e.Category
			entry.Details = e.Message
		}

		timeline = append(timeline, entry)
	}

	return timeline
}
