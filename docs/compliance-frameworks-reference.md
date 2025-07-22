# Compliance Frameworks System Reference

## Overview
The Compliance Frameworks system manages security frameworks (NIST, ISO 27001, SOC 2, PCI-DSS) and provides control assessment capabilities. This system operates independently and communicates with other systems through well-defined helper interfaces.

## Core Components

### ComplianceFrameworksManager
**Location**: `/src/compliance-frameworks/compliance.frameworks.manager.js`

**Purpose**: Core system logic for managing compliance frameworks, control definitions, and assessments.

**Key Methods**:
- `initialize()` - Initialize the system and load frameworks
- `getFrameworks()` - Get list of available frameworks
- `getFramework(name)` - Get specific framework details
- `assessControl(framework, controlId, assessment)` - Assess a control
- `calculateComplianceScore(framework)` - Calculate compliance percentage
- `performGapAnalysis(framework)` - Identify compliance gaps

### ComplianceFrameworksHelpers
**Location**: `/src/compliance-frameworks/compliance.frameworks.helpers.js`

**Purpose**: External interface for other systems to interact with compliance frameworks.

**Key Methods**:
- `getAvailableFrameworks()` - Get list of frameworks
- `getOverallComplianceScore()` - Get aggregated compliance score
- `getComplianceStatusSummary()` - Get comprehensive status summary
- `performGapAnalysis(framework)` - Get gap analysis for framework
- `getHighPriorityGaps()` - Get critical compliance gaps
- `healthCheck()` - System health verification

## Configuration

### Primary Configuration File
**Location**: `/config/app.settings.json`

**Key Settings**:
```json
{
  "systems": {
    "compliance": {
      "defaultFramework": "NIST",
      "autoUpdateFrameworks": true,
      "frameworkSources": ["NIST", "ISO27001", "SOC2", "PCI-DSS"],
      "notifyAuditSystem": true,
      "controlMappings": {},
      "assessmentReminders": true,
      "assessmentReminderDays": 30
    }
  }
}
```

### Configuration Parameters

#### Framework Management
- **`defaultFramework`** (string): Default framework to display/use
  - Valid values: "NIST", "ISO27001", "SOC2", "PCI-DSS"
  - Default: "NIST"
  - Runtime changeable: Yes

- **`autoUpdateFrameworks`** (boolean): Automatically update framework definitions
  - Default: true
  - Runtime changeable: Yes

- **`frameworkSources`** (array): List of available frameworks
  - Valid values: Array of framework names
  - Default: ["NIST", "ISO27001", "SOC2", "PCI-DSS"]
  - Runtime changeable: Yes

#### Assessment Settings
- **`assessmentReminders`** (boolean): Enable assessment reminders
  - Default: true
  - Runtime changeable: Yes

- **`assessmentReminderDays`** (number): Days before assessment due date to send reminders
  - Valid range: 1-90 days
  - Default: 30
  - Runtime changeable: Yes

- **`notifyAuditSystem`** (boolean): Send notifications to audit system
  - Default: true
  - Runtime changeable: Yes

## Data Structures

### Framework Definition
```json
{
  "name": "NIST Cybersecurity Framework",
  "version": "1.1",
  "categories": ["Identify", "Protect", "Detect", "Respond", "Recover"],
  "controls": [
    {
      "id": "ID.AM-1",
      "name": "Physical devices and systems within the organization are inventoried",
      "category": "Identify",
      "subcategory": "Asset Management",
      "description": "Maintain an inventory of physical devices and systems",
      "priority": "High"
    }
  ]
}
```

### Control Assessment
```json
{
  "frameworkName": "NIST",
  "controlId": "ID.AM-1",
  "assessmentDate": "2024-07-04T10:00:00Z",
  "assessor": "John Smith",
  "status": "compliant",
  "maturityLevel": "managed",
  "evidence": ["Asset inventory spreadsheet", "Automated discovery scan"],
  "findings": [],
  "remediation": null,
  "nextAssessmentDate": "2024-10-04"
}
```

