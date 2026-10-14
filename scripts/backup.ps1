# ============================================================================
# ORBITWATCH Database Backup Script (PowerShell / Windows)
# ============================================================================

$BackupDir = Join-Path $PSScriptRoot "snapshots"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path $BackupDir "orbitwatch_backup_$Timestamp.sql"

$mysqldump = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"

if (Test-Path $mysqldump) {
    Write-Host "Creating physical mysqldump backup to $OutputFile..."
    & $mysqldump -u root -p"Arihant@006" --routines --triggers --events --databases orbitwatch_db > $OutputFile
    Write-Host "✓ mysqldump backup completed successfully ($((Get-Item $OutputFile).Length / 1MB) MB)."
} else {
    Write-Host "mysqldump executable not found in default path, triggering Node JSON snapshot exporter..."
    npm run snapshot:export
}
