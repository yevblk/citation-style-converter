/**
 * Pagination Manager - The magic that helps users swipe between citation styles
 * when they're stuck on their tiny phone screens
 */

/**
 * Sprinkles those little navigation dots at the bottom of the page
 * You know, the ones that let you know where the heck you are
 */
function createPaginationDots() {
    // No need for this on big screens - dots are a mobile-only party
    if (window.innerWidth > 768) {
        // Clean up any leftover dots if someone resized their browser
        const existingPagination = document.querySelector('.pagination-dots');
        if (existingPagination) {
            existingPagination.remove();
        }
        return;
    }

    const outputContainers = document.querySelectorAll('.output');
    const visibleOutputs = [...outputContainers].filter(
        container => !container.classList.contains('hidden')
    );
    
    // Sweep away old dots before making new ones
    const existingPagination = document.querySelector('.pagination-dots');
    if (existingPagination) {
        existingPagination.remove();
    }
    
    // Just one style? No dots needed - would look silly
    if (visibleOutputs.length <= 1) return;
    
    // Container for our little dot buddies
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-dots';
    // Keep it tight and tidy
    paginationContainer.style.margin = '0.1rem 0';
    paginationContainer.style.padding = '0.2rem';
    
    // One dot per citation style - nothing fancy
    visibleOutputs.forEach((output, index) => {
        const dot = document.createElement('div');
        dot.className = 'pagination-dot';
        dot.dataset.index = index.toString(); // Store index in data attribute for delegation
        
        // Figure out which dot should light up
        const hasFocus = output.classList.contains('focus');
        const isFirstWithNoFocused = index === 0 && !visibleOutputs.some(o => o.classList.contains('focus'));
        
        if (hasFocus || isFirstWithNoFocused) {
            dot.classList.add('active');
        }
        
        paginationContainer.appendChild(dot);
    });
    
    // Use event delegation instead of individual listeners to prevent memory leaks
    paginationContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('pagination-dot')) {
            const index = parseInt(event.target.dataset.index, 10);
            const output = visibleOutputs[index];
            
            // Reset everything first
            visibleOutputs.forEach(o => o.classList.remove('focus'));
            
            // Highlight just what they tapped on
            output.classList.add('focus');
            
            // Light up the right dot
            document.querySelectorAll('.pagination-dot').forEach((d, i) => {
                d.classList.toggle('active', i === index);
            });
            
            // Scroll to show what they picked
            output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    // Append pagination after results
    const resultsContainer = document.querySelector('.results');
    resultsContainer.after(paginationContainer);
}

/**
 * Setup touch swipe detection for pagination
 */
function setupSwipeNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;
    let mouseStartX = 0;
    let mouseEndX = 0;
    let isMouseDown = false;
    
    const handleSwipe = (element) => {
        // Touch events for mobile
        element.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        element.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipeGesture(touchEndX - touchStartX);
        }, false);
        
        // Mouse events for desktop users accessing mobile view
        element.addEventListener('mousedown', e => {
            isMouseDown = true;
            mouseStartX = e.clientX;
            e.preventDefault(); // Prevent text selection during swipe
        }, false);
        
        element.addEventListener('mousemove', e => {
            if (!isMouseDown) return;
            // Optional: Add visual feedback during dragging
        }, false);
        
        element.addEventListener('mouseup', e => {
            if (!isMouseDown) return;
            mouseEndX = e.clientX;
            isMouseDown = false;
            handleSwipeGesture(mouseEndX - mouseStartX);
        }, false);
        
        element.addEventListener('mouseleave', e => {
            if (!isMouseDown) return;
            mouseEndX = e.clientX;
            isMouseDown = false;
            handleSwipeGesture(mouseEndX - mouseStartX);
        }, false);
        
        // Add cursor style to indicate swipeable area
        element.style.cursor = 'grab';
        element.addEventListener('mousedown', () => {
            element.style.cursor = 'grabbing';
        });
        element.addEventListener('mouseup', () => {
            element.style.cursor = 'grab';
        });
        element.addEventListener('mouseleave', () => {
            element.style.cursor = 'grab';
        });
    };
    
    const handleSwipeGesture = (difference) => {
        const swipeThreshold = 100;
        if (Math.abs(difference) > swipeThreshold) {
            if (difference > 0) {
                switchToAdjacentStyle(-1);  // Previous
            } else {
                switchToAdjacentStyle(1);   // Next
            }
            createPaginationDots();
        }
    };
    
    // Apply swipe handling to results container
    handleSwipe(document.querySelector('.results'));
    
    // Update navigation buttons on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            createPaginationDots();
        } else {
            removeNavigationButtons();
        }
    });
}

/**
 * Remove navigation buttons
 */
function removeNavigationButtons() {
    const navContainer = document.querySelector('.results-navigation');
    if (navContainer) {
        navContainer.remove();
    }
}

/**
 * Switch to the adjacent style result based on direction
 * @param {number} direction - Direction to move (1 for next, -1 for previous)
 */
function switchToAdjacentStyle(direction) {
    const outputContainers = document.querySelectorAll('.output');
    const visibleOutputs = [...outputContainers].filter(
        container => !container.classList.contains('hidden')
    );
    
    if (visibleOutputs.length <= 1) return;
    
    // Find currently focused output
    const focusedIndex = visibleOutputs.findIndex(
        container => container.classList.contains('focus')
    );
    
    let nextIndex = 0;
    
    if (focusedIndex === -1) {
        // No focused output yet, focus on first or last depending on direction
        nextIndex = direction > 0 ? 0 : visibleOutputs.length - 1;
    } else {
        // Calculate next index with wrapping
        nextIndex = (focusedIndex + direction + visibleOutputs.length) % visibleOutputs.length;
    }
    
    // Remove focus from all
    visibleOutputs.forEach(output => output.classList.remove('focus'));
    
    // Add focus to next
    visibleOutputs[nextIndex].classList.add('focus');
    visibleOutputs[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Update pagination dots
    const dots = document.querySelectorAll('.pagination-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === nextIndex);
    });
    
    // Show hint
    const styleName = visibleOutputs[nextIndex].querySelector('h3').textContent;
    if (typeof showToast === 'function') {
        showToast(`Перехід до стилю: ${styleName}`, 'info', 1500);
    }
}

/**
 * Handle responsive changes related to pagination
 */
function handlePaginationResponsiveChanges() {
    const outputContainers = document.querySelectorAll('.output');
    
    // If switching from mobile to desktop
    if (window.innerWidth > 768) {
        // Remove focus class from all outputs to show all of them
        outputContainers.forEach(container => container.classList.remove('focus'));
        
        // Remove navigation buttons
        removeNavigationButtons();
    } else {
        // If switching to mobile, make sure exactly one output has focus
        const visibleOutputs = [...outputContainers].filter(
            container => !container.classList.contains('hidden')
        );
        
        if (visibleOutputs.length > 0 && !visibleOutputs.some(c => c.classList.contains('focus'))) {
            visibleOutputs[0].classList.add('focus');
        }
        
        // Add navigation buttons
        // addNavigationButtons();
    }
    
    // Update pagination dots
    createPaginationDots();
}

export {
    createPaginationDots,
    setupSwipeNavigation,
    switchToAdjacentStyle,
    handlePaginationResponsiveChanges
}; 