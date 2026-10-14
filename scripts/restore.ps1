# ============================================================================
# ORBITWATCH Database Restore Script (PowerShell / Windows)
# ============================================================================

param (
    [string]$BackupFile
)

$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

if (-not $BackupFile) {
    # Default to latest .sql or snapshot
    $BackupDir = Join-Path $PSScriptRoot "snapshots"
    $latest = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest) {
        $BackupFile = $latest.FullName
    }
}

if ($BackupFile -and (Test-Path $BackupFile) -and (Test-Path $mysql)) {
    Write-Host "Restoring database from $BackupFile..."
    Get-Content $BackupFile -Raw | & $mysql -u root -p"Arihant@006"
    Write-Host "✓ Database restore completed successfully."
} else {
    Write-Host "Triggering Node JSON snapshot importer..."
    npm run snapshot:import
}