### Gap Analysis Result
```json
{
  "frameworkName": "NIST",
  "totalControls": 108,
  "compliantControls": 85,
  "partiallyCompliantControls": 15,
  "gaps": 8,
  "complianceScore": 0.86,
  "gapDetails": [
    {
      "controlId": "PR.AC-1",
      "controlName": "Identities and credentials are issued, managed, verified, revoked, and audited",
      "category": "Protect",
      "priority": "High",
      "reason": "Non-compliant",
      "findings": ["No automated user access review process"]
    }
  ]
}
```

## API Interface

### Helper Interface Methods

#### Framework Information
```javascript
// Get all available frameworks
const frameworks = await ComplianceFrameworksHelpers.getAvailableFrameworks();
// Returns: ["NIST", "ISO27001", "SOC2", "PCI-DSS"]

// Get framework details
const nistDetails = await ComplianceFrameworksHelpers.getFrameworkDetails("NIST");
// Returns: Framework object with controls and metadata

// Get controls for a framework
const controls = await ComplianceFrameworksHelpers.getFrameworkControls("NIST", "Identify");
// Returns: Array of control objects for the specified category
```

#### Compliance Scoring
```javascript
// Get overall compliance score
const overallScore = await ComplianceFrameworksHelpers.getOverallComplianceScore();
// Returns: 0.86 (86% compliance across all frameworks)

// Get framework-specific score
const nistScore = await ComplianceFrameworksHelpers.getFrameworkComplianceScore("NIST");
// Returns: 0.92 (92% NIST compliance)

// Get comprehensive status summary
const summary = await ComplianceFrameworksHelpers.getComplianceStatusSummary();
// Returns: Detailed summary object with scores and metrics
```

#### Gap Analysis
```javascript
// Perform gap analysis for specific framework
const gaps = await ComplianceFrameworksHelpers.performGapAnalysis("NIST");
// Returns: Gap analysis object with details

// Get high-priority gaps across all frameworks
const priorityGaps = await ComplianceFrameworksHelpers.getHighPriorityGaps();
// Returns: Array of high/critical priority gaps

// Get all gap analyses
const allGaps = await ComplianceFrameworksHelpers.getAllGapAnalyses();
// Returns: Object with gap analysis for each framework
```

#### Assessment Management
```javascript
// Assess a control
const assessment = await ComplianceFrameworksHelpers.assessControl("NIST", "ID.AM-1", {
  assessor: "Jane Doe",
  status: "compliant",
  maturityLevel: "managed",
  evidence: ["Asset inventory", "Discovery scan"],
  nextAssessmentDate: "2024-10-04"
});

// Get control assessment
const existing = await ComplianceFrameworksHelpers.getControlAssessment("NIST", "ID.AM-1");

// Get all assessments for framework
const assessments = await ComplianceFrameworksHelpers.getFrameworkAssessments("NIST");
```

#### Activity Tracking
```javascript
// Get recent assessment activities
const recent = await ComplianceFrameworksHelpers.getRecentAssessmentActivities(10);
// Returns: Last 10 assessment activities across all frameworks

// Get controls requiring assessment
const pending = await ComplianceFrameworksHelpers.getControlsRequiringAssessment("NIST");
// Returns: Controls that haven't been assessed or are overdue

// Get compliance trends
const trends = await ComplianceFrameworksHelpers.getComplianceTrends("NIST", "12months");
// Returns: Historical compliance score data
```

## Integration Patterns

### With Audit Management System
```javascript
// Audit system can check compliance status for audit planning
const complianceGaps = await ComplianceFrameworksHelpers.getHighPriorityGaps();
const auditPriority = complianceGaps.map(gap => ({
  framework: gap.framework,
  control: gap.controlId,
  priority: gap.priority,
  auditRequired: true
}));
```

