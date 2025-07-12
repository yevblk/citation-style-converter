/**
 * A bag of handy helpers. Nothing fancy, just stuff that makes life easier.
 */

/**
 * Pops up a message for the user - then fades away
 * @param {string} message - What to tell the user
 * @param {string} type - Message mood (success, error, info)
 * @param {number} duration - How long to keep it on screen
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Kill any existing toasts first - no toast party allowed
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon to match the vibe
    let icon = '';
    switch (type) {
        case 'success':
            icon = 'check_circle'; // all good!
            break;
        case 'error': 
            icon = 'error'; // uh oh...
            break;
        default:
            icon = 'info'; // fyi
    }
    
    toast.innerHTML = `
        <span class="material-icons">${icon}</span>
        <span>${message}</span>
    `;
    
    // Try to find a home for our toast
    const notificationsRegion = document.getElementById('notifications-region');
    if (notificationsRegion) {
        notificationsRegion.appendChild(toast);
    } else {
        // Plan B - just throw it on the body
        document.body.appendChild(toast);
    }
    
    // Set the self-destruct sequence
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300); // clean up after ourselves
    }, duration);
}

/**
 * Sends text to clipboard - because nobody wants to type stuff twice
 * @param {string} text - The goods to copy
 * @param {string} successMessage - What to brag about when it works
 */
export async function copyToClipboard(text, successMessage = 'Successfully copied to clipboard!') {
    try {
        await navigator.clipboard.writeText(text);
        if (successMessage) {
            showToast(successMessage, 'success');
        }
        return true;
    } catch (error) {
        // Clipboard can be finicky sometimes
        console.error('Failed to copy:', error);
        showToast('Failed to copy text. Please check your browser permissions.', 'error');
        return false;
    }
}

/**
 * Makes sure user didn't submit garbage data
 * @param {FormData} formData - User's input
 * @returns {string|null} - Error message or null if we're golden
 */
export function validateFormData(formData) {
    const data = Object.fromEntries(formData);
    
    // Must-haves - can't live without these
    if (!data.authors || data.authors.trim() === '') {
        return 'Please specify the authors of the publication';
    }
    
    if (!data.title || data.title.trim() === '') {
        return 'Please specify the full title of the publication';
    }
    
    if (!data.year) {
        return 'Please specify the year of publication';
    }
    
    const yearNum = parseInt(data.year);
    const currentYear = new Date().getFullYear();
    
    // No time travelers allowed
    if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear + 5) {
        return `The year of publication must be between 1800 and ${currentYear + 5}`;
    }
    
    // Different source types need different info
    const sourceType = data.sourceType;
    
    switch (sourceType) {
        case 'article':
            if (!data.journal || data.journal.trim() === '') {
                return 'For an article, please specify the name of the scientific journal';
            }
            break;
            
        case 'book':
            if (!data.publisher || data.publisher.trim() === '') {
                return 'For a book, please specify the name of the publisher';
            }
            break;
            
        case 'conference':
            if (!data.conferenceName || data.conferenceName.trim() === '') {
                return 'For conference materials, please specify the name of the conference';
            }
            break;
            
        case 'webpage':
            if (!data.url || data.url.trim() === '') {
                return 'For a webpage, please specify the full URL address';
            }
            
            // Make sure URL isn't going to break everything
            try {
                new URL(data.url);
            } catch (e) {
                return 'Invalid URL format. Example of correct format: https://example.com';
            }
            break;
            
        case 'thesis':
            if (!data.institution || data.institution.trim() === '') {
                return 'For a thesis, please specify the name of the scientific institution';
            }
            break;
    }
    
    // If we made it here, we're good to go
    return null;
}

/**
 * Adds that cool water ripple effect when buttons get clicked
 * @param {HTMLElement} element - Button that needs some style
 */
export function addRippleEffect(element) {
    element.addEventListener('click', function(e) {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.appendChild(ripple);
        
        // Clean up our mess after the animation finishes
        setTimeout(() => ripple.remove(), 600);
    });
}

/**
 * Makes all buttons do the cool ripple thing
 */
export function initRippleEffects() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(addRippleEffect);
}

export default {
    showToast,
    copyToClipboard,
    validateFormData,
    addRippleEffect,
    initRippleEffects
}; 