# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Cyber Security Compliance Auditing Tracker application built with AI-assisted development patterns. The project emphasizes system independence, configuration-driven behavior, and modular architecture to support iterative development with minimal context loss.

## Core Architecture Principles

### System Independence
- Each system operates as a completely independent utility with zero cross-dependencies
- Communication only through well-defined helper interfaces
- Systems can be developed, tested, and debugged in isolation
- Helper interfaces abstract implementation complexity

### Configuration-Driven Design
- All behavior controlled through JSON configuration files in `/config/`
- Runtime configuration loading with validation
- Designer-friendly parameters that don't require code changes
- Configuration changes preferred over code modifications

### Self-Documenting Code
- Clear architectural patterns maintained across all systems
- Helper interface abstractions hide implementation complexity
- Built-in debug commands for health checking
- Comprehensive logging with configurable levels

## Development Commands

### Core Development
- `npm start` - Start development server
- `npm run dev` - Development mode with hot reload
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests

### System Management
- `npm run health-check` - Run all system health checks
- `npm run config-validate` - Validate all configuration files
- `npm run system-test` - Run system integration tests
- `npm run debug-mode` - Enable debug logging

### Development Tools
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run docs` - Generate documentation

## System Architecture

### Core Systems
| System | Purpose | Manager | Helpers | Config |
|--------|---------|---------|---------|--------|
| ComplianceFrameworks | Manage security frameworks (NIST, ISO 27001, SOC 2) | ComplianceFrameworksManager.js | ComplianceFrameworksHelpers.js | appSettings.json |
| AuditManagement | Track audit engagements, findings, and remediation | AuditManagementManager.js | AuditManagementHelpers.js | auditSettings.json, engagementTypes.json |
| UserRole | Manage users, roles, and engagement participation | UserRoleManager.js | UserRoleHelpers.js | userRoles.json, appSettings.json |
| RiskAssessment | Evaluate and score security risks | RiskAssessmentManager.js | RiskAssessmentHelpers.js | riskSettings.json |
| ReportGeneration | Generate compliance reports and dashboards | ReportGenerationManager.js | ReportGenerationHelpers.js | reportSettings.json |

### Helper Interface Pattern
```javascript
// Cross-system communication example
const engagementData = await AuditManagementHelpers.getCurrentEngagements();
const participants = await UserRoleHelpers.getEngagementParticipants(engagementId);
const riskScores = await RiskAssessmentHelpers.calculateRisks(engagementData);
const report = await ReportGenerationHelpers.generateReport(riskScores);
```

### System Manager Pattern
```javascript
// System initialization pattern
class SystemManager {
    constructor() {
        this.initialized = false;
        this.config = config.get('systems.systemName');
    }
    
    async initialize() {
        await this.loadConfiguration();
        await this.setupSystem();
        this.initialized = true;
    }
    
    healthCheck() {
        return {
            status: this.initialized ? 'healthy' : 'error',
            initialized: this.initialized
        };
    }
}
```

## Configuration System

### Configuration Files
- `/config/appSettings.json` - Core application settings
- `/config/debugSettings.json` - Debug and development settings
- `/config/auditSettings.json` - Audit management configuration
- `/config/engagementTypes.json` - Engagement types and definitions
- `/config/userRoles.json` - User roles, permissions, and access levels
- `/config/riskSettings.json` - Risk assessment configuration
- `/config/reportSettings.json` - Report generation configuration

### Configuration Access Pattern
```javascript
// Get configuration values
const maxAudits = config.get('systems.audit.maxConcurrentAudits', 10);
const riskThreshold = config.get('systems.risk.highRiskThreshold', 0.8);

// Set configuration values
config.set('systems.audit.maxConcurrentAudits', 15);

// Watch for configuration changes
config.watch('systems.audit.maxConcurrentAudits', (value) => {
    console.log('Max audits updated:', value);
});
```

### Configuration Validation
Always validate configuration files before making changes:
```bash
npm run config-validate
```

## Development Workflow

### Adding New Features
1. **Check Configuration First** - Determine if the feature can be implemented through configuration
2. **System Isolation** - Develop within the appropriate system boundaries
3. **Helper Interface** - Use defined interfaces for cross-system communication
4. **Health Checks** - Add health check methods to new components
5. **Documentation** - Update system reference docs

### Making Changes
1. **Configuration Changes** - Prefer configuration over code changes when possible
2. **System Independence** - Maintain zero cross-dependencies between systems
3. **Helper Interfaces** - Use helper interfaces for all cross-system communication
4. **Validation** - Run configuration validation after changes
5. **Health Checks** - Verify system health after modifications

### Testing Approach
- **Unit Tests** - Test individual system components
- **Integration Tests** - Test helper interface communications
- **Configuration Tests** - Validate configuration file integrity
- **Health Check Tests** - Verify system health monitoring

## Common Configuration Paths

### System Configuration
- `systems.compliance.defaultFramework` - Default compliance framework
- `systems.audit.maxConcurrentEngagements` - Maximum concurrent engagements
- `systems.audit.defaultEngagementType` - Default engagement type
- `systems.userRole.allowMultipleRoles` - Allow users to have multiple roles
- `systems.userRole.requireRoleAssignment` - Require role assignment for all users
- `systems.risk.highRiskThreshold` - High risk threshold value
- `systems.reporting.autoGenerate` - Auto-generate reports flag
- `database.mongodb.uri` - MongoDB connection string
- `database.mongodb.options` - MongoDB connection options

### Debug Configuration
- `debug.systems.compliance` - Enable compliance system debugging
- `debug.systems.audit` - Enable audit system debugging
- `debug.systems.userRole` - Enable user role system debugging
- `debug.systems.risk` - Enable risk system debugging
- `debug.enableLogging` - Enable debug logging

### Feature Flags
- `features.enableAdvancedRiskModeling` - Advanced risk assessment features
- `features.enableAutomatedReporting` - Automated report generation
- `features.enableRealTimeUpdates` - Real-time dashboard updates
- `features.enableComplianceValidation` - Automated compliance checking
- `features.enableMultiEngagementTypes` - Support for multiple engagement types
- `features.enableRoleBasedAccess` - Role-based access control system
- `features.enableUserManagement` - User management capabilities

## System Health Monitoring

### Health Check Commands
```javascript
// Check individual system health
const complianceHealth = await ComplianceFrameworksHelpers.healthCheck();
const auditHealth = await AuditManagementHelpers.healthCheck();
const userRoleHealth = await UserRoleHelpers.healthCheck();
const riskHealth = await RiskAssessmentHelpers.healthCheck();

// Check configuration system health
const configHealth = config.healthCheck();
```

### Health Check Response Format
```javascript
{
    status: 'healthy' | 'warning' | 'error',
    initialized: boolean,
    systemSpecificMetrics: {},
    lastCheck: timestamp,
    issues: []
}
```

## Error Handling

### Configuration Errors
- Always provide sensible defaults for configuration values
- Validate configuration on startup and changes
- Log configuration validation errors clearly
- Gracefully handle missing configuration files

### System Errors
- Use try-catch blocks around system operations
- Log errors with system context
- Provide meaningful error messages
- Implement graceful degradation where possible

## Integration Guidelines

### Adding New Systems
1. Create system manager in `/src/SystemName/`
2. Create helper interface in `/src/SystemName/SystemNameHelpers.js`
3. Add configuration section to appropriate JSON file
4. Update system reference documentation
5. Add health check methods
6. Create integration tests

### Modifying Existing Systems
1. Check if changes can be made through configuration
2. Maintain helper interface compatibility
3. Update configuration validation if needed
4. Update system reference documentation
5. Run health checks to verify changes

## Troubleshooting

### Common Issues
- **Configuration Validation Errors** - Check JSON syntax and required fields
- **System Not Initialized** - Verify system initialization in startup sequence
- **Helper Interface Errors** - Check system dependencies and initialization order
- **Health Check Failures** - Review system-specific logs and configuration

### Debug Mode
Enable debug mode to get detailed logging:
```bash
npm run debug-mode
```

Or set configuration:
```javascript
config.set('debug.enableLogging', true);
config.set('debug.systems.systemName', true);
```

## Data Management

### Data Persistence
- System state persisted through configuration and data files
- Helper interfaces provide data access abstraction
- Configuration changes can be applied at runtime
- Health checks verify data integrity

### Data Flow
```
ComplianceFrameworks → AuditManagement → RiskAssessment → ReportGeneration
                    ↓                    ↓                ↓
                Framework Data      Engagement Data   Risk Scores
                                   & Findings
```

## Security Considerations

### Configuration Security
- Never commit sensitive configuration values
- Use environment variables for sensitive data
- Encrypt configuration files if they contain sensitive information
- Validate all configuration input

### System Security
- Implement proper input validation
- Use secure communication between systems
- Log security-relevant events
- Implement proper error handling to prevent information leakage

## Performance Considerations

### Configuration Loading
- Configuration values are cached for performance
- Hot reload capability for development
- Validation occurs during configuration loading
- Watch-based updates for real-time changes

### System Performance
- Helper interfaces provide efficient cross-system communication
- Health checks designed to be lightweight
- System initialization optimized for startup performance
- Debug logging configurable to reduce overhead

## User Role Management

### User Roles
The system supports multiple user roles with different permissions and access levels:

#### System Roles
- **Admin**: Full system access, can create engagements and manage all users
- **Auditor**: Consultant role, manages engagement execution and findings

#### Customer Roles  
- **Owner**: Primary customer contact, manages customer users and engagement access
- **SME**: Subject matter expert, participates in interviews and meetings
- **Control Owner**: Owns specific controls, provides evidence and responses
- **Manager**: Management stakeholder, views reports and schedules
- **Executive**: Executive stakeholder, views high-level reports and summaries

### Role-Based Access Control
- Users can have multiple roles within the system
- Engagement-specific role assignments control access to specific audits
- Permission inheritance allows for flexible access control
- Role hierarchy enables appropriate user management capabilities

### User Management Workflow
```javascript
// Create user with roles
const user = await UserRoleHelpers.createUser({
    email: 'john.doe@company.com',
    firstName: 'John',
    lastName: 'Doe',
    organization: 'Acme Corp',
    roles: ['owner', 'controlOwner']
});

// Add user to engagement with specific roles
await AuditManagementHelpers.addParticipantToEngagement(
    engagementId, 
    user.userId, 
    ['controlOwner'], 
    ['CC6.1', 'CC6.2']
);

// Check permissions
const canEdit = await UserRoleHelpers.userHasPermission(
    userId, 
    'edit_engagement', 
    engagementId
);
```

### Database Integration
- MongoDB backend for persistent storage
- Configurable connection settings in `appSettings.json`
- Automatic schema management with Mongoose
- Health monitoring and connection resilience

## AI Assistant Guidelines

### Context Preservation
- System architecture designed to be comprehensible after context loss
- Helper interfaces provide clear system boundaries
- Configuration-driven behavior reduces complexity
- Self-documenting code patterns maintained

### Development Approach
- Always check configuration before hardcoding values
- Use helper interfaces for cross-system communication
- Maintain system independence principles
- Update documentation with changes
- Run health checks after modifications

### When Making Changes
1. Review existing configuration options
2. Consider if change should be configuration-driven
3. Use appropriate helper interfaces
4. Maintain system independence
5. Add health check methods
6. Update relevant documentation
7. Validate configuration changes