/**
 * Where all the form submission magic happens
 */

import { formatCitations } from './formatters.js';
import { showToast, copyToClipboard, validateFormData } from './utils.js';
import { createShareModal, createPrintWindow } from './uiManager.js';
import { styleDescriptions } from './fieldManager.js';

/**
 * Sets up all the form submission behavior
 * @param {HTMLElement} citationForm - The form we're working with
 * @param {Object} resultElements - Where to dump our formatted citations
 * @param {NodeList} styleCheckboxes - The style options users can pick from
 * @param {NodeList} outputContainers - Where we'll show each style's output
 */
function initFormSubmission(citationForm, resultElements, styleCheckboxes, outputContainers) {
    // Catch the form when it's submitted
    citationForm.addEventListener('submit', async event => {
        // Don't refresh the page, we've got this
        event.preventDefault();
        
        // Get all our submit buttons (might have extras on mobile)
        const allSubmitButtons = document.querySelectorAll('.submit');
        
        // See which citation styles they want
        const selectedStyles = [...styleCheckboxes].filter(checkbox => checkbox.checked);
        
        if (selectedStyles.length === 0) {
            showToast('Please select at least one citation style', 'error');
            return;
        }
        
        // Pull everything from the form
        const formData = new FormData(citationForm);
        const dataObj = Object.fromEntries(formData);
        
        // Check DOI format if provided
        const doiField = document.getElementById('doi');
        if (doiField && doiField.value && !doiField.validity.valid) {
            showToast('DOI has an invalid format. Use 10.xxxx/xxxxx or https://doi.org/10.xxxx/xxxxx', 'error');
            doiField.focus();
            return;
        }
        
        // Let's make sure they didn't forget anything important
        const validationError = validateFormData(formData);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }
        
        try {
            // Show a spinner so they know we're actually doing something
            allSubmitButtons.forEach(button => {
                button.disabled = true;
                button.innerHTML = `
                    <span class="material-icons loading-spinner">sync</span>
                    <span>Generating citation...</span>
                `;
            });
            
            // Do the actual citation crunching
            const data = Object.fromEntries(formData);
            let citations = formatCitations(data);
            
            // Fill in results for each style they wanted
            selectedStyles.forEach(checkbox => {
                const style = checkbox.value;
                const element = resultElements[style];
                
                if (!element) {
                    return;
                }
                
                element.textContent = '';
                
                // Get the formatted text for this style
                const text = citations[style];
                
                // Reset container and prep for animation
                element.parentElement.classList.add('animating');
                
                // Stuff the text in
                element.textContent = text;
                element.parentElement.classList.remove('animating');
            });
            
            // Update the mobile pagination dots if needed
            if (typeof createPaginationDots === 'function') {
                createPaginationDots();
            }
            
            // On small screens, make sure at least one result is highlighted
            if (window.innerWidth <= 768) {
                const visibleOutputs = [...outputContainers].filter(
                    container => !container.classList.contains('hidden')
                );
                
                if (visibleOutputs.length > 0 && !visibleOutputs.some(c => c.classList.contains('focus'))) {
                    visibleOutputs[0].classList.add('focus');
                }
            }
            
            // Jump down to show them their shiny new citation
            const outputSection = document.querySelector('.output-section');
            if (outputSection) {
                outputSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
            
        } catch (error) {
            console.error('Error generating citation:', error);
            showToast('Something went wrong while generating the citation. Please try again.', 'error');
        } finally {
            // Put the buttons back to normal
            allSubmitButtons.forEach(button => {
                button.disabled = false;
                button.innerHTML = `
                    <span class="material-icons">check_circle</span>
                    <span>Generate citation</span>
                `;
            });
        }
    });
}

/**
 * Sets up the copy/print/share buttons for citations
 * @param {Object} actionButtons - The buttons that do stuff
 * @param {Object} resultElements - Where our formatted citations live
 */
function initActionButtons(actionButtons, resultElements) {
    // Set up copy buttons
    if (actionButtons.copy) {
        actionButtons.copy.forEach(button => {
            button.addEventListener('click', () => {
                const style = button.dataset.style;
                const element = resultElements[style];
                
                if (!element) {
                    return;
                }
                
                const citationText = element.textContent;
                
                if (!citationText || citationText.trim() === '') {
                    showToast('No text to copy. Please generate a citation first.', 'error');
                    return;
                }
                
                handleCopy(citationText);
            });
        });
    }
    
    // Set up print buttons
    if (actionButtons.print) {
        actionButtons.print.forEach(button => {
            button.addEventListener('click', () => {
                const style = button.dataset.style;
                const element = resultElements[style];
                
                if (!element) {
                    return;
                }
                
                const citationText = element.textContent;
                
                if (!citationText || citationText.trim() === '') {
                    showToast('No text to print. Please generate a citation first.', 'error');
                    return;
                }
                
                const styleName = styleDescriptions[style]?.title || style.toUpperCase();
                handlePrint(citationText, styleName);
            });
        });
    }
    
    // Set up share buttons (if the Web Share API is available)
    if (actionButtons.share && navigator.share) {
        actionButtons.share.forEach(button => {
            button.addEventListener('click', () => {
                const style = button.dataset.style;
                const element = resultElements[style];
                
                if (!element) {
                    return;
                }
                
                const citationText = element.textContent;
                
                if (!citationText || citationText.trim() === '') {
                    showToast('No text to share. Please generate a citation first.', 'error');
                    return;
                }
                
                const styleName = styleDescriptions[style]?.title || style.toUpperCase();
                handleShare(citationText, styleName);
            });
        });
    }
}

/**
 * Try to share the citation with other apps
 * @param {string} citationText - The formatted citation
 * @param {string} style - Which style we're sharing
 */
async function handleShare(citationText, style) {
    try {
        if (navigator.share) {
            // Use native sharing if available (mostly on mobile)
            await navigator.share({
                title: `Citation (${style})`,
                text: citationText
            });
            
            showToast('Citation shared successfully!', 'success');
        } else {
            // Fall back to a custom share modal on desktops
            createShareModal(citationText, style);
        }
    } catch (error) {
        // Only show error if it's not just the user canceling
        if (error.name !== 'AbortError') {
            console.error('Error while trying to share:', error);
            showToast('Could not share the citation. Please copy and share it manually.', 'error');
        }
    }
}

/**
 * Copy citation to clipboard
 * @param {string} citationText - The formatted citation
 */
async function handleCopy(citationText) {
    try {
        await copyToClipboard(citationText);
    } catch (error) {
        console.error('Error copying:', error);
        showToast('Could not copy the text. Please select and copy it manually.', 'error');
    }
}

/**
 * Pop open a print window for the citation
 * @param {string} citationText - The formatted citation
 * @param {string} style - Which style we're printing
 */
function handlePrint(citationText, style) {
    try {
        createPrintWindow(citationText, style);
    } catch (error) {
        console.error('Error preparing for print:', error);
        showToast('Could not open the print window. Please copy and print from a text editor.', 'error');
    }
}

/**
 * Wire up keyboard shortcuts for power users
 * @param {HTMLElement} citationForm - The form element
 */
function addKeyboardShortcuts(citationForm) {
    document.addEventListener('keydown', (event) => {
        // Ctrl+Enter or Cmd+Enter to submit the form
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            // Only if the form exists and is visible
            if (citationForm && window.getComputedStyle(citationForm).display !== 'none') {
                citationForm.requestSubmit();
            }
        }
    });
}

export {
    initFormSubmission,
    initActionButtons,
    addKeyboardShortcuts
}; 