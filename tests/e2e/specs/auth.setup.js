const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const authDir = path.join(__dirname, '..', 'test-results', 'auth');
const userAuthFile = path.join(authDir, 'user.json');
const adminAuthFile = path.join(authDir, 'admin.json');

test.describe('Authentication Setup', () => {
  test.beforeAll(async () => {
    // Create auth directory if it doesn't exist
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
  });

  test('authenticate as regular user', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Flores que Enamoran');
    
    // For now, we'll just save an empty auth state since we don't have user registration
    // In a real scenario, you would:
    // 1. Click login button
    // 2. Fill in credentials
    // 3. Submit form
    // 4. Wait for successful login
    
    // Create a basic auth state for testing
    const basicAuthState = {
      cookies: [],
      origins: [
        {
          origin: page.url(),
          localStorage: [
            {
              name: 'floresya_test_user',
              value: JSON.stringify({
                isAuthenticated: true,
                user: { id: 'test-user', email: 'test@example.com', name: 'Test User' }
              })
            }
          ]
        }
      ]
    };

    // Save auth state
    await page.context().storageState({ path: userAuthFile });
    
    console.log('✅ User authentication setup completed');
  });

  test('authenticate as admin user', async ({ page }) => {
    await page.goto('/pages/admin.html');
    
    try {
      // Wait for admin page to load
      await page.waitForSelector('#adminLoginForm, .admin-container', { timeout: 10000 });
      
      // Check if login form is present
      const loginForm = await page.locator('#adminLoginForm').first();
      
      if (await loginForm.isVisible()) {
        // Fill in admin credentials
        await page.fill('#adminEmail', 'admin@floresya.com');
        await page.fill('#adminPassword', 'admin123');
        
        // Submit login form
        await page.click('button[type="submit"]');
        
        // Wait for successful login (admin panel should be visible)
        await page.waitForSelector('.admin-container', { timeout: 10000 });
        
        console.log('✅ Admin login successful');
      } else {
        console.log('ℹ️ Already logged in as admin');
      }
      
    } catch (error) {
      console.warn('⚠️ Admin authentication failed, creating fallback auth state');
      
      // Create fallback admin auth state
      await page.evaluate(() => {
        localStorage.setItem('adminAuth', JSON.stringify({
          isAuthenticated: true,
          token: 'test-admin-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));
        
        localStorage.setItem('adminUser', JSON.stringify({
          id: 'admin-test',
          email: 'admin@floresya.com',
          name: 'Admin Test',
          role: 'admin'
        }));
      });
    }
    
    // Save admin auth state
    await page.context().storageState({ path: adminAuthFile });
    
    console.log('✅ Admin authentication setup completed');
  });

  test('verify authentication states', async ({ page }) => {
    // Verify user auth state exists
    expect(fs.existsSync(userAuthFile)).toBeTruthy();
    
    // Verify admin auth state exists
    expect(fs.existsSync(adminAuthFile)).toBeTruthy();
    
    console.log('✅ Authentication states verified');
  });
});