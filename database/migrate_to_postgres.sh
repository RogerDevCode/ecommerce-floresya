#!/bin/bash

# FloresYa Database Migration to PostgreSQL 17.5
# This script automates the migration from SQLite to PostgreSQL

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${POSTGRES_DB:-floresya}"
DB_USER="${POSTGRES_USER:-floresya_user}"
DB_PASSWORD="${POSTGRES_PASSWORD:-floresya_password}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

# File paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="${SCRIPT_DIR}/migration_postgres_schema.sql"
DATA_FILE="${SCRIPT_DIR}/migration_postgres_data.sql"

echo -e "${BLUE}🐘 FloresYa PostgreSQL Migration Tool${NC}"
echo "======================================"
echo ""

# Function to check if PostgreSQL is running
check_postgres() {
    echo -e "${YELLOW}🔍 Checking PostgreSQL connection...${NC}"
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; then
        echo -e "${RED}❌ Cannot connect to PostgreSQL server${NC}"
        echo "Please check that:"
        echo "  - PostgreSQL is running"
        echo "  - Host: $DB_HOST"
        echo "  - Port: $DB_PORT"
        echo "  - User: $DB_USER"
        echo "  - Password is correct"
        exit 1
    fi
    echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"
}

# Function to create database if it doesn't exist
create_database() {
    echo -e "${YELLOW}🏗️  Creating database '$DB_NAME'...${NC}"
    
    # Check if database exists
    DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
    
    if [ "$DB_EXISTS" = "1" ]; then
        echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
        read -p "Do you want to drop and recreate it? (y/N): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
            echo -e "${GREEN}✅ Database recreated${NC}"
        else
            echo -e "${BLUE}ℹ️  Using existing database${NC}"
        fi
    else
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
        echo -e "${GREEN}✅ Database '$DB_NAME' created${NC}"
    fi
}

# Function to run SQL file
run_sql_file() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}📄 $description...${NC}"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ File not found: $file${NC}"
        exit 1
    fi
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"; then
        echo -e "${GREEN}✅ $description completed${NC}"
    else
        echo -e "${RED}❌ Error executing $description${NC}"
        exit 1
    fi
}

# Function to verify migration
verify_migration() {
    echo -e "${YELLOW}🔍 Verifying migration...${NC}"
    
    # Count records in main tables
    local tables=("categories" "products" "users" "orders" "payments" "settings")
    
    for table in "${tables[@]}"; do
        local count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM $table;")
        echo -e "${BLUE}📊 $table: $count records${NC}"
    done
    
    echo -e "${GREEN}✅ Migration verification completed${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Configuration:${NC}"
    echo "  Database: $DB_NAME"
    echo "  Host: $DB_HOST:$DB_PORT"
    echo "  User: $DB_USER"
    echo ""
    
    check_postgres
    create_database
    run_sql_file "$SCHEMA_FILE" "Creating database schema"
    run_sql_file "$DATA_FILE" "Migrating data"
    verify_migration
    
    echo ""
    echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update your application configuration to use PostgreSQL"
    echo "2. Install pg module: npm install pg"
    echo "3. Update database connection string in your app"
    echo ""
    echo -e "${YELLOW}Connection string example:${NC}"
    echo "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
}

# Check for required files
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

if [ ! -f "$DATA_FILE" ]; then
    echo -e "${RED}❌ Data file not found: $DATA_FILE${NC}"
    exit 1
fi

# Run main function
main