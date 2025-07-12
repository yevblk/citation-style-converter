/**
 * UI Manager - All the visual stuff: effects, animations, and making things look good on different devices
 */

import { addRippleEffect } from './utils.js';
import { showToast } from './utils.js';

/**
 * Adjusts the submit button based on screen size - sticks it to the bottom on mobile
 * @param {HTMLElement} submitButton - The original button in the form
 * @param {HTMLElement} submitWrapper - The container around the button
 * @param {HTMLElement} citationForm - The main form element
 */
function handleResponsiveSubmitButton(submitButton, submitWrapper, citationForm) {
    if (window.innerWidth <= 768) {
        // On mobile, we'll move the button to a fixed container at the bottom
        if (!document.querySelector('.submit-container')) {
            const submitContainer = document.createElement('div');
            submitContainer.className = 'submit-container';
            
            // We need to clone the button but change its type to prevent auto-submission
            const buttonClone = submitButton.cloneNode(true);
            buttonClone.type = "button"; // This stops the form from submitting automatically
            
            submitContainer.appendChild(buttonClone);
            document.body.appendChild(submitContainer);
            
            // Wire up the new button to submit the form when clicked
            const newSubmitButton = submitContainer.querySelector('.submit');
            newSubmitButton.addEventListener('click', (event) => {
                event.preventDefault();
                citationForm.dispatchEvent(new Event('submit', {
                    bubbles: true,
                    cancelable: true
                }));
            });
            
            // The original button should also be type="button" for consistency
            submitButton.type = "button";
            
            // Hide the original button since we have our fancy floating one now
            submitWrapper.style.display = 'none';
            
            // Add that nice ripple effect to our new button
            addRippleEffect(newSubmitButton);
        }
    } else {
        // On desktop, we'll put the button back in the form where it belongs
        const fixedContainer = document.querySelector('.submit-container');
        if (fixedContainer) {
            fixedContainer.remove();
            submitWrapper.style.display = 'block';
            
            // Keep the button type consistent
            submitButton.type = "button";
        }
    }
}

/**
 * Add CSS styling for required fields highlighting
 */
function addRequiredFieldsStyle() {
    // Add CSS to highlight required-by-style fields
    if (!document.querySelector('#required-fields-style')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'required-fields-style';
        styleEl.textContent = `
            .required-by-style {
                position: relative;
            }
            .required-by-style::before {
                content: '';
                position: absolute;
                left: -12px;
                top: 0;
                bottom: 0;
                width: 3px;
                background: var(--primary);
                border-radius: 2px;
                opacity: 0.7;
            }
            .style-option {
                position: relative;
            }
        `;
        document.head.appendChild(styleEl);
    }
}

/**
 * Add staggered animation effects to form fields
 */
function addStaggeredAnimations() {
    // Add CSS class for staggered animations
    Array.from(document.querySelectorAll('.field')).forEach((field, index) => {
        field.style.animationDelay = `${0.1 + index * 0.05}s`;
    });
}

/**
 * Add focus effects to input fields
 */
function addInputFocusEffects() {
    // Add fancy focus effects to inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
}

/**
 * Create and show a share modal for desktop platforms
 * @param {string} citationText - The citation text to share
 * @param {string} styleName - The name of the citation style
 */
