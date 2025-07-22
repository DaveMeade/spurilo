/**
 * ConfigManager - Centralized configuration management
 * Handles loading, validation, and runtime updates of configuration
 */
class ConfigManager {
    constructor() {
        this.config = {};
        this.watchers = new Map();
        this.loaded = false;
    }
    
    /**
     * Load all configuration files
     */
    async loadAllConfigs() {
        try {
            // Load core configuration files
            this.config.app = await this.loadJSON('/config/app.settings.json');
            this.config.debug = await this.loadJSON('/config/debug.settings.json');
            this.config.audit = await this.loadJSON('/config/audit.settings.json');
            this.config.compliance = await this.loadJSON('/config/compliance.settings.json');
            // Risk and reporting configs moved to archive until systems are implemented
            // this.config.risk = await this.loadJSON('/config/archive/_riskSettings.json');
            // this.config.reporting = await this.loadJSON('/config/archive/_reportSettings.json');
            
            // Validate configuration
            await this.validateConfig();
            
            this.loaded = true;
            this.log('Configuration loaded successfully');
        } catch (error) {
            console.error('Failed to load configuration:', error);
            throw error;
        }
    }
    
    /**
     * Load individual JSON configuration file
     */
    async loadJSON(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load config file: ${path}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`Config file not found or invalid: ${path}, using defaults`);
            return {};
        }
    }
    
    /**
     * Get configuration value using dot notation
     * @param {string} path - Configuration path (e.g., 'systems.audit.maxConcurrentAudits')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = null) {
        if (!this.loaded) {
            console.warn('Configuration not loaded yet, returning default value');
            return defaultValue;
        }
        
        const value = this.getNestedValue(this.config, path);
        
        // Log configuration access in debug mode
        if (this.get('debug.logConfigAccess', false)) {
            console.log(`Config access: ${path} = ${JSON.stringify(value)}`);
        }
        
        return value !== undefined ? value : defaultValue;
    }
    
    /**
     * Set configuration value using dot notation
     * @param {string} path - Configuration path
     * @param {*} value - Value to set
     */
    set(path, value) {
        this.setNestedValue(this.config, path, value);
        this.notifyWatchers(path, value);
        
        if (this.get('debug.logConfigChanges', false)) {
            console.log(`Config updated: ${path} = ${JSON.stringify(value)}`);
        }
    }
    
    /**
     * Watch for configuration changes
     * @param {string} path - Configuration path to watch
     * @param {Function} callback - Callback function
     */
    watch(path, callback) {
        if (!this.watchers.has(path)) {
            this.watchers.set(path, []);
        }
        this.watchers.get(path).push(callback);
    }
    
    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    
    /**
     * Set nested value in object using dot notation
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }
    
    /**
     * Notify watchers of configuration changes
     */
    notifyWatchers(path, value) {
        // Notify exact path watchers
        if (this.watchers.has(path)) {
            this.watchers.get(path).forEach(callback => {
                try {
                    callback(value, path);
                } catch (error) {
                    console.error('Error in config watcher:', error);
                }
            });
        }
        
        // Notify parent path watchers
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            if (this.watchers.has(parentPath)) {
                this.watchers.get(parentPath).forEach(callback => {
                    try {
                        callback(this.get(parentPath), parentPath);
                    } catch (error) {
                        console.error('Error in config watcher:', error);
                    }
                });
            }
        }
    }
    
    /**
     * Validate configuration
     */
    async validateConfig() {
        const errors = [];
        
        // Validate app configuration
        if (!this.config.app?.name) {
            errors.push('app.name is required');
        }
        
        // Validate system configurations
        await this.validateSystemConfigs(errors);
        
        if (errors.length > 0) {
            console.error('Configuration validation errors:', errors);
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }
    }
    
    /**
     * Validate system-specific configurations
     */
    async validateSystemConfigs(errors) {
        // Validate audit configuration
        const maxAudits = this.get('systems.audit.maxConcurrentAudits');
        if (maxAudits && (maxAudits < 1 || maxAudits > 100)) {
            errors.push('systems.audit.maxConcurrentAudits must be between 1 and 100');
        }
        
        // Risk configuration validation removed until system is implemented
        // const riskThreshold = this.get('systems.risk.highRiskThreshold');
        // if (riskThreshold && (riskThreshold < 0 || riskThreshold > 1)) {
        //     errors.push('systems.risk.highRiskThreshold must be between 0 and 1');
        // }
        
        // Validate compliance configuration
        const frameworks = this.get('systems.compliance.frameworkSources');
        if (frameworks && !Array.isArray(frameworks)) {
            errors.push('systems.compliance.frameworkSources must be an array');
        }
    }
    
    /**
     * Reload configuration from files
     */
    async reload() {
        this.config = {};
        this.loaded = false;
        await this.loadAllConfigs();
        
        // Notify all watchers of reload
        this.watchers.forEach((callbacks, path) => {
            const value = this.get(path);
            callbacks.forEach(callback => {
                try {
                    callback(value, path);
                } catch (error) {
                    console.error('Error in config watcher during reload:', error);
                }
            });
        });
    }
    
    /**
     * Get all configuration as object
     */
    getAll() {
        return { ...this.config };
    }
    
    /**
     * Health check for configuration system
     */
    healthCheck() {
        return {
            status: this.loaded ? 'healthy' : 'error',
            loaded: this.loaded,
            configFiles: Object.keys(this.config),
            watcherCount: this.watchers.size,
            lastValidation: this.lastValidation || null
        };
    }
    
    /**
     * Log message with configuration context
     */
    log(message, level = 'info') {
        if (this.get('debug.enableLogging', true)) {
            console[level](`[ConfigManager] ${message}`);
        }
    }
}

// Global configuration instance
const config = new ConfigManager();

// Auto-load configuration when module is imported
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await config.loadAllConfigs();
        } catch (error) {
            console.error('Failed to initialize configuration:', error);
        }
    });
} else {
    // Node.js environment
    config.loadAllConfigs().catch(error => {
        console.error('Failed to initialize configuration:', error);
    });
}

// ES modules export
export { ConfigManager, config };