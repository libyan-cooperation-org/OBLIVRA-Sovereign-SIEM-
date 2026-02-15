package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/app"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/auth"
)

type Router struct {
	app *app.App
	mw  *auth.Middleware
}

func NewRouter(a *app.App, mw *auth.Middleware) *Router {
	return &Router{app: a, mw: mw}
}

func (api *Router) Register(mux *http.ServeMux) {
	mux.Handle("/api/v1/stats", api.mw.RequireAuth(http.HandlerFunc(api.handleStats)))
	mux.Handle("/api/v1/search", api.mw.RequireAuth(api.mw.RequirePermission("logs:search", http.HandlerFunc(api.handleSearch))))
	mux.Handle("/api/v1/cases", api.mw.RequireAuth(api.mw.RequirePermission("cases:read", http.HandlerFunc(api.handleCases))))
	mux.Handle("/api/v1/alerts", api.mw.RequireAuth(api.mw.RequirePermission("alerts:read", http.HandlerFunc(api.handleAlerts))))
	mux.Handle("/api/v1/compliance", api.mw.RequireAuth(api.mw.RequirePermission("rules:read", http.HandlerFunc(api.handleCompliance))))
	mux.Handle("/api/v1/hunting/saved", api.mw.RequireAuth(api.mw.RequirePermission("logs:search", http.HandlerFunc(api.handleHuntingList))))
	mux.Handle("/api/v1/graph", api.mw.RequireAuth(api.mw.RequirePermission("alerts:read", http.HandlerFunc(api.handleGraph))))
}

func (api *Router) handleHuntingList(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		searches, err := api.app.ListSavedSearches()
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, searches)
	case http.MethodPost:
		var req struct {
			Name  string `json:"name"`
			Query string `json:"query"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "Invalid request body")
			return
		}
		s, err := api.app.SaveSearch(req.Name, req.Query)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusCreated, s)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (api *Router) handleGraph(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	alertID := r.URL.Query().Get("alert_id")
	g, err := api.app.GetAlertGraph(alertID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, g)
}

func (api *Router) handleCompliance(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	coverage, err := api.app.GetComplianceCoverage()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, coverage)
}

func (api *Router) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	counts, err := api.app.GetAlertCounts()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, counts)
}

func (api *Router) handleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query().Get("q")
	// Using defaults for other filters in the REST API for now
	severity := r.URL.Query().Get("severity")
	source := r.URL.Query().Get("source")
	host := r.URL.Query().Get("host")

	results, err := api.app.SearchEvents(query, source, host, severity, 0, 0, 100)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, results)
}

func (api *Router) handleCases(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		status := r.URL.Query().Get("status")
		cases, err := api.app.ListCases(status, 100)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, cases)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (api *Router) handleAlerts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		limit := 100
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil {
				limit = parsed
			}
		}
		alerts, err := api.app.ListAlerts("", "", limit)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, alerts)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func respondJSON(w http.ResponseWriter, code int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, code int, message string) {
	respondJSON(w, code, map[string]string{"error": message})
}
