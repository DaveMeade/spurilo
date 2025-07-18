/**
 * ComplianceFrameworksManager - Manages compliance frameworks and control mappings
 * Handles framework definitions, control assessments, and compliance gap analysis
 */
class ComplianceFrameworksManager {
    constructor() {
        this.frameworks = new Map();
        this.controlMappings = new Map();
        this.assessments = new Map();
        this.initialized = false;
    }
    
    /**
     * Initialize the compliance frameworks system
     */
    async initialize() {
        try {
            await this.loadFrameworks();
            await this.loadControlMappings();
            await this.loadExistingAssessments();
            
            this.initialized = true;
            this.log('Compliance Frameworks system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Compliance Frameworks system:', error);
            throw error;
        }
    }
    
    /**
     * Load available compliance frameworks
     */
    async loadFrameworks() {
        const frameworkSources = config.get('systems.compliance.frameworkSources', ['NIST', 'ISO27001', 'SOC2']);
        
        for (const frameworkName of frameworkSources) {
            try {
                const framework = await this.loadFrameworkDefinition(frameworkName);
                this.frameworks.set(frameworkName, framework);
                this.log(`Loaded framework: ${frameworkName}`);
            } catch (error) {
                console.warn(`Failed to load framework ${frameworkName}:`, error);
            }
        }
    }
    
    /**
     * Load individual framework definition
     */
    async loadFrameworkDefinition(frameworkName) {
        // In a real implementation, this would load from dataPacks or external sources
        const defaultFrameworks = {
            'NIST': {
                name: 'NIST Cybersecurity Framework',
                version: '1.1',
                categories: ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'],
                controls: await this.loadFrameworkControls('NIST')
            },
            'ISO27001': {
                name: 'ISO/IEC 27001:2013',
                version: '2013',
                categories: ['Information Security Policies', 'Organization of Information Security', 'Human Resource Security'],
                controls: await this.loadFrameworkControls('ISO27001')
            },
            'SOC2': {
                name: 'SOC 2 Type II',
                version: '2017',
                categories: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
                controls: await this.loadFrameworkControls('SOC2')
            }
        };
        
        return defaultFrameworks[frameworkName] || {
            name: frameworkName,
            version: '1.0',
            categories: [],
            controls: []
        };
    }
    
    /**
     * Load framework controls
     */
    async loadFrameworkControls(frameworkName) {
        // This would typically load from a comprehensive control database
        const sampleControls = {
            'NIST': [
                {
                    id: 'ID.AM-1',
                    name: 'Physical devices and systems within the organization are inventoried',
                    category: 'Identify',
                    subcategory: 'Asset Management',
                    description: 'Maintain an inventory of physical devices and systems',
                    priority: 'High'
                },
                {
                    id: 'PR.AC-1',
                    name: 'Identities and credentials are issued, managed, verified, revoked, and audited',
                    category: 'Protect',
                    subcategory: 'Access Control',
                    description: 'Manage user identities and access credentials',
                    priority: 'High'
                }
            ],
            'ISO27001': [
                {
                    id: 'A.5.1.1',
                    name: 'Information security policy',
                    category: 'Information Security Policies',
                    description: 'A set of policies for information security shall be defined',
                    priority: 'High'
                }
            ],
            'SOC2': [
                {
                    id: 'CC6.1',
                    name: 'Logical and physical access controls',
                    category: 'Security',
                    description: 'The entity implements logical and physical access controls',
                    priority: 'High'
                }
            ]
        };
        
        return sampleControls[frameworkName] || [];
    }
    
    /**
     * Load control mappings between frameworks
     */
    async loadControlMappings() {
        // Load existing control mappings
        const mappings = config.get('systems.compliance.controlMappings', {});
        
        for (const [key, mapping] of Object.entries(mappings)) {
            this.controlMappings.set(key, mapping);
        }
    }
    
    /**
     * Load existing control assessments
     */
    async loadExistingAssessments() {
        // In a real implementation, this would load from persistent storage
        this.assessments = new Map();
    }
    
    /**
     * Get available frameworks
     */
    getFrameworks() {
        return Array.from(this.frameworks.keys());
    }
    
    /**
     * Get framework details
     */
    getFramework(frameworkName) {
        return this.frameworks.get(frameworkName);
    }
    
    /**
     * Get controls for a specific framework
     */
    getFrameworkControls(frameworkName, category = null) {
        const framework = this.frameworks.get(frameworkName);
        if (!framework) return [];
        
        let controls = framework.controls;
        
        if (category) {
            controls = controls.filter(control => control.category === category);
        }
        
        return controls;
    }
    
    /**
     * Assess a control
     */
    async assessControl(frameworkName, controlId, assessment) {
        const assessmentKey = `${frameworkName}_${controlId}`;
        
        const controlAssessment = {
            frameworkName,
            controlId,
            assessmentDate: new Date().toISOString(),
            assessor: assessment.assessor,
            status: assessment.status, // 'compliant', 'non-compliant', 'partially-compliant', 'not-applicable'
            maturityLevel: assessment.maturityLevel, // 'initial', 'developing', 'defined', 'managed', 'optimized'
            evidence: assessment.evidence || [],
            findings: assessment.findings || [],
            remediation: assessment.remediation || null,
            nextAssessmentDate: assessment.nextAssessmentDate
        };
        
        this.assessments.set(assessmentKey, controlAssessment);
        
        // Notify other systems of assessment update
        this.notifyAssessmentUpdate(controlAssessment);
        
        return controlAssessment;
    }
    
    /**
     * Get control assessment
     */
    getControlAssessment(frameworkName, controlId) {
        const assessmentKey = `${frameworkName}_${controlId}`;
        return this.assessments.get(assessmentKey);
    }
    
    /**
     * Get all assessments for a framework
     */
    getFrameworkAssessments(frameworkName) {
        const assessments = [];
        
        for (const [key, assessment] of this.assessments) {
            if (assessment.frameworkName === frameworkName) {
                assessments.push(assessment);
            }
        }
        
        return assessments;
    }
    
    /**
     * Calculate compliance score for a framework
     */
    calculateComplianceScore(frameworkName) {
        const framework = this.frameworks.get(frameworkName);
        if (!framework) return 0;
        
        const totalControls = framework.controls.length;
        if (totalControls === 0) return 0;
        
        const assessments = this.getFrameworkAssessments(frameworkName);
        const assessmentMap = new Map();
        
        assessments.forEach(assessment => {
            assessmentMap.set(assessment.controlId, assessment);
        });
        
        let compliantControls = 0;
        let partiallyCompliantControls = 0;
        
        framework.controls.forEach(control => {
            const assessment = assessmentMap.get(control.id);
            if (assessment) {
                if (assessment.status === 'compliant') {
                    compliantControls++;
                } else if (assessment.status === 'partially-compliant') {
                    partiallyCompliantControls++;
                }
            }
        });
        
        // Calculate score: full points for compliant, half points for partially compliant
        const score = (compliantControls + (partiallyCompliantControls * 0.5)) / totalControls;
        
        return Math.round(score * 100) / 100; // Round to 2 decimal places
    }
    
    /**
     * Perform gap analysis
     */
    performGapAnalysis(frameworkName) {
        const framework = this.frameworks.get(frameworkName);
        if (!framework) return null;
        
        const assessments = this.getFrameworkAssessments(frameworkName);
        const assessmentMap = new Map();
        
        assessments.forEach(assessment => {
            assessmentMap.set(assessment.controlId, assessment);
        });
        
        const gaps = [];
        const compliantControls = [];
        const partiallyCompliantControls = [];
        
        framework.controls.forEach(control => {
            const assessment = assessmentMap.get(control.id);
            
            if (!assessment) {
                gaps.push({
                    controlId: control.id,
                    controlName: control.name,
                    category: control.category,
                    priority: control.priority,
                    reason: 'Not assessed'
                });
            } else if (assessment.status === 'non-compliant') {
                gaps.push({
                    controlId: control.id,
                    controlName: control.name,
                    category: control.category,
                    priority: control.priority,
                    reason: 'Non-compliant',
                    findings: assessment.findings
                });
            } else if (assessment.status === 'partially-compliant') {
                partiallyCompliantControls.push({
                    controlId: control.id,
                    controlName: control.name,
                    category: control.category,
                    assessment: assessment
                });
            } else if (assessment.status === 'compliant') {
                compliantControls.push({
                    controlId: control.id,
                    controlName: control.name,
                    category: control.category,
                    assessment: assessment
                });
            }
        });
        
        return {
            frameworkName,
            totalControls: framework.controls.length,
            compliantControls: compliantControls.length,
            partiallyCompliantControls: partiallyCompliantControls.length,
            gaps: gaps.length,
            complianceScore: this.calculateComplianceScore(frameworkName),
            gapDetails: gaps,
            partiallyCompliantDetails: partiallyCompliantControls
        };
    }
    
    /**
     * Notify other systems of assessment updates
     */
    notifyAssessmentUpdate(assessment) {
        // This would integrate with other systems through helper interfaces
        if (config.get('systems.compliance.notifyAuditSystem', true)) {
            // Notify audit system of assessment changes
            this.log(`Assessment updated: ${assessment.frameworkName} - ${assessment.controlId}`);
        }
    }
    
    /**
     * Health check for the compliance frameworks system
     */
    healthCheck() {
        return {
            status: this.initialized ? 'healthy' : 'error',
            initialized: this.initialized,
            frameworksLoaded: this.frameworks.size,
            assessmentsCount: this.assessments.size,
            controlMappingsCount: this.controlMappings.size,
            availableFrameworks: Array.from(this.frameworks.keys())
        };
    }
    
    /**
     * Log message with system context
     */
    log(message, level = 'info') {
        if (config.get('debug.systems.compliance', false)) {
            console[level](`[ComplianceFrameworks] ${message}`);
        }
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ComplianceFrameworksManager };
} else {
    window.ComplianceFrameworksManager = ComplianceFrameworksManager;
}