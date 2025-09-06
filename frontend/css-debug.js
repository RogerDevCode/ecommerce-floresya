// CSS Debug - Check which stylesheets are loaded and applied
console.log('🎨 [CSS-DEBUG] Checking CSS application...');

setTimeout(() => {
    // Check if enhanced styles are being applied
    const productInfo = document.querySelector('.product-info-enhanced');
    const priceSection = document.querySelector('.price-section-enhanced');
    const quantitySection = document.querySelector('.quantity-section');
    
    if (productInfo) {
        const styles = getComputedStyle(productInfo);
        console.log('🔍 [CSS-DEBUG] .product-info-enhanced styles:', {
            display: styles.display,
            background: styles.background,
            padding: styles.padding,
            borderRadius: styles.borderRadius
        });
    }
    
    if (priceSection) {
        const styles = getComputedStyle(priceSection);
        console.log('🔍 [CSS-DEBUG] .price-section-enhanced styles:', {
            display: styles.display,
            background: styles.background,
            padding: styles.padding,
            border: styles.border
        });
    }
    
    // Check if product-detail-enhanced.css is loaded
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    console.log('🔍 [CSS-DEBUG] Loaded stylesheets:');
    links.forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.href}`);
        if (link.href.includes('product-detail-enhanced')) {
            console.log('     ✅ Enhanced CSS found!');
        }
    });
    
    // Check for CSS load errors
    links.forEach(link => {
        link.addEventListener('error', () => {
            console.error('❌ [CSS-DEBUG] Failed to load:', link.href);
        });
    });
    
}, 1000);