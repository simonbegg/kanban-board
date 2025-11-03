# 🧪 E2E Testing Guide - Three Lanes Kanban Board

## 🎯 Overview
Comprehensive end-to-end testing setup using Playwright to ensure the kanban board works flawlessly across all browsers and devices.

## 📋 Test Coverage Areas

### **🔐 Authentication Tests**
- User sign up flow
- User sign in flow  
- Sign out functionality
- Session persistence
- Error handling for invalid credentials
- Form validation (email format, password match)

### **📋 Kanban Core Functionality**
- Board creation and management
- Task CRUD operations (Create, Read, Update, Delete)
- Drag and drop between columns
- Board switching (Home, Work, Life)
- Task position updates
- Column management

### **💰 Pro/Free Tier Features**
- Plan enforcement and limits
- Board limits (1 free, 500 pro)
- Task limits per board (100)
- Archive functionality (90 days free, 36500 days pro)
- Upgrade/downgrade flows
- Usage statistics display

### **👑 Admin Panel**
- User management interface
- Pro plan granting/revoking
- User search and filtering
- Bulk operations
- User data export
- Usage statistics for all users

### **📱 Mobile Responsiveness**
- Mobile navigation (hamburger menu)
- Touch interactions and gestures
- Mobile-optimized layouts
- Keyboard handling
- Orientation changes
- Tablet responsiveness

## 🛠️ Running Tests

### **Local Development**
```bash
# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run tests with UI (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (show browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# Generate new tests with codegen
npm run test:e2e:codegen

# View test results
npm run test:e2e:report
```

### **Specific Test Suites**
```bash
# Run only authentication tests
npx playwright test auth.spec.ts

# Run only kanban functionality tests
npx playwright test kanban.spec.ts

# Run only Pro features tests
npx playwright test pro-features.spec.ts

# Run only admin panel tests
npx playwright test admin.spec.ts

# Run only responsive tests
npx playwright test responsive.spec.ts
```

### **Cross-Browser Testing**
```bash
# Run on specific browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run mobile tests
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"

# Run tablet tests
npx playwright test --project="iPad Pro"
```

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── auth.spec.ts              # Authentication flow tests
│   ├── kanban.spec.ts            # Core kanban functionality
│   ├── pro-features.spec.ts      # Pro/Free tier features
│   ├── admin.spec.ts             # Admin panel functionality
│   └── responsive.spec.ts        # Mobile and tablet responsiveness
├── utils/
│   └── test-helpers.ts           # Reusable test utilities
└── fixtures/                     # Test data and mock responses
```

## 🔧 Test Configuration

### **Playwright Config**
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Tablet**: iPad Pro
- **Timeouts**: 10 seconds for actions, 60 seconds for tests
- **Retries**: 2 on CI, 0 locally
- **Reporting**: HTML reports with screenshots and videos

### **Test Helpers**
Custom fixtures and utilities in `tests/utils/test-helpers.ts`:
- `authenticatedPage` - Auto-signed in page
- `adminPage` - Admin-signed in page
- Helper methods for common actions
- Test data constants

## 🎯 Writing New Tests

### **Test Template**
```typescript
import { test, expect } from '@playwright/test';

test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
    // Sign in or perform other setup
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('[data-testid="element"]')).toBeVisible();
  });
});
```

### **Best Practices**
1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** instead of using fixed timeouts
3. **Use custom helpers** for repetitive actions
4. **Test both happy path and error cases**
5. **Include mobile and desktop variations**
6. **Add proper assertions** for all critical states

### **Selecting Elements**
```typescript
// Good: Use data-testid
await page.click('[data-testid="submit-button"]');

// Avoid: Brittle selectors
await page.click('button[type="submit"]'); // Might change
await page.click('text=Submit'); // Might be translated
```

### **Waiting for Elements**
```typescript
// Good: Wait for specific condition
await expect(page.locator('[data-testid="loading"]')).not.toBeVisible();

// Avoid: Fixed timeouts
await page.waitForTimeout(3000); // Unreliable and slow
```

## 🐛 Debugging Tests

### **Debug Mode**
```bash
# Run with debugger
npm run test:e2e:debug

# Or run specific test in debug mode
npx playwright test auth.spec.ts --debug
```

### **VS Code Integration**
1. Install Playwright VS Code extension
2. Use "Debug Test" option in test editor
3. Set breakpoints in test code

### **Trace Viewer**
```bash
# View trace files for failed tests
npx playwright show-trace trace.zip
```

### **Screenshots and Videos**
- Automatically captured on test failures
- Stored in `test-results/` directory
- Included in CI artifacts for debugging

## 📊 Test Reports

### **HTML Reports**
```bash
# View detailed HTML report
npm run test:e2e:report

# Or open directly
npx playwright show-report
```

### **CI/CD Integration**
- Tests run automatically on push/PR
- Results uploaded as GitHub artifacts
- Failed tests include screenshots and videos
- Cross-browser and mobile test coverage

## 🔄 CI/CD Pipeline

### **GitHub Actions Workflows**
- **E2E Tests**: Full test suite on Chromium
- **Mobile Tests**: Mobile Chrome and Safari
- **Cross-Browser**: Firefox and WebKit
- **Performance**: Lighthouse CI integration
- **Security**: Dependency and code security checks

### **Test Environment**
- **Database**: Isolated test database
- **Users**: Test user accounts with known credentials
- **Data**: Clean state between tests
- **Timeouts**: Extended for CI environment

## 📱 Mobile Testing

### **Touch Interactions**
```typescript
// Tap
await page.tap('[data-testid="element"]');

// Swipe
await page.touchscreen.swipe(100, 100, 200, 100);

// Long press
await page.locator('[data-testid="element"]').tap();
```

### **Viewport Testing**
```typescript
// Custom viewport
await page.setViewportSize({ width: 375, height: 667 });

// Landscape mode
await page.setViewportSize({ width: 667, height: 375 });
```

## 🎯 Test Data Management

### **Test Users**
- **Free User**: `test@example.com`
- **Admin User**: `simon@teamtwobees.com`
- **Additional Users**: Created programmatically

### **Data Cleanup**
- Tests clean up after themselves
- Isolated test data per test
- Database transactions rolled back

## 📈 Coverage Goals

### **Target Coverage**
- **Authentication**: 100%
- **Core Kanban**: 95%+
- **Pro Features**: 90%+
- **Admin Panel**: 95%+
- **Mobile**: 85%+

### **Critical Paths**
1. User registration → First board → First task
2. Free user → Upgrade to Pro → Advanced features
3. Admin login → User management → Plan changes
4. Mobile login → Task creation → Drag and drop

## 🚀 Next Steps

### **Immediate Actions**
1. ✅ **Run existing tests** to verify setup
2. ✅ **Add missing data-testid attributes** to components
3. ✅ **Update test user credentials** if needed
4. ✅ **Configure CI/CD secrets** for test environment

### **Future Enhancements**
- **Visual regression testing** with Playwright
- **API testing** alongside E2E tests
- **Performance testing** integration
- **Accessibility testing** with axe-playwright
- **Load testing** with k6 or Artillery

---

## 🎯 Ready to Test!

The E2E testing suite is comprehensive and ready to catch bugs before they reach production. Run `npm run test:e2e` to verify everything works correctly!

**Remember**: Good tests prevent regressions and ensure confidence in deployments. 🚀

---

*This testing setup ensures the Three Lanes kanban board works flawlessly across all devices, browsers, and user scenarios.*
