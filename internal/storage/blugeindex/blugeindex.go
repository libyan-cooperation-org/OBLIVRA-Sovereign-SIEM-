// Package blugeindex wraps the Bluge full-text search engine for OBLIVRA.
// It indexes the searchable fields of each Event and exposes a query API
// that returns matching event IDs (the full payloads live in BadgerDB).
package blugeindex

import (
	"context"
	"fmt"
	"time"

	"github.com/blugelabs/bluge"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

const defaultSearchLimit = 200

// Query holds the search parameters for a Bluge query.
// This is defined here (not in the parent storage package) to avoid
// circular imports.
type Query struct {
	Text      string // full-text search on the message field
	Source    string // exact keyword filter
	Host      string // exact keyword filter
	Severity  string // exact keyword filter
	StartTime int64  // unix nano lower bound (0 = no bound)
	EndTime   int64  // unix nano upper bound (0 = no bound)
	Limit     int    // max results (0 → defaultSearchLimit)
}

// Index wraps a Bluge writer/reader pair.
type Index struct {
	writer *bluge.Writer
}

// Open creates the on-disk Bluge index at path.
func Open(path string) (*Index, error) {
	cfg := bluge.DefaultConfig(path)
	w, err := bluge.OpenWriter(cfg)
	if err != nil {
		return nil, fmt.Errorf("blugeindex: open writer: %w", err)
	}
	return &Index{writer: w}, nil
}

// IndexEvent adds a single event's searchable fields to the index.
// Fields indexed:
//   - _id       (keyword) – document identifier
//   - message   (text)    – full-text search
//   - source    (keyword) – exact match filter
//   - host      (keyword) – exact match filter
//   - user      (keyword) – exact match filter
//   - severity  (keyword) – exact match filter
//   - category  (keyword) – exact match filter
//   - timestamp (date)    – range queries
func (idx *Index) IndexEvent(ev *models.Event) error {
	doc := bluge.NewDocument(ev.ID).
		AddField(bluge.NewTextField("message", ev.Message).StoreValue()).
		AddField(bluge.NewKeywordField("source", ev.Source).StoreValue()).
		AddField(bluge.NewKeywordField("host", ev.Host).StoreValue()).
		AddField(bluge.NewKeywordField("user", ev.User).StoreValue()).
		AddField(bluge.NewKeywordField("severity", string(ev.Severity)).StoreValue()).
		AddField(bluge.NewKeywordField("category", ev.Category).StoreValue()).
		AddField(bluge.NewDateTimeField("timestamp", ev.Timestamp).StoreValue())

	return idx.writer.Update(&customTermQuery{id: ev.ID, field: "_id"}, doc)
}

type customTermQuery struct {
	id    string
	field string
}

func (q *customTermQuery) Field() string { return q.field }
func (q *customTermQuery) Term() []byte  { return []byte(q.id) }

// IndexEventBatch indexes multiple events in one batch commit.
func (idx *Index) IndexEventBatch(events []*models.Event) error {
	batch := bluge.NewBatch()
	for _, ev := range events {
		doc := bluge.NewDocument(ev.ID).
			AddField(bluge.NewTextField("message", ev.Message).StoreValue()).
			AddField(bluge.NewKeywordField("source", ev.Source).StoreValue()).
			AddField(bluge.NewKeywordField("host", ev.Host).StoreValue()).
			AddField(bluge.NewKeywordField("user", ev.User).StoreValue()).
			AddField(bluge.NewKeywordField("severity", string(ev.Severity)).StoreValue()).
			AddField(bluge.NewKeywordField("category", ev.Category).StoreValue()).
			AddField(bluge.NewDateTimeField("timestamp", ev.Timestamp).StoreValue())
		batch.Update(&customTermQuery{id: ev.ID, field: "_id"}, doc)
	}
	return idx.writer.Batch(batch)
}

// Search executes a Query and returns the matching event IDs.
func (idx *Index) Search(q *Query) ([]string, error) {
	limit := q.Limit
	if limit <= 0 {
		limit = defaultSearchLimit
	}

	var clauses []bluge.Query

	if q.Text != "" {
		clauses = append(clauses, bluge.NewMatchQuery(q.Text).SetField("message"))
	}
	if q.Source != "" {
		clauses = append(clauses, bluge.NewTermQuery(q.Source).SetField("source"))
	}
	if q.Host != "" {
		clauses = append(clauses, bluge.NewTermQuery(q.Host).SetField("host"))
	}
	if q.Severity != "" {
		clauses = append(clauses, bluge.NewTermQuery(q.Severity).SetField("severity"))
	}
	if q.StartTime > 0 || q.EndTime > 0 {
		var start, end time.Time
		if q.StartTime > 0 {
			start = time.Unix(0, q.StartTime)
		}
		if q.EndTime > 0 {
			end = time.Unix(0, q.EndTime)
		} else {
			end = time.Now()
		}
		clauses = append(clauses, bluge.NewDateRangeQuery(start, end).SetField("timestamp"))
	}

	var finalQuery bluge.Query
	switch len(clauses) {
	case 0:
		finalQuery = bluge.NewMatchAllQuery()
	case 1:
		finalQuery = clauses[0]
	default:
		bq := bluge.NewBooleanQuery()
		for _, c := range clauses {
			bq.AddMust(c)
		}
		finalQuery = bq
	}

	reader, err := idx.writer.Reader()
	if err != nil {
		return nil, fmt.Errorf("blugeindex: open reader: %w", err)
	}
	defer reader.Close()

	req := bluge.NewTopNSearch(limit, finalQuery).
		SortBy([]string{"-timestamp"}).
		WithStandardAggregations()

	dmi, err := reader.Search(context.Background(), req)
	if err != nil {
		return nil, fmt.Errorf("blugeindex: search: %w", err)
	}

	var ids []string
	next, err := dmi.Next()
	for err == nil && next != nil {
		next.VisitStoredFields(func(field string, value []byte) bool {
			if field == "_id" {
				ids = append(ids, string(value))
			}
			return true
		})
		next, err = dmi.Next()
	}
	if err != nil {
		return nil, fmt.Errorf("blugeindex: iterate: %w", err)
	}

	return ids, nil
}

// DeleteEvent removes a document by event ID.
func (idx *Index) DeleteEvent(id string) error {
	return idx.writer.Delete(&customTermQuery{id: id, field: "_id"})
}

// Close commits pending writes and closes the writer.
func (idx *Index) Close() error {
	return idx.writer.Close()
}
