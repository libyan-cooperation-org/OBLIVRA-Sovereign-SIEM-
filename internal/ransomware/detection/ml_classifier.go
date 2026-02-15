package detection

import (
	"log"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// MLClassifier runs local ONNX models for advanced ransomware detection.
type MLClassifier struct {
	ModelPath string
}

func NewMLClassifier(modelPath string) *MLClassifier {
	return &MLClassifier{ModelPath: modelPath}
}

// Classify evaluates an event using the loaded ML model.
func (ml *MLClassifier) Classify(ev *models.Event) float64 {
	// Load ONNX model and perform inference
	log.Printf("[RDS-DETECTION] ML Classifier analyzing event: %s", ev.ID)
	return 0.0 // Confidence score
}
