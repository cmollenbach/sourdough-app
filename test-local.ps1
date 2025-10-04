# Local Test Setup and Execution Script
# Run this to test the CI setup locally before pushing

Write-Host "🧪 Setting up local test environment..." -ForegroundColor Cyan

# Change to backend directory
Set-Location backend

# 1. Drop and recreate test database
Write-Host "`n📊 Setting up test database..." -ForegroundColor Yellow
$env:PGPASSWORD = "your_local_postgres_password"  # UPDATE THIS!

# Terminate connections
psql -h localhost -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'sourdough_test' AND pid <> pg_backend_pid();" 2>$null

# Drop and create
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS sourdough_test;" 
psql -h localhost -U postgres -c "CREATE DATABASE sourdough_test;"

Write-Host "✅ Test database created" -ForegroundColor Green

# 2. Set environment variable
$env:DATABASE_URL = "postgresql://postgres:your_local_postgres_password@localhost:5432/sourdough_test"  # UPDATE THIS!
$env:JWT_SECRET = "test-jwt-secret-key-for-testing-purposes"
$env:NODE_ENV = "test"

Write-Host "`n🔄 Running migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

Write-Host "`n🧪 Running tests..." -ForegroundColor Yellow
npm test

Write-Host "`n✅ Tests completed!" -ForegroundColor Green
Write-Host "`nℹ️  Check the output above for any failures" -ForegroundColor Cyan

# Return to root
Set-Location ..
