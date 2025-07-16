# CI/CD Setup Documentation

## Overview

This project uses GitHub Actions to automate the continuous integration and deployment (CI/CD) process across two separate repositories. The system includes multiple workflows to ensure code quality, security, and automated deployment.

## Repository Structure

The project consists of two separate repositories:

### Frontend Repository
- **URL**: [GenesisEducationKyiv/front-end-school-3-0-povezlo](https://github.com/GenesisEducationKyiv/front-end-school-3-0-povezlo.git)
- **Technology**: Angular 18, TypeScript, Angular Material
- **Purpose**: Music tracks management interface

### Backend Repository  
- **URL**: [povezlo/test-server-case](https://github.com/povezlo/test-server-case.git)
- **Technology**: Node.js, Fastify, GraphQL
- **Purpose**: API server and data management

## CI/CD Architecture

### 1. Frontend CI/CD Pipeline (`frontend-ci.yml`)

**Repository**: GenesisEducationKyiv/front-end-school-3-0-povezlo

**Triggers:**
- Push to any branch (`branches: [ "**" ]`)
- Pull Request to any branch

**Stages:**

#### Frontend Build and Test
- **Caching**: Automatic `node_modules` caching
- **ESLint**: Static code analysis
- **Type Checking**: TypeScript validation
- **Unit Tests**: Run unit tests (`npm run test:unit`)
- **Component Tests**: Run component tests (`npm run test:components`)
- **Build**: Project compilation (`npm run build`)
- **Bundle Analysis**: Size and optimization analysis
- **Artifacts**: Save builds and test coverage

#### E2E Tests (Optional)
- **Dependencies**: Runs after successful frontend build
- **Condition**: Only if `BACKEND_URL` environment variable is set
- **Playwright**: Browser automation for E2E testing
- **Server Setup**: Start frontend server for testing
- **Artifacts**: Save test results and reports

#### Deploy (Main branch only)
- **Condition**: Only on push to `main` branch
- **Artifacts**: Download frontend build
- **Deployment**: Ready for deployment to various platforms

### 2. Backend CI/CD Pipeline (`backend-ci.yml`)

**Repository**: povezlo/test-server-case

**Triggers:**
- Push to any branch (`branches: [ "**" ]`)
- Pull Request to any branch

**Stages:**

#### Backend Build and Test
- **Caching**: Automatic `node_modules` caching
- **ESLint**: Static code analysis
- **Type Checking**: TypeScript validation
- **Tests**: Run tests (`npm run test:ci`)
- **Coverage**: Generate test coverage reports
- **Build**: Project compilation (`npm run build`)
- **Artifacts**: Save builds and coverage reports

#### Integration Tests
- **Database**: Reset and seed test data
- **Server**: Start backend server for testing
- **API Tests**: Test GraphQL and REST endpoints
- **Artifacts**: Save integration test results

#### Database Operations (Main branch only)
- **Backup**: Create data backups before deployment
- **Migrations**: Run database migrations if needed
- **Artifacts**: Save backup files

### 3. Security Audit (`security.yml`)

**Works for both repositories**

**Triggers:**
- Push and Pull Request to any branch
- Daily at 03:00 UTC (cron schedule)

**Stages:**
- **npm audit**: Check for dependency vulnerabilities
- **CodeQL Analysis**: Static security analysis
- **Dependency Check**: Check for unused/outdated dependencies
- **License Compliance**: Verify package licenses
- **Security Reports**: Save audit results

### 4. Code Quality (`code-quality.yml`)

**Works for both repositories**

**Stages:**
- **Code Quality Analysis**: ESLint, Prettier, circular dependencies
- **Performance Analysis**: Bundle size, large files detection
- **Documentation Check**: README, JSDoc coverage
- **TypeScript Analysis**: Compiler checks and type validation

### 5. Dependabot (`dependabot.yml`)

**Automatic dependency updates:**
- **Frontend**: Weekly npm package updates (GenesisEducationKyiv repo)
- **Backend**: Reference configuration for povezlo repo
- **GitHub Actions**: Weekly actions updates
- **Target Branch**: `develop`
- **Schedule**: Monday, 09:00

## Configuration and Setup

### Environment Variables

Configure the following secrets in each repository:

```bash
# For deployment (optional)
DEPLOY_TOKEN=your-deploy-token
DEPLOY_URL=your-deploy-url

# For E2E tests integration (frontend repo)
BACKEND_URL=https://your-backend-api.com

# For notifications (optional)
SLACK_WEBHOOK=your-slack-webhook
DISCORD_WEBHOOK=your-discord-webhook
```

### Repository-Specific Setup

#### Frontend Repository Setup
1. Copy these files to GenesisEducationKyiv/front-end-school-3-0-povezlo:
   - `.github/workflows/frontend-ci.yml`
   - `.github/workflows/security.yml`
   - `.github/workflows/code-quality.yml`
   - `.github/dependabot.yml`
   - `.github/pull_request_template.md`

#### Backend Repository Setup
1. Copy these files to povezlo/test-server-case:
   - `backend-ci.yml` (rename to `.github/workflows/backend-ci.yml`)
   - `.github/workflows/security.yml`
   - `.github/workflows/code-quality.yml`
   - Backend-specific `dependabot.yml` configuration
   - `.github/pull_request_template.md`

### Caching

The system automatically caches:
- `node_modules` (both repositories)
- Playwright browsers (frontend)
- TypeScript compilation cache

### Artifacts

Automatically saved artifacts:
- **Frontend Build** (`dist/`, `bundle-stats.json`)
- **Backend Build** (`dist/`, `package.json`)
- **Test Coverage** (both repositories)
- **E2E Test Results** (`test-results/`, `playwright-report/`)
- **Security Audit Reports**
- **Code Quality Reports**

## Local Testing Commands

### Frontend (GenesisEducationKyiv/front-end-school-3-0-povezlo)
```bash
# Install dependencies
npm ci

# Lint
npm run lint

# Type checking
npx tsc --noEmit --skipLibCheck

# Unit tests
npm run test:unit

# Component tests
npm run test:components

# E2E tests
npm run test:e2e

# Build
npm run build

# Build analysis
npm run build:analyze
```

### Backend (povezlo/test-server-case)
```bash
# Install dependencies
npm ci

# Lint
npm run lint

# Type checking
npm run typecheck

# Tests
npm run test:ci

# Build
npm run build

# Reset database
npm run bd:reset

# Seed data
npm run seed
```

## Cross-Repository Integration

### E2E Testing Strategy
1. **Backend First**: Deploy backend to staging environment
2. **Frontend Configuration**: Set `BACKEND_URL` environment variable
3. **E2E Execution**: Frontend E2E tests run against live backend
4. **Results**: Combined test reports from both repositories

### Deployment Coordination
1. **Backend Deployment**: Deploy API server first
2. **Database Migrations**: Run any necessary migrations
3. **Frontend Deployment**: Deploy frontend with updated backend URL
4. **Smoke Tests**: Verify integration functionality

## Monitoring and Debugging

### Viewing Logs
1. Navigate to GitHub Actions in your repository
2. Select the desired workflow run
3. Open specific job for detailed logs

### Artifacts
- Download artifacts for build analysis or test results
- Artifacts are stored for 7 days (30 days for security reports)

### Notifications
- Configure GitHub notifications for CI/CD status
- Add webhooks for Slack/Discord integration

## Troubleshooting

### Common Issues

1. **ESLint Errors**
   - Run `npm run lint` locally
   - Fix all identified issues

2. **Type Errors**
   - Run `npm run typecheck:ci` locally (excludes test files)
   - Run `npm run typecheck` to check all files including tests
   - See `CI_CD_TROUBLESHOOTING.md` for TypeScript test issues

3. **Test Failures**
   - Run tests locally
   - Check test coverage

4. **Build Failures**
   - Check dependencies
   - Ensure environment variables are configured

5. **E2E Test Failures**
   - Verify backend server is running
   - Check backend URL configuration
   - Review timeout settings in tests

6. **Cross-Repository Issues**
   - Ensure API compatibility between frontend and backend
   - Verify environment variable configuration
   - Check network connectivity between services

### TypeScript Configuration

The project uses two TypeScript configurations:
- `tsconfig.json` - Main configuration for development
- `tsconfig.ci.json` - CI/CD configuration that excludes test files

This separation ensures that CI/CD type checking focuses on application code while test files are validated during test execution.

## Extending CI/CD

### Adding New Stages

1. **Additional Tests**
   - Add new commands to workflow steps
   - Update artifacts as needed

2. **Additional Checks**
   - Add new jobs to workflows
   - Configure dependencies between jobs

3. **External Service Integration**
   - Add necessary secrets
   - Create new workflows for specific tasks

### Deployment Setup

For automated deployment setup:

#### Frontend Deployment

**Vercel**
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Netlify**
```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v3.0
  with:
    publish-dir: './dist'
    production-branch: main
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deploy-message: "Deploy from GitHub Actions"
```

#### Backend Deployment

**Heroku**
```yaml
- name: Deploy to Heroku
  uses: akhileshns/heroku-deploy@v3.12.12
  with:
    heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
    heroku_app_name: "your-backend-app"
    heroku_email: "your-email@example.com"
```

**Railway**
```yaml
- name: Deploy to Railway
  uses: bervProject/railway-deploy@main
  with:
    railway-token: ${{ secrets.RAILWAY_TOKEN }}
    service: "your-service-name"
```

## Repository-Specific Considerations

### Frontend Repository
- Focus on build optimization and bundle analysis
- Browser compatibility testing
- Performance metrics monitoring
- Asset optimization

### Backend Repository
- API endpoint testing
- Database migration management
- Performance benchmarking
- Security vulnerability scanning

### Integration Testing
- Cross-repository E2E testing
- API contract validation
- Performance testing under load
- Security testing across the full stack

## Conclusion

This CI/CD setup provides:
- ✅ Automated code testing across repositories
- ✅ Quality and security checks
- ✅ Automated project builds
- ✅ Artifact preservation
- ✅ Caching for faster execution
- ✅ Automatic dependency updates
- ✅ Deployment readiness
- ✅ Cross-repository integration support

The system is easily extensible and configurable for specific project needs across both frontend and backend repositories. 