/**
 * Field Manager - Takes care of showing/hiding fields based on what you're citing and which style you're using
 */

// Here's how we determine which fields are needed for different citation types and styles
// Format: { fieldSelector: { sourceType: [required styles], ...}, ... }
const fieldRequirements = {
    // Core fields needed for basic citation
    '#authors': { 
        all: ['dstu', 'apa', 'ieee']
    },
    '#title': { 
        all: ['dstu', 'apa', 'ieee']
    },
    '#year': { 
        all: ['dstu', 'apa', 'ieee']
    },
    '#doi': {
        all: ['dstu', 'apa', 'ieee']
    },
    
    // Source-specific essential fields
    '#journalGroup': {
        article: ['dstu', 'apa', 'ieee']
    },
    '#issueGroup': {
        article: ['dstu', 'apa', 'ieee'],
        conference: ['dstu', 'apa', 'ieee']
    },
    '#volumeGroup': {
        article: ['dstu', 'apa', 'ieee'],
        book: ['dstu', 'apa', 'ieee']
    },
    '#pagesGroup': {
        article: ['dstu', 'apa', 'ieee'],
        book: ['dstu', 'apa', 'ieee'],
        conference: ['dstu', 'apa', 'ieee']
    },
    '#publisherGroup': {
        book: ['dstu', 'apa', 'ieee'],
        conference: ['dstu', 'apa']
    },
    '#locationGroup': {
        book: ['dstu', 'apa'],
        conference: ['dstu', 'apa']
    },
    '#conferenceNameGroup': {
        conference: ['dstu', 'apa', 'ieee']
    },
    '#urlGroup': {
        webpage: ['dstu', 'apa', 'ieee'],
        article: ['apa', 'ieee'],
        conference: ['ieee']
    },
    '#accessDateGroup': {
        webpage: ['dstu', 'apa', 'ieee']
    },
    '#institutionGroup': {
        thesis: ['dstu', 'apa', 'ieee']
    },
    '#thesisTypeGroup': {
        thesis: ['dstu', 'apa', 'ieee']
    },
    
    // Additional fields
    '#editionGroup': {
        book: ['dstu', 'apa', 'ieee']
    },
    '#isbnGroup': {
        book: ['dstu', 'apa', 'ieee']
    },
    '#conferenceLocationGroup': {
        conference: ['dstu', 'apa', 'ieee']
    },
    '#conferenceDateGroup': {
        conference: ['dstu', 'apa', 'ieee']
    },
    '#issn': {
        article: ['dstu', 'apa', 'ieee']
    },
    '#languageGroup': {
        article: ['dstu'],
        book: ['dstu'],
        conference: ['dstu'],
        thesis: ['dstu']
    }
};

// Style descriptions for tooltips/help
const styleDescriptions = {
    dstu: {
        name: "ДСТУ 8302:2015",
        description: "Український національний стандарт бібліографічного опису"
    },
    apa: {
        name: "APA (7th Edition)",
        description: "Стиль Американської психологічної асоціації, широко використовується у соціальних науках"
    },
    ieee: {
        name: "IEEE",
        description: "Стиль Інституту інженерів електротехніки та електроніки, використовується в технічних публікаціях"
    }
};

// Source type descriptions
const sourceTypeDescriptions = {
    article: "Наукова стаття в журналі або періодичному виданні",
    book: "Книга, монографія або інше неперіодичне видання",
    conference: "Матеріали конференції, тези доповіді або збірник наукових праць",
    webpage: "Веб-сторінка, онлайн-ресурс або електронне джерело",
    thesis: "Дисертація, автореферат або інша кваліфікаційна наукова робота"
};

/**
 * Update tooltips/descriptions for style options
 */
function updateStyleDescriptions(styleCheckboxes) {
    // Remove any existing style-info elements
    document.querySelectorAll('.style-info').forEach(el => el.remove());
    
    styleCheckboxes.forEach(checkbox => {
        const style = checkbox.value;
        const styleInfo = styleDescriptions[style];
        const optionEl = checkbox.closest('.style-option');
        
        // Update tooltip text only
        if (styleInfo && optionEl) {
            optionEl.title = `${styleInfo.name}: ${styleInfo.description}`;
        }
    });
}

