# Backend Tests Setup

## Running Tests Locally

Backend tests require a PostgreSQL test database. Follow these steps to set it up:

### Prerequisites

- PostgreSQL installed locally
- Access to a PostgreSQL superuser account

### Setup Instructions

#### Option 1: Use Postgres Superuser (Recommended)

1. **Set the postgres user password** (if not already set):
   ```bash
   psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'test_password';"
   ```

2. **Create the test database**:
   ```bash
   createdb -U postgres sourdough_test
   ```

3. **Run migrations**:
   ```bash
   cd backend
   DATABASE_URL="postgresql://postgres:test_password@localhost:5432/sourdough_test" npx prisma migrate deploy
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

#### Option 2: Use Your Own Database User

If you prefer to use a different user (e.g., `sdadmin`):

1. **Update `.env.test`** with your credentials:
   ```
   DATABASE_URL="postgresql://your_user:your_password@localhost:5432/sourdough_test"
   ```

2. **Grant necessary permissions**:
   ```bash
   psql -U your_user -d postgres -c "CREATE DATABASE sourdough_test OWNER your_user;"
   ```

3. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

### CI/CD

Tests run automatically in GitHub Actions with a PostgreSQL service container. No local setup is required for CI.

### Skipping Tests Locally

If you're working on frontend features and don't need to run backend tests:

- Tests only run when you explicitly run `npm test` in the backend directory
- GitHub Actions will run tests automatically on push/PR
- If CI tests fail due to database issues, check the Actions logs

### Troubleshooting

**Permission Denied Errors:**
- Ensure your database user has CREATE privileges on the database
- Try using the `postgres` superuser

**Connection Refused:**
- Check that PostgreSQL is running: `pg_ctl status`
- Verify the connection string in `.env.test`

**Authentication Failed:**
- Verify your password is correct
- Check `pg_hba.conf` for authentication method (should be `md5` or `scram-sha-256`)
