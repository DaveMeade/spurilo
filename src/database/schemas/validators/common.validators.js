/**
 * Common validation helpers for Mongoose schemas
 * These validators can be reused across different schemas
 */

/**
 * Email validator with domain checking support
 */
const emailValidator = {
    validator: function(v) {
        if (!v) return true; // Allow empty if not required
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    },
    message: 'Invalid email format'
};

/**
 * Phone number validator - supports international formats
 */
const phoneValidator = {
    validator: function(v) {
        if (!v) return true; // Allow empty if not required
        // Allow digits, spaces, hyphens, parentheses, and + for international
        return /^\+?[\d\s\-\(\)]+$/.test(v) && v.replace(/\D/g, '').length >= 10;
    },
    message: 'Invalid phone number format'
};

/**
 * URL validator
 */
const urlValidator = {
    validator: function(v) {
        if (!v) return true; // Allow empty if not required
        try {
            new URL(v);
            return true;
        } catch {
            return false;
        }
    },
    message: 'Must be a valid URL'
};

/**
 * Date range validator - ensures end date is after start date
 */
const dateRangeValidator = function(startField, endField) {
    return {
        validator: function() {
            const start = this[startField];
            const end = this[endField];
            if (!start || !end) return true; // Skip if either is not set
            return new Date(end) > new Date(start);
        },
        message: `${endField} must be after ${startField}`
    };
};

/**
 * Array length validator
 */
const arrayLengthValidator = function(min, max) {
    return {
        validator: function(v) {
            if (!Array.isArray(v)) return false;
            if (min !== undefined && v.length < min) return false;
            if (max !== undefined && v.length > max) return false;
            return true;
        },
        message: `Array length must be between ${min || 0} and ${max || 'unlimited'}`
    };
};

/**
 * Enum validator with case insensitive option
 */
const enumValidator = function(allowedValues, caseInsensitive = false) {
    return {
        validator: function(v) {
            if (!v) return true; // Allow empty if not required
            const values = caseInsensitive 
                ? allowedValues.map(val => val.toLowerCase())
                : allowedValues;
            const checkValue = caseInsensitive ? v.toLowerCase() : v;
            return values.includes(checkValue);
        },
        message: `Value must be one of: ${allowedValues.join(', ')}`
    };
};

/**
 * MongoDB ObjectId validator
 */
const objectIdValidator = {
    validator: function(v) {
        if (!v) return true; // Allow empty if not required
        return /^[0-9a-fA-F]{24}$/.test(v);
    },
    message: 'Invalid ObjectId format'
};

/**
 * Domain validator - checks if email domain is in allowed list
 */
const domainValidator = function(allowedDomainsField) {
    return {
        validator: async function(email) {
            if (!email) return true;
            const domain = email.split('@')[1];
            if (!domain) return false;
            
            // Get allowed domains from the document
            const allowedDomains = this[allowedDomainsField];
            if (!allowedDomains || !Array.isArray(allowedDomains)) return true;
            
            return allowedDomains.includes(domain);
        },
        message: 'Email domain is not in the allowed domains list'
    };
};

/**
 * File extension validator
 */
const fileExtensionValidator = function(allowedExtensions) {
    return {
        validator: function(filename) {
            if (!filename) return true;
            const ext = filename.split('.').pop().toLowerCase();
            return allowedExtensions.map(e => e.toLowerCase()).includes(ext);
        },
        message: `File must have one of these extensions: ${allowedExtensions.join(', ')}`
    };
};

/**
 * JSON validator - ensures string contains valid JSON
 */
const jsonValidator = {
    validator: function(v) {
        if (!v) return true;
        try {
            JSON.parse(v);
            return true;
        } catch {
            return false;
        }
    },
    message: 'Must be valid JSON'
};

export {
    emailValidator,
    phoneValidator,
    urlValidator,
    dateRangeValidator,
    arrayLengthValidator,
    enumValidator,
    objectIdValidator,
    domainValidator,
    fileExtensionValidator,
    jsonValidator
};