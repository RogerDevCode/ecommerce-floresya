# FloresYa E2E Tests

This directory contains end-to-end tests for FloresYa using Playwright.

## Setup

1. Install dependencies:
```bash
cd tests/e2e
npm install
npm run setup
```

2. Make sure the FloresYa server is running:
```bash
cd ../../
npm start
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Mobile Tests
```bash
npm run test:mobile
```

### Admin Panel Tests
```bash
npm run test:admin
```

### Debug Mode
```bash
npm run test:debug
npm run test:headed
npm run test:ui
```

### CI Mode
```bash
npm run test:ci
```

## Test Structure

### Test Files
- `specs/auth.setup.js` - Authentication setup for user and admin sessions
- `specs/homepage.spec.js` - Homepage functionality tests
- `specs/admin.spec.js` - Admin panel tests
- `specs/product-detail.spec.js` - Product detail page tests

### Test Projects
- **chromium** - Desktop Chrome tests
- **firefox** - Desktop Firefox tests
- **webkit** - Desktop Safari tests
- **mobile-chrome** - Mobile Chrome tests
- **mobile-safari** - Mobile Safari tests
- **admin-flow** - Admin-specific tests with admin authentication

## Authentication

The tests use two authentication states:
- `test-results/auth/user.json` - Regular user session
- `test-results/auth/admin.json` - Admin user session

These are set up automatically by the `auth.setup.js` file.

## Test Categories

### Smoke Tests
Basic functionality tests that run quickly:
```bash
npm run test:smoke
```

### Regression Tests
Comprehensive tests for full feature coverage:
```bash
npm run test:regression
```

## Configuration

Tests are configured in `playwright.config.js`:
- Base URL: `http://localhost:3000` (configurable via `BASE_URL` env var)
- Timeouts: 30s for tests, 5s for assertions
- Retries: 2 on CI, 0 locally
- Screenshots: On failure only
- Videos: On failure only
- Traces: On first retry

## Reports

Test reports are generated in `test-results/`:
- HTML report: `test-results/html-report/index.html`
- JSON report: `test-results/results.json`
- JUnit XML: `test-results/results.xml`

View the last HTML report:
```bash
npm run report
```

## CI Integration

The tests are configured for GitHub Actions with:
- Parallel execution disabled on CI
- GitHub reporter for inline annotations
- Artifact uploads for failed test traces

## Best Practices

1. **Page Object Pattern**: Create reusable page objects for complex interactions
2. **Wait Strategies**: Use `waitForSelector` and `expect` with timeouts
3. **Error Handling**: Tests gracefully handle missing elements or features
4. **Mobile Testing**: All tests verify responsive behavior
5. **Accessibility**: Tests include basic accessibility checks
6. **Performance**: Tests validate performance metrics where applicable

## Debugging

1. **Headed Mode**: See browser actions in real-time
```bash
npm run test:headed
```

2. **Debug Mode**: Step through tests with browser developer tools
```bash
npm run test:debug
```

3. **UI Mode**: Interactive test runner
```bash
npm run test:ui
```

4. **Trace Viewer**: Analyze failed test traces
```bash
npx playwright show-trace test-results/trace.zip
```

## Environment Variables

- `BASE_URL`: Base URL for tests (default: http://localhost:3000)
- `CI`: Enable CI mode with different retry/worker settings

## Maintenance

1. **Update Browsers**: Keep Playwright browsers updated
```bash
npm run install-browsers
```

2. **Clean Results**: Remove old test results
```bash
npm run clean
```

3. **Record Tests**: Create tests with recording
```bash
npm run test:record
```