/**
 * Theme Manager - Dark mode, light mode, and everything in between
 * Remembers what you like so you don't have to keep switching
 */

import { showToast } from './utils.js';

// Our theme constants - keep these together
const THEME_STORAGE_KEY = 'preferred-theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';
const THEME_AUTO = 'auto';

/**
 * Boot up the theme system
 * Sets up the toggle button and loads whatever theme you picked last time
 */
export function initThemeSystem() {
    // Slap that theme toggle button onto the page
    createThemeToggle();
    
    // Figure out what theme to use (saved or system default)
    applyTheme(getSavedTheme());
    
    // Keep an eye on system theme changes if we're in auto mode
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // React when the OS switches themes
        mediaQuery.addEventListener('change', (e) => {
            if (getSavedTheme() === THEME_AUTO) {
                applyTheme(THEME_AUTO);
            }
        });
    }
}

/**
 * Builds our fancy theme switcher and sticks it on the page
 */
function createThemeToggle() {
    // Create the toggle container
    const themeToggle = document.createElement('div');
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('role', 'group');
    themeToggle.setAttribute('aria-label', 'Перемикач теми');
    
    // Set up our three amigos - light, auto, and dark
    const options = [
        { value: THEME_LIGHT, icon: 'light_mode', label: 'Світла' },
        { value: THEME_AUTO, icon: 'brightness_auto', label: 'Авто' },
        { value: THEME_DARK, icon: 'dark_mode', label: 'Темна' }
    ];
    
    // What are we using right now?
    const currentTheme = getSavedTheme();
    
    // Create each button
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = `theme-option ${currentTheme === option.value ? 'active' : ''}`;
        button.setAttribute('data-theme', option.value);
        button.setAttribute('aria-label', option.label);
        button.setAttribute('title', option.label);
        button.innerHTML = `<span class="material-icons">${option.icon}</span>`;
        
        // Wire up the click
        button.addEventListener('click', () => {
            // Highlight the active button
            document.querySelectorAll('.theme-option').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Make it happen
            applyTheme(option.value);
            saveTheme(option.value);
            
            // Let the user know we did something
            const themeLabels = {
                'Світла': 'світлу',
                'Авто': 'авто',
                'Темна': 'темну'
            };
            showToast(`Тему змінено на ${themeLabels[option.label]}`, 'success');
        });
        
        themeToggle.appendChild(button);
    });
    
    // Find a good spot for our toggle
    const h1 = document.querySelector('h1');
    if (h1) {
        // Right after the heading looks nice
        h1.parentNode.insertBefore(themeToggle, h1.nextSibling);
    } else {
        // Plan B - just throw it at the top
        document.body.insertBefore(themeToggle, document.body.firstChild);
    }
}

/**
 * Actually change the theme
 * @param {string} theme - What theme we want (light, dark, or auto)
 */
function applyTheme(theme) {
    // For auto mode, we need to check what the system wants
    if (theme === THEME_AUTO) {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? THEME_DARK : THEME_LIGHT);
    } else {
        // Just go with what the user picked
        document.documentElement.setAttribute('data-theme', theme);
    }
}

/**
 * Remember theme choice for next time
 * @param {string} theme - The chosen one
 */
function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        // LocalStorage can fail in private browsing or if quota is exceeded
        console.error('Failed to save theme preference:', error);
    }
}

/**
 * Check what theme the user picked before
 * @returns {string} The saved theme or 'auto' as fallback
 */
function getSavedTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return savedTheme || THEME_AUTO; // Auto is our default
    } catch (error) {
        console.error('Failed to get saved theme:', error);
        return THEME_AUTO; // Something went wrong, play it safe with auto
    }
} 