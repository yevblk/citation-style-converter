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
export async function copyToClipboard(text, successMessage = 'Успішно скопійовано до буфера обміну!') {
    try {
        await navigator.clipboard.writeText(text);
        if (successMessage) {
            showToast(successMessage, 'success');
        }
        return true;
    } catch (error) {
        // Clipboard can be finicky sometimes
        console.error('Failed to copy:', error);
        showToast('Не вдалося скопіювати текст. Перевірте дозволи браузера.', 'error');
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
        return 'Будь ласка, вкажіть авторів публікації';
    }
    
    if (!data.title || data.title.trim() === '') {
        return 'Будь ласка, вкажіть повну назву публікації';
    }
    
    if (!data.year) {
        return 'Будь ласка, вкажіть рік публікації';
    }
    
    const yearNum = parseInt(data.year);
    const currentYear = new Date().getFullYear();
    
    // No time travelers allowed
    if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear + 5) {
        return `Рік публікації має бути між 1800 та ${currentYear + 5}`;
    }
    
    // Different source types need different info
    const sourceType = data.sourceType;
    
    switch (sourceType) {
        case 'article':
            if (!data.journal || data.journal.trim() === '') {
                return 'Для статті необхідно вказати назву наукового журналу';
            }
            break;
            
        case 'book':
            if (!data.publisher || data.publisher.trim() === '') {
                return 'Для книги необхідно вказати назву видавництва';
            }
            break;
            
        case 'conference':
            if (!data.conferenceName || data.conferenceName.trim() === '') {
                return 'Для матеріалів конференції необхідно вказати назву конференції';
            }
            break;
            
        case 'webpage':
            if (!data.url || data.url.trim() === '') {
                return 'Для веб-сторінки необхідно вказати повну URL-адресу';
            }
            
            // Make sure URL isn't going to break everything
            try {
                new URL(data.url);
            } catch (e) {
                return 'Невірний формат URL-адреси. Приклад правильного формату: https://example.com';
            }
            break;
            
        case 'thesis':
            if (!data.institution || data.institution.trim() === '') {
                return 'Для дисертації необхідно вказати назву наукової установи';
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