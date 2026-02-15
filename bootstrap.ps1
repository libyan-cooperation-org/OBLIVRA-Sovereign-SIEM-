#!/usr/bin/env pwsh
# bootstrap.ps1 — Run once to download dependencies and verify the build.
# Requires: Go 1.21+, CGO enabled (gcc or MSVC), Wails CLI

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "==> Downloading Go modules..." -ForegroundColor Cyan
go mod tidy

Write-Host "==> Verifying module checksums..." -ForegroundColor Cyan
go mod verify

Write-Host "==> Running storage unit tests..." -ForegroundColor Cyan
go test ./internal/storage/... -v -count=1 -timeout 60s

Write-Host "==> Running parser tests..." -ForegroundColor Cyan
go test ./pkg/parsers/... -v -count=1 -timeout 60s

Write-Host "==> Building backend (no Wails window)..." -ForegroundColor Cyan
go build ./...

Write-Host ""
Write-Host "==> All checks passed. Run 'wails dev' to launch the full app." -ForegroundColor Green
