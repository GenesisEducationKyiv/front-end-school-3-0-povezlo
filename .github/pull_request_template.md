## Description

Brief description of what was changed and why.

## Type of Changes

- [ ] 🐛 Bug fix (fixing an issue)
- [ ] ✨ New feature (adding new functionality)
- [ ] 💄 UI/UX improvement (interface enhancement)
- [ ] ⚡ Performance improvement (optimization)
- [ ] 🔧 Refactoring (code restructuring)
- [ ] 📝 Documentation update (documentation changes)
- [ ] 🧪 Tests (adding/modifying tests)
- [ ] 🔨 Build/CI (build or CI/CD changes)
- [ ] 🔒 Security (security fixes)

## Related Issues

Closes #(issue number)
Related to #(issue number)

## What was done

- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## How to test

1. Step 1
2. Step 2
3. Expected result

## Review Checklist

### Code Quality
- [ ] Code follows project standards
- [ ] No ESLint errors
- [ ] All TypeScript types are correct
- [ ] Code is properly formatted (Prettier)
- [ ] No console.log in production code
- [ ] Code is commented where necessary

### Tests
- [ ] Added/updated unit tests
- [ ] Added/updated integration tests
- [ ] Updated E2E tests when necessary
- [ ] All tests pass locally
- [ ] Test coverage hasn't decreased

### Functionality
- [ ] Feature works as expected
- [ ] No regressions in existing functionality
- [ ] Changes work on all supported devices/browsers
- [ ] Error handling is implemented correctly

### Documentation
- [ ] README updated when necessary
- [ ] API documentation updated
- [ ] Changelog updated
- [ ] Code comments are up to date

### Security
- [ ] No vulnerabilities in code
- [ ] No hardcoded secrets/keys
- [ ] Input validation implemented
- [ ] Authorization and authentication work correctly

### Performance
- [ ] No memory leaks
- [ ] Image optimization performed
- [ ] Lazy loading applied where possible
- [ ] Bundle size hasn't increased significantly

## Screenshots (if applicable)

Add before/after screenshots of the interface changes.

## Additional Notes

Any additional information that might be useful for the reviewer.

## For Reviewer

### Main areas to check
- [ ] Business logic processes
- [ ] Architectural decisions
- [ ] Performance
- [ ] Security
- [ ] UX/UI solutions

### Discussion questions
- Are there alternative approaches to the solution?
- Do the changes align with the project architecture?
- Are additional tests needed?

## Deployment Checklist

### Frontend (GenesisEducationKyiv/front-end-school-3-0-povezlo)
- [ ] Build passes successfully
- [ ] Bundle analysis shows acceptable size
- [ ] E2E tests pass
- [ ] Browser compatibility verified

### Backend (povezlo/test-server-case) 
- [ ] API endpoints tested
- [ ] Database migrations applied
- [ ] GraphQL schema valid
- [ ] Performance benchmarks met

### Environment Variables
- [ ] All required environment variables documented
- [ ] Staging environment tested
- [ ] Production deployment plan ready

## Automated Checks Status

The following checks will run automatically:

**Frontend Repository:**
- ✅ ESLint code quality
- ✅ TypeScript type checking
- ✅ Unit tests (Vitest)
- ✅ Component tests (Jest)
- ✅ E2E tests (Playwright)
- ✅ Bundle analysis
- ✅ Security audit

**Backend Repository:**
- ✅ ESLint code quality
- ✅ TypeScript type checking
- ✅ Integration tests
- ✅ API endpoint tests
- ✅ GraphQL schema validation
- ✅ Security audit

**Cross-Repository:**
- ✅ End-to-end integration tests
- ✅ Performance validation
- ✅ Documentation checks 