/**
 * ComplianceFrameworksHelpers - Helper interface for Compliance Frameworks system
 * Provides external interface for other systems to interact with compliance frameworks
 */
class ComplianceFrameworksHelpers {
    static manager = null;
    
    /**
     * Initialize the compliance frameworks system
     */
    static async initialize() {
        if (!this.manager) {
            this.manager = new ComplianceFrameworksManager();
            await this.manager.initialize();
        }
        return this.manager;
    }
    
    /**
     * Get list of available frameworks
     */
    static async getAvailableFrameworks() {
        await this.ensureInitialized();
        return this.manager.getFrameworks();
    }
    
    /**
     * Get framework details
     */
    static async getFrameworkDetails(frameworkName) {
        await this.ensureInitialized();
        return this.manager.getFramework(frameworkName);
    }
    
    /**
     * Get controls for a framework
     */
    static async getFrameworkControls(frameworkName, category = null) {
        await this.ensureInitialized();
        return this.manager.getFrameworkControls(frameworkName, category);
    }
    
    /**
     * Get overall compliance score across all frameworks
     */
    static async getOverallComplianceScore() {
        await this.ensureInitialized();
        
        const frameworks = this.manager.getFrameworks();
        if (frameworks.length === 0) return 0;
        
        let totalScore = 0;
        let validFrameworks = 0;
        
        frameworks.forEach(frameworkName => {
            const score = this.manager.calculateComplianceScore(frameworkName);
            if (score >= 0) {
                totalScore += score;
                validFrameworks++;
            }
        });
        
        return validFrameworks > 0 ? totalScore / validFrameworks : 0;
    }
    
    /**
     * Get compliance score for a specific framework
     */
    static async getFrameworkComplianceScore(frameworkName) {
        await this.ensureInitialized();
        return this.manager.calculateComplianceScore(frameworkName);
    }
    
    /**
     * Get compliance status summary
     */
    static async getComplianceStatusSummary() {
        await this.ensureInitialized();
        
        const frameworks = this.manager.getFrameworks();
        const summary = {
            totalFrameworks: frameworks.length,
            averageComplianceScore: await this.getOverallComplianceScore(),
            frameworkScores: {},
            totalControls: 0,
            assessedControls: 0,
            compliantControls: 0
        };
        
        frameworks.forEach(frameworkName => {
            const score = this.manager.calculateComplianceScore(frameworkName);
            const gapAnalysis = this.manager.performGapAnalysis(frameworkName);
            
            summary.frameworkScores[frameworkName] = {
                score: score,
                totalControls: gapAnalysis.totalControls,
                compliantControls: gapAnalysis.compliantControls,
                partiallyCompliantControls: gapAnalysis.partiallyCompliantControls,
                gaps: gapAnalysis.gaps
            };
            
            summary.totalControls += gapAnalysis.totalControls;
            summary.assessedControls += (gapAnalysis.compliantControls + gapAnalysis.partiallyCompliantControls);
            summary.compliantControls += gapAnalysis.compliantControls;
        });
        
        return summary;
    }
    
    /**
     * Perform gap analysis for a framework
     */
    static async performGapAnalysis(frameworkName) {
        await this.ensureInitialized();
        return this.manager.performGapAnalysis(frameworkName);
    }
    
    /**
     * Get all gap analyses
     */
    static async getAllGapAnalyses() {
        await this.ensureInitialized();
        
        const frameworks = this.manager.getFrameworks();
        const analyses = {};
        
        frameworks.forEach(frameworkName => {
            analyses[frameworkName] = this.manager.performGapAnalysis(frameworkName);
        });
        
        return analyses;
    }
    
    /**
     * Get high-priority compliance gaps
     */
    static async getHighPriorityGaps() {
        await this.ensureInitialized();
        
        const allAnalyses = await this.getAllGapAnalyses();
        const highPriorityGaps = [];
        
        Object.values(allAnalyses).forEach(analysis => {
            if (analysis && analysis.gapDetails) {
                const highPriorityFrameworkGaps = analysis.gapDetails.filter(gap => 
                    gap.priority === 'High' || gap.priority === 'Critical'
                );
                
                highPriorityFrameworkGaps.forEach(gap => {
                    highPriorityGaps.push({
                        ...gap,
                        framework: analysis.frameworkName
                    });
                });
            }
        });
        
        return highPriorityGaps;
    }
    
