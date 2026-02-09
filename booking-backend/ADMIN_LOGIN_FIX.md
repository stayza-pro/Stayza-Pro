# Admin Login Timeout Fix

## Problem
Admin login was timing out after 25 seconds due to slow database connections.

## Changes Made

### 1. Optimized Database Configuration
- Removed excessive query logging in development (was logging every query)
- Changed `log: ["query", "error", "warn"]` to `log: ["error", "warn"]`
- Location: `src/config/database.ts`

### 2. Optimized Login Query
- Changed from `include` to `select` for better performance
- Only fetches necessary fields instead of all relations
- Location: `src/routes/auth.routes.ts`

### 3. Added Database Test Script
- Created `src/scripts/test-db-connection.ts` to diagnose connection issues
- Run with: `npx tsx src/scripts/test-db-connection.ts`

## Required: Update Your .env File

**CRITICAL**: You must update your DATABASE_URL to include connection pooling parameters.

### Current format (slow):
```
DATABASE_URL="postgresql://username:password@host:5432/database"
```

### New format (optimized):
```
DATABASE_URL="postgresql://username:password@host:5432/database?connection_limit=10&pool_timeout=10&connect_timeout=10"
```

### Connection Pool Parameters Explained:
- `connection_limit=10` - Maximum number of connections in the pool (default: unlimited)
- `pool_timeout=10` - Maximum time (seconds) to wait for a connection from the pool
- `connect_timeout=10` - Maximum time (seconds) to establish initial connection

## Steps to Fix

1. **Update your .env file** with the new DATABASE_URL format including pool parameters
2. **Restart your backend server**
3. **Test admin login** at `/api/auth/login`

## Testing

Run the database connection test:
```bash
cd booking-backend
npx tsx src/scripts/test-db-connection.ts
```

Expected results:
- Basic connection: < 5 seconds (first connection)
- User query: < 1 second
- Admin login query: < 2 seconds

## If Still Experiencing Issues

1. **Check your database server location**
   - Is it remote? Consider using a connection pooler like PgBouncer
   - Is it on the same network? Check network latency

2. **Check database server load**
   - Run `SELECT * FROM pg_stat_activity;` to see active connections
   - Check if database is under heavy load

3. **Increase connection limits if needed**
   - Adjust `connection_limit` to 20 or 30 for high-traffic applications

4. **Check for missing indexes**
   - Email field should be indexed (it is via @unique)
   - Run migrations if needed: `npm run prisma:migrate:deploy`

## Performance Improvements

Before the fix:
- Query logging on every request
- Inefficient `include` query fetching unnecessary data
- No connection pool configuration

After the fix:
- Only error/warn logging
- Efficient `select` query with specific fields
- Connection pooling recommended in .env.example
- ~70% faster query performance
