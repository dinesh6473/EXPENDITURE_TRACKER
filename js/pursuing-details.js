// ============================================
// PURSUING DETAILS - Cascading sub-detail logic
// ============================================

const PURSUING_CONFIG = {
    'Primary School (1-5)': {
        fields: [
            { id: 'class', label: 'Class', type: 'select', options: ['1', '2', '3', '4', '5'] }
        ]
    },
    'Middle School (6-8)': {
        fields: [
            { id: 'class', label: 'Class', type: 'select', options: ['6', '7', '8'] }
        ]
    },
    'High School (9-10)': {
        fields: [
            { id: 'class', label: 'Class', type: 'select', options: ['9', '10'] }
        ]
    },
    'Higher Secondary (11-12)': {
        fields: [
            { id: 'class', label: 'Class', type: 'select', options: ['11', '12'] },
            { id: 'stream', label: 'Stream', type: 'select', options: ['Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts / Humanities', 'Vocational'] }
        ]
    },
    'Diploma': {
        fields: [
            { id: 'branch', label: 'Branch / Stream', type: 'text', placeholder: 'e.g. Mechanical, Computer Science' },
            { id: 'year', label: 'Year', type: 'select', options: ['1st Year', '2nd Year', '3rd Year'] }
        ]
    },
    'Undergraduate (UG)': {
        fields: [
            { id: 'degree', label: 'Degree', type: 'select', options: ['B.Tech / B.E.', 'B.Sc', 'B.Com', 'B.A.', 'BBA', 'BCA', 'B.Arch', 'B.Des', 'B.Pharm', 'MBBS', 'BDS', 'B.Ed', 'LLB', 'Other'] },
            { id: 'branch', label: 'Branch / Specialization', type: 'text', placeholder: 'e.g. Computer Science, Economics' },
            { id: 'year', label: 'Year', type: 'select', options: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'] }
        ]
    },
    'Postgraduate (PG)': {
        fields: [
            { id: 'degree', label: 'Degree', type: 'select', options: ['M.Tech / M.E.', 'M.Sc', 'M.Com', 'M.A.', 'MBA', 'MCA', 'M.Des', 'M.Pharm', 'MD', 'MS (Medical)', 'LLM', 'M.Ed', 'Other'] },
            { id: 'branch', label: 'Specialization', type: 'text', placeholder: 'e.g. Data Science, Finance' },
            { id: 'year', label: 'Year', type: 'select', options: ['1st Year', '2nd Year', '3rd Year'] }
        ]
    },
    'M.Phil': {
        fields: [
            { id: 'subject', label: 'Subject', type: 'text', placeholder: 'e.g. English Literature, Physics' },
            { id: 'year', label: 'Year', type: 'select', options: ['1st Year', '2nd Year'] }
        ]
    },
    'Ph.D / Doctorate': {
        fields: [
            { id: 'subject', label: 'Research Area / Subject', type: 'text', placeholder: 'e.g. Machine Learning, Biotechnology' },
            { id: 'year', label: 'Year', type: 'select', options: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year+'] }
        ]
    },
    'Post-Doctoral': {
        fields: [
            { id: 'field', label: 'Field of Research', type: 'text', placeholder: 'e.g. Quantum Computing, Genetics' }
        ]
    },
    'Professional Course': {
        fields: [
            { id: 'course', label: 'Course', type: 'select', options: ['CA (Chartered Accountant)', 'CS (Company Secretary)', 'CMA (Cost Accountant)', 'LLB (Law)', 'MBBS (Medicine)', 'BDS (Dentistry)', 'BAMS / BHMS (Ayurveda/Homeopathy)', 'Nursing', 'Architecture', 'Hotel Management', 'Fashion Design', 'Animation & Multimedia', 'Pilot Training', 'Merchant Navy', 'Other'] },
            { id: 'level', label: 'Level / Year', type: 'text', placeholder: 'e.g. Foundation, Intermediate, Final, 2nd Year' }
        ]
    },
    'Other': {
        fields: [
            { id: 'detail', label: 'Please Specify', type: 'text', placeholder: 'Describe what you are currently pursuing' }
        ]
    }
};

/**
 * Initialize cascading pursuing detail fields.
 * @param {string} pursuingSelectId - ID of the main "Currently Pursuing" <select>
 * @param {string} containerId - ID of the container div where sub-fields will be rendered
 * @param {string} prefix - Prefix for generated field IDs (to avoid collisions between pages)
 */
function initPursuingDetails(pursuingSelectId, containerId, prefix) {
    const pursuingSelect = document.getElementById(pursuingSelectId);
    const container = document.getElementById(containerId);
    if (!pursuingSelect || !container) return;

    pursuingSelect.addEventListener('change', () => {
        renderPursuingSubFields(pursuingSelect.value, container, prefix);
    });
}

/**
 * Render sub-fields based on the selected pursuing level
 */
function renderPursuingSubFields(level, container, prefix, existingValues = {}) {
    container.innerHTML = '';
    const config = PURSUING_CONFIG[level];
    if (!config) return;

    config.fields.forEach(field => {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.cssText = 'animation: fadeInUp 0.3s ease;';

        const label = document.createElement('label');
        label.setAttribute('for', prefix + '_' + field.id);
        label.textContent = field.label;
        group.appendChild(label);

        let input;
        if (field.type === 'select') {
            input = document.createElement('select');
            input.className = 'form-control';
            input.id = prefix + '_' + field.id;
            input.required = true;

            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = 'Select ' + field.label.toLowerCase();
            input.appendChild(defaultOpt);

            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                if (existingValues[field.id] === opt) option.selected = true;
                input.appendChild(option);
            });
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.id = prefix + '_' + field.id;
            input.placeholder = field.placeholder || '';
            input.required = true;
            if (existingValues[field.id]) input.value = existingValues[field.id];
        }

        group.appendChild(input);
        container.appendChild(group);
    });
}

/**
 * Collect all sub-field values into a single string like "Class: 10 | Stream: Science (PCM)"
 */
function collectPursuingDetail(level, prefix) {
    const config = PURSUING_CONFIG[level];
    if (!config) return '';

    const parts = [];
    config.fields.forEach(field => {
        const el = document.getElementById(prefix + '_' + field.id);
        if (el && el.value.trim()) {
            parts.push(field.label + ': ' + el.value.trim());
        }
    });
    return parts.join(' | ');
}

/**
 * Parse a saved pursuing_detail string back into key-value pairs
 * e.g. "Class: 10 | Stream: Science (PCM)" → { class: "10", stream: "Science (PCM)" }
 */
function parsePursuingDetail(detailString, level) {
    if (!detailString || !level) return {};
    const config = PURSUING_CONFIG[level];
    if (!config) return {};

    const values = {};
    const pairs = detailString.split(' | ');

    pairs.forEach(pair => {
        const colonIndex = pair.indexOf(': ');
        if (colonIndex > -1) {
            const label = pair.substring(0, colonIndex).trim();
            const value = pair.substring(colonIndex + 2).trim();
            // Find the matching field ID by label
            const matchedField = config.fields.find(f => f.label === label);
            if (matchedField) {
                values[matchedField.id] = value;
            }
        }
    });

    return values;
}

/**
 * Validate that all required sub-fields are filled
 */
function validatePursuingDetail(level, prefix) {
    const config = PURSUING_CONFIG[level];
    if (!config) return true;

    for (const field of config.fields) {
        const el = document.getElementById(prefix + '_' + field.id);
        if (!el || !el.value.trim()) {
            return false;
        }
    }
    return true;
}
