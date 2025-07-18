/**
 * AuditManagementManager - Manages audit engagements, findings, and remediation
 * Handles engagement lifecycle from planning through completion
 * Supports multiple engagement types: Gap Assessment, Internal Audit, Audit Prep, Audit Facilitation
 * Integrates with UserRole system for participant management
 */
class AuditManagementManager {
    constructor() {
        this.engagements = new Map();
        this.findings = new Map();
        this.remediations = new Map();
        this.schedules = new Map();
        this.engagementTypes = new Map();
        this.userRoleHelpers = null;
        this.initialized = false;
    }
    
    /**
     * Initialize the audit management system
     */
    async initialize() {
        try {
            await this.initializeUserRoleHelpers();
            await this.loadEngagementTypes();
            await this.loadExistingEngagements();
            await this.loadAuditSchedules();
            await this.loadFindings();
            await this.loadRemediations();
            
            this.initialized = true;
            this.log('Audit Management system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Audit Management system:', error);
            throw error;
        }
    }

    /**
     * Initialize UserRole helpers
     */
    async initializeUserRoleHelpers() {
        try {
            const { userRoleHelpers } = require('../UserRole/UserRoleHelpers');
            this.userRoleHelpers = userRoleHelpers;
            await this.userRoleHelpers.initialize();
            this.log('UserRole helpers initialized');
        } catch (error) {
            console.error('Failed to initialize UserRole helpers:', error);
            throw error;
        }
    }
    
    /**
     * Load engagement types from configuration
     */
    async loadEngagementTypes() {
        try {
            const fs = require('fs');
            const path = require('path');
            const configPath = path.join(process.cwd(), 'config', 'engagementTypes.json');
            
            if (fs.existsSync(configPath)) {
                const engagementTypesData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                
                Object.values(engagementTypesData.engagementTypes).forEach(type => {
                    this.engagementTypes.set(type.id, type);
                });
                
                this.log('Loaded engagement types from configuration');
            } else {
                this.log('No engagement types configuration found, using defaults');
            }
        } catch (error) {
            console.error('Failed to load engagement types:', error);
            throw error;
        }
    }

    /**
     * Load existing engagements from storage
     */
    async loadExistingEngagements() {
        // In a real implementation, this would load from persistent storage
        // For now, create some sample data
        const sampleEngagements = [
            {
                id: 'eng-001',
                name: 'Q1 2024 Gap Assessment',
                engagementType: 'gap-assessment',
                framework: 'NIST',
                status: 'in-progress',
                priority: 'high',
                startDate: '2024-01-15',
                endDate: '2024-02-15',
                consultant: 'John Smith',
                scope: 'Information Security Controls',
                findings: [],
                currentPhase: 'assessment',
                deliverables: [],
                requiredDocuments: []
            },
            {
                id: 'eng-002',
                name: 'SOC 2 Internal Audit',
                engagementType: 'internal-audit',
                framework: 'SOC2',
                status: 'completed',
                priority: 'medium',
                startDate: '2024-01-01',
                endDate: '2024-01-31',
                consultant: 'External Auditor',
                scope: 'Trust Services Criteria',
                findings: ['finding-001', 'finding-002'],
                currentPhase: 'reporting',
                deliverables: ['Internal Audit Report', 'NCR-001', 'CAP-001'],
                requiredDocuments: ['Security Policies', 'Risk Assessment']
            }
        ];
        
        sampleEngagements.forEach(engagement => {
            this.engagements.set(engagement.id, engagement);
        });
    }
    
    /**
     * Load audit schedules
     */
    async loadAuditSchedules() {
        const scheduleInterval = config.get('systems.audit.defaultScheduleInterval', 'quarterly');
        
        // Create default schedules based on configuration
        const defaultSchedules = [
            {
                id: 'schedule-001',
                name: 'Quarterly Security Review',
                framework: 'NIST',
                frequency: 'quarterly',
                nextDue: this.calculateNextDueDate('quarterly'),
                responsible: 'Security Team',
                active: true
            },
            {
                id: 'schedule-002',
                name: 'Annual SOC 2 Audit',
                framework: 'SOC2',
                frequency: 'yearly',
                nextDue: this.calculateNextDueDate('yearly'),
                responsible: 'External Auditor',
                active: true
            }
        ];
        
        defaultSchedules.forEach(schedule => {
            this.schedules.set(schedule.id, schedule);
        });
    }
    
    /**
     * Load existing findings
     */
    async loadFindings() {
        const sampleFindings = [
            {
                id: 'finding-001',
                auditId: 'audit-002',
                controlId: 'CC6.1',
                framework: 'SOC2',
                severity: 'medium',
                status: 'open',
                title: 'Inadequate Access Review Process',
                description: 'User access reviews are not performed regularly',
                evidence: 'No evidence of quarterly access reviews',
                recommendation: 'Implement quarterly access review process',
                dueDate: '2024-03-15',
                assignedTo: 'IT Team',
                createdDate: '2024-01-31'
            },
            {
                id: 'finding-002',
                auditId: 'audit-002',
                controlId: 'CC6.2',
                framework: 'SOC2',
                severity: 'high',
                status: 'in-remediation',
                title: 'Weak Password Policy',
                description: 'Password policy does not meet security requirements',
                evidence: 'Current policy allows 6-character passwords',
                recommendation: 'Update password policy to require 12+ characters',
                dueDate: '2024-02-29',
                assignedTo: 'Security Team',
                createdDate: '2024-01-31'
            }
        ];
        
        sampleFindings.forEach(finding => {
            this.findings.set(finding.id, finding);
        });
    }
    
    /**
     * Load remediation activities
     */
    async loadRemediations() {
        const sampleRemediations = [
            {
                id: 'remediation-001',
                findingId: 'finding-002',
                status: 'in-progress',
                assignedTo: 'Security Team',
                startDate: '2024-02-01',
                targetDate: '2024-02-29',
                actions: [
                    'Review current password policy',
                    'Update policy documentation',
                    'Implement technical controls',
                    'Communicate changes to users'
                ],
                progress: 0.6,
                notes: 'Policy updated, implementing technical controls'
            }
        ];
        
        sampleRemediations.forEach(remediation => {
            this.remediations.set(remediation.id, remediation);
        });
    }
    
    /**
     * Create a new engagement
     */
    async createEngagement(engagementData) {
        const engagementId = `eng-${Date.now()}`;
        
        // Get engagement type configuration
        const engagementType = this.engagementTypes.get(engagementData.engagementType);
        if (!engagementType) {
            throw new Error(`Invalid engagement type: ${engagementData.engagementType}`);
        }
        
        const engagement = {
            id: engagementId,
            name: engagementData.name,
            engagementType: engagementData.engagementType,
            framework: engagementData.framework,
            status: 'planning',
            priority: engagementData.priority || 'medium',
            startDate: engagementData.startDate,
            endDate: engagementData.endDate,
            consultant: engagementData.consultant,
            scope: engagementData.scope,
            findings: [],
            currentPhase: engagementType.phases[0]?.name?.toLowerCase() || 'planning',
            deliverables: [...engagementType.deliverables],
            requiredDocuments: [...engagementType.requiredDocuments],
            participants: [],
            createdBy: engagementData.createdBy || 'system',
            createdDate: new Date().toISOString()
        };
        
        this.engagements.set(engagementId, engagement);
        this.log(`Created new engagement: ${engagement.name} (${engagementId})`);
        
        return engagement;
    }

    /**
     * Create a new audit (legacy method for backward compatibility)
     */
    async createAudit(auditData) {
        // Convert audit data to engagement format
        const engagementData = {
            name: auditData.name,
            engagementType: auditData.type === 'compliance' ? 'internal-audit' : 'gap-assessment',
            framework: auditData.framework,
            priority: 'medium',
            startDate: auditData.startDate,
            endDate: auditData.endDate,
            consultant: auditData.auditor,
            scope: auditData.scope
        };
        
        return await this.createEngagement(engagementData);
    }
    
    /**
     * Update engagement status
     */
    async updateEngagementStatus(engagementId, status) {
        const engagement = this.engagements.get(engagementId);
        if (!engagement) {
            throw new Error(`Engagement not found: ${engagementId}`);
        }
        
        engagement.status = status;
        engagement.lastUpdated = new Date().toISOString();
        
        this.log(`Updated engagement ${engagementId} status to: ${status}`);
        
        return engagement;
    }

    /**
     * Update engagement phase
     */
    async updateEngagementPhase(engagementId, phase) {
        const engagement = this.engagements.get(engagementId);
        if (!engagement) {
            throw new Error(`Engagement not found: ${engagementId}`);
        }
        
        engagement.currentPhase = phase;
        engagement.lastUpdated = new Date().toISOString();
        
        this.log(`Updated engagement ${engagementId} phase to: ${phase}`);
        
        return engagement;
    }

    /**
     * Update audit status (legacy method for backward compatibility)
     */
    async updateAuditStatus(auditId, status) {
        return await this.updateEngagementStatus(auditId, status);
    }
    
    /**
     * Create a new finding
     */
    async createFinding(findingData) {
        const findingId = `finding-${Date.now()}`;
        
        const finding = {
            id: findingId,
            engagementId: findingData.engagementId || findingData.auditId, // Support legacy auditId
            controlId: findingData.controlId,
            framework: findingData.framework,
            severity: findingData.severity,
            status: 'open',
            title: findingData.title,
            description: findingData.description,
            evidence: findingData.evidence,
            recommendation: findingData.recommendation,
            dueDate: findingData.dueDate,
            assignedTo: findingData.assignedTo,
            createdDate: new Date().toISOString()
        };
        
        this.findings.set(findingId, finding);
        
        // Add finding to engagement
        const engagement = this.engagements.get(finding.engagementId);
        if (engagement) {
            engagement.findings.push(findingId);
        }
        
        this.log(`Created new finding: ${finding.title} (${findingId})`);
        
        return finding;
    }
    
    /**
     * Update finding status
     */
    async updateFindingStatus(findingId, status) {
        const finding = this.findings.get(findingId);
        if (!finding) {
            throw new Error(`Finding not found: ${findingId}`);
        }
        
        finding.status = status;
        finding.lastUpdated = new Date().toISOString();
        
        this.log(`Updated finding ${findingId} status to: ${status}`);
        
        return finding;
    }
    
    /**
     * Create remediation plan
     */
    async createRemediationPlan(findingId, remediationData) {
        const remediationId = `remediation-${Date.now()}`;
        
        const remediation = {
            id: remediationId,
            findingId: findingId,
            status: 'planned',
            assignedTo: remediationData.assignedTo,
            startDate: remediationData.startDate,
            targetDate: remediationData.targetDate,
            actions: remediationData.actions || [],
            progress: 0,
            notes: remediationData.notes || '',
            createdDate: new Date().toISOString()
        };
        
        this.remediations.set(remediationId, remediation);
        
        // Update finding status
        await this.updateFindingStatus(findingId, 'in-remediation');
        
        this.log(`Created remediation plan for finding ${findingId}`);
        
        return remediation;
    }
    
    /**
     * Update remediation progress
     */
    async updateRemediationProgress(remediationId, progress, notes = '') {
        const remediation = this.remediations.get(remediationId);
        if (!remediation) {
            throw new Error(`Remediation not found: ${remediationId}`);
        }
        
        remediation.progress = progress;
        remediation.notes = notes;
        remediation.lastUpdated = new Date().toISOString();
        
        if (progress >= 1.0) {
            remediation.status = 'completed';
            remediation.completedDate = new Date().toISOString();
            
            // Mark finding as remediated
            await this.updateFindingStatus(remediation.findingId, 'remediated');
        }
        
        this.log(`Updated remediation ${remediationId} progress to: ${progress * 100}%`);
        
        return remediation;
    }
    
    /**
     * Get all engagements
     */
    getEngagements(status = null, engagementType = null) {
        let engagements = Array.from(this.engagements.values());
        
        if (status) {
            engagements = engagements.filter(engagement => engagement.status === status);
        }
        
        if (engagementType) {
            engagements = engagements.filter(engagement => engagement.engagementType === engagementType);
        }
        
        return engagements;
    }

    /**
     * Get engagement by ID
     */
    getEngagement(engagementId) {
        return this.engagements.get(engagementId);
    }

    /**
     * Get findings for an engagement
     */
    getEngagementFindings(engagementId) {
        const engagement = this.engagements.get(engagementId);
        if (!engagement) return [];
        
        return engagement.findings.map(findingId => this.findings.get(findingId)).filter(Boolean);
    }

    /**
     * Get all audits (legacy method for backward compatibility)
     */
    getAudits(status = null) {
        return this.getEngagements(status);
    }
    
    /**
     * Get audit by ID (legacy method for backward compatibility)
     */
    getAudit(auditId) {
        return this.getEngagement(auditId);
    }
    
    /**
     * Get findings for an audit (legacy method for backward compatibility)
     */
    getAuditFindings(auditId) {
        return this.getEngagementFindings(auditId);
    }
    
    /**
     * Get all findings
     */
    getFindings(status = null) {
        let findings = Array.from(this.findings.values());
        
        if (status) {
            findings = findings.filter(finding => finding.status === status);
        }
        
        return findings;
    }
    
    /**
     * Get finding by ID
     */
    getFinding(findingId) {
        return this.findings.get(findingId);
    }
    
    /**
     * Get remediation for a finding
     */
    getFindingRemediation(findingId) {
        for (const remediation of this.remediations.values()) {
            if (remediation.findingId === findingId) {
                return remediation;
            }
        }
        return null;
    }
    
    /**
     * Get audit schedules
     */
    getAuditSchedules() {
        return Array.from(this.schedules.values());
    }
    
    /**
     * Get upcoming audits
     */
    getUpcomingAudits(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + days);
        
        const upcomingAudits = [];
        
        // Check scheduled audits
        this.schedules.forEach(schedule => {
            if (schedule.active && new Date(schedule.nextDue) <= cutoffDate) {
                upcomingAudits.push({
                    type: 'scheduled',
                    schedule: schedule,
                    dueDate: schedule.nextDue
                });
            }
        });
        
        // Check in-progress audits
        this.audits.forEach(audit => {
            if (audit.status === 'in-progress' && new Date(audit.endDate) <= cutoffDate) {
                upcomingAudits.push({
                    type: 'ending',
                    audit: audit,
                    dueDate: audit.endDate
                });
            }
        });
        
        return upcomingAudits.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
    
    /**
     * Get overdue items
     */
    getOverdueItems() {
        const today = new Date();
        const overdue = [];
        
        // Check overdue findings
        this.findings.forEach(finding => {
            if (finding.status === 'open' && new Date(finding.dueDate) < today) {
                overdue.push({
                    type: 'finding',
                    item: finding,
                    daysOverdue: Math.floor((today - new Date(finding.dueDate)) / (1000 * 60 * 60 * 24))
                });
            }
        });
        
        // Check overdue remediations
        this.remediations.forEach(remediation => {
            if (remediation.status === 'in-progress' && new Date(remediation.targetDate) < today) {
                overdue.push({
                    type: 'remediation',
                    item: remediation,
                    daysOverdue: Math.floor((today - new Date(remediation.targetDate)) / (1000 * 60 * 60 * 24))
                });
            }
        });
        
        return overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
    }
    
    /**
     * Calculate next due date based on frequency
     */
    calculateNextDueDate(frequency) {
        const now = new Date();
        
        switch (frequency) {
            case 'weekly':
                now.setDate(now.getDate() + 7);
                break;
            case 'monthly':
                now.setMonth(now.getMonth() + 1);
                break;
            case 'quarterly':
                now.setMonth(now.getMonth() + 3);
                break;
            case 'yearly':
                now.setFullYear(now.getFullYear() + 1);
                break;
            default:
                now.setMonth(now.getMonth() + 3); // Default to quarterly
        }
        
        return now.toISOString().split('T')[0];
    }
    
    /**
     * Health check for the audit management system
     */
    healthCheck() {
        const openFindings = this.getFindings('open').length;
        const inProgressEngagements = this.getEngagements('in-progress').length;
        const overdueItems = this.getOverdueItems().length;
        
        return {
            status: this.initialized ? 'healthy' : 'error',
            initialized: this.initialized,
            engagementsCount: this.engagements.size,
            engagementTypesCount: this.engagementTypes.size,
            findingsCount: this.findings.size,
            remediationsCount: this.remediations.size,
            schedulesCount: this.schedules.size,
            openFindings: openFindings,
            inProgressEngagements: inProgressEngagements,
            overdueItems: overdueItems
        };
    }
    
    /**
     * Get available engagement types
     */
    getEngagementTypes() {
        return Array.from(this.engagementTypes.values());
    }

    /**
     * Get engagement type by ID
     */
    getEngagementType(typeId) {
        return this.engagementTypes.get(typeId);
    }

    /**
     * Get engagement phases by type
     */
    getEngagementPhases(engagementType) {
        const type = this.engagementTypes.get(engagementType);
        return type ? type.phases : [];
    }

    /**
     * Get engagement deliverables by type
     */
    getEngagementDeliverables(engagementType) {
        const type = this.engagementTypes.get(engagementType);
        return type ? type.deliverables : [];
    }

    /**
     * Get engagement required documents by type
     */
    getEngagementRequiredDocuments(engagementType) {
        const type = this.engagementTypes.get(engagementType);
        return type ? type.requiredDocuments : [];
    }

    /**
     * Add participant to engagement
     */
    async addParticipantToEngagement(engagementId, userId, roles, assignedControls = []) {
        try {
            const engagement = this.engagements.get(engagementId);
            if (!engagement) {
                throw new Error(`Engagement not found: ${engagementId}`);
            }

            // Add user to engagement via UserRole system
            await this.userRoleHelpers.addUserToEngagement(userId, engagementId, roles, assignedControls);

            // Update local engagement participants list
            const existingParticipant = engagement.participants.find(p => p.userId === userId);
            if (existingParticipant) {
                existingParticipant.roles = [...new Set([...existingParticipant.roles, ...roles])];
                existingParticipant.assignedControls = [...new Set([...existingParticipant.assignedControls, ...assignedControls])];
            } else {
                engagement.participants.push({
                    userId: userId,
                    roles: roles,
                    assignedControls: assignedControls,
                    joinedDate: new Date().toISOString(),
                    status: 'active'
                });
            }

            engagement.lastUpdated = new Date().toISOString();
            this.log(`Added participant ${userId} to engagement ${engagementId} with roles: ${roles.join(', ')}`);
            
            return engagement;
        } catch (error) {
            console.error('Failed to add participant to engagement:', error);
            throw error;
        }
    }

    /**
     * Remove participant from engagement
     */
    async removeParticipantFromEngagement(engagementId, userId) {
        try {
            const engagement = this.engagements.get(engagementId);
            if (!engagement) {
                throw new Error(`Engagement not found: ${engagementId}`);
            }

            // Remove user from engagement via UserRole system
            await this.userRoleHelpers.removeUserFromEngagement(userId, engagementId);

            // Update local engagement participants list
            engagement.participants = engagement.participants.filter(p => p.userId !== userId);
            engagement.lastUpdated = new Date().toISOString();

            this.log(`Removed participant ${userId} from engagement ${engagementId}`);
            
            return engagement;
        } catch (error) {
            console.error('Failed to remove participant from engagement:', error);
            throw error;
        }
    }

    /**
     * Get engagement participants
     */
    async getEngagementParticipants(engagementId) {
        try {
            const participants = await this.userRoleHelpers.getEngagementParticipants(engagementId);
            return participants;
        } catch (error) {
            console.error('Failed to get engagement participants:', error);
            return [];
        }
    }

    /**
     * Get engagement participants with user details
     */
    async getEngagementParticipantsWithDetails(engagementId) {
        try {
            const participants = await this.userRoleHelpers.getEngagementParticipants(engagementId);
            const participantsWithDetails = [];

            for (const participant of participants) {
                const user = await this.userRoleHelpers.getUser(participant.userId);
                if (user) {
                    participantsWithDetails.push({
                        ...participant,
                        user: {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            organization: user.organization,
                            title: user.title
                        }
                    });
                }
            }

            return participantsWithDetails;
        } catch (error) {
            console.error('Failed to get engagement participants with details:', error);
            return [];
        }
    }

    /**
     * Check if user has permission for engagement
     */
    async checkEngagementPermission(userId, engagementId, permission) {
        try {
            return await this.userRoleHelpers.userHasPermission(userId, permission, engagementId);
        } catch (error) {
            console.error('Failed to check engagement permission:', error);
            return false;
        }
    }

    /**
     * Get users with specific role in engagement
     */
    async getEngagementUsersByRole(engagementId, role) {
        try {
            const participants = await this.userRoleHelpers.getEngagementParticipants(engagementId);
            const usersWithRole = participants.filter(p => p.roles.includes(role));
            
            const usersWithDetails = [];
            for (const participant of usersWithRole) {
                const user = await this.userRoleHelpers.getUser(participant.userId);
                if (user) {
                    usersWithDetails.push(user);
                }
            }
            
            return usersWithDetails;
        } catch (error) {
            console.error('Failed to get engagement users by role:', error);
            return [];
        }
    }

    /**
     * Assign controls to user in engagement
     */
    async assignControlsToUser(engagementId, userId, controls) {
        try {
            const engagement = this.engagements.get(engagementId);
            if (!engagement) {
                throw new Error(`Engagement not found: ${engagementId}`);
            }

            const participant = engagement.participants.find(p => p.userId === userId);
            if (!participant) {
                throw new Error(`User ${userId} is not a participant in engagement ${engagementId}`);
            }

            participant.assignedControls = [...new Set([...participant.assignedControls, ...controls])];
            engagement.lastUpdated = new Date().toISOString();

            // Update in UserRole system as well
            const user = await this.userRoleHelpers.getUser(userId);
            if (user) {
                const userEngagement = user.engagements.find(e => e.engagementId === engagementId);
                if (userEngagement) {
                    userEngagement.assignedControls = participant.assignedControls;
                    await this.userRoleHelpers.updateUser(userId, { engagements: user.engagements });
                }
            }

            this.log(`Assigned controls to user ${userId} in engagement ${engagementId}: ${controls.join(', ')}`);
            
            return engagement;
        } catch (error) {
            console.error('Failed to assign controls to user:', error);
            throw error;
        }
    }

    /**
     * Log message with system context
     */
    log(message, level = 'info') {
        if (config.get('debug.systems.audit', false)) {
            console[level](`[AuditManagement] ${message}`);
        }
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuditManagementManager };
} else {
    window.AuditManagementManager = AuditManagementManager;
}