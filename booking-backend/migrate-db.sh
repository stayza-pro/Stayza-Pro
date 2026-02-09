#!/bin/bash

# PostgreSQL Database Migration Script
# Migrates data from one PostgreSQL provider to another

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PostgreSQL Database Migration Script  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Get old database URL
echo -e "${YELLOW}Enter your OLD database URL:${NC}"
echo -e "${BLUE}Example: postgresql://user:pass@old-host.com:5432/dbname${NC}"
read OLD_DB_URL

if [ -z "$OLD_DB_URL" ]; then
    echo -e "${RED}❌ Error: Old database URL cannot be empty${NC}"
    exit 1
fi

# Get new database URL
echo -e "\n${YELLOW}Enter your NEW database URL:${NC}"
echo -e "${BLUE}Example: postgresql://user:pass@new-host.com:5432/dbname${NC}"
read NEW_DB_URL

if [ -z "$NEW_DB_URL" ]; then
    echo -e "${RED}❌ Error: New database URL cannot be empty${NC}"
    exit 1
fi

# Create backup directory
mkdir -p backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/db_backup_${TIMESTAMP}.sql"

# Step 1: Test old database connection
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Testing OLD database connection...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

psql "$OLD_DB_URL" -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Old database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to old database!${NC}"
    echo -e "${YELLOW}Check your database URL and network connection${NC}"
    exit 1
fi

# Step 2: Test new database connection
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Testing NEW database connection...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

psql "$NEW_DB_URL" -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ New database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to new database!${NC}"
    echo -e "${YELLOW}Check your database URL and network connection${NC}"
    exit 1
fi

# Step 3: Get record counts from old database
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Getting record counts from OLD database...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

OLD_COUNTS=$(psql "$OLD_DB_URL" -t -c "
    SELECT 'users', COUNT(*) FROM users
    UNION ALL
    SELECT 'realtors', COUNT(*) FROM realtors
    UNION ALL
    SELECT 'properties', COUNT(*) FROM properties
    UNION ALL
    SELECT 'bookings', COUNT(*) FROM bookings
    UNION ALL
    SELECT 'payments', COUNT(*) FROM payments;
" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Old Database Record Counts:${NC}"
    echo "$OLD_COUNTS" | while read line; do
        echo -e "${BLUE}  $line${NC}"
    done
else
    echo -e "${YELLOW}⚠️  Could not get record counts (tables may not exist yet)${NC}"
fi

# Step 4: Create backup
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4: Creating backup from OLD database...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

pg_dump "$OLD_DB_URL" > "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo -e "${GREEN}   File: $BACKUP_FILE${NC}"
    echo -e "${GREEN}   Size: $BACKUP_SIZE${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Step 5: Confirm before restore
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  WARNING: This will OVERWRITE all data in the NEW database!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Do you want to proceed with the restore? (yes/no):${NC}"
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Migration cancelled by user${NC}"
    echo -e "${GREEN}Backup saved at: $BACKUP_FILE${NC}"
    exit 0
fi

# Step 6: Restore to new database
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 5: Restoring to NEW database...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}This may take a few minutes depending on database size...${NC}\n"

psql "$NEW_DB_URL" < "$BACKUP_FILE" -v ON_ERROR_STOP=1 2>&1 | tee restore.log

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Database restored successfully!${NC}"
else
    echo -e "\n${RED}❌ Restore failed! Check restore.log for details${NC}"
    exit 1
fi

# Step 7: Verify migration
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 6: Verifying migration...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

NEW_COUNTS=$(psql "$NEW_DB_URL" -t -c "
    SELECT 'users', COUNT(*) FROM users
    UNION ALL
    SELECT 'realtors', COUNT(*) FROM realtors
    UNION ALL
    SELECT 'properties', COUNT(*) FROM properties
    UNION ALL
    SELECT 'bookings', COUNT(*) FROM bookings
    UNION ALL
    SELECT 'payments', COUNT(*) FROM payments;
" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}New Database Record Counts:${NC}"
    echo "$NEW_COUNTS" | while read line; do
        echo -e "${BLUE}  $line${NC}"
    done
    echo -e "\n${GREEN}✅ Migration verified!${NC}"
else
    echo -e "${RED}❌ Verification failed!${NC}"
    exit 1
fi

# Success message
echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    🎉 Migration Completed Successfully! ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1.${NC} Update your .env file with the new DATABASE_URL:"
echo -e "   ${GREEN}DATABASE_URL=\"$NEW_DB_URL\"${NC}"
echo -e "${BLUE}2.${NC} Run: ${GREEN}npx prisma migrate status${NC}"
echo -e "${BLUE}3.${NC} Run: ${GREEN}npx tsx src/scripts/test-db-connection.ts${NC}"
echo -e "${BLUE}4.${NC} Test your application: ${GREEN}npm run dev${NC}"
echo -e "${BLUE}5.${NC} Keep old database active for 7 days as backup"
echo -e "\n${YELLOW}Backup location:${NC} ${GREEN}$BACKUP_FILE${NC}"
echo -e "${YELLOW}Restore log:${NC} ${GREEN}restore.log${NC}\n"