/**
 * Update field visibility and required state based on selected source type and citation styles
 */
function updateFieldVisibility(styleCheckboxes, outputContainers, showToast) {
    // Get styleCheckboxes if not provided
    if (!styleCheckboxes) {
        styleCheckboxes = document.querySelectorAll('input[name="styles"]');
    }
    
    // Get showToast function if not provided
    if (!showToast && window.showToast) {
        showToast = window.showToast;
    }
    
    const selectedSourceType = document.querySelector('input[name="sourceType"]:checked').value;
    const selectedStyles = [...styleCheckboxes]
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
        
    // If no styles selected, show a message and return
    if (selectedStyles.length === 0 && showToast) {
        showToast('Будь ласка, оберіть хоча б один стиль форматування бібліографічного опису', 'info');
        return;
    }
    
    // Show/hide output containers based on selected styles
    outputContainers.forEach(container =>
        container.classList.toggle('hidden',
            !selectedStyles.includes(container.id.replace('Output', ''))
        )
    );

    // Apply focus logic only on mobile
    if (window.innerWidth <= 768) {
        // Ensure at least one visible output has focus on mobile
        const visibleOutputs = [...outputContainers].filter(
            container => !container.classList.contains('hidden')
        );
        
        const hasFocused = visibleOutputs.some(
            container => container.classList.contains('focus')
        );
        
        if (visibleOutputs.length > 0 && !hasFocused) {
            // Remove focus from all outputs first (just to be safe)
            outputContainers.forEach(container => container.classList.remove('focus'));
            // Add focus to the first visible output
            visibleOutputs[0].classList.add('focus');
        }
    } else {
        // On desktop, remove focus from all outputs (show all)
        outputContainers.forEach(container => container.classList.remove('focus'));
    }
    
    // Create pagination dots after updating visibility
    if (typeof createPaginationDots === 'function') {
        createPaginationDots();
    }
    
    // Array to track required and optional fields for sorting later
    const requiredFields = [];
    const optionalFields = [];
    
    // Update all fields based on requirements matrix
    Object.entries(fieldRequirements).forEach(([fieldSelector, sourceTypes]) => {
        const element = document.querySelector(fieldSelector);
        if (!element) return;
        
        // Get the field's parent (the actual field container)
        const fieldContainer = fieldSelector.includes('Group') ? 
            element : element.closest('.field');
            
        if (!fieldContainer) return;
        
        // Check if field is applicable to the current source type
        const applicableSourceTypes = Object.keys(sourceTypes);
        const isApplicable = 
            applicableSourceTypes.includes('all') || 
            applicableSourceTypes.includes(selectedSourceType);
            
        // If not applicable to this source type, hide and make not required
        if (!isApplicable) {
            fieldContainer.classList.add('hidden');
            
            // If it's a field (not a container), update required property
            const input = fieldContainer.querySelector('input, select');
            if (input) input.required = false;
            
            const label = fieldContainer.querySelector('label');
            if (label) label.classList.remove('required');
            
            fieldContainer.dataset.required = "false";
            return;
        }
        
        // Get the styles that require this field for this source type
        const requiredStyles = 
            sourceTypes['all'] || 
            sourceTypes[selectedSourceType] || 
            [];
            
        // Field is required if at least one of the selected styles requires it
        const isRequired = requiredStyles.some(style => selectedStyles.includes(style));
        
        // Show/hide based on applicability to current selected styles
        const isRelevant = requiredStyles.some(style => selectedStyles.includes(style));
        fieldContainer.classList.toggle('hidden', !isRelevant);
        
        // Track fields for sorting (only if visible)
        if (!fieldContainer.classList.contains('hidden')) {
            if (isRequired || fieldContainer.dataset.initial === "true") {
                requiredFields.push(fieldContainer);
            } else {
                optionalFields.push(fieldContainer);
            }
        }
        
        // If it's a field (not a container), update required property
        const input = fieldContainer.querySelector('input, select');
        if (input && !fieldContainer.dataset.initial) {
            input.required = isRequired;
        }
        
        // Update required data attribute for CSS ordering
        fieldContainer.dataset.required = isRequired || fieldContainer.dataset.initial === "true" ? "true" : "false";
        
        // Update label to show required state
        const label = fieldContainer.querySelector('label');
        if (label) {
            label.classList.toggle('required', isRequired);
        }
        
        // Add data to help users understand why this field is required
        if (isRequired && isRelevant) {
            const requiredByStyles = requiredStyles
                .filter(style => selectedStyles.includes(style))
                .map(style => styleDescriptions[style].name)
                .join(', ');
                
            fieldContainer.title = `Це поле обов'язкове для стилів: ${requiredByStyles}`;
            
            // Highlight field with a subtle style
            fieldContainer.classList.add('required-by-style');
        } else {
            fieldContainer.classList.remove('required-by-style');
            fieldContainer.removeAttribute('title');
        }
    });
    
    // Sort fields - required fields first, then optional
    const form = document.querySelector('.form');
    
    // Sorting fields by moving them in the DOM
    // First append all required fields
    requiredFields.forEach(field => {
        form.appendChild(field);
    });
    
    // Then append all optional fields
    optionalFields.forEach(field => {
        form.appendChild(field);
    });
    
    // Update placeholder and label for title field based on source type
    const titleInput = document.querySelector('#title');
    const titleDescription = titleInput.closest('.field').querySelector('.description');
    
    switch (selectedSourceType) {
        case 'article':
            titleInput.placeholder = 'Назва статті';
            titleDescription.textContent = 'Повна назва статті';
            break;
        case 'book':
            titleInput.placeholder = 'Назва книги';
            titleDescription.textContent = 'Повна назва книги';
            break;
        case 'conference':
            titleInput.placeholder = 'Назва доповіді';
            titleDescription.textContent = 'Повна назва доповіді';
            break;
        case 'webpage':
            titleInput.placeholder = 'Назва веб-сторінки';
            titleDescription.textContent = 'Повна назва веб-сторінки';
            break;
        case 'thesis':
            titleInput.placeholder = 'Назва дисертації';
            titleDescription.textContent = 'Повна назва дисертації';
            break;
    }
    
    // Improve the look of the thesis type dropdown
    customizeThesisTypeDropdown();
    
    // Highlight selected source type
    updateSourceTypeSelection();
    
    // Move submit wrapper to end of form
    const submitWrapperDesktop = document.querySelector('.submit-wrapper');
    if (submitWrapperDesktop && !submitWrapperDesktop.style.display) {
        form.appendChild(submitWrapperDesktop);
    }
}