### With Risk Assessment System
```javascript
// Risk system can factor compliance status into risk calculations
const complianceScore = await ComplianceFrameworksHelpers.getFrameworkComplianceScore("NIST");
const riskAdjustment = complianceScore < 0.8 ? 1.2 : 1.0; // Increase risk if low compliance
```

### With Report Generation System
```javascript
// Report system can include compliance data in reports
const summary = await ComplianceFrameworksHelpers.getComplianceStatusSummary();
const trends = await ComplianceFrameworksHelpers.getComplianceTrends();
const reportData = { summary, trends };
```

## Health Monitoring

### Health Check Response
```javascript
const health = await ComplianceFrameworksHelpers.healthCheck();
// Returns:
{
  status: 'healthy',
  initialized: true,
  frameworksLoaded: 4,
  assessmentsCount: 156,
  controlMappingsCount: 0,
  availableFrameworks: ['NIST', 'ISO27001', 'SOC2', 'PCI-DSS']
}
```

### Performance Metrics
- Framework loading time
- Assessment calculation time
- Gap analysis performance
- Configuration validation time

## Error Handling

### Common Error Scenarios
1. **Framework Not Found**: Invalid framework name provided
2. **Control Not Found**: Invalid control ID for framework
3. **Configuration Error**: Invalid configuration values
4. **Assessment Error**: Invalid assessment data

### Error Response Format
```javascript
{
  error: true,
  message: "Framework 'INVALID' not found",
  code: "FRAMEWORK_NOT_FOUND",
  details: {
    availableFrameworks: ["NIST", "ISO27001", "SOC2", "PCI-DSS"]
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
      "compliance": true
    }
  }
}
```

### Debug Commands
```javascript
// Manual health check
const health = await ComplianceFrameworksHelpers.healthCheck();

// Validate system state
const manager = await ComplianceFrameworksHelpers.initialize();
console.log(manager.healthCheck());

// Check configuration
console.log(config.get('systems.compliance'));
```

## Performance Considerations

### Caching
- Framework definitions cached after first load
- Assessment data cached for performance
- Gap analysis results cached with invalidation
- Configuration values cached for frequent access

### Optimization
- Lazy loading of framework controls
- Incremental gap analysis calculations
- Efficient assessment lookups
- Minimal data transfer in helper interfaces

## Security Considerations

### Data Protection
- Assessment data contains sensitive information
- Control evidence may include confidential documents
- Framework mappings may reveal security architecture
- Access control through configuration

### Audit Trail
- All assessment activities logged
- Configuration changes tracked
- Framework updates recorded
- Access attempts monitored

## Migration and Versioning

### Framework Updates
- Automatic framework definition updates (configurable)
- Version tracking for frameworks
- Backward compatibility for assessments
- Migration tools for framework changes

### Data Migration
- Assessment data preserved during upgrades
- Configuration migration for new parameters
- Framework mapping updates
- Historical data preservation

## Troubleshooting Guide

### Common Issues

#### System Not Initializing
**Symptoms**: Health check shows `initialized: false`
**Causes**: Configuration errors, missing framework files
**Solutions**: 
- Check configuration validation
- Verify framework source availability
- Review debug logs

#### Incorrect Compliance Scores
**Symptoms**: Unexpected compliance percentages
**Causes**: Missing assessments, calculation errors
**Solutions**:
- Verify assessment data integrity
- Check control definitions
- Recalculate scores manually

#### Gap Analysis Errors
**Symptoms**: Incomplete or incorrect gap analysis
**Causes**: Framework definition issues, assessment data problems
**Solutions**:
- Validate framework controls
- Check assessment coverage
- Review calculation logic

### Performance Issues

#### Slow Framework Loading
**Symptoms**: Long initialization times
**Causes**: Large framework definitions, network delays
**Solutions**:
- Enable caching
- Optimize framework sources
- Use lazy loading

#### Memory Usage
**Symptoms**: High memory consumption
**Causes**: Large assessment datasets, inefficient caching
**Solutions**:
- Implement data archiving
- Optimize cache management
- Use pagination for large datasets