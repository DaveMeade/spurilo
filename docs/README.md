# Cyber Security Compliance Auditing Tracker

## Overview
A comprehensive project tracker application focused on auditing cyber security against compliance frameworks. Built with AI-assisted development patterns emphasizing system independence, configuration-driven behavior, and modular architecture.

## Architecture Principles
- **System Independence**: Each subsystem operates as a standalone utility with zero cross-dependencies
- **Configuration-Driven Design**: All adjustable settings managed through JSON configuration files
- **Helper Interface Abstraction**: Communication between systems only through well-defined interfaces
- **Living Documentation**: Comprehensive documentation that evolves with the codebase

## Core Systems

| System | Purpose | Documentation | Configuration |
|--------|---------|---------------|---------------|
| ComplianceFrameworks | Manage security frameworks (NIST, ISO 27001, SOC 2) | [ComplianceFrameworksReference.md](ComplianceFrameworksReference.md) | appSettings.json |
| AuditManagement | Track audit schedules, findings, and remediation | [AuditManagementReference.md](AuditManagementReference.md) | auditSettings.json |
| RiskAssessment | Evaluate and score security risks | [RiskAssessmentReference.md](RiskAssessmentReference.md) | riskSettings.json |
| ReportGeneration | Generate compliance reports and dashboards | [ReportGenerationReference.md](ReportGenerationReference.md) | reportSettings.json |

## Configuration System
- **Master Configuration**: `/config/appSettings.json` - Core application settings
- **System Configurations**: Individual JSON files per system
- **Debug Configuration**: `/config/debugSettings.json` - Development and testing settings
- **Runtime Updates**: Configuration changes applied without restart where possible

## System Interrelations & Data Flow

### Initialization Sequence
1. Load master configuration from appSettings.json
2. Initialize ComplianceFrameworks system with framework definitions
3. Load AuditManagement system with existing audit data
4. Initialize RiskAssessment system with scoring models
5. Start ReportGeneration system for dashboard updates

### Data Flow
```
ComplianceFrameworks → AuditManagement → RiskAssessment → ReportGeneration
                    ↓                    ↓                ↓
                Framework Data      Audit Findings    Risk Scores
```

## Making Changes & Contributions

### For AI Agents
- Always check configuration files before hardcoding values
- Prefer configuration changes over code modifications when appropriate
- Validate configuration after making changes
- Document new configuration options in system reference docs
- Use helper interfaces for cross-system communication

### Development Workflow
1. **Configuration First**: Check if change can be made through configuration
2. **System Isolation**: Develop and test systems independently
3. **Helper Interface**: Use defined interfaces for system communication
4. **Documentation**: Update system reference docs with changes
5. **Bug Tracking**: Use `/bugs/` folder for comprehensive issue tracking

## Quick Reference

### Essential Helper Functions
- `ConfigManager.get(path, defaultValue)` - Get configuration value
- `ConfigManager.set(path, value)` - Update configuration at runtime
- `SystemHelper.healthCheck()` - Validate system status
- `SystemHelper.getInterface()` - Get system's external interface

### Configuration Paths
- `systems.compliance.frameworks` - Available compliance frameworks
- `systems.audit.scheduleInterval` - Audit scheduling frequency
- `systems.risk.scoringModel` - Risk assessment methodology
- `systems.reporting.refreshInterval` - Report generation frequency

### Debug Commands
- `npm run health-check` - Run all system health checks
- `npm run config-validate` - Validate all configuration files
- `npm run system-test` - Run integration tests
- `npm run debug-mode` - Enable debug logging

## Common Troubleshooting

### Configuration Issues
- Check configuration file syntax with `npm run config-validate`
- Verify required fields are present in system configurations
- Ensure configuration values are within valid ranges

### System Communication
- Use helper interfaces for cross-system data exchange
- Check system health with individual health check commands
- Verify initialization sequence completed successfully

### Data Integrity
- Validate audit data consistency across systems
- Check framework definitions match current standards
- Ensure risk scores align with assessment criteria

## Feature Flags
Configuration-driven features can be enabled/disabled through:
- `features.enableAdvancedRiskModeling` - Advanced risk assessment features
- `features.enableAutomatedReporting` - Automated report generation
- `features.enableRealTimeUpdates` - Real-time dashboard updates
- `features.enableComplianceValidation` - Automated compliance checking