/**
 * Data Storage Module
 * All the localStorage magic to keep user data from vanishing
 * when they accidentally close their tab
 */

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Our storage bucket names
const STORAGE_KEYS = {
  FORM_DATA: 'citationFormData',
  CITATIONS: 'citationResults',
  RECENT_CITATIONS: 'recentCitations', 
  LAST_UPDATED: 'dataLastUpdated'
};

// How many citations to keep in history before we start forgetting
const MAX_RECENT_CITATIONS = 20;

/**
 * Stash form data away in localStorage
 * @param {Object} formData - The form stuff to save
 */
export function saveFormData(formData) {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available - data will not persist');
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(formData));
    updateLastModified();
  } catch (error) {
    // localStorage can fail - private browsing, quota exceeded, etc.
    console.error('Error saving form data:', error);
  }
}

/**
 * Pull form data from localStorage
 * @returns {Object|null} Whatever we found or null if the cupboard is bare
 */
export function loadFormData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEYS.FORM_DATA);
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error('Error loading form data:', error);
    return null; // Something broke, start fresh
  }
}

/**
 * Save freshly-generated citations
 * @param {Object} citations - The citation goodies to save
 */
export function saveCitations(citations) {
  try {
    localStorage.setItem(STORAGE_KEYS.CITATIONS, JSON.stringify(citations));
    
    // Also keep a history of old ones
    addToRecentCitations(citations);
    updateLastModified();
  } catch (error) {
    console.error('Error saving citations:', error);
  }
}

/**
 * Grab saved citations from localStorage
 * @returns {Object|null} The citations we found or null if there's nothing
 */
export function loadCitations() {
  try {
    const savedCitations = localStorage.getItem(STORAGE_KEYS.CITATIONS);
    return savedCitations ? JSON.parse(savedCitations) : null;
  } catch (error) {
    console.error('Error loading citations:', error);
    return null; // If something broke, we've got nothin'
  }
}

/**
 * Add to our running history of citations
 * @param {Object} citations - New citations to add to the pile
 */
function addToRecentCitations(citations) {
  try {
    // Get what we already have
    let recentCitations = loadRecentCitations() || [];
    
    // Slap on a timestamp so we know when it happened
    const newEntry = {
      timestamp: Date.now(),
      data: citations
    };
    
    // New stuff goes at the front of the line
    recentCitations.unshift(newEntry);
    
    // Keep the list from growing out of control
    if (recentCitations.length > MAX_RECENT_CITATIONS) {
      recentCitations = recentCitations.slice(0, MAX_RECENT_CITATIONS);
    }
    
    // Save our updated history
    localStorage.setItem(STORAGE_KEYS.RECENT_CITATIONS, JSON.stringify(recentCitations));
  } catch (error) {
    console.error('Error adding to recent citations:', error);
  }
}

/**
 * Get the history of recent citations
 * @returns {Array|null} List of recent citations or empty array if none
 */
export function loadRecentCitations() {
  try {
    const recentCitations = localStorage.getItem(STORAGE_KEYS.RECENT_CITATIONS);
    return recentCitations ? JSON.parse(recentCitations) : [];
  } catch (error) {
    console.error('Error loading recent citations:', error);
    return []; // Start with a blank slate if things blow up
  }
}

/**
 * Wipe the slate clean - nuke all saved data
 */
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.FORM_DATA);
    localStorage.removeItem(STORAGE_KEYS.CITATIONS);
    localStorage.removeItem(STORAGE_KEYS.RECENT_CITATIONS);
    updateLastModified();
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

/**
 * Update the "last touched" timestamp
 */
function updateLastModified() {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, Date.now());
  } catch (error) {
    console.error('Error updating last modified timestamp:', error);
  }
}

/**
 * Find out when data was last updated
 * @returns {number|null} Timestamp or null if we've got no history
 */
export function getLastUpdateTime() {
  try {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Error getting last update time:', error);
    return null;
  }
}

/**
 * Package everything up for export/backup
 * @returns {string} JSON string with all the user's precious data
 */
export function exportUserData() {
  try {
    const userData = {
      formData: loadFormData(),
      citations: loadCitations(),
      recentCitations: loadRecentCitations(),
      lastUpdated: getLastUpdateTime()
    };
    
    // Pretty-print for easier debugging if someone opens the file
    return JSON.stringify(userData, null, 2);
  } catch (error) {
    console.error('Error exporting user data:', error);
    return JSON.stringify({ error: 'Failed to export data' });
  }
}

/**
 * Restore everything from a backup file
 * @param {string} jsonData - JSON string with user data
 * @returns {boolean} True if we didn't completely mess up
 */
export function importUserData(jsonData) {
  try {
    const userData = JSON.parse(jsonData);
    
    // Only restore what's actually in the backup
    if (userData.formData) {
      localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(userData.formData));
    }
    
    if (userData.citations) {
      localStorage.setItem(STORAGE_KEYS.CITATIONS, JSON.stringify(userData.citations));
    }
    
    if (userData.recentCitations) {
      localStorage.setItem(STORAGE_KEYS.RECENT_CITATIONS, JSON.stringify(userData.recentCitations));
    }
    
    updateLastModified();
    return true;
  } catch (error) {
    console.error('Error importing user data:', error);
    return false; // Let the caller know we couldn't make it work
  }
} 