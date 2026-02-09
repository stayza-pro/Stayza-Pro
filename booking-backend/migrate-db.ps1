# PostgreSQL Database Migration Script for Windows
# Migrates data from one PostgreSQL provider to another

param(
    [string]$OldDbUrl,
    [string]$NewDbUrl
)

# Colors for output
function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Cyan "╔════════════════════════════════════════╗"
Write-ColorOutput Cyan "║  PostgreSQL Database Migration Script  ║"
Write-ColorOutput Cyan "╚════════════════════════════════════════╝`n"

# Get old database URL if not provided
if (-not $OldDbUrl) {
    Write-ColorOutput Yellow "Enter your OLD database URL:"
    Write-ColorOutput Blue "Example: postgresql://user:pass@old-host.com:5432/dbname"
    $OldDbUrl = Read-Host
}

if (-not $OldDbUrl) {
    Write-ColorOutput Red "❌ Error: Old database URL cannot be empty"
    exit 1
}

# Get new database URL if not provided
if (-not $NewDbUrl) {
    Write-ColorOutput Yellow "`nEnter your NEW database URL:"
    Write-ColorOutput Blue "Example: postgresql://user:pass@new-host.com:5432/dbname"
    $NewDbUrl = Read-Host
}

if (-not $NewDbUrl) {
    Write-ColorOutput Red "❌ Error: New database URL cannot be empty"
    exit 1
}

# Create backup directory
$BackupDir = "backups"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\db_backup_$Timestamp.sql"

# Step 1: Test old database connection
Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "Step 1: Testing OLD database connection..."
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$null = psql "$OldDbUrl" -c "SELECT 1;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "✅ Old database connection successful"
} else {
    Write-ColorOutput Red "❌ Cannot connect to old database!"
    Write-ColorOutput Yellow "Check your database URL and network connection"
    Write-ColorOutput Yellow "`nMake sure PostgreSQL client is installed:"
    Write-ColorOutput Blue "  Download from: https://www.postgresql.org/download/windows/"
    Write-ColorOutput Blue "  Or install via chocolatey: choco install postgresql"
    exit 1
}

# Step 2: Test new database connection
Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "Step 2: Testing NEW database connection..."
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$null = psql "$NewDbUrl" -c "SELECT 1;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "✅ New database connection successful"
} else {
    Write-ColorOutput Red "❌ Cannot connect to new database!"
    Write-ColorOutput Yellow "Check your database URL and network connection"
    exit 1
}

# Step 3: Get record counts from old database
Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "Step 3: Getting record counts from OLD database..."
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$OldCounts = psql "$OldDbUrl" -t -c @"
    SELECT 'users', COUNT(*) FROM users
    UNION ALL
    SELECT 'realtors', COUNT(*) FROM realtors
    UNION ALL
    SELECT 'properties', COUNT(*) FROM properties
    UNION ALL
    SELECT 'bookings', COUNT(*) FROM bookings
    UNION ALL
    SELECT 'payments', COUNT(*) FROM payments;
"@ 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "Old Database Record Counts:"
    $OldCounts | ForEach-Object {
        Write-ColorOutput Blue "  $_"
    }
} else {
    Write-ColorOutput Yellow "⚠️  Could not get record counts (tables may not exist yet)"
}

# Step 4: Create backup
Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "Step 4: Creating backup from OLD database..."
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pg_dump "$OldDbUrl" | Out-File -FilePath $BackupFile -Encoding utf8

if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupFile)) {
    $BackupSize = (Get-Item $BackupFile).Length / 1MB
    Write-ColorOutput Green "✅ Backup created successfully!"
    Write-ColorOutput Green "   File: $BackupFile"
    Write-ColorOutput Green ("   Size: {0:N2} MB" -f $BackupSize)
} else {
    Write-ColorOutput Red "❌ Backup failed!"
    exit 1
}

# Step 5: Confirm before restore
Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Red "⚠️  WARNING: This will OVERWRITE all data in the NEW database!"
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "Do you want to proceed with the restore? (yes/no):"
$Confirm = Read-Host

if ($Confirm -ne "yes") {
    Write-ColorOutput Yellow "Migration cancelled by user"
    Write-ColorOutput Green "Backup saved at: $BackupFile"
    exit 0
}

# Step 6: Restore to new database
Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "Step 5: Restoring to NEW database..."
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Blue "This may take a few minutes depending on database size...`n"

Get-Content $BackupFile | psql "$NewDbUrl" -v ON_ERROR_STOP=1 2>&1 | Tee-Object -FilePath "restore.log"

if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "`n✅ Database restored successfully!"
} else {
    Write-ColorOutput Red "`n❌ Restore failed! Check restore.log for details"
    exit 1
}

# Step 7: Verify migration
Write-ColorOutput Yellow "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Yellow "Step 6: Verifying migration..."
Write-ColorOutput Yellow "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$NewCounts = psql "$NewDbUrl" -t -c @"
    SELECT 'users', COUNT(*) FROM users
    UNION ALL
    SELECT 'realtors', COUNT(*) FROM realtors
    UNION ALL
    SELECT 'properties', COUNT(*) FROM properties
    UNION ALL
    SELECT 'bookings', COUNT(*) FROM bookings
    UNION ALL
    SELECT 'payments', COUNT(*) FROM payments;
"@ 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "New Database Record Counts:"
    $NewCounts | ForEach-Object {
        Write-ColorOutput Blue "  $_"
    }
    Write-ColorOutput Green "`n✅ Migration verified!"
} else {
    Write-ColorOutput Red "❌ Verification failed!"
    exit 1
}

# Success message
Write-ColorOutput Green "`n╔════════════════════════════════════════╗"
Write-ColorOutput Green "║    🎉 Migration Completed Successfully! ║"
Write-ColorOutput Green "╚════════════════════════════════════════╝`n"

Write-ColorOutput Yellow "Next steps:"
Write-ColorOutput Blue "1." -NoNewline
Write-Output " Update your .env file with the new DATABASE_URL:"
Write-ColorOutput Green "   DATABASE_URL=`"$NewDbUrl`""
Write-ColorOutput Blue "2." -NoNewline
Write-Output " Run: " -NoNewline
Write-ColorOutput Green "npx prisma migrate status"
Write-ColorOutput Blue "3." -NoNewline
Write-Output " Run: " -NoNewline
Write-ColorOutput Green "npx tsx src/scripts/test-db-connection.ts"
Write-ColorOutput Blue "4." -NoNewline
Write-Output " Test your application: " -NoNewline
Write-ColorOutput Green "npm run dev"
Write-ColorOutput Blue "5." -NoNewline
Write-Output " Keep old database active for 7 days as backup"
Write-ColorOutput Yellow "`nBackup location:" -NoNewline
Write-ColorOutput Green " $BackupFile"
Write-ColorOutput Yellow "Restore log:" -NoNewline
Write-ColorOutput Green " restore.log`n"
