# Audit Management System Reference

## Overview
The Audit Management system handles audit schedules, findings, and remediation tracking. It manages the complete audit lifecycle from planning through remediation verification, operating independently while communicating with other systems through helper interfaces.

## Core Components

### AuditManagementManager
**Location**: `/src/audit-management/audit.management.manager.js`

**Purpose**: Core system logic for managing audits, findings, and remediation activities.

**Key Methods**:
- `initialize()` - Initialize the system and load existing data
- `createAudit(auditData)` - Create new audit
- `updateAuditStatus(auditId, status)` - Update audit status
- `createFinding(findingData)` - Create new audit finding
- `createRemediationPlan(findingId, remediationData)` - Create remediation plan
- `getOverdueItems()` - Get overdue findings and remediations
- `getUpcomingAudits(days)` - Get audits due within specified days

### AuditManagementHelpers
**Location**: `/src/audit-management/audit.management.helpers.js` (To be implemented)

**Purpose**: External interface for other systems to interact with audit management.

**Key Methods** (Planned):
- `getCurrentAudits()` - Get active audits
- `getAuditFindings(auditId)` - Get findings for audit
- `getOverdueItems()` - Get overdue items
- `getAuditMetrics()` - Get audit performance metrics
- `healthCheck()` - System health verification

## Configuration

### Primary Configuration File
**Location**: `/config/audit.settings.json`

### Key Configuration Sections

#### Scheduling Configuration
```json
{
  "scheduling": {
    "defaultFrequency": "quarterly",
    "allowedFrequencies": ["weekly", "monthly", "quarterly", "semi-annually", "annually"],
    "advanceNoticeDays": 30,
    "reminderDays": [30, 14, 7, 1],
    "autoScheduleFollowup": true,
    "followupInterval": 90,
    "workingDaysOnly": true,
    "excludeHolidays": true,
    "allowWeekendAudits": false,
    "preferredStartTime": "09:00",
    "maxAuditDuration": 30,
    "minAuditGap": 7
  }
}
```

#### Findings Configuration
```json
{
  "findings": {
    "severityLevels": ["critical", "high", "medium", "low", "informational"],
    "autoAssignSeverity": false,
    "requireEvidence": true,
    "evidenceTypes": ["document", "screenshot", "video", "log", "interview"],
    "maxEvidenceSize": 10485760,
    "allowedEvidenceFormats": ["pdf", "doc", "docx", "png", "jpg", "jpeg", "mp4", "txt", "log"],
    "defaultDueDays": {
      "critical": 7,
      "high": 14,
      "medium": 30,
      "low": 60,
      "informational": 90
    },
    "autoEscalation": true,
    "escalationDays": {
      "critical": 3,
      "high": 7,
      "medium": 14,
      "low": 30
    }
  }
}
```

#### Remediation Configuration
```json
{
  "remediation": {
    "requireRemediationPlan": true,
    "autoCreateRemediationTasks": false,
    "defaultRemediationDays": {
      "critical": 14,
      "high": 30,
      "medium": 60,
      "low": 90,
      "informational": 120
    },
    "allowRemediationExtension": true,
    "maxExtensionDays": 30,
    "requireExtensionApproval": true,
    "trackRemediationProgress": true,
    "requireProgressUpdates": true,
    "progressUpdateFrequency": 7,
    "enableRemediationTemplates": true,
    "autoVerifyRemediation": false,
    "requireEvidenceOfRemediation": true,
    "allowPartialRemediation": true
  }
}
```

### Configuration Parameters

#### Audit Scheduling
- **`defaultFrequency`** (string): Default audit frequency
  - Valid values: "weekly", "monthly", "quarterly", "semi-annually", "annually"
  - Default: "quarterly"
  - Runtime changeable: Yes

- **`advanceNoticeDays`** (number): Days of advance notice for scheduled audits
  - Valid range: 1-90 days
  - Default: 30
  - Runtime changeable: Yes

- **`reminderDays`** (array): Days before audit to send reminders
  - Valid values: Array of positive integers
  - Default: [30, 14, 7, 1]
  - Runtime changeable: Yes

#### Finding Management
- **`severityLevels`** (array): Available severity levels for findings
  - Valid values: Array of severity strings
  - Default: ["critical", "high", "medium", "low", "informational"]
  - Runtime changeable: Yes

- **`requireEvidence`** (boolean): Require evidence for all findings
  - Default: true
  - Runtime changeable: Yes

- **`maxEvidenceSize`** (number): Maximum evidence file size in bytes
  - Valid range: 1MB-100MB
  - Default: 10485760 (10MB)
  - Runtime changeable: Yes

#### Remediation Tracking
- **`requireRemediationPlan`** (boolean): Require remediation plan for findings
  - Default: true
  - Runtime changeable: Yes

- **`trackRemediationProgress`** (boolean): Track remediation progress
  - Default: true
  - Runtime changeable: Yes

- **`requireProgressUpdates`** (boolean): Require regular progress updates
  - Default: true
  - Runtime changeable: Yes

## Data Structures

