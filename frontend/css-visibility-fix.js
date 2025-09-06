// Emergency CSS visibility fix for debugging
console.log('🚨 [CSS-FIX] Starting comprehensive visibility fix...');

// Check initial HTML visibility state
console.log('🔍 [CSS-FIX] Initial HTML classes:', document.documentElement.className);
console.log('🔍 [CSS-FIX] Initial HTML visibility:', getComputedStyle(document.documentElement).visibility);

// Force add the stylesheets-loaded class immediately
document.documentElement.classList.add('stylesheets-loaded');
console.log('✅ [CSS-FIX] Added stylesheets-loaded class');

// Also force visibility on html and body elements as backup
document.documentElement.style.visibility = 'visible !important';
document.body.style.visibility = 'visible !important';
document.body.style.display = 'block !important';
console.log('✅ [CSS-FIX] Forced HTML and body visibility');

// Immediately check and fix visibility without waiting
function forceVisibilityFix() {
    console.log('🔧 [CSS-FIX] Running immediate visibility fix...');
    
    // Force visibility on critical elements
    const criticalElements = [
        'product-content',
        'product-detail-container', 
        'main-container',
        'product-info',
        'product-title',
        'product-summary',
        'product-actions',
        'price-section',
        'quantity-section'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const currentStyles = getComputedStyle(element);
            console.log(`🔍 [CSS-FIX] Element #${id} - display: ${currentStyles.display}, visibility: ${currentStyles.visibility}, opacity: ${currentStyles.opacity}`);
            
            // Force visibility with !important
            element.style.cssText += 'display: block !important; visibility: visible !important; opacity: 1 !important;';
            console.log(`✅ [CSS-FIX] Forced visibility on #${id}`);
        } else {
            console.warn(`⚠️ [CSS-FIX] Element #${id} not found`);
        }
    });
    
    // Also check container elements
    const containers = document.querySelectorAll('.container, .container-fluid, main, .row, .col');
    console.log(`🔍 [CSS-FIX] Found ${containers.length} container elements`);
    containers.forEach((container, index) => {
        if (container.id || container.className) {
            container.style.cssText += 'display: block !important; visibility: visible !important; opacity: 1 !important;';
            console.log(`✅ [CSS-FIX] Fixed container ${index}: ${container.id || container.className}`);
        }
    });
}

// Run fix immediately
forceVisibilityFix();

// Run fix again after a short delay to catch dynamically loaded content
setTimeout(forceVisibilityFix, 500);
setTimeout(forceVisibilityFix, 1000);
setTimeout(forceVisibilityFix, 2000);

// Add a global style to override any hiding CSS rules
const emergencyStyle = document.createElement('style');
emergencyStyle.innerHTML = `
    html, body {
        visibility: visible !important;
        display: block !important;
    }
    #product-content,
    #product-detail-container,
    #main-container,
    .product-section {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
`;
document.head.appendChild(emergencyStyle);
console.log('✅ [CSS-FIX] Added emergency CSS overrides');