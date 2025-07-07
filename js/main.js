/**
 * The brains of the operation
 * Where all the magic happens and everything comes together
 */

import { formatCitations } from './formatters.js';
import { 
    showToast, 
    copyToClipboard, 
    validateFormData, 
    initRippleEffects 
} from './utils.js';

import { 
    updateFieldVisibility, 
    updateStyleDescriptions,
    fieldRequirements,
    styleDescriptions
} from './fieldManager.js';

import {
    createPaginationDots,
    setupSwipeNavigation,
    handlePaginationResponsiveChanges
} from './paginationManager.js';

import {
    handleResponsiveSubmitButton,
    addRequiredFieldsStyle,
    addStaggeredAnimations,
    addInputFocusEffects,
    enhanceToastNotifications
} from './uiManager.js';

import {
    initFormSubmission,
    initActionButtons,
    addKeyboardShortcuts
} from './formHandler.js';

// Bring in dark mode and friends
import { initThemeSystem } from './themeManager.js';

// All things storage-related
import {
    saveFormData,
    loadFormData,
    saveCitations,
    loadCitations,
    loadRecentCitations,
    exportUserData,
    importUserData
} from './dataStorage.js';

// Expose our formatter to the outside world - needed for the service worker
if (typeof window.formatCitations !== 'function') {
    window.formatCitations = formatCitations;
}

// What the user's working with right now
let currentFormData = {};

/**
 * Kick everything off once the DOM is ready to party
 */
