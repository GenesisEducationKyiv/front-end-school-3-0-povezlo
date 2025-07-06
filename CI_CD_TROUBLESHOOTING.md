# CI/CD Troubleshooting Guide

## Table of Contents
1. [Docker Build Issues](#docker-build-issues)
2. [Backend CI/CD Caching Issues](#backend-cicd-caching-issues)
3. [Jest Path Aliases Issues](#jest-path-aliases-issues)
4. [TypeScript Type Check Issues](#typescript-type-check-issues)
5. [Angular CLI Not Found in Docker Build](#angular-cli-not-found-in-docker-build)
6. [Docker Registry Case Sensitivity Issues](#docker-registry-case-sensitivity-issues)
7. [Docker Container Startup Issues](#docker-container-startup-issues)

---

## Docker Build Issues

### Problem: Invalid Docker tag format
**Error**: `ERROR: failed to build: invalid tag "/music-tracks-frontend:branch-name": invalid reference format`

**Cause**: 
- Docker username secret is empty or undefined, leading to tags starting with `/`
- Branch names containing uppercase letters, special characters, or double dashes
- Invalid characters in Docker tags

**Solution**:
1. Remove dependency on Docker Hub credentials if using only GitHub Container Registry
2. Normalize branch names for Docker tags:
   - Convert to lowercase
   - Replace invalid characters with dashes
   - Remove consecutive dashes
   - Trim leading/trailing dashes

**Example fix**:
```yaml
- name: Normalize branch name for Docker tags
  id: normalize
  run: |
    BRANCH_NAME="${{ github.ref_name }}"
    NORMALIZED_BRANCH=$(echo "$BRANCH_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    echo "branch=$NORMALIZED_BRANCH" >> $GITHUB_OUTPUT

- name: Extract metadata
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      type=raw,value=${{ steps.normalize.outputs.branch }}-{{sha}}
      type=raw,value=${{ steps.normalize.outputs.branch }}-latest
```

### Common Docker Tag Issues:
- `Homework--9_CICD` → `homework-9-cicd`
- `Feature/USER-123` → `feature-user-123`
- `HOTFIX_v1.2.3` → `hotfix-v1-2-3`

### Testing the Fix
```bash
# Test Docker build locally
docker build -t test-image .

# Test with various branch names
git checkout -b "Test--Branch_Name"
# Should normalize to: test-branch-name
```

---

## Backend CI/CD Caching Issues

### Problem
Backend CI/CD fails during Node.js setup with caching error:
```
Error: Some specified paths were not resolved, unable to cache dependencies.
```

### Solution
This issue occurs when the CI/CD workflow tries to cache dependencies from a path that doesn't exist. For separate repositories, backend CI/CD should be in its own repository, not in the frontend workflow.

#### For Separate Repositories (Recommended):

1. **Remove backend from frontend CI/CD**:
   - Frontend repository should only contain frontend CI/CD
   - Backend repository should have its own CI/CD

2. **Copy backend CI/CD files to backend repository**:
   ```bash
   # In backend repository, create workflow directory
   mkdir -p .github/workflows
   
   # Copy the backend workflow (rename backend-ci.yml to ci.yml)
   cp backend-ci.yml .github/workflows/ci.yml
   
   # Copy TypeScript configuration
   cp backend-tsconfig.ci.json tsconfig.ci.json
   
   # Copy other necessary files
   cp .github/workflows/security.yml .github/workflows/security.yml
   cp .github/dependabot.yml .github/dependabot.yml
   ```

3. **Update backend workflow cache path**:
   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: '20.x'
       cache: 'npm'
       cache-dependency-path: package-lock.json  # NOT test-server-case/package-lock.json
   ```

#### For Monorepo (Alternative):

If you want to keep both in the same repository:

1. **Ensure backend files exist**:
   ```bash
   # Make sure these files exist
   ls -la test-server-case/package-lock.json
   ls -la test-server-case/package.json
   ```

2. **Fix cache path in workflow**:
   ```yaml
   # In .github/workflows/ci.yml
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: '20.x'
       cache: 'npm'
       cache-dependency-path: |
         package-lock.json
         test-server-case/package-lock.json
   ```

### Why This Happens
- GitHub Actions tries to cache dependencies from the specified path
- If the path doesn't exist, caching fails
- In separate repositories, backend files don't exist in frontend repo
- The workflow needs to point to the correct package-lock.json location

### Testing the Fix
```bash
# For separate repos: Test in each repository
npm ci
npm run build
npm run test

# For monorepo: Test both frontend and backend
npm ci
cd test-server-case && npm ci
```

---

## Jest Path Aliases Issues

### Problem
Jest fails to run component tests with errors related to missing modules with path aliases:
```
Cannot find module '@shared/graphql/generated' from 'src/app/entities/track/model/track-graphql.service.ts'
```

### Solution
This issue occurs because Jest doesn't understand TypeScript path aliases from `tsconfig.json`. The solution is to add all path aliases to Jest configuration:

1. **Update `jest.config.js`** to include all path aliases:
   ```javascript
   module.exports = {
     // ... other config
     moduleNameMapper: {
       '^@app/(.*)$': '<rootDir>/src/app/$1',
       '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
       '^@entities/(.*)$': '<rootDir>/src/app/entities/$1',
       '^@features/(.*)$': '<rootDir>/src/app/features/$1',
       '^@widgets/(.*)$': '<rootDir>/src/app/widgets/$1',
       '^@pages/(.*)$': '<rootDir>/src/app/pages/$1',
       '^@processes/(.*)$': '<rootDir>/src/app/processes/$1',
       '^@environment/(.*)$': '<rootDir>/src/environments/$1',
     },
   };
   ```

2. **Ensure `tsconfig.spec.json`** extends the main tsconfig and includes Jest types:
   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "types": ["jest", "node"]
     },
     "include": [
       "src/**/*.spec.ts",
       "tests/components/**/*.spec.ts"
     ]
   }
   ```

### Why This Happens
- Jest uses its own module resolution system
- TypeScript path aliases from `tsconfig.json` are not automatically recognized
- Jest needs explicit `moduleNameMapper` configuration for aliases

### Testing the Fix
```bash
npm run test:components
```

---

## TypeScript Type Check Issues

### Problem
TypeScript type checking fails in CI/CD with errors related to missing Jest types in test files:
```
Cannot find name 'describe'. Do you need to install type definitions for a test runner?
Cannot find name 'it'. Do you need to install type definitions for a test runner?
Cannot find name 'expect'.
```

### Solution
We've created a separate TypeScript configuration file `tsconfig.ci.json` that excludes test files from type checking during CI/CD runs. This is because:

1. Test files use Jest types which are only needed during test execution
2. Tests are already validated when they run in their respective test jobs
3. The main application code is still fully type-checked

### Implementation Details

1. **tsconfig.ci.json** - Extends the main tsconfig but excludes test files and overrides types:
   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "types": ["node"]
     },
     "exclude": [
       "**/*.spec.ts",
       "**/tests/**",
       "src/setup-jest.ts",
       "src/test-setup.ts",
       "node_modules",
       "dist",
       "coverage",
       "playwright-report",
       "test-results"
     ]
   }
   ```

2. **package.json scripts**:
   - `typecheck` - Regular type checking (includes test files)
   - `typecheck:ci` - CI/CD type checking (excludes test files)

3. **CI/CD Workflow** uses `npm run typecheck:ci` to avoid test-related type errors

**Important:** All workflow files must use `npm run typecheck:ci` instead of direct `npx tsc` commands. This includes:
- `.github/workflows/ci.yml`
- `.github/workflows/code-quality.yml`
- `.github/workflows/frontend-ci.yml`

### Alternative Solutions

If you want to include test files in type checking:

1. **Add Jest types to tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "types": ["node", "jest"]
     }
   }
   ```

2. **Create a separate tsconfig for tests**:
   ```json
   // tsconfig.spec.json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "types": ["jest", "node"]
     },
     "include": [
       "src/**/*.spec.ts",
       "tests/**/*.ts"
     ]
   }
   ```

### Local Testing

To test TypeScript compilation locally:
```bash
# Check all files (including tests) - might show errors
npm run typecheck

# Check only application code (CI/CD mode)
npm run typecheck:ci
```

### Why This Approach?

1. **Separation of Concerns**: Application code and test code have different requirements
2. **CI/CD Efficiency**: Faster type checking by excluding test files
3. **Test Validation**: Tests are validated when they actually run
4. **Flexibility**: Easy to switch between including/excluding test files

### Common Issues

1. **New test files not excluded**: Make sure they follow the naming pattern `*.spec.ts`
2. **Import errors**: Ensure test utilities are properly excluded in `tsconfig.ci.json`
3. **Missing types**: Application code should not import from test files

### References

- [TypeScript tsconfig documentation](https://www.typescriptlang.org/tsconfig)
- [Jest TypeScript setup](https://jestjs.io/docs/getting-started#using-typescript)
- [Angular testing guide](https://angular.io/guide/testing)

---

## Angular CLI Not Found in Docker Build

### Problem
Docker build fails with "ng: not found" error during npm run build:

```
> ng build
sh: ng: not found
ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 127
```

### Root Cause
- Using `npm ci --only=production` installs only production dependencies
- Angular CLI (`@angular/cli`) is typically a dev dependency
- Angular CLI is required for building the application

### Solution
1. **Install All Dependencies:** Change from `--only=production` to install all dependencies including dev dependencies
2. **Verify Output Path:** Ensure the correct path to built application in multi-stage build

**Dockerfile fixes:**
```dockerfile
# Before (incorrect):
RUN npm ci --only=production && npm cache clean --force

# After (correct):
RUN npm ci && npm cache clean --force

# Also check output path (check angular.json for outputPath):
COPY --from=build /app/dist/music-tracks-app /usr/share/nginx/html
```

### Why This Works
- Dev dependencies are needed during build stage
- Multi-stage build means dev dependencies won't be in final image
- Final image only contains the built application files

### Additional Checks
1. **Verify Angular CLI is in devDependencies:**
   ```json
   {
     "devDependencies": {
       "@angular/cli": "^18.2.9",
       "@angular/compiler-cli": "^18.2.0"
     }
   }
   ```

2. **Check output path in angular.json:**
   ```json
   {
     "projects": {
       "your-app": {
         "architect": {
           "build": {
             "options": {
               "outputPath": "dist/your-app-name"
             }
           }
         }
       }
     }
   }
   ```

### Testing the Fix
```bash
# Test Docker build locally
docker build -t test-image .

# Test build command without Docker
npm ci
npm run build
```

### Alternative Solutions
If you want to keep production-only dependencies:

1. **Install Angular CLI globally:**
   ```dockerfile
   RUN npm install -g @angular/cli
   RUN npm ci --only=production
   ```

2. **Use npx to run Angular CLI:**
   ```dockerfile
   RUN npx @angular/cli build
   ```

### Result
Angular CLI is available during build, application builds successfully

---

## Docker Registry Case Sensitivity Issues

### Problem
Docker image testing fails with "invalid reference format" error due to uppercase letters in repository name:

```
docker: invalid reference format: repository name (GenesisEducationKyiv/front-end-school-3-0-povezlo) must be lowercase
```

### Root Cause
- Docker registry requires repository names to be lowercase
- GitHub repository names can contain uppercase letters
- Using `${{ github.repository }}` directly in Docker commands causes case mismatch

### Solution
Normalize repository names to lowercase before using in Docker commands:

**Workflow fixes:**
```yaml
# Add repository name normalization step
- name: Normalize repository name
  id: normalize-repo
  run: |
    # Convert repository name to lowercase for Docker registry
    REPO_NAME=$(echo "${{ github.repository }}" | tr '[:upper:]' '[:lower:]')
    echo "repo=$REPO_NAME" >> $GITHUB_OUTPUT
    echo "Original repository: ${{ github.repository }}"
    echo "Normalized repository: $REPO_NAME"

# Use normalized repository name in Docker commands
- name: Extract metadata
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: |
      ghcr.io/${{ steps.normalize-repo.outputs.repo }}

# Use normalized repository name in testing
- name: Test Docker image
  run: |
    IMAGE_TAG="ghcr.io/${{ steps.normalize-repo.outputs.repo }}:${{ steps.normalize.outputs.branch }}-${{ github.sha }}"
    docker run -d --name test-container -p 8080:80 "$IMAGE_TAG"
```

### Why This Works
- Docker registry accepts only lowercase repository names
- GitHub allows mixed case repository names
- Normalization ensures compatibility between GitHub and Docker registry
- Original repository name is preserved for GitHub API calls

### Testing the Fix
```bash
# Test repository name normalization
REPO_NAME=$(echo "GenesisEducationKyiv/front-end-school-3-0-povezlo" | tr '[:upper:]' '[:lower:]')
echo $REPO_NAME
# Output: genesiseducationkyiv/front-end-school-3-0-povezlo

# Test Docker image reference
docker pull ghcr.io/genesiseducationkyiv/front-end-school-3-0-povezlo:latest
```

### Common Repository Name Issues
- `GenesisEducationKyiv/MyApp` → `genesiseducationkyiv/myapp`
- `CompanyName/Project-Name` → `companyname/project-name`
- `UserName/REPO_NAME` → `username/repo_name`

### Alternative Solutions
1. **Create repository with lowercase name from start**
2. **Use environment variable for Docker registry name**
3. **Separate Docker image name from repository name**

### Result
Docker image testing and deployment works correctly with normalized repository names

---

## Docker Container Startup Issues

### Problem
Docker container starts but fails health checks due to:
1. Directory creation order issues in entrypoint script
2. Insufficient wait time for container startup
3. Missing directories for runtime configuration

**Error examples:**
```
curl: (7) Failed to connect to localhost port 8080 after 0 ms: Couldn't connect to server
❌ Health check failed
/docker-entrypoint.sh: line 24: can't create /usr/share/nginx/html/assets/config/environment.json: nonexistent directory
```

### Root Cause
1. **Directory Creation Order**: Trying to create files before creating directories
2. **Startup Timing**: Container needs time to fully initialize nginx
3. **Health Check Timeout**: Fixed 10-second wait is insufficient for container startup

### Solution
1. **Fix Directory Creation Order** in `docker-entrypoint.sh`:
   ```bash
   # Create config directory BEFORE creating files
   mkdir -p /usr/share/nginx/html/assets/config
   
   # Then create environment config file
   cat > /usr/share/nginx/html/assets/config/environment.json << EOF
   {
     "production": true,
     "apiUrl": "$API_URL",
     "graphqlUrl": "$GRAPHQL_URL",
     "backendUrl": "$BACKEND_URL"
   }
   EOF
   ```

2. **Improve Health Check Logic** with retry and timeout:
   ```yaml
   # Wait for nginx to be ready with timeout
   for i in {1..30}; do
     if curl -f http://localhost:8080/health 2>/dev/null; then
       echo "✅ Health check passed after ${i} attempts"
       break
     elif [ $i -eq 30 ]; then
       echo "❌ Health check failed after 30 attempts"
       docker logs test-container
       exit 1
     else
       echo "⏳ Attempt $i: Health check not ready yet, retrying..."
       sleep 1
     fi
   done
   ```

### Additional Improvements
1. **Better Error Handling**: Show container logs on health check failure
2. **Gradual Startup**: Initial 5-second wait, then 1-second intervals
3. **Timeout Protection**: Maximum 30 attempts to prevent infinite loops

### Testing the Fix
```bash
# Test directory creation locally
mkdir -p /tmp/test/assets/config
echo "test" > /tmp/test/assets/config/environment.json

# Test health check endpoint
curl -f http://localhost:8080/health

# Test container startup
docker run -d --name test-container -p 8080:80 your-image
sleep 5
curl -f http://localhost:8080/health
```

### Why This Works
- **Directory First**: Ensures target directory exists before file creation
- **Retry Logic**: Handles variable container startup times
- **Detailed Logging**: Provides better debugging information
- **Timeout Protection**: Prevents infinite waiting

### Result
Docker container starts successfully with proper health checks and runtime configuration 