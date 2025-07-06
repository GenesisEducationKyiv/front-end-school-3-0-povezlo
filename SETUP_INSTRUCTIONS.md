# CI/CD Setup Instructions

## Overview

This setup provides comprehensive CI/CD pipelines for Angular frontend and Node.js backend projects. Since frontend and backend are in **separate repositories**, each has its own CI/CD pipeline.

## Repository Structure

- **Frontend Repository**: `https://github.com/GenesisEducationKyiv/front-end-school-3-0-povezlo.git`
- **Backend Repository**: `https://github.com/povezlo/test-server-case.git`

## Frontend CI/CD Setup

### 1. Files Already in Frontend Repository

The following files are already configured in your frontend repository:
- `.github/workflows/ci.yml` - Main CI/CD pipeline
- `.github/workflows/code-quality.yml` - Code quality checks
- `.github/workflows/security.yml` - Security auditing
- `.github/dependabot.yml` - Dependency management
- `tsconfig.ci.json` - TypeScript config for CI/CD
- `jest.config.js` - Jest configuration with path aliases

### 2. Frontend Pipeline Features

- ✅ ESLint code quality checks
- ✅ TypeScript type checking (excluding test files)
- ✅ Unit tests (Vitest) and component tests (Jest)
- ✅ Angular build with bundle analysis
- ✅ Docker containerization
- ✅ Security auditing
- ✅ Coverage reporting
- ✅ Artifact management

### 3. Required Scripts in package.json

Make sure your frontend `package.json` includes these scripts:
```json
{
  "scripts": {
    "lint": "eslint \"src/**/*.ts\" --fix",
    "typecheck": "tsc --noEmit",
    "typecheck:ci": "tsc --noEmit --skipLibCheck --project tsconfig.ci.json",
    "test:unit": "vitest run tests/unit --config vitest.unit.config.ts",
    "test:components": "jest",
    "build": "ng build",
    "build:analyze": "ng build --stats-json"
  }
}
```

## Backend CI/CD Setup

### 1. Files to Copy to Backend Repository

Copy these files from the frontend repository to your backend repository:

#### Required Files:
1. **`.github/workflows/ci.yml`** - Copy from `backend-ci.yml`
2. **`tsconfig.ci.json`** - Copy from `backend-tsconfig.ci.json`
3. **`.github/workflows/security.yml`** - Copy and adapt for backend
4. **`.github/dependabot.yml`** - Copy for dependency management

#### Step-by-Step Backend Setup:

1. **Create the GitHub Actions directory** in your backend repository:
   ```bash
   mkdir -p .github/workflows
   ```

2. **Copy the backend CI/CD workflow**:
   ```bash
   # Copy backend-ci.yml to .github/workflows/ci.yml in backend repo
   cp backend-ci.yml .github/workflows/ci.yml
   ```

3. **Copy the TypeScript configuration**:
   ```bash
   # Copy backend-tsconfig.ci.json to tsconfig.ci.json in backend repo
   cp backend-tsconfig.ci.json tsconfig.ci.json
   ```

4. **Copy security workflow**:
   ```bash
   # Copy .github/workflows/security.yml to backend repo
   cp .github/workflows/security.yml .github/workflows/security.yml
   ```

5. **Copy Dependabot configuration**:
   ```bash
   # Copy .github/dependabot.yml to backend repo
   cp .github/dependabot.yml .github/dependabot.yml
   ```

### 2. Required Scripts in Backend package.json

Make sure your backend `package.json` includes these scripts:
```json
{
  "scripts": {
    "lint": "eslint \"src/**/*.ts\" --fix",
    "typecheck": "tsc --noEmit",
    "typecheck:ci": "tsc --noEmit --skipLibCheck --project tsconfig.ci.json",
    "test": "vitest",
    "test:ci": "vitest run",
    "test:coverage": "vitest run --coverage",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts"
  }
}
```

### 3. Backend Pipeline Features

- ✅ ESLint code quality checks
- ✅ TypeScript type checking (excluding test files)
- ✅ Unit and integration tests
- ✅ Build verification
- ✅ Security auditing
- ✅ Coverage reporting
- ✅ Artifact management
- ✅ Production deployment

## Environment Variables

### Frontend Environment Variables
Add these to your frontend repository secrets:
```
ANGULAR_ENV_API_URL=https://your-backend-api.com
ANGULAR_ENV_GRAPHQL_URL=https://your-backend-api.com/graphql
```

### Backend Environment Variables
Add these to your backend repository secrets:
```
NODE_ENV=production
PORT=8000
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
```

## Branch Strategy

Both repositories use the same branch strategy:
- **All branches**: CI/CD runs on all branches for testing
- **Main branch**: Additional deployment steps run only on main branch
- **Pull requests**: Full CI/CD pipeline with PR comments

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Business logic, services, utilities (Vitest)
- **Component Tests**: Angular components (Jest + Angular Testing Library)
- **E2E Tests**: Full application flow (Playwright)

### Backend Testing
- **Unit Tests**: Individual functions and modules (Vitest)
- **Integration Tests**: API endpoints and database interactions
- **Security Tests**: Vulnerability scanning and audit

## Deployment Options

### Frontend Deployment
Configure deployment in `.github/workflows/ci.yml`:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **AWS S3**: `aws s3 sync dist/ s3://your-bucket`
- **Firebase**: `firebase deploy`

### Backend Deployment
Configure deployment in `.github/workflows/ci.yml`:
- **Heroku**: `heroku deploy`
- **AWS EC2/ECS**: Custom deployment scripts
- **Docker**: Push to registry and deploy
- **Railway**: `railway deploy`

## Monitoring and Alerts

### Setup Notifications
1. **Slack Integration**: Add webhook URL to repository secrets
2. **Email Notifications**: Configure in repository settings
3. **GitHub Discussions**: Enable for team communication

### Monitoring
- **Build Status**: GitHub Actions dashboard
- **Test Results**: Artifacts and PR comments
- **Security Alerts**: Dependabot and security workflow
- **Performance**: Bundle analyzer reports

## Common Issues and Solutions

See `CI_CD_TROUBLESHOOTING.md` for detailed troubleshooting information.

## Getting Started

1. **Frontend**: CI/CD is already configured and working
2. **Backend**: Follow the "Backend CI/CD Setup" section above
3. **Test**: Create a test PR in both repositories
4. **Deploy**: Configure deployment credentials in repository secrets

## Support

For issues or questions:
1. Check `CI_CD_TROUBLESHOOTING.md`
2. Review GitHub Actions logs
3. Contact the development team 