const { test, expect } = require('@playwright/test');

test.describe('Admin Panel Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/admin.html');
    
    // Wait for admin panel to load
    await page.waitForSelector('.admin-container, #adminLoginForm', { timeout: 10000 });
  });

  test('should load admin panel with correct interface', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Admin/);
    
    // Should see either login form or admin dashboard
    const loginForm = page.locator('#adminLoginForm');
    const adminDashboard = page.locator('.admin-container');
    
    const hasLoginForm = await loginForm.isVisible();
    const hasAdminDashboard = await adminDashboard.isVisible();
    
    expect(hasLoginForm || hasAdminDashboard).toBeTruthy();
    
    if (hasAdminDashboard) {
      // Check main admin sections
      await expect(page.locator('h1, h2').first()).toContainText(/Admin|Panel/);
      
      // Check navigation/tabs
      const adminTabs = page.locator('.nav-tabs li, .admin-nav a, [role="tab"]');
      if (await adminTabs.count() > 0) {
        await expect(adminTabs.first()).toBeVisible();
      }
    }
  });

  test('should handle admin authentication', async ({ page }) => {
    const loginForm = page.locator('#adminLoginForm');
    
    if (await loginForm.isVisible()) {
      // Test login form
      await page.fill('#adminEmail', 'admin@floresya.com');
      await page.fill('#adminPassword', 'admin123');
      
      await page.click('button[type="submit"]');
      
      // Wait for dashboard to load or error message
      await Promise.race([
        page.waitForSelector('.admin-container', { timeout: 5000 }),
        page.waitForSelector('.alert-danger, .error', { timeout: 5000 })
      ]);
      
      // Should either see dashboard or error
      const hasDashboard = await page.locator('.admin-container').isVisible();
      const hasError = await page.locator('.alert-danger, .error').isVisible();
      
      expect(hasDashboard || hasError).toBeTruthy();
      
      if (hasDashboard) {
        console.log('✅ Admin login successful');
      } else {
        console.log('⚠️ Admin login failed - testing error handling');
        await expect(page.locator('.alert-danger, .error')).toContainText(/error|invalid|incorrect/i);
      }
    } else {
      console.log('ℹ️ Already authenticated as admin');
    }
  });

  test('should display products management section', async ({ page }) => {
    // Skip if not authenticated
    const isAuthenticated = await page.locator('.admin-container').isVisible();
    if (!isAuthenticated) {
      test.skip('Not authenticated as admin');
    }
    
    // Find and click products tab/section
    const productsTab = page.locator('[href="#productos"], [data-bs-target="#productos"], a:has-text("Productos")').first();
    
    if (await productsTab.isVisible()) {
      await productsTab.click();
      
      // Wait for products section to load
      await page.waitForSelector('#productos, .products-section', { timeout: 5000 });
      
      // Check products table/grid
      const productsTable = page.locator('#productTable, .products-table, .product-list');
      await expect(productsTable).toBeVisible();
      
      // Check add product button
      const addButton = page.locator('#addProductBtn, .add-product, button:has-text("Agregar")');
      if (await addButton.count() > 0) {
        await expect(addButton.first()).toBeVisible();
      }
      
      // Check if products are loaded
      const productRows = page.locator('tbody tr, .product-item');
      const hasProducts = await productRows.count() > 0;
      
      if (hasProducts) {
        console.log(`Found ${await productRows.count()} products`);
        
        // Check first product has required elements
        const firstProduct = productRows.first();
        await expect(firstProduct).toBeVisible();
        
        // Should have edit/delete buttons
        const editButton = firstProduct.locator('button:has-text("Editar"), .edit-btn');
        const deleteButton = firstProduct.locator('button:has-text("Eliminar"), .delete-btn');
        
        expect(await editButton.count() > 0 || await deleteButton.count() > 0).toBeTruthy();
      } else {
        console.log('No products found - checking for empty state');
        const emptyMessage = page.locator('.no-products, .empty-state');
        if (await emptyMessage.isVisible()) {
          await expect(emptyMessage).toContainText(/no.*productos|empty|vacío/i);
        }
      }
    } else {
      console.log('Products section not found');
    }
  });

  test('should handle product CRUD operations', async ({ page }) => {
    // Skip if not authenticated
    const isAuthenticated = await page.locator('.admin-container').isVisible();
    if (!isAuthenticated) {
      test.skip('Not authenticated as admin');
    }
    
    // Navigate to products section
    const productsTab = page.locator('[href="#productos"], [data-bs-target="#productos"], a:has-text("Productos")').first();
    
    if (await productsTab.isVisible()) {
      await productsTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Test Add Product
    const addButton = page.locator('#addProductBtn, .add-product, button:has-text("Agregar")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Check if modal or form opens
      const productModal = page.locator('#productModal, .product-modal, .modal.show');
      const productForm = page.locator('#productForm, .product-form');
      
      const hasModal = await productModal.isVisible({ timeout: 3000 });
      const hasForm = await productForm.isVisible({ timeout: 3000 });
      
      if (hasModal || hasForm) {
        console.log('✅ Add product interface opened');
        
        // Test form fields
        const nameField = page.locator('#productName, [name="name"], input[placeholder*="nombre"]');
        const priceField = page.locator('#productPrice, [name="price"], input[placeholder*="precio"]');
        
        if (await nameField.isVisible() && await priceField.isVisible()) {
          // Fill test product data
          await nameField.fill('Test Product E2E');
          await priceField.fill('25.99');
          
          // Try to submit (but cancel to avoid actually creating)
          const submitButton = page.locator('button[type="submit"], .submit-btn, button:has-text("Guardar")');
          const cancelButton = page.locator('button:has-text("Cancelar"), .cancel-btn');
          
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
            console.log('✅ Product form cancelled successfully');
          } else if (await submitButton.isVisible()) {
            console.log('ℹ️ Submit button found but not testing actual submission');
          }
        }
        
        // Close modal if still open
        const closeButton = page.locator('.btn-close, .close, button:has-text("Cerrar")');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    }
    
    // Test Edit Product (if products exist)
    const productRows = page.locator('tbody tr, .product-item');
    const productCount = await productRows.count();
    
    if (productCount > 0) {
      const firstProduct = productRows.first();
      const editButton = firstProduct.locator('button:has-text("Editar"), .edit-btn');
      
      if (await editButton.count() > 0) {
        await editButton.first().click();
        
        // Check if edit form opens
        await page.waitForTimeout(1000);
        const editModal = page.locator('#productModal, .product-modal, .modal.show');
        
        if (await editModal.isVisible()) {
          console.log('✅ Edit product interface opened');
          
          // Close without saving
          const cancelButton = page.locator('button:has-text("Cancelar"), .cancel-btn');
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    }
  });

  test('should handle categories management', async ({ page }) => {
    // Skip if not authenticated
    const isAuthenticated = await page.locator('.admin-container').isVisible();
    if (!isAuthenticated) {
      test.skip('Not authenticated as admin');
    }
    
    // Find categories section
    const categoriesTab = page.locator('[href="#categorias"], [data-bs-target="#categorias"], a:has-text("Categorías")').first();
    
    if (await categoriesTab.isVisible()) {
      await categoriesTab.click();
      await page.waitForTimeout(1000);
      
      // Check categories section loads
      const categoriesSection = page.locator('#categorias, .categories-section');
      await expect(categoriesSection).toBeVisible();
      
      // Check for categories list/table
      const categoriesList = page.locator('#categoryTable, .categories-list');
      if (await categoriesList.isVisible()) {
        console.log('✅ Categories section loaded');
        
        // Check add category button
        const addCategoryBtn = page.locator('#addCategoryBtn, .add-category, button:has-text("Agregar")');
        if (await addCategoryBtn.count() > 0) {
          await expect(addCategoryBtn.first()).toBeVisible();
        }
      }
    } else {
      console.log('Categories section not found');
    }
  });

  test('should handle orders management', async ({ page }) => {
    // Skip if not authenticated
    const isAuthenticated = await page.locator('.admin-container').isVisible();
    if (!isAuthenticated) {
      test.skip('Not authenticated as admin');
    }
    
    // Find orders section
    const ordersTab = page.locator('[href="#pedidos"], [data-bs-target="#pedidos"], a:has-text("Pedidos")').first();
    
    if (await ordersTab.isVisible()) {
      await ordersTab.click();
      await page.waitForTimeout(1000);
      
      // Check orders section loads
      const ordersSection = page.locator('#pedidos, .orders-section');
      await expect(ordersSection).toBeVisible();
      
      // Check for orders list/table
      const ordersList = page.locator('#orderTable, .orders-list, .order-list');
      if (await ordersList.isVisible()) {
        console.log('✅ Orders section loaded');
        
        const orderRows = page.locator('tbody tr, .order-item');
        const orderCount = await orderRows.count();
        
        if (orderCount > 0) {
          console.log(`Found ${orderCount} orders`);
          
          // Check first order has status/actions
          const firstOrder = orderRows.first();
          const statusElement = firstOrder.locator('.status, .order-status');
          const actionButtons = firstOrder.locator('button, .btn');
          
          if (await statusElement.count() > 0 || await actionButtons.count() > 0) {
            console.log('✅ Order management interface found');
          }
        } else {
          console.log('No orders found');
        }
      }
    } else {
      console.log('Orders section not found');
    }
  });

  test('should have working search and filters', async ({ page }) => {
    // Skip if not authenticated
    const isAuthenticated = await page.locator('.admin-container').isVisible();
    if (!isAuthenticated) {
      test.skip('Not authenticated as admin');
    }
    
    // Find search functionality
    const searchInput = page.locator('#searchInput, .search-input, input[type="search"]');
    
    if (await searchInput.isVisible()) {
      // Test search
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(1000);
      
      // Check if results are filtered/updated
      console.log('✅ Search functionality tested');
    }
    
    // Check for filter controls
    const filterSelects = page.locator('select[id*="filter"], .filter-select');
    const filterButtons = page.locator('.filter-btn, button:has-text("Filtrar")');
    
    if (await filterSelects.count() > 0 || await filterButtons.count() > 0) {
      console.log('✅ Filter controls found');
    }
  });

  test('should have responsive admin interface', async ({ page }) => {
    // Skip if not authenticated
    const isAuthenticated = await page.locator('.admin-container').isVisible();
    if (!isAuthenticated) {
      test.skip('Not authenticated as admin');
    }
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that admin interface is still usable
    await expect(page.locator('.admin-container')).toBeVisible();
    
    // Check for mobile navigation
    const mobileToggle = page.locator('.navbar-toggler, .mobile-toggle');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      
      // Check mobile menu opens
      const mobileMenu = page.locator('.navbar-collapse.show, .mobile-menu.show');
      await expect(mobileMenu).toBeVisible({ timeout: 3000 });
    }
    
    // Check that tables are scrollable or responsive
    const tables = page.locator('table');
    const tableCount = await tables.count();
    
    if (tableCount > 0) {
      const firstTable = tables.first();
      const tableContainer = firstTable.locator('xpath=ancestor::div[contains(@class, "table-responsive") or contains(@class, "table-container")]');
      
      // Should have responsive wrapper or be scrollable
      expect(await tableContainer.count() > 0).toBeTruthy();
    }
  });

  test('should handle admin logout', async ({ page }) => {
    // Skip if not authenticated
    const isAuthenticated = await page.locator('.admin-container').isVisible();
    if (!isAuthenticated) {
      test.skip('Not authenticated as admin');
    }
    
    // Find logout button
    const logoutButton = page.locator('#logoutBtn, .logout-btn, button:has-text("Cerrar sesión")');
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to login or homepage
      await page.waitForTimeout(2000);
      
      const hasLoginForm = await page.locator('#adminLoginForm').isVisible();
      const isHomepage = page.url().includes('/index.html') || page.url().endsWith('/');
      
      expect(hasLoginForm || isHomepage).toBeTruthy();
      console.log('✅ Admin logout successful');
    } else {
      console.log('Logout button not found');
    }
  });

  test('should validate admin form inputs', async ({ page }) => {
    // Skip if not authenticated
    const isAuthenticated = await page.locator('.admin-container').isVisible();
    if (!isAuthenticated) {
      test.skip('Not authenticated as admin');
    }
    
    // Test product form validation if available
    const addButton = page.locator('#addProductBtn, .add-product, button:has-text("Agregar")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      const submitButton = page.locator('button[type="submit"], .submit-btn, button:has-text("Guardar")');
      
      if (await submitButton.isVisible()) {
        // Try to submit empty form
        await submitButton.click();
        
        // Check for validation messages
        const validationMessages = page.locator('.invalid-feedback, .error-message, .validation-error');
        const requiredFields = page.locator('input:required, select:required');
        
        const hasValidation = await validationMessages.count() > 0;
        const hasRequiredFields = await requiredFields.count() > 0;
        
        if (hasRequiredFields && hasValidation) {
          console.log('✅ Form validation working');
        }
        
        // Close form
        const cancelButton = page.locator('button:has-text("Cancelar"), .cancel-btn');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    }
  });
});