// Product Image Hover Functionality for FloresYa
// Handles sequential image switching on mouse movement over product cards

class ProductImageHover {
    constructor() {
        this.init();
        this.isActive = false;
        this.mouseMovementThreshold = 12; // pixels - optimal for intentional movement detection
        this.settleTime = 400; // milliseconds - allow user to position cursor intentionally  
        this.switchDebounce = 800; // milliseconds - give user time to appreciate each image (marketing best practice)
    }

    init() {
        this.bindEvents();
        console.log('ProductImageHover: Inicializado');
    }

    bindEvents() {
        // Use event delegation for dynamically loaded product cards
        document.addEventListener('mouseover', (e) => {
            const productImage = e.target.closest('.product-image');
            // Debug log removed for cleaner console
            if (productImage) {
                this.initImageHover(productImage);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const productImage = e.target.closest('.product-image');
            if (productImage) {
                this.resetImageHover(productImage);
            }
        });
    }

    initImageHover(imageElement) {
        // Get all images for this product
        const imagesData = imageElement.getAttribute('data-images');
        
        if (!imagesData) {
            return;
        }

        let images;
        try {
            images = JSON.parse(imagesData);
        } catch (e) {
            console.warn('ProductImageHover: Error parsing images data', e);
            return;
        }

        // Need at least 2 images for hover effect
        if (!images || images.length <= 1) {
            return;
        }

        // Initialize hover state
        const hoverState = {
            images: images,
            currentIndex: parseInt(imageElement.getAttribute('data-current-index')) || 0,
            lastMousePosition: { x: 0, y: 0 },
            mouseMoveInitialized: false,
            isSettled: false,
            settleTimer: null,
            switchTimer: null,
            element: imageElement,
            accumulatedMovement: 0,
            lastSwitchTime: 0
        };

        // Store state on element
        imageElement._hoverState = hoverState;

        // Add mouse move listener
        const mouseMoveHandler = (e) => this.handleMouseMove(e, hoverState);
        imageElement.addEventListener('mousemove', mouseMoveHandler);
        
        // Store handler for cleanup
        imageElement._mouseMoveHandler = mouseMoveHandler;

        // Create initial image indicator
        this.createImageIndicator(imageElement);
        this.updateImageIndicator(imageElement, 0, images.length);

        // Set initial settle timer (wait for mouse to stop before activating)
        this.setSettleTimer(hoverState);
    }

    resetImageHover(imageElement) {
        const hoverState = imageElement._hoverState;
        if (!hoverState) return;

        // Clear all timers
        if (hoverState.settleTimer) {
            clearTimeout(hoverState.settleTimer);
        }
        if (hoverState.switchTimer) {
            clearTimeout(hoverState.switchTimer);
        }

        // Remove mouse move listener
        if (imageElement._mouseMoveHandler) {
            imageElement.removeEventListener('mousemove', imageElement._mouseMoveHandler);
            delete imageElement._mouseMoveHandler;
        }

        // Reset to first image
        if (hoverState.currentIndex !== 0) {
            this.switchToImage(imageElement, hoverState, 0);
            hoverState.currentIndex = 0;
            imageElement.setAttribute('data-current-index', '0');
        }

        // Remove image indicator
        this.removeImageIndicator(imageElement);

        // Clean up state
        delete imageElement._hoverState;
    }

    setSettleTimer(hoverState) {
        if (hoverState.settleTimer) {
            clearTimeout(hoverState.settleTimer);
        }

        hoverState.settleTimer = setTimeout(() => {
            hoverState.isSettled = true;
            hoverState.accumulatedMovement = 0; // Reset accumulated movement
        }, this.settleTime);
    }

    handleMouseMove(event, hoverState) {
        const currentPos = { x: event.offsetX, y: event.offsetY };
        const now = Date.now();
        // If this is the first mouse move, just store position
        if (!hoverState.mouseMoveInitialized) {
            hoverState.lastMousePosition = currentPos;
            hoverState.mouseMoveInitialized = true;
            return;
        }

        // If mouse hasn't settled yet, reset settle timer
        if (!hoverState.isSettled) {
            hoverState.lastMousePosition = currentPos;
            this.setSettleTimer(hoverState);
            return;
        }

        // Calculate movement distance
        const deltaX = Math.abs(currentPos.x - hoverState.lastMousePosition.x);
        const deltaY = Math.abs(currentPos.y - hoverState.lastMousePosition.y);
        const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Accumulate movement instead of immediate threshold check
        hoverState.accumulatedMovement += totalMovement;
        hoverState.lastMousePosition = currentPos;

        // Check if accumulated movement exceeds threshold and enough time has passed
        if (hoverState.accumulatedMovement >= this.mouseMovementThreshold && 
            now - hoverState.lastSwitchTime >= this.switchDebounce) {
            this.advanceImage(hoverState);
            hoverState.accumulatedMovement = 0; // Reset accumulated movement
            hoverState.lastSwitchTime = now;
        }
    }

    advanceImage(hoverState) {
        // Advance to next image
        const nextIndex = (hoverState.currentIndex + 1) % hoverState.images.length;
        this.switchToImage(hoverState.element, hoverState, nextIndex);
        
        hoverState.currentIndex = nextIndex;
        hoverState.element.setAttribute('data-current-index', nextIndex.toString());
    }

    switchToImage(imageElement, hoverState, imageIndex) {
        const targetImageUrl = hoverState.images[imageIndex];
        
        // Update the visible index indicator
        this.updateImageIndicator(imageElement, imageIndex, hoverState.images.length);
        
        // Add VERY DRAMATIC transition effects to make it highly visible
        imageElement.style.transition = 'opacity 0.8s ease-in-out, transform 0.6s ease, filter 0.6s ease';
        imageElement.style.opacity = '0.1';  // Much more dramatic fade
        imageElement.style.transform = 'scale(0.9) rotate(1deg)';  // More dramatic scale + slight rotation
        imageElement.style.filter = 'blur(2px)';  // Add blur effect during transition
        
        // Create a new image to preload
        const preloadImg = new Image();
        preloadImg.onload = () => {
            // Don't use the responsive system for hover images since the URLs already have correct sizing
            // The data-images array already contains processed URLs with proper sizes
            imageElement.src = targetImageUrl;
            imageElement.setAttribute('data-src', targetImageUrl);
            
            setTimeout(() => {
                imageElement.style.opacity = '1';
                imageElement.style.transform = 'scale(1.05) rotate(0deg)';  // Slight overshoot effect
                imageElement.style.filter = 'blur(0px)';
                
                // Return to normal scale after overshoot
                setTimeout(() => {
                    imageElement.style.transform = 'scale(1) rotate(0deg)';
                }, 200);
            }, 150);
        };
        
        preloadImg.onerror = () => {
            // If image fails to load, restore styles anyway
            imageElement.style.opacity = '1';
            imageElement.style.transform = 'scale(1) rotate(0deg)';
            imageElement.style.filter = 'blur(0px)';
            console.warn('ProductImageHover: Failed to load image:', targetImageUrl);
        };
        
        preloadImg.src = targetImageUrl;
    }

    createImageIndicator(imageElement) {
        // Create a visible indicator in the top-left corner
        const indicator = document.createElement('div');
        indicator.className = 'hover-image-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 8px;
            left: 8px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            font-family: Arial, sans-serif;
            z-index: 1000;
            pointer-events: none;
            border: 2px solid #ff6b9d;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        
        // Make sure the parent container has relative positioning
        const container = imageElement.parentElement;
        if (container) {
            const computedStyle = window.getComputedStyle(container);
            if (computedStyle.position === 'static') {
                container.style.position = 'relative';
            }
            container.appendChild(indicator);
        }
        
        imageElement._imageIndicator = indicator;
    }

    updateImageIndicator(imageElement, currentIndex, totalImages) {
        const indicator = imageElement._imageIndicator;
        if (indicator) {
            indicator.textContent = `${currentIndex + 1}/${totalImages}`;
            // Flash effect to make it more noticeable
            indicator.style.transform = 'scale(1.2)';
            indicator.style.background = 'rgba(255,107,157,0.9)';
            setTimeout(() => {
                indicator.style.transform = 'scale(1)';
                indicator.style.background = 'rgba(0,0,0,0.8)';
            }, 200);
        }
    }

    removeImageIndicator(imageElement) {
        const indicator = imageElement._imageIndicator;
        if (indicator && indicator.parentElement) {
            indicator.parentElement.removeChild(indicator);
            delete imageElement._imageIndicator;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ProductImageHover();
    });
} else {
    new ProductImageHover();
}