/**
 * Customize the thesis type dropdown with icons and enhanced styling
 */
function customizeThesisTypeDropdown() {
    const thesisTypeSelect = document.querySelector('#thesisType');
    if (!thesisTypeSelect) return;
    
    // Add custom icons/styling to thesis types
    const thesisTypeOptions = {
        'PhD': {
            label: 'Дисертація доктора філософії',
            icon: 'school'
        },
        'masters': {
            label: 'Магістерська робота',
            icon: 'workspace_premium'
        },
        'bachelors': {
            label: 'Бакалаврська робота',
            icon: 'assignment'
        },
        'doctoral': {
            label: 'Докторська дисертація',
            icon: 'psychology'
        }
    };
    
    // Check if we've already customized the select
    if (thesisTypeSelect.classList.contains('customized')) return;
    
    // Check if field has a wrapper already
    const thesisTypeField = thesisTypeSelect.closest('.field');
    let selectWrapper = thesisTypeField.querySelector('.select-wrapper');
    
    if (!selectWrapper) {
        // Create a wrapper for the select with an icon
        selectWrapper = document.createElement('div');
        selectWrapper.className = 'select-wrapper';
        selectWrapper.style.position = 'relative';
        selectWrapper.style.display = 'flex';
        selectWrapper.style.alignItems = 'center';
        
        // Create icon element to show before select
        const iconElement = document.createElement('span');
        iconElement.className = 'material-icons select-icon';
        iconElement.style.position = 'absolute';
        iconElement.style.left = '10px';
        iconElement.style.color = 'var(--primary)';
        iconElement.style.zIndex = '1';
        iconElement.textContent = thesisTypeOptions['PhD'].icon; // Default icon
        selectWrapper.appendChild(iconElement);
        
        // Wrap the select element in our custom wrapper
        thesisTypeSelect.parentNode.insertBefore(selectWrapper, thesisTypeSelect);
        selectWrapper.appendChild(thesisTypeSelect);
        
        // Adjust select padding for icon
        thesisTypeSelect.style.paddingLeft = '36px';
    }
    
    // Clear current options
    thesisTypeSelect.innerHTML = '';
    
    // Add new options with proper data
    Object.entries(thesisTypeOptions).forEach(([value, data]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = data.label;
        option.dataset.icon = data.icon;
        thesisTypeSelect.appendChild(option);
    });
    
    // Make sure thesis type label shows required marker when appropriate
    const thesisTypeLabel = thesisTypeField.querySelector('label');
    
    // Check if thesis type is required based on field requirements
    const requiredForThesis = fieldRequirements['#thesisTypeGroup']?.thesis || [];
    const isRequired = requiredForThesis.length > 0;
    
    if (isRequired) {
        thesisTypeLabel.classList.add('required');
        thesisTypeSelect.required = true;
        thesisTypeField.dataset.required = "true";
    }
    
    // Add styles directly to the select element
    thesisTypeSelect.classList.add('customized');
    thesisTypeSelect.style.fontWeight = 'var(--font-weight-medium)';
    thesisTypeSelect.style.color = 'var(--text)';
    thesisTypeSelect.style.width = '100%';
    thesisTypeSelect.style.appearance = 'none';
    thesisTypeSelect.style.transition = 'all 0.2s ease';
    
    // Update icon when select changes
    thesisTypeSelect.addEventListener('change', () => {
        const selectedOption = thesisTypeSelect.options[thesisTypeSelect.selectedIndex];
        const selectedIcon = thesisTypeOptions[selectedOption.value]?.icon;
        const iconElement = selectWrapper.querySelector('.select-icon');
        if (iconElement && selectedIcon) {
            iconElement.textContent = selectedIcon;
        }
    });
    
    // Add focus effects
    thesisTypeSelect.addEventListener('focus', () => {
        thesisTypeSelect.parentElement.classList.add('focused');
        thesisTypeSelect.style.borderColor = 'var(--primary)';
        thesisTypeSelect.style.boxShadow = '0 0 0 3px rgba(var(--primary-rgb), 0.25)';
    });
    
    thesisTypeSelect.addEventListener('blur', () => {
        thesisTypeSelect.parentElement.classList.remove('focused');
        thesisTypeSelect.style.borderColor = '';
        thesisTypeSelect.style.boxShadow = '';
    });
    
    // Trigger initial change to set the correct icon
    thesisTypeSelect.dispatchEvent(new Event('change'));
}

/**
 * Update source type selection highlighting
 */
function updateSourceTypeSelection() {
    document.querySelectorAll('.source-option').forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        const isSelected = radio.checked;
        
        option.classList.toggle('selected', isSelected);
        
        if (isSelected) {
            option.style.borderColor = 'var(--primary)';
            option.style.backgroundColor = 'rgba(13, 110, 253, 0.15)'; 
            
            // Add source type description as tooltip
            const sourceType = radio.value;
            if (sourceTypeDescriptions[sourceType]) {
                option.title = sourceTypeDescriptions[sourceType];
            }
        } else {
            option.style.borderColor = 'transparent';
            option.style.backgroundColor = 'var(--bg-input)';
            option.removeAttribute('title');
        }
    });
}

export { 
    updateFieldVisibility, 
    updateStyleDescriptions,
    customizeThesisTypeDropdown,
    updateSourceTypeSelection,
    fieldRequirements,
    styleDescriptions,
    sourceTypeDescriptions
}; 