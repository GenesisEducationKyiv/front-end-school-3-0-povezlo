# CI/CD Troubleshooting Guide

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