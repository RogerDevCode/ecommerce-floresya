// Debug script to add logging to renderProductInfo function

console.log('🔧 Adding debug logging to renderProductInfo...');

// Override the renderProductInfo function with enhanced logging
if (window.productDetailManager && typeof window.productDetailManager.renderProductInfo === 'function') {
    const originalRenderProductInfo = window.productDetailManager.renderProductInfo;
    
    window.productDetailManager.renderProductInfo = function() {
        console.log('📋 [DEBUG] Starting renderProductInfo function...');
        console.log('📦 [DEBUG] Product data:', this.product);
        console.log('💱 [DEBUG] Exchange rate:', this.exchangeRate);
        
        try {
            console.log('🔤 [DEBUG] Setting product title...');
            const titleElement = document.getElementById('product-title');
            console.log('🔍 [DEBUG] Title element found:', !!titleElement);
            if (titleElement && this.product && this.product.name) {
                titleElement.textContent = this.product.name;
                console.log('✅ [DEBUG] Product title set successfully');
            } else {
                console.error('❌ [DEBUG] Missing title element or product name');
            }
            
            console.log('📝 [DEBUG] Setting product summary...');
            const summaryElement = document.getElementById('product-summary');
            console.log('🔍 [DEBUG] Summary element found:', !!summaryElement);
            
            console.log('💰 [DEBUG] Setting prices...');
            const priceUsdElement = document.getElementById('price-usd');
            const priceVesElement = document.getElementById('price-ves');
            console.log('🔍 [DEBUG] Price elements found:', !!priceUsdElement, !!priceVesElement);
            
            // Call original function
            console.log('🔄 [DEBUG] Calling original renderProductInfo...');
            return originalRenderProductInfo.call(this);
            
        } catch (error) {
            console.error('❌ [DEBUG] Error in renderProductInfo:', error);
            console.error('❌ [DEBUG] Error stack:', error.stack);
        }
    };
    
    console.log('✅ Debug logging added to renderProductInfo');
} else {
    console.warn('⚠️ productDetailManager or renderProductInfo not found yet');
}

// Also check if all required DOM elements exist
setTimeout(() => {
    console.log('🔍 [DEBUG] Checking DOM elements...');
    const requiredElements = [
        'product-title',
        'product-summary', 
        'price-usd',
        'price-ves',
        'stock-available',
        'stock-unavailable',
        'stock-quantity',
        'quantity'
    ];
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`🔍 [DEBUG] Element #${id}:`, !!element, element ? 'EXISTS' : 'MISSING');
    });
}, 1000);