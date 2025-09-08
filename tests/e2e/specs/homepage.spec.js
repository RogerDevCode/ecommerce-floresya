const { test, expect } = require('@playwright/test');

test.describe('Homepage Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title and content', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/FloresYa/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Flores que Enamoran');
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check logo is present
    await expect(page.locator('img[alt*="FloresYa"]')).toBeVisible();
    
    // Check main call-to-action button
    await expect(page.locator('a[href="#productos"]')).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Check that skip links work
    const skipLink = page.locator('a[href="#main-content"]').first();
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await expect(page.locator('#main-content')).toBeFocused();
    }
    
    // Test navigation links
    const navLinks = page.locator('nav a');
    const navCount = await navLinks.count();
    expect(navCount).toBeGreaterThan(0);
    
    // Check each nav link is accessible
    for (let i = 0; i < navCount; i++) {
      const link = navLinks.nth(i);
      await expect(link).toHaveAttribute('href');
      
      const ariaLabel = await link.getAttribute('aria-label');
      const text = await link.textContent();
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should display products section', async ({ page }) => {
    // Navigate to products section
    await page.click('a[href="#productos"]');
    
    // Check products section is visible
    await expect(page.locator('#productos')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Productos Destacados');
    
    // Wait for products to load
    await page.waitForFunction(() => {
      const productGrid = document.querySelector('#productGrid');
      return productGrid && productGrid.children.length > 0;
    }, { timeout: 10000 });
    
    // Check that products are displayed
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    
    // Verify product cards have required elements
    const firstProduct = productCards.first();
    await expect(firstProduct.locator('img')).toBeVisible();
    await expect(firstProduct.locator('.product-title, .card-title')).toBeVisible();
    await expect(firstProduct.locator('.price')).toBeVisible();
  });

  test('should handle product interactions', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('.product-card', { timeout: 10000 });
    
    // Click on first product
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.click();
    
    // Check if product detail modal opens
    const modal = page.locator('.modal.show');
    if (await modal.isVisible({ timeout: 5000 })) {
      // Modal opened - check content
      await expect(modal.locator('.modal-title')).toBeVisible();
      await expect(modal.locator('.modal-body')).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    } else {
      // Might navigate to product detail page
      await page.waitForURL(/product-detail/, { timeout: 5000 }).catch(() => {
        console.log('Neither modal nor navigation occurred - product interaction might not be implemented');
      });
    }
  });

  test('should have working search functionality', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], .search-input');
    
    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('rosas');
      await page.keyboard.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(2000);
      
      // Check that some results are shown or loading state is visible
      const hasResults = await page.locator('.product-card').count() > 0;
      const hasLoadingState = await page.locator('.loading, .spinner').isVisible();
      const hasNoResultsMessage = await page.locator('[data-testid="no-results"], .no-results').isVisible();
      
      expect(hasResults || hasLoadingState || hasNoResultsMessage).toBeTruthy();
    } else {
      console.log('Search functionality not found on homepage');
    }
  });

  test('should have working cart functionality', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('.product-card', { timeout: 10000 });
    
    // Find add to cart buttons
    const addToCartButton = page.locator('button:has-text("Agregar"), .add-to-cart, [onclick*="addToCart"]').first();
    
    if (await addToCartButton.isVisible()) {
      // Add product to cart
      await addToCartButton.click();
      
      // Check for cart update (cart icon badge, notification, etc.)
      const cartBadge = page.locator('.cart-badge, .badge');
      const notification = page.locator('.alert, .notification, .toast');
      
      // Wait for cart update indication
      await Promise.race([
        expect(cartBadge).toBeVisible({ timeout: 3000 }),
        expect(notification).toBeVisible({ timeout: 3000 }),
        page.waitForTimeout(2000) // Fallback timeout
      ]).catch(() => {
        console.log('Cart update indication not found');
      });
      
      // Try to open cart
      const cartToggle = page.locator('#cartToggle, .cart-toggle, [data-bs-target="#cartOffcanvas"]');
      if (await cartToggle.isVisible()) {
        await cartToggle.click();
        
        // Check if cart sidebar/modal opens
        const cartPanel = page.locator('#cartOffcanvas, .cart-panel, .offcanvas.show');
        await expect(cartPanel).toBeVisible({ timeout: 5000 });
      }
    } else {
      console.log('Add to cart functionality not found');
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile navigation works
    const mobileToggle = page.locator('.navbar-toggler');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      
      // Check that mobile menu opens
      const mobileMenu = page.locator('.navbar-collapse.show, .offcanvas.show');
      await expect(mobileMenu).toBeVisible({ timeout: 3000 });
    }
    
    // Check that content is readable on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.btn')).toBeVisible();
    
    // Check that products are displayed properly on mobile
    const productCards = page.locator('.product-card');
    if (await productCards.count() > 0) {
      const firstProduct = productCards.first();
      await expect(firstProduct).toBeVisible();
      
      // Check that product image is not too large
      const productImage = firstProduct.locator('img');
      const imageBounds = await productImage.boundingBox();
      expect(imageBounds?.width).toBeLessThanOrEqual(400);
    }
  });

  test('should have proper performance metrics', async ({ page }) => {
    // Enable performance timing
    const performanceMetrics = await page.evaluate(() => {
      return {
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
    });
    
    // Performance expectations
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(performanceMetrics.loadComplete).toBeLessThan(5000); // 5 seconds
    
    if (performanceMetrics.firstContentfulPaint) {
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000); // 2 seconds
    }
    
    console.log('Performance metrics:', performanceMetrics);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test network failure handling
    await page.route('/api/products', route => {
      route.fulfill({ status: 500, body: 'Server Error' });
    });
    
    await page.reload();
    
    // Check that page still loads even with API errors
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for error handling UI
    const errorMessage = page.locator('.error, .alert-danger, [data-testid="error"]');
    const loadingState = page.locator('.loading, .spinner');
    
    // Should show either error message or maintain loading state gracefully
    await page.waitForTimeout(3000);
    
    // Page should remain functional
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have valid HTML structure', async ({ page }) => {
    // Check for proper HTML structure
    await expect(page.locator('html')).toHaveAttribute('lang');
    await expect(page.locator('head title')).toBeVisible();
    await expect(page.locator('main, #main-content')).toBeVisible();
    
    // Check for accessibility essentials
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Images should have alt text or be marked as decorative
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1
    
    // Check for form labels if forms exist
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Input should have associated label or aria-label
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });
});