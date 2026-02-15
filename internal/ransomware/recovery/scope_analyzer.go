package recovery

import (
	"log"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// ScopeAnalyzer determines the extent of data damage.
type ScopeAnalyzer struct{}

func NewScopeAnalyzer() *ScopeAnalyzer {
	return &ScopeAnalyzer{}
}

// IdentifyAffectedFiles returns a list of files that were likely encrypted or modified.
func (sa *ScopeAnalyzer) IdentifyAffectedFiles(events []*models.Event) []string {
	log.Println("[RDS-RECOVERY] Analyzing incident scope to identify affected files...")

	affectedFiles := make(map[string]bool)
	for _, e := range events {
		if e.Category == "File_Modify" || e.Category == "File_Write" || e.Category == "File_Delete" {
			if path, ok := e.Fields["path"].(string); ok {
				affectedFiles[path] = true
			}
		}
	}

	fileList := []string{}
	for path := range affectedFiles {
		fileList = append(fileList, path)
	}

	return fileList
}
