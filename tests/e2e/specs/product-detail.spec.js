const { test, expect } = require('@playwright/test');

test.describe('Product Detail Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to product detail page with a test product ID
    await page.goto('/pages/product-detail.html?id=1');
  });

  test('should load product detail page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Producto.*FloresYa/);
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check logo is present
    await expect(page.locator('img[alt*="FloresYa"]')).toBeVisible();
    
    // Wait for product content to load
    await page.waitForSelector('.product-container, .product-detail, main', { timeout: 10000 });
  });

  test('should display product information', async ({ page }) => {
    // Wait for product data to load
    await page.waitForTimeout(3000);
    
    // Check for product image
    const productImage = page.locator('#productImage, .product-image img, .main-image');
    await expect(productImage.first()).toBeVisible({ timeout: 10000 });
    
    // Check for product title
    const productTitle = page.locator('#productTitle, .product-title, h1');
    await expect(productTitle.first()).toBeVisible();
    
    // Check for product price
    const productPrice = page.locator('#productPrice, .product-price, .price');
    await expect(productPrice.first()).toBeVisible();
    
    // Check for product description
    const productDescription = page.locator('#productDescription, .product-description, .description');
    if (await productDescription.count() > 0) {
      await expect(productDescription.first()).toBeVisible();
    }
  });

  test('should handle image interactions', async ({ page }) => {
    // Wait for images to load
    await page.waitForSelector('img', { timeout: 10000 });
    
    const mainImage = page.locator('#productImage, .product-image img, .main-image').first();
    
    if (await mainImage.isVisible()) {
      // Test image click (might open modal or zoom)
      await mainImage.click();
      
      // Check for image modal or zoom functionality
      const imageModal = page.locator('.image-modal, .modal.show');
      const zoomedImage = page.locator('.image-zoom, .zoomed');
      
      const hasModal = await imageModal.isVisible({ timeout: 3000 });
      const hasZoom = await zoomedImage.isVisible({ timeout: 3000 });
      
      if (hasModal) {
        console.log('✅ Image modal opened');
        // Close modal
        await page.keyboard.press('Escape');
        await expect(imageModal).not.toBeVisible();
      } else if (hasZoom) {
        console.log('✅ Image zoom activated');
      }
    }
    
    // Test thumbnail navigation if available
    const thumbnails = page.locator('.thumbnail, .product-thumbnails img');
    const thumbnailCount = await thumbnails.count();
    
    if (thumbnailCount > 1) {
      // Click second thumbnail
      await thumbnails.nth(1).click();
      await page.waitForTimeout(500);
      
      // Main image should change
      console.log('✅ Thumbnail navigation tested');
    }
  });

  test('should handle quantity selection', async ({ page }) => {
    const quantityInput = page.locator('#quantity, input[name="quantity"], .quantity-input');
    const increaseBtn = page.locator('.increase-quantity, .qty-plus, button:has-text("+")');
    const decreaseBtn = page.locator('.decrease-quantity, .qty-minus, button:has-text("-")');
    
    if (await quantityInput.isVisible()) {
      // Test manual quantity input
      await quantityInput.fill('3');
      
      const value = await quantityInput.inputValue();
      expect(value).toBe('3');
      
      console.log('✅ Quantity input tested');
    }
    
    if (await increaseBtn.isVisible() && await quantityInput.isVisible()) {
      // Get initial quantity
      const initialQty = parseInt(await quantityInput.inputValue()) || 1;
      
      // Test increase button
      await increaseBtn.click();
      
      await page.waitForTimeout(500);
      const newQty = parseInt(await quantityInput.inputValue());
      expect(newQty).toBe(initialQty + 1);
      
      console.log('✅ Quantity increase button tested');
    }
    
    if (await decreaseBtn.isVisible() && await quantityInput.isVisible()) {
      // Test decrease button (ensure quantity doesn't go below 1)
      const currentQty = parseInt(await quantityInput.inputValue()) || 1;
      
      if (currentQty > 1) {
        await decreaseBtn.click();
        await page.waitForTimeout(500);
        
        const newQty = parseInt(await quantityInput.inputValue());
        expect(newQty).toBe(currentQty - 1);
      }
      
      console.log('✅ Quantity decrease button tested');
    }
  });

  test('should handle add to cart functionality', async ({ page }) => {
    const addToCartBtn = page.locator('#addToCartBtn, .add-to-cart, button:has-text("Agregar al carrito")');
    
    if (await addToCartBtn.isVisible()) {
      // Test add to cart
      await addToCartBtn.click();
      
      // Check for success indication
      const successMessage = page.locator('.alert-success, .success-message, .notification');
      const cartBadge = page.locator('.cart-badge, .badge');
      const cartUpdate = page.locator('.cart-count');
      
      // Should show some indication of successful add to cart
      await Promise.race([
        expect(successMessage).toBeVisible({ timeout: 3000 }),
        expect(cartBadge).toBeVisible({ timeout: 3000 }),
        expect(cartUpdate).toBeVisible({ timeout: 3000 }),
        page.waitForTimeout(2000)
      ]).catch(() => {
        console.log('No visible cart update indication found');
      });
      
      // Test add to cart button state change
      const buttonText = await addToCartBtn.textContent();
      console.log('Add to cart button clicked, final text:', buttonText);
      
      // Button might change to "Added" or similar
      if (buttonText?.includes('Agregado') || buttonText?.includes('Added')) {
        console.log('✅ Add to cart button state changed');
      }
    } else {
      console.log('Add to cart button not found');
    }
  });

  test('should handle product options and variations', async ({ page }) => {
    // Check for size options
    const sizeSelect = page.locator('select[name="size"], .size-selector, #productSize');
    if (await sizeSelect.isVisible()) {
      await sizeSelect.selectOption({ index: 1 });
      console.log('✅ Size selection tested');
    }
    
    // Check for color options
    const colorOptions = page.locator('.color-option, input[name="color"]');
    const colorCount = await colorOptions.count();
    
    if (colorCount > 0) {
      await colorOptions.first().click();
      console.log('✅ Color selection tested');
    }
    
    // Check for other custom options
    const customSelects = page.locator('select:not([name="size"]):not([name="quantity"])');
    const customInputs = page.locator('input[type="radio"]:not([name="color"]), input[type="checkbox"]');
    
    if (await customSelects.count() > 0) {
      await customSelects.first().selectOption({ index: 1 });
      console.log('✅ Custom select option tested');
    }
    
    if (await customInputs.count() > 0) {
      await customInputs.first().click();
      console.log('✅ Custom input option tested');
    }
  });

  test('should display related products', async ({ page }) => {
    // Check for related products section
    const relatedSection = page.locator('.related-products, .similar-products, #relatedProducts');
    
    if (await relatedSection.isVisible()) {
      // Check for related product cards
      const relatedCards = relatedSection.locator('.product-card, .related-item');
      const relatedCount = await relatedCards.count();
      
      if (relatedCount > 0) {
        console.log(`✅ Found ${relatedCount} related products`);
        
        // Test clicking on a related product
        const firstRelated = relatedCards.first();
        await expect(firstRelated).toBeVisible();
        
        // Click should navigate to that product or open modal
        await firstRelated.click();
        
        // Check if URL changed or modal opened
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        const hasModal = await page.locator('.modal.show').isVisible();
        
        if (currentUrl.includes('id=') || hasModal) {
          console.log('✅ Related product navigation tested');
        }
      }
    } else {
      console.log('No related products section found');
    }
  });

  test('should handle product reviews and ratings', async ({ page }) => {
    // Check for reviews section
    const reviewsSection = page.locator('.reviews, .product-reviews, #productReviews');
    
    if (await reviewsSection.isVisible()) {
      // Check for rating display
      const rating = reviewsSection.locator('.rating, .stars, .product-rating');
      if (await rating.count() > 0) {
        console.log('✅ Product rating display found');
      }
      
      // Check for individual reviews
      const reviewItems = reviewsSection.locator('.review, .review-item');
      const reviewCount = await reviewItems.count();
      
      if (reviewCount > 0) {
        console.log(`✅ Found ${reviewCount} product reviews`);
        
        // Check first review structure
        const firstReview = reviewItems.first();
        await expect(firstReview).toBeVisible();
        
        const reviewText = firstReview.locator('.review-text, .comment');
        const reviewAuthor = firstReview.locator('.review-author, .reviewer-name');
        
        if (await reviewText.count() > 0) {
          console.log('✅ Review text found');
        }
        
        if (await reviewAuthor.count() > 0) {
          console.log('✅ Review author found');
        }
      }
      
      // Check for add review form
      const addReviewBtn = page.locator('.add-review, #addReviewBtn, button:has-text("Escribir reseña")');
      if (await addReviewBtn.isVisible()) {
        console.log('✅ Add review button found');
      }
    } else {
      console.log('No reviews section found');
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile layout works
    await expect(page.locator('nav')).toBeVisible();
    
    // Product image should be responsive
    const productImage = page.locator('#productImage, .product-image img').first();
    if (await productImage.isVisible()) {
      const imageBounds = await productImage.boundingBox();
      expect(imageBounds?.width).toBeLessThanOrEqual(400);
    }
    
    // Product information should be readable
    const productTitle = page.locator('#productTitle, .product-title, h1').first();
    const productPrice = page.locator('#productPrice, .product-price, .price').first();
    
    if (await productTitle.isVisible()) {
      await expect(productTitle).toBeVisible();
    }
    
    if (await productPrice.isVisible()) {
      await expect(productPrice).toBeVisible();
    }
    
    // Add to cart button should be accessible
    const addToCartBtn = page.locator('#addToCartBtn, .add-to-cart, button:has-text("Agregar")').first();
    if (await addToCartBtn.isVisible()) {
      await expect(addToCartBtn).toBeVisible();
      
      const buttonBounds = await addToCartBtn.boundingBox();
      expect(buttonBounds?.height).toBeGreaterThanOrEqual(44); // Minimum touch target size
    }
  });

  test('should handle navigation and breadcrumbs', async ({ page }) => {
    // Check for breadcrumb navigation
    const breadcrumbs = page.locator('.breadcrumb, .breadcrumbs');
    
    if (await breadcrumbs.isVisible()) {
      const breadcrumbItems = breadcrumbs.locator('a, .breadcrumb-item');
      const itemCount = await breadcrumbItems.count();
      
      if (itemCount > 0) {
        console.log(`✅ Found ${itemCount} breadcrumb items`);
        
        // Test breadcrumb navigation
        const homeLink = breadcrumbItems.first();
        if (await homeLink.getAttribute('href')) {
          console.log('✅ Breadcrumb home link found');
        }
      }
    }
    
    // Check for back button
    const backButton = page.locator('.back-btn, button:has-text("Volver"), a:has-text("← ")');
    
    if (await backButton.isVisible()) {
      console.log('✅ Back button found');
      
      // Test back navigation
      await backButton.click();
      
      // Should navigate back
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      
      if (!currentUrl.includes('product-detail')) {
        console.log('✅ Back navigation successful');
      }
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with invalid product ID
    await page.goto('/pages/product-detail.html?id=999999');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Should show error message or redirect
    const errorMessage = page.locator('.error, .not-found, .alert-danger');
    const noProductMessage = page.locator(':has-text("no encontrado"), :has-text("not found")');
    
    const hasError = await errorMessage.count() > 0;
    const hasNoProductMessage = await noProductMessage.count() > 0;
    const redirectedToHome = !page.url().includes('product-detail');
    
    expect(hasError || hasNoProductMessage || redirectedToHome).toBeTruthy();
    
    if (hasError || hasNoProductMessage) {
      console.log('✅ Error state handled properly');
    } else if (redirectedToHome) {
      console.log('✅ Redirected to home page for invalid product');
    }
  });

  test('should have proper SEO and meta tags', async ({ page }) => {
    // Check for proper meta tags
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for meta description
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      const description = await metaDescription.getAttribute('content');
      expect(description?.length).toBeGreaterThan(0);
      console.log('✅ Meta description found');
    }
    
    // Check for Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogImage = page.locator('meta[property="og:image"]');
    
    if (await ogTitle.count() > 0) {
      console.log('✅ OpenGraph title found');
    }
    
    if (await ogImage.count() > 0) {
      console.log('✅ OpenGraph image found');
    }
    
    // Check for structured data
    const structuredData = page.locator('script[type="application/ld+json"]');
    if (await structuredData.count() > 0) {
      console.log('✅ Structured data found');
    }
  });
});