# CI/CD Setup Instructions

This document provides step-by-step instructions for setting up CI/CD workflows across the two separate repositories.

## Repository Overview

- **Frontend**: [GenesisEducationKyiv/front-end-school-3-0-povezlo](https://github.com/GenesisEducationKyiv/front-end-school-3-0-povezlo.git)
- **Backend**: [povezlo/test-server-case](https://github.com/povezlo/test-server-case.git)

## Frontend Repository Setup

### 1. Copy Workflow Files to GenesisEducationKyiv/front-end-school-3-0-povezlo

Copy these files to the frontend repository:

```bash
# GitHub Actions workflows
.github/workflows/frontend-ci.yml
.github/workflows/security.yml
.github/workflows/code-quality.yml

# Configuration files
.github/dependabot.yml
.github/pull_request_template.md
```

### 2. Environment Variables (Frontend)

Configure these variables in the repository settings:

**Repository Variables:**
```
BACKEND_URL=https://your-backend-api.com  # Optional: for E2E tests
```

**Repository Secrets:**
```
VERCEL_TOKEN=your-vercel-token           # For Vercel deployment
NETLIFY_AUTH_TOKEN=your-netlify-token    # For Netlify deployment
DEPLOY_TOKEN=your-deploy-token           # Generic deployment token
```

### 3. Branch Protection Rules (Frontend)

Configure branch protection for `main` and `develop`:

1. Go to Settings > Branches
2. Add rule for `main`:
   - Require status checks to pass
   - Require branches to be up to date
   - Required status checks:
     - `Frontend Build and Test`
     - `Code Quality Analysis`
     - `Security Audit`

### 4. GitHub Actions Permissions (Frontend)

1. Go to Settings > Actions > General
2. Set "Workflow permissions" to "Read and write permissions"
3. Allow GitHub Actions to create and approve pull requests

## Backend Repository Setup

### 1. Copy Workflow Files to povezlo/test-server-case

Copy these files to the backend repository:

```bash
# Rename and copy backend workflow
backend-ci.yml → .github/workflows/backend-ci.yml

# Other workflows
.github/workflows/security.yml
.github/workflows/code-quality.yml

# Configuration files (create backend-specific versions)
.github/dependabot.yml  # Backend-specific configuration
.github/pull_request_template.md
```

### 2. Create Backend-Specific Dependabot Configuration

Create `.github/dependabot.yml` in the backend repository:

```yaml
version: 2
updates:
  # Backend dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    target-branch: "develop"
    reviewers:
      - "povezlo"
    labels:
      - "dependencies"
      - "backend"
      - "automation"
    commit-message:
      prefix: "feat"
      include: "scope"
    groups:
      fastify:
        patterns:
          - "fastify*"
          - "@fastify/*"
        update-types:
          - "minor"
          - "patch"
      graphql:
        patterns:
          - "graphql*"
          - "@graphql-tools/*"
          - "mercurius*"
        update-types:
          - "minor"
          - "patch"
      testing:
        patterns:
          - "vitest"
          - "@vitest/*"
          - "supertest"
        update-types:
          - "minor"
          - "patch"

  # GitHub Actions updates
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 5
    target-branch: "develop"
    reviewers:
      - "povezlo"
    labels:
      - "dependencies"
      - "ci/cd"
      - "automation"
    commit-message:
      prefix: "ci"
      include: "scope"
```

### 3. Environment Variables (Backend)

Configure these variables in the repository settings:

**Repository Secrets:**
```
HEROKU_API_KEY=your-heroku-api-key       # For Heroku deployment
RAILWAY_TOKEN=your-railway-token         # For Railway deployment
DATABASE_URL=your-database-url           # Production database
DEPLOY_TOKEN=your-deploy-token           # Generic deployment token
```

### 4. Branch Protection Rules (Backend)

Configure branch protection for `main` and `develop`:

1. Go to Settings > Branches
2. Add rule for `main`:
   - Require status checks to pass
   - Require branches to be up to date
   - Required status checks:
     - `Backend Build and Test`
     - `Integration Tests`
     - `Security Audit`

## Cross-Repository Integration

### 1. Environment Configuration

**Frontend Environment Variables:**
```javascript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-api.com',
  graphqlUrl: 'https://your-backend-api.com/graphql'
};
```

**Backend CORS Configuration:**
```javascript
// src/config/index.ts
export default {
  cors: {
    origin: [
      'https://your-frontend-domain.com',
      'http://localhost:4200' // for development
    ]
  }
};
```

### 2. E2E Testing Setup

1. Deploy backend to staging environment
2. Configure frontend `BACKEND_URL` variable
3. E2E tests will automatically run against the live backend

### 3. Deployment Coordination

**Recommended deployment order:**
1. Backend deployment (with database migrations)
2. Verify backend health endpoints
3. Frontend deployment (with updated API URLs)
4. Run smoke tests

## Workflow Configuration

### 1. Trigger Configuration

All workflows are configured to trigger on:
- Push to any branch (`branches: [ "**" ]`)
- Pull requests to any branch

### 2. Artifact Retention

- Build artifacts: 7 days
- Security reports: 30 days
- Test results: 7 days

### 3. Notification Setup

Configure notifications in each repository:

1. Go to Settings > Notifications
2. Enable "Actions" notifications
3. Configure Slack/Discord webhooks (optional)

## Testing the Setup

### 1. Frontend Repository Test

1. Create a feature branch
2. Make a small change
3. Push the branch
4. Verify all workflows run successfully
5. Create a pull request
6. Check that PR comments are added with build information

### 2. Backend Repository Test

1. Create a feature branch
2. Make a small change
3. Push the branch
4. Verify all workflows run successfully
5. Create a pull request
6. Check that PR comments are added with test results

### 3. Cross-Repository Test

1. Deploy backend changes
2. Update frontend to use new backend endpoints
3. Run E2E tests to verify integration
4. Deploy both repositories

## Troubleshooting

### Common Setup Issues

1. **Missing Secrets**
   - Verify all required secrets are configured
   - Check secret names match workflow references

2. **Workflow Permissions**
   - Ensure workflows have read/write permissions
   - Check branch protection rules don't block workflows

3. **Dependency Issues**
   - Verify package.json scripts exist
   - Check Node.js version compatibility

4. **Cross-Repository Issues**
   - Verify CORS configuration
   - Check API endpoint URLs
   - Ensure network connectivity

### Debug Commands

**Frontend debugging:**
```bash
# Check workflow syntax
npx yaml-lint .github/workflows/*.yml

# Test build locally
npm run build
npm run test:unit
npm run test:components
```

**Backend debugging:**
```bash
# Check workflow syntax
npx yaml-lint .github/workflows/*.yml

# Test build locally
npm run build
npm run test:ci
npm run start
```

## Maintenance

### Regular Tasks

1. **Weekly**: Review Dependabot PRs
2. **Monthly**: Update workflow versions
3. **Quarterly**: Review and update documentation
4. **As needed**: Adjust branch protection rules

### Monitoring

1. Check GitHub Actions dashboard regularly
2. Monitor artifact storage usage
3. Review security audit reports
4. Update deployment configurations as needed

## Support

For issues with this CI/CD setup:

1. Check the troubleshooting section
2. Review GitHub Actions logs
3. Verify environment configuration
4. Contact repository maintainers

## Next Steps

After setup is complete:

1. Test the complete workflow with a sample change
2. Configure deployment targets (Vercel, Heroku, etc.)
3. Set up monitoring and alerts
4. Train team members on the CI/CD process
5. Document any project-specific customizations 