    /**
     * Assess a control
     */
    static async assessControl(frameworkName, controlId, assessment) {
        await this.ensureInitialized();
        return this.manager.assessControl(frameworkName, controlId, assessment);
    }
    
    /**
     * Get control assessment
     */
    static async getControlAssessment(frameworkName, controlId) {
        await this.ensureInitialized();
        return this.manager.getControlAssessment(frameworkName, controlId);
    }
    
    /**
     * Get all assessments for a framework
     */
    static async getFrameworkAssessments(frameworkName) {
        await this.ensureInitialized();
        return this.manager.getFrameworkAssessments(frameworkName);
    }
    
    /**
     * Get recent assessment activities
     */
    static async getRecentAssessmentActivities(limit = 10) {
        await this.ensureInitialized();
        
        const frameworks = this.manager.getFrameworks();
        const allAssessments = [];
        
        frameworks.forEach(frameworkName => {
            const assessments = this.manager.getFrameworkAssessments(frameworkName);
            allAssessments.push(...assessments);
        });
        
        // Sort by assessment date (most recent first)
        allAssessments.sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
        
        return allAssessments.slice(0, limit);
    }
    
    /**
     * Get controls requiring assessment
     */
    static async getControlsRequiringAssessment(frameworkName = null) {
        await this.ensureInitialized();
        
        const frameworks = frameworkName ? [frameworkName] : this.manager.getFrameworks();
        const controlsRequiringAssessment = [];
        
        frameworks.forEach(framework => {
            const gapAnalysis = this.manager.performGapAnalysis(framework);
            
            if (gapAnalysis && gapAnalysis.gapDetails) {
                gapAnalysis.gapDetails.forEach(gap => {
                    if (gap.reason === 'Not assessed') {
                        controlsRequiringAssessment.push({
                            framework: framework,
                            controlId: gap.controlId,
                            controlName: gap.controlName,
                            category: gap.category,
                            priority: gap.priority
                        });
                    }
                });
            }
        });
        
        return controlsRequiringAssessment;
    }
    
    /**
     * Get compliance trends over time
     */
    static async getComplianceTrends(frameworkName = null, timeframe = '12months') {
        await this.ensureInitialized();
        
        // In a real implementation, this would query historical data
        // For now, return mock trend data
        const frameworks = frameworkName ? [frameworkName] : this.manager.getFrameworks();
        const trends = {};
        
        frameworks.forEach(framework => {
            const currentScore = this.manager.calculateComplianceScore(framework);
            
            // Generate mock historical data
            trends[framework] = {
                current: currentScore,
                historical: this.generateMockTrendData(currentScore, timeframe)
            };
        });
        
        return trends;
    }
    
    /**
     * Generate mock trend data for demonstration
     */
    static generateMockTrendData(currentScore, timeframe) {
        const months = timeframe === '12months' ? 12 : 6;
        const data = [];
        
        for (let i = months; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            // Generate score with some variation
            const variation = (Math.random() - 0.5) * 0.2;
            const score = Math.max(0, Math.min(1, currentScore + variation));
            
            data.push({
                date: date.toISOString().split('T')[0],
                score: Math.round(score * 100) / 100
            });
        }
        
        return data;
    }
    
    /**
     * Health check for compliance frameworks system
     */
    static async healthCheck() {
        try {
            await this.ensureInitialized();
            return this.manager.healthCheck();
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                initialized: false
            };
        }
    }
    
    /**
     * Get system interface information
     */
    static getInterface() {
        return {
            name: 'ComplianceFrameworksHelpers',
            version: '1.0.0',
            methods: [
                'getAvailableFrameworks',
                'getFrameworkDetails',
                'getFrameworkControls',
                'getOverallComplianceScore',
                'getFrameworkComplianceScore',
                'getComplianceStatusSummary',
                'performGapAnalysis',
                'getAllGapAnalyses',
                'getHighPriorityGaps',
                'assessControl',
                'getControlAssessment',
                'getFrameworkAssessments',
                'getRecentAssessmentActivities',
                'getControlsRequiringAssessment',
                'getComplianceTrends',
                'healthCheck'
            ],
            description: 'Helper interface for compliance frameworks management'
        };
    }
    
    /**
     * Ensure the system is initialized
     */
    static async ensureInitialized() {
        if (!this.manager || !this.manager.initialized) {
            await this.initialize();
        }
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ComplianceFrameworksHelpers };
} else {
    window.ComplianceFrameworksHelpers = ComplianceFrameworksHelpers;
}