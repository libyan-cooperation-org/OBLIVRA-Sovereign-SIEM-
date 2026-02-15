package detection

import (
	"math"
)

// CalculateEntropy computes the Shannon entropy of a byte slice.
// Returns a value between 0 and 8. Encryption usually results in >7.5.
func CalculateEntropy(data []byte) float64 {
	if len(data) == 0 {
		return 0
	}

	frequencies := make(map[byte]float64)
	for _, b := range data {
		frequencies[b]++
	}

	var entropy float64
	length := float64(len(data))
	for _, count := range frequencies {
		p := count / length
		entropy -= p * math.Log2(p)
	}

	return entropy
}