document.addEventListener('DOMContentLoaded', () => {
    // Set up dark/light mode first - nobody likes flash of wrong theme
    initThemeSystem();
    
    // Grab all the page elements we need to mess with
    const citationForm = document.querySelector('#citationForm');
    const resultElements = {
        dstu: document.querySelector('#dstuResult'),
        apa: document.querySelector('#apaResult'),
        ieee: document.querySelector('#ieeeResult')
    };
    
    // More handy DOM elements
    const styleCheckboxes = document.querySelectorAll('input[name="styles"]');
    const outputContainers = document.querySelectorAll('.output');
    const submitButton = document.querySelector('#submitButton');
    const submitWrapper = document.querySelector('.submit-wrapper');
    const sourceTypeRadios = document.querySelectorAll('input[name="sourceType"]');
    const actionButtons = document.querySelectorAll('.action-btn');
    
    // Flag the fields that are always required
    const initialRequiredFields = [
        document.querySelector('#authors').parentElement,
        document.querySelector('#title').parentElement,
        document.querySelector('#year').parentElement
    ];
    
    initialRequiredFields.forEach(field => {
        field.dataset.initial = "true";
        field.dataset.required = "true"; // Make sure they're marked as required
    });
    
    // Make buttons pretty with ripple effects
    initRippleEffects();
    
    // Set up those nice staggered animations
    addStaggeredAnimations();

    // Make the submit button adjust to screen size
    handleResponsiveSubmitButton(submitButton, submitWrapper, citationForm);
    window.addEventListener('resize', () => {
        handleResponsiveSubmitButton(submitButton, submitWrapper, citationForm);
        handlePaginationResponsiveChanges();
    });

    // The submit button doesn't need a separate event handler
    // The browser will automatically trigger the form's submit event when clicked

    // Load saved checkbox states and source type
    addEventListener('load', () => {
        // Setup style descriptions and tooltips
        updateStyleDescriptions(styleCheckboxes);
        
        // Show welcome message only if it hasn't been shown before
        const welcomeShown = localStorage.getItem('welcomeMessageShown');
        if (!welcomeShown) {
            setTimeout(() => {
                showToast('Вітаємо у Конвертері стилів форматування бібліографічних посилань! Заповніть форму, щоб створити бібліографічний опис.', 'info');
                localStorage.setItem('welcomeMessageShown', 'true');
            }, 1000);
        }
        
        // Load saved checkbox states
        const savedStates = JSON.parse(
            localStorage.getItem('styleCheckboxStates') ??
            '{"dstu":true,"apa":true,"ieee":true}'
        );
        styleCheckboxes.forEach(checkbox =>
            checkbox.checked = savedStates[checkbox.value] ?? true
        );
        
        // Load saved source type
        const savedSourceType = localStorage.getItem('selectedSourceType') ?? 'article';
        const sourceTypeRadio = document.querySelector(`input[name="sourceType"][value="${savedSourceType}"]`);
        if (sourceTypeRadio) {
            sourceTypeRadio.checked = true;
        }
        
        // Apply saved settings
        updateFieldVisibility(styleCheckboxes, outputContainers, showToast);
        
        // Add fancy focus effects to inputs
        addInputFocusEffects();
        
        // Add CSS for required fields highlighting
        addRequiredFieldsStyle();
    });

    // Add event listeners to checkboxes - update fields on change
    styleCheckboxes.forEach(checkbox =>
        checkbox.addEventListener('change', () => {
            // Save checkbox states to localStorage
            const checkboxStates = Object.fromEntries(
                [...styleCheckboxes].map(cb => [cb.value, cb.checked])
            );
            localStorage.setItem('styleCheckboxStates', JSON.stringify(checkboxStates));
            
            // Update fields
            updateFieldVisibility(styleCheckboxes, outputContainers, showToast);
        })
    );
    
    // Add event listeners to source type radios
    sourceTypeRadios.forEach(radio =>
        radio.addEventListener('change', () => {
            // Save source type to localStorage
            localStorage.setItem('selectedSourceType', radio.value);
            
            // Update fields based on new source type
            updateFieldVisibility(styleCheckboxes, outputContainers, showToast);
        })
    );

    // Initialize form submission handling
    initFormSubmission(citationForm, resultElements, styleCheckboxes, outputContainers);

    // Initialize action buttons
    initActionButtons(actionButtons, resultElements);

    // Add keyboard shortcuts
    addKeyboardShortcuts(citationForm);
    
    // Setup swipe navigation for mobile
    setupSwipeNavigation();
    
    // Make createPaginationDots globally available for other modules
    window.createPaginationDots = createPaginationDots;
    
    // Enhance toast notifications with icons
    enhanceToastNotifications();
    
    // Quick way to reset everything when things go haywire during testing
    window.resetAppPreferences = function() {
        localStorage.removeItem('welcomeMessageShown');
        console.log('Налаштування програми скинуто. Оновіть сторінку, щоб побачити вітальне повідомлення знову.');
    };

    // Save user's work while they type - nobody likes losing their stuff
    function setupAutoSave() {
        const form = document.getElementById('citationForm');
        
        if (form) {
            // Watch for changes but don't spam localStorage on every keystroke
            form.addEventListener('input', debounce(saveCurrentFormData, 500));
            
            // Double-check we saved everything when they hit submit
            form.addEventListener('submit', () => {
                saveCurrentFormData();
            });
            
            // Pull up anything they were working on last time
            const savedData = loadFormData();
            if (savedData) {
                restoreFormData(savedData);
                showToast('Дані форми відновлено з вашої останньої сесії', 'info');
            }
            
            // Grab any citations they've already created
            const savedCitations = loadCitations();
            if (savedCitations) {
                displaySavedCitations(savedCitations);
            }
        }
    }
    
    // Grab everything from the form and stash it away
    function saveCurrentFormData() {
        const form = document.getElementById('citationForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const dataObj = {};
        
        // Scoop up all the regular form fields
        for (const [key, value] of formData.entries()) {
            dataObj[key] = value;
        }
        
        // Figure out which citation styles they want
        const selectedStyles = [];
        document.querySelectorAll('input[name="styles"]:checked').forEach(checkbox => {
            selectedStyles.push(checkbox.value);
        });
        dataObj.selectedStyles = selectedStyles;
        
        // What kind of source are we citing?
        const sourceType = document.querySelector('input[name="sourceType"]:checked');
        if (sourceType) {
            dataObj.sourceType = sourceType.value;
        }
        
        // Remember for later - both in memory and localStorage
        currentFormData = dataObj;
        saveFormData(dataObj);
    }
    
    // Put everything back where it was when they left
    function restoreFormData(data) {
        const form = document.getElementById('citationForm');
        if (!form) return;
        
        // Basic stuff - text fields, dropdowns, etc.
        for (const [key, value] of Object.entries(data)) {
            if (key !== 'selectedStyles' && key !== 'sourceType') {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = value;
                }
            }
        }
        
        // Which citation styles did they have checked?
        if (data.selectedStyles && Array.isArray(data.selectedStyles)) {
            document.querySelectorAll('input[name="styles"]').forEach(checkbox => {
                checkbox.checked = data.selectedStyles.includes(checkbox.value);
            });
        }
        
        // What source type were they working with?
        if (data.sourceType) {
            const sourceTypeRadio = form.querySelector(`input[name="sourceType"][value="${data.sourceType}"]`);
            if (sourceTypeRadio) {
                sourceTypeRadio.checked = true;
                // Nudge the form to show/hide fields as needed
                const event = new Event('change');
                sourceTypeRadio.dispatchEvent(event);
            }
        }
        
        // Make sure the right fields are visible
        updateFieldVisibility(styleCheckboxes, outputContainers, showToast);
    }
    
    // Show their previous citation work in the results area
    function displaySavedCitations(citations) {
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection && citations) {
            // Unhide the results if they're hidden
            if (resultsSection.classList.contains('hidden')) {
                resultsSection.classList.remove('hidden');
            }
            
            // Slot each citation into its proper box
            Object.entries(citations).forEach(([style, citation]) => {
                // Find the container or make a new one if needed
                const container = document.querySelector(`.citation-result[data-style="${style}"]`) || 
                                 createCitationContainer(style);
                
                if (container) {
                    container.querySelector('.citation-text').innerHTML = citation;
                }
            });
        }
    }
    
    // Whip up a fresh container for a citation style
    function createCitationContainer(style) {
        const resultsSection = document.querySelector('.results-section');
        if (!resultsSection) return null;
        
        const container = document.createElement('div');
        container.className = 'citation-result card';
        container.setAttribute('data-style', style);
        
        // Nice heading showing which style this is
        const heading = document.createElement('h3');
        heading.textContent = getStyleFullName(style);
        
        // Where the actual citation text goes
        const citationText = document.createElement('div');
        citationText.className = 'citation-text';
        
        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<span class="material-icons">content_copy</span> Копіювати';
        copyBtn.addEventListener('click', () => {
            const text = citationText.textContent;
            copyToClipboard(text);
            showToast('Опис скопійовано до буфера обміну', 'success');
        });
        
        // Add elements to container
        container.appendChild(heading);
        container.appendChild(citationText);
        container.appendChild(copyBtn);
        
        // Add container to results section
        resultsSection.appendChild(container);
        
        return container;
    }
    
    // Get full style name from style code
    function getStyleFullName(styleCode) {
        const styleNames = {
            'dstu': 'ДСТУ 8302:2015',
            'apa': 'APA Style',
            'ieee': 'IEEE Style',
            'harvard': 'Harvard Style',
            'mla': 'MLA Style',
            'chicago': 'Chicago Style'
        };
        
        return styleNames[styleCode] || styleCode;
    }
    
    // Stops functions from firing a million times when they get spammed
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    // Let users backup and restore their citation data
    function setupDataExportImport() {
        // Find a good spot for our export/import buttons
        const settingsSection = document.querySelector('.settings-section');
        if (settingsSection) {
            const exportButton = document.createElement('button');
            exportButton.type = 'button';
            exportButton.className = 'btn export-btn';
            exportButton.innerHTML = '<span class="material-icons">download</span> Експорт даних';
            exportButton.addEventListener('click', handleDataExport);
            
            const importButton = document.createElement('button');
            importButton.type = 'button';
            importButton.className = 'btn import-btn';
            importButton.innerHTML = '<span class="material-icons">upload</span> Імпорт даних';
            importButton.addEventListener('click', handleDataImport);
            
            // Group everything together nicely
            const dataManagementDiv = document.createElement('div');
            dataManagementDiv.className = 'data-management-controls';
            dataManagementDiv.appendChild(document.createElement('h3')).textContent = 'Керування даними';
            dataManagementDiv.appendChild(exportButton);
            dataManagementDiv.appendChild(importButton);
            
            settingsSection.appendChild(dataManagementDiv);
        }
    }
    
    // Pack up user data and send it as a download
    function handleDataExport() {
        // Grab all their data and package it up
        const data = exportUserData();
        const dataBlob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        // Trick to trigger download without navigating
        const link = document.createElement('a');
        link.href = url;
        // Add today's date to the filename so they can keep track
        link.download = `citation-converter-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Дані успішно експортовано', 'success');
    }
    
    // Let user upload their backup file
    function handleDataImport() {
        // Create a file picker and hide it from view
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        // When they pick a file, process it
        input.addEventListener('change', event => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.addEventListener('load', e => {
                try {
                    const success = importUserData(e.target.result);
                    if (success) {
                        showToast('Дані успішно імпортовано. Сторінка перезавантажується...', 'success');
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        showToast('Не вдалося імпортувати дані. Невірний формат.', 'error');
                    }
                } catch (error) {
                    console.error('Error importing data:', error);
                    showToast('Не вдалося імпортувати дані', 'error');
                }
            });
            
            reader.readAsText(file);
        });
        
        input.click();
    }

    // Initialize all components
    initRippleEffects();
    
    // Use the existing outputContainers variable that was declared at line 74
    updateFieldVisibility(styleCheckboxes, outputContainers, showToast);
    updateStyleDescriptions(styleCheckboxes);
    setupSwipeNavigation();
    createPaginationDots();
    handlePaginationResponsiveChanges();
    handleResponsiveSubmitButton(submitButton, submitWrapper, citationForm);
    addRequiredFieldsStyle();
    addStaggeredAnimations();
    addInputFocusEffects();
    enhanceToastNotifications();
    initFormSubmission(citationForm, resultElements, styleCheckboxes, outputContainers);
    initActionButtons(actionButtons, resultElements);
    addKeyboardShortcuts(citationForm);
    
    // Initialize new data persistence features
    setupAutoSave();
    setupDataExportImport();
    
    // Handle welcome message
    const welcomeShown = localStorage.getItem('welcomeMessageShown');
    if (!welcomeShown) {
        showToast('Вітаємо! Ваші дані зберігаються локально у вашому браузері для конфіденційності. Додаток також працює офлайн!', 'info', 10000);
        localStorage.setItem('welcomeMessageShown', 'true');
    }
    
    // Override the native formatCitations to save results
    const originalFormatCitations = window.formatCitations;
    window.formatCitations = function(...args) {
        const results = originalFormatCitations(...args);
        if (results) {
            saveCitations(results);
        }
        return results;
    };
    
    // Check and handle offline status
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
    updateOfflineStatus();
    
    function updateOfflineStatus() {
        const statusElement = document.getElementById('offline-status') || createOfflineStatusElement();
        
        if (navigator.onLine) {
            statusElement.classList.remove('visible');
        } else {
            statusElement.classList.add('visible');
            showToast('Ви в офлайн режимі. Не хвилюйтеся, додаток продовжуватиме працювати!', 'info');
        }
    }
    
    function createOfflineStatusElement() {
        const element = document.createElement('div');
        element.id = 'offline-status';
        element.innerHTML = '<span class="material-icons">cloud_off</span> Offline Mode';
        document.body.appendChild(element);
        return element;
    }
}); 