### Audit Definition
```json
{
  "id": "audit-001",
  "name": "Q1 2024 Security Assessment",
  "type": "security",
  "framework": "NIST",
  "status": "in-progress",
  "startDate": "2024-01-15",
  "endDate": "2024-02-15",
  "auditor": "John Smith",
  "scope": "Information Security Controls",
  "findings": ["finding-001", "finding-002"],
  "createdDate": "2024-01-01T10:00:00Z"
}
```

### Finding Definition
```json
{
  "id": "finding-001",
  "auditId": "audit-002",
  "controlId": "CC6.1",
  "framework": "SOC2",
  "severity": "medium",
  "status": "open",
  "title": "Inadequate Access Review Process",
  "description": "User access reviews are not performed regularly",
  "evidence": "No evidence of quarterly access reviews",
  "recommendation": "Implement quarterly access review process",
  "dueDate": "2024-03-15",
  "assignedTo": "IT Team",
  "createdDate": "2024-01-31T10:00:00Z"
}
```

### Remediation Plan
```json
{
  "id": "remediation-001",
  "findingId": "finding-002",
  "status": "in-progress",
  "assignedTo": "Security Team",
  "startDate": "2024-02-01",
  "targetDate": "2024-02-29",
  "actions": [
    "Review current password policy",
    "Update policy documentation",
    "Implement technical controls",
    "Communicate changes to users"
  ],
  "progress": 0.6,
  "notes": "Policy updated, implementing technical controls",
  "createdDate": "2024-02-01T10:00:00Z"
}
```

### Audit Schedule
```json
{
  "id": "schedule-001",
  "name": "Quarterly Security Review",
  "framework": "NIST",
  "frequency": "quarterly",
  "nextDue": "2024-10-01",
  "responsible": "Security Team",
  "active": true
}
```

## API Interface

### Helper Interface Methods (Planned)

#### Audit Information
```javascript
// Get current active audits
const currentAudits = await AuditManagementHelpers.getCurrentAudits();
// Returns: Array of audit objects with status 'in-progress'

// Get audit details
const auditDetails = await AuditManagementHelpers.getAudit("audit-001");
// Returns: Complete audit object

// Get audits by status
const completedAudits = await AuditManagementHelpers.getAuditsByStatus("completed");
// Returns: Array of completed audit objects
```

#### Finding Management
```javascript
// Get findings for an audit
const findings = await AuditManagementHelpers.getAuditFindings("audit-001");
// Returns: Array of finding objects for the audit

// Get findings by status
const openFindings = await AuditManagementHelpers.getFindingsByStatus("open");
// Returns: Array of open finding objects

// Get findings by severity
const criticalFindings = await AuditManagementHelpers.getFindingsBySeverity("critical");
// Returns: Array of critical finding objects
```

#### Remediation Tracking
```javascript
// Get remediation for finding
const remediation = await AuditManagementHelpers.getFindingRemediation("finding-001");
// Returns: Remediation object or null

// Get remediation progress summary
const progressSummary = await AuditManagementHelpers.getRemediationProgress();
// Returns: Overall remediation progress metrics

// Get overdue remediations
const overdueRemediations = await AuditManagementHelpers.getOverdueRemediations();
// Returns: Array of overdue remediation objects
```

#### Metrics and Reporting
```javascript
// Get audit metrics
const metrics = await AuditManagementHelpers.getAuditMetrics();
// Returns: Comprehensive audit performance metrics

// Get overdue items
const overdueItems = await AuditManagementHelpers.getOverdueItems();
// Returns: Array of overdue findings and remediations

// Get upcoming audits
const upcoming = await AuditManagementHelpers.getUpcomingAudits(30);
// Returns: Audits due within 30 days
```

#### Schedule Management
```javascript
// Get audit schedules
const schedules = await AuditManagementHelpers.getAuditSchedules();
// Returns: Array of active audit schedules

// Get next scheduled audits
const nextAudits = await AuditManagementHelpers.getNextScheduledAudits();
// Returns: Upcoming scheduled audits based on frequency
```

## Integration Patterns

### With Compliance Frameworks System
```javascript
// Get compliance gaps to prioritize audit focus
const gaps = await ComplianceFrameworksHelpers.getHighPriorityGaps();
const auditScope = gaps.map(gap => ({
  framework: gap.framework,
  control: gap.controlId,
  priority: gap.priority
}));

// Create audit based on compliance gaps
const audit = await AuditManagementHelpers.createAudit({
  name: "High Priority Compliance Audit",
  framework: "NIST",
  scope: auditScope
});
```

### With Risk Assessment System
```javascript
// Factor audit findings into risk calculations
const findings = await AuditManagementHelpers.getFindingsByStatus("open");
const riskFactors = findings.map(finding => ({
  severity: finding.severity,
  framework: finding.framework,
  control: finding.controlId,
  impact: finding.severity === "critical" ? 0.9 : 0.5
}));
```

### With Report Generation System
```javascript
// Include audit data in compliance reports
const auditMetrics = await AuditManagementHelpers.getAuditMetrics();
const overdueItems = await AuditManagementHelpers.getOverdueItems();
const reportData = {
  auditSummary: auditMetrics,
  overdueFindings: overdueItems.filter(item => item.type === "finding"),
  overdueRemediations: overdueItems.filter(item => item.type === "remediation")
};
```

## Health Monitoring

### Health Check Response
```javascript
const health = await AuditManagementHelpers.healthCheck();
// Returns:
{
  status: 'healthy',
  initialized: true,
  auditsCount: 15,
  findingsCount: 42,
  remediationsCount: 28,
  schedulesCount: 6,
  openFindings: 12,
  inProgressAudits: 3,
  overdueItems: 2
}
```

### Performance Metrics
- Audit creation time
- Finding processing time
- Remediation tracking performance
- Schedule calculation time
- Database query performance

## Workflow States

### Audit States
- **planned** - Audit scheduled but not started
- **in-progress** - Audit currently being conducted
- **completed** - Audit finished, findings documented
- **cancelled** - Audit cancelled before completion
- **on-hold** - Audit temporarily suspended

### Finding States
- **open** - Finding identified, awaiting remediation
- **in-remediation** - Remediation plan active
- **remediated** - Remediation completed, awaiting verification
- **closed** - Finding verified as resolved
- **accepted-risk** - Risk accepted, no remediation planned

### Remediation States
- **planned** - Remediation plan created
- **in-progress** - Remediation activities underway
- **completed** - Remediation activities finished
- **cancelled** - Remediation cancelled
- **on-hold** - Remediation temporarily suspended

## Notification System

### Notification Types
- **auditScheduled** - New audit scheduled
- **auditStarted** - Audit has begun
- **auditCompleted** - Audit finished
- **findingCreated** - New finding identified
- **findingDue** - Finding due date approaching
- **findingOverdue** - Finding past due date
- **remediationStarted** - Remediation plan activated
- **remediationCompleted** - Remediation finished
- **remediationOverdue** - Remediation past target date

### Escalation Process
1. **Initial notification** at configured reminder intervals
2. **First escalation** after configured escalation days
3. **Management escalation** for critical/high severity items
4. **Executive escalation** for significantly overdue items

## Error Handling

### Common Error Scenarios
1. **Audit Not Found**: Invalid audit ID provided
2. **Finding Not Found**: Invalid finding ID provided
3. **Invalid Status Transition**: Attempted invalid state change
4. **Missing Required Data**: Required fields not provided
5. **Configuration Error**: Invalid configuration values

### Error Response Format
```javascript
{
  error: true,
  message: "Audit 'audit-999' not found",
  code: "AUDIT_NOT_FOUND",
  details: {
    auditId: "audit-999",
    availableAudits: ["audit-001", "audit-002"]
  }
}
```

## Debugging

### Debug Configuration
Enable debug logging in `/config/debug.settings.json`:
```json
{
  "debug": {
    "systems": {
      "audit": true
    }
  }
}
```

### Debug Commands
```javascript
// Manual health check
const health = await AuditManagementHelpers.healthCheck();

// Check system state
const manager = await AuditManagementHelpers.initialize();
console.log(manager.healthCheck());

// Validate configuration
console.log(config.get('systems.audit'));
```

## Performance Considerations

### Caching
- Audit data cached for frequent access
- Finding lookups optimized with indexes
- Remediation progress cached
- Schedule calculations cached

### Optimization
- Lazy loading of audit details
- Efficient finding queries
- Optimized overdue item calculations
- Minimal data transfer in helper interfaces

## Security Considerations

### Data Protection
- Audit findings may contain sensitive information
- Evidence files require secure storage
- Access control for audit data
- Audit trail for all activities

### Access Control
- Role-based permissions for audit operations
- Separation of duties for finding approval
- Secure evidence handling
- Audit logging of all activities

## Migration and Versioning

### Data Migration
- Audit data preserved during upgrades
- Finding status migration for new workflows
- Configuration migration for new parameters
- Historical data preservation

### Backward Compatibility
- Support for legacy audit formats
- Graceful handling of old finding statuses
- Configuration parameter defaults
- Migration tools for data updates

## Troubleshooting Guide

### Common Issues

#### Audits Not Scheduling
**Symptoms**: No automatic audit scheduling
**Causes**: Configuration errors, schedule calculation issues
**Solutions**:
- Check scheduling configuration
- Verify schedule calculation logic
- Review debug logs for errors

#### Findings Not Creating
**Symptoms**: Unable to create new findings
**Causes**: Validation errors, missing required fields
**Solutions**:
- Verify finding data structure
- Check required field validation
- Review evidence file requirements

#### Remediation Tracking Issues
**Symptoms**: Progress not updating correctly
**Causes**: Status transition errors, calculation issues
**Solutions**:
- Check remediation state transitions
- Verify progress calculation logic
- Review update frequency settings

### Performance Issues

#### Slow Audit Queries
**Symptoms**: Long response times for audit data
**Causes**: Large datasets, inefficient queries
**Solutions**:
- Implement database indexing
- Optimize query patterns
- Use pagination for large result sets

#### Memory Usage
**Symptoms**: High memory consumption
**Causes**: Large evidence files, inefficient caching
**Solutions**:
- Implement evidence file streaming
- Optimize cache management
- Use file storage for large evidence