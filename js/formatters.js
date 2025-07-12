/**
 * The magic citation factory - turns your raw info into citation gold
 */
const formatters = {
    /**
     * Whips up citations in DSTU 8302:2015 format (the Ukrainian standard)
     * @param {Object} data - Your citation ingredients
     * @returns {string} - A tasty, properly formatted citation
     */
    dstu: data => {
        try {
            const elements = [];
            const sourceType = data.sourceType || 'article';
            
            // Every citation needs someone who wrote something
            elements.push(data.authors);
            elements.push(data.title);
            
            // Add the source-specific bits
            switch (sourceType) {
                case 'article':
                    if (data.journal) elements.push(`_${data.journal}_`);
                    if (data.volume && data.issue) {
                        elements.push(`${data.volume}(${data.issue})`);
                    } else if (data.volume) {
                        elements.push(`${data.volume}`);
                    } else if (data.issue) {
                        elements.push(`No. ${data.issue}`);
                    }
                    break;
                    
                case 'book':
                    if (data.volume) elements.push(`Vol. ${data.volume}`);
                    break;
                    
                case 'conference':
                    if (data.conferenceName) elements.push(`Conference proceedings "${data.conferenceName}"`);
                    break;
                    
                case 'webpage':
                    elements.push('[Electronic resource]');
                    if (data.url) elements.push(`URL: ${data.url}`);
                    if (data.accessDate) {
                        const date = new Date(data.accessDate);
                        const formattedDate = date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });
                        elements.push(`access date: ${formattedDate}`);
                    }
                    break;
                    
                case 'thesis':
                    const thesisTypeMap = {
                        'PhD': 'PhD thesis',
                        'masters': "Master's thesis",
                        'bachelors': "Bachelor's thesis",
                        'doctoral': 'Doctoral thesis'
                    };
                    elements.push(thesisTypeMap[data.thesisType] || 'Thesis');
                    if (data.institution) elements.push(data.institution);
                    break;
            }
            
            // Common elements for all source types
            if (data.location || data.publisher) {
                elements.push([data.location, data.publisher]
                    .filter(Boolean)
                    .join(': '));
            }
            
            elements.push(data.year);
            if (data.pages) elements.push(`P. ${data.pages}`);
            if (data.doi) elements.push(`DOI: ${data.doi}`);
            
            return elements.filter(Boolean).join('. ');
        } catch (error) {
            return `${data.authors}. ${data.title}. ${data.year}.`;
        }
    },

    /**
     * Format citation according to APA standard
     * @param {Object} data - Citation data
     * @returns {string} - Formatted citation
     */
    apa: data => {
        try {
            const sourceType = data.sourceType || 'article';
            let citation = `${data.authors} (${data.year}). ${data.title}`;
            
            switch (sourceType) {
                case 'article':
                    if (data.journal) citation += `. _${data.journal}_`;
                    if (data.volume || data.issue) {
                        citation += [
                            data.volume && `, ${data.volume}`,
                            data.issue && `(${data.issue})`
                        ].filter(Boolean).join('');
                    }
                    if (data.pages) citation += `, ${data.pages}`;
                    break;
                    
                case 'book':
                    if (data.publisher) {
                        if (data.location) citation += `. ${data.location}: ${data.publisher}`;
                        else citation += `. ${data.publisher}`;
                    }
                    break;
                    
                case 'conference':
                    if (data.conferenceName) citation += `. In ${data.conferenceName}`;
                    if (data.location) citation += `, ${data.location}`;
                    if (data.pages) citation += ` (pp. ${data.pages})`;
                    break;
                    
                case 'webpage':
                    citation += `. Retrieved`;
                    if (data.accessDate) {
                        const date = new Date(data.accessDate);
                        citation += ` ${date.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}`;
                    }
                    if (data.url) citation += ` from ${data.url}`;
                    break;
                    
                case 'thesis':
                    const thesisTypeMap = {
                        'PhD': 'Doctoral dissertation',
                        'masters': 'Master\'s thesis',
                        'bachelors': 'Bachelor\'s thesis',
                        'doctoral': 'Doctoral dissertation'
                    };
                    citation += ` [${thesisTypeMap[data.thesisType] || 'Dissertation'}`;
                    if (data.institution) citation += `, ${data.institution}`;
                    citation += ']';
                    break;
            }
            
            if (data.doi) citation += `. https://doi.org/${data.doi}`;
            
            return citation;
        } catch (error) {
            return `${data.authors} (${data.year}). ${data.title}.`;
        }
    },

    /**
     * Format citation according to IEEE standard
     * @param {Object} data - Citation data
     * @returns {string} - Formatted citation
     */
    ieee: data => {
        try {
            // Transform authors to put initials first
            const transformAuthors = authors => {
                return authors.split(', ').map(author => {
                    const parts = author.split(' ');
                    if (parts.length <= 1) return author;
                    const lastName = parts.pop();
                    const initials = parts.map(name => `${name.charAt(0)}.`).join(' ');
                    return `${initials} ${lastName}`;
                }).join(', ');
            };

            const elements = [`${transformAuthors(data.authors)}, "${data.title}"`];
            const sourceType = data.sourceType || 'article';
            
            switch (sourceType) {
                case 'article':
                    if (data.journal) elements.push(`in _${data.journal}_`);
                    break;
                    
                case 'book':
                    elements.push('book');
                    if (data.publisher) {
                        if (data.location) elements.push(`${data.location}: ${data.publisher}`);
                        else elements.push(`${data.publisher}`);
                    }
                    break;
                    
                case 'conference':
                    if (data.conferenceName) elements.push(`in ${data.conferenceName}`);
                    if (data.location) elements.push(data.location);
                    break;
                    
                case 'webpage':
                    elements.push('Online');
                    if (data.url) elements.push(`Available: ${data.url}`);
                    if (data.accessDate) {
                        const date = new Date(data.accessDate);
                        elements.push(`Accessed: ${date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}`);
                    }
                    break;
                    
                case 'thesis':
                    const thesisTypeMap = {
                        'PhD': 'Ph.D. dissertation',
                        'masters': 'M.S. thesis',
                        'bachelors': 'B.S. thesis',
                        'doctoral': 'Doctoral dissertation'
                    };
                    elements.push(thesisTypeMap[data.thesisType] || 'dissertation');
                    if (data.institution) elements.push(data.institution);
                    break;
            }
            
            if (data.volume) elements.push(`vol. ${data.volume}`);
            if (data.issue) elements.push(`no. ${data.issue}`);
            if (data.pages) elements.push(`pp. ${data.pages}`);
            elements.push(data.year);
            
            let citation = elements.join(', ');
            
            // Add period before DOI
            if (data.doi) {
                citation += `.`;
                citation += ` doi: ${data.doi}`;
            }
            
            return citation;
        } catch (error) {
            return `${data.authors}, "${data.title}", ${data.year}.`;
        }
    }
};

/**
 * Format citations using the provided data
 * @param {Object} data - Citation data
 * @returns {Object} - Object with formatted citations for each style
 */
export function formatCitations(data) {
    try {
        // Check for required fields
        if (!data.authors || !data.title || !data.year) {
            // Return fallback formatting
            return {
                dstu: `${data.authors || 'Author not specified'}. ${data.title || 'Title not specified'}. ${data.year || 'Year not specified'}.`,
                apa: `${data.authors || 'Author not specified'} (${data.year || 'n.d.'}). ${data.title || 'Title not specified'}.`,
                ieee: `${data.authors || 'Author not specified'}, "${data.title || 'Title not specified'}", ${data.year || 'n.d.'}.`
            };
        }
        
        // Format citations for each style
        const result = {
            dstu: formatters.dstu(data),
            apa: formatters.apa(data),
            ieee: formatters.ieee(data)
        };
        
        // Verify result has valid string values
        Object.entries(result).forEach(([style, citation]) => {
            if (!citation || typeof citation !== 'string' || citation.trim() === '') {
                result[style] = `${data.authors}. ${data.title}. ${data.year}.`;
            }
        });
        
        return result;
    } catch (error) {
        // Return fallback formatting
        return {
            dstu: `${data.authors || 'Author not specified'}. ${data.title || 'Title not specified'}. ${data.year || 'Year not specified'}.`,
            apa: `${data.authors || 'Author not specified'} (${data.year || 'n.d.'}). ${data.title || 'Title not specified'}.`,
            ieee: `${data.authors || 'Author not specified'}, "${data.title || 'Title not specified'}", ${data.year || 'n.d.'}.`
        };
    }
}

// Make formatCitations available globally for compatibility
window.formatCitations = formatCitations;

export default formatters; 