# Quick Test Database Setup
# Run this once before testing locally

Write-Host "Setting up test database..." -ForegroundColor Cyan

# UPDATE THIS PASSWORD to match your local PostgreSQL
$PG_PASSWORD = "your_postgres_password_here"

# Set password environment variable for psql
$env:PGPASSWORD = $PG_PASSWORD

# Create test database
Write-Host "Creating sourdough_test database..." -ForegroundColor Yellow
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS sourdough_test;" 2>$null
psql -h localhost -U postgres -c "CREATE DATABASE sourdough_test;"

Write-Host "✅ Database created!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Update backend\.env.test with your PostgreSQL password"
Write-Host "2. Run: cd backend"
Write-Host "3. Run: npx prisma migrate deploy"
Write-Host "4. Run: npm test"
