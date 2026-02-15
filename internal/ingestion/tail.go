package ingestion

import (
	"bufio"
	"context"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// WatchFile monitors a file for new lines.
func (m *Manager) WatchFile(ctx context.Context, path string) error {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	m.wg.Add(1)
	go m.tailFile(ctx, absPath)

	log.Printf("Forensics: Watching file %s", absPath)
	return nil
}

func (m *Manager) tailFile(ctx context.Context, path string) {
	defer m.wg.Done()

	var offset int64
	// Start at end of file
	if f, err := os.Open(path); err == nil {
		if info, err := f.Stat(); err == nil {
			offset = info.Size()
		}
		f.Close()
	}

	for {
		select {
		case <-ctx.Done():
			return
		default:
			f, err := os.Open(path)
			if err != nil {
				time.Sleep(1 * time.Second)
				continue
			}

			info, err := f.Stat()
			if err != nil {
				f.Close()
				time.Sleep(1 * time.Second)
				continue
			}

			if info.Size() < offset {
				// File truncated
				offset = 0
			}

			if info.Size() > offset {
				f.Seek(offset, io.SeekStart)
				scanner := bufio.NewScanner(f)
				for scanner.Scan() {
					line := scanner.Text()
					if line == "" {
						continue
					}

					ev := &models.Event{
						ID:        uuid.NewString(),
						Timestamp: time.Now(),
						Source:    "file",
						Host:      "localhost",
						Category:  filepath.Base(path),
						Severity:  models.SeverityInfo,
						Message:   line,
						Raw:       line,
					}
					m.Ingest(ev)
				}
				offset, _ = f.Seek(0, io.SeekCurrent)
			}

			f.Close()
			time.Sleep(500 * time.Millisecond) // Poll interval
		}
	}
}