function createShareModal(citationText, styleName) {
    // Create sharing options for common platforms
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(citationText);
    
    // Create sharing options for common platforms
    const shareOptions = [
        { name: 'Email', url: `mailto:?subject=Bibliographic citation in ${styleName} style&body=${shareText}`, icon: 'email' },
        { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, icon: 'twitter' }
    ];
    
    // Create a small popup with share options
    const shareModal = document.createElement('div');
    shareModal.className = 'share-modal';
    shareModal.style.position = 'fixed';
    shareModal.style.top = '50%';
    shareModal.style.left = '50%';
    shareModal.style.transform = 'translate(-50%, -50%)';
    shareModal.style.background = 'var(--bg-card)';
    shareModal.style.padding = 'var(--spacing)';
    shareModal.style.borderRadius = 'var(--radius)';
    shareModal.style.boxShadow = 'var(--shadow-lg)';
    shareModal.style.zIndex = '1000';
    shareModal.style.maxWidth = '90%';
    shareModal.style.width = '300px';
    
    // Add header
    const header = document.createElement('h3');
    header.textContent = 'Share bibliographic citation';
    header.style.marginBottom = 'var(--spacing)';
    shareModal.appendChild(header);
    
    // Add share options
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'flex';
    optionsContainer.style.justifyContent = 'space-around';
    optionsContainer.style.gap = 'var(--spacing-sm)';
    
    shareOptions.forEach(option => {
        const shareButton = document.createElement('a');
        shareButton.href = option.url;
        shareButton.target = '_blank';
        shareButton.className = 'share-button';
        shareButton.style.display = 'flex';
        shareButton.style.flexDirection = 'column';
        shareButton.style.alignItems = 'center';
        shareButton.style.textDecoration = 'none';
        shareButton.style.color = 'var(--primary)';
        shareButton.style.padding = 'var(--spacing-sm)';
        shareButton.style.borderRadius = 'var(--radius-sm)';
        shareButton.style.transition = 'var(--transition)';
        
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = option.icon;
        icon.style.fontSize = '2rem';
        icon.style.marginBottom = '0.5rem';
        
        const name = document.createElement('span');
        name.textContent = option.name;
        name.style.fontSize = 'var(--font-size-sm)';
        
        shareButton.appendChild(icon);
        shareButton.appendChild(name);
        optionsContainer.appendChild(shareButton);
        
        // Add hover effect
        shareButton.addEventListener('mouseenter', () => {
            shareButton.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
            shareButton.style.transform = 'translateY(-3px)';
        });
        
        shareButton.addEventListener('mouseleave', () => {
            shareButton.style.backgroundColor = 'transparent';
            shareButton.style.transform = 'translateY(0)';
        });
    });
    
    shareModal.appendChild(optionsContainer);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'action-btn';
    closeButton.style.marginTop = 'var(--spacing)';
    closeButton.style.width = '100%';
    closeButton.style.textAlign = 'center';
    closeButton.style.padding = 'var(--spacing-sm)';
    
    // Add backdrop/overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.right = '0';
    modalOverlay.style.bottom = '0';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.zIndex = '999';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
    
    shareModal.appendChild(closeButton);
    modalOverlay.appendChild(shareModal);
    document.body.appendChild(modalOverlay);
    
    // Close on clicking outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
    
    return modalOverlay;
}

/**
 * Create a print-friendly window for the citation
 * @param {string} citationText - The citation text to print
 * @param {string} styleName - The name of the citation style
 */
function createPrintWindow(citationText, styleName) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Failed to open print window. Please check your browser\'s popup blocker settings.');
    }
    
    // Create a clean, print-friendly document
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bibliographic citation in ${styleName} style</title>
            <style>
                body {
                    font-family: 'Times New Roman', Times, serif;
                    line-height: 1.5;
                    color: #000;
                    margin: 2cm;
                    font-size: 12pt;
                }
                .header {
                    text-align: center;
                    margin-bottom: 2em;
                }
                h1 {
                    font-size: 14pt;
                    font-weight: bold;
                    margin-bottom: 0.5em;
                }
                .citation {
                    margin-bottom: 1em;
                    text-align: justify;
                    hyphens: auto;
                }
                .footer {
                    margin-top: 2em;
                    font-size: 10pt;
                    text-align: center;
                    color: #666;
                }
                @media print {
                    body {
                        margin: 1cm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Bibliographic citation in ${styleName} style</h1>
                <p>Date created: ${new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
            </div>
            <div class="citation">${citationText}</div>
            <div class="footer">
                Created with the TSATU Bibliographic Citation Style Converter<br>
                <a href="https://t.me/tsatu_citations_bot/app">t.me/tsatu_citations_bot</a>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Give the browser a moment to process the document before printing
    setTimeout(() => {
        printWindow.print();
        // Close the window after print dialog closes (or if user cancels)
        printWindow.onafterprint = function() {
            printWindow.close();
        };
    }, 500);
    
    return printWindow;
}

// Enhanced toast notifications with icons
function enhanceToastNotifications() {
    // Store the original showToast function if it exists
    const originalShowToast = window.showToast;
    
    // Only enhance if the original exists
    if (typeof originalShowToast === 'function') {
        window.showToast = function(message, type = 'info', duration = 3000) {
            // Use the original showToast function
            const toast = originalShowToast(message, type, duration);
            
            // Clear any existing icons
            const existingIcon = toast.querySelector('.toast-icon');
            if (existingIcon) existingIcon.remove();
            
            // Add appropriate icon based on type
            let iconName;
            switch (type) {
                case 'success':
                    iconName = 'check_circle';
                    break;
                case 'error':
                    iconName = 'error';
                    break;
                case 'info':
                default:
                    iconName = 'info';
                    break;
            }
            
            const icon = document.createElement('span');
            icon.className = 'material-icons toast-icon';
            icon.textContent = iconName;
            toast.prepend(icon);
            
            return toast;
        };
    }
}

export {
    handleResponsiveSubmitButton,
    addRequiredFieldsStyle,
    addStaggeredAnimations,
    addInputFocusEffects,
    createShareModal,
    createPrintWindow,
    enhanceToastNotifications
}; 