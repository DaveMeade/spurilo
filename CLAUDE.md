# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
Spurilo is a comprehensive tool designed for auditing organizations to conduct readiness assessments and full audit engagements for their clients.

It streamlines the entire audit lifecycle, from scheduling and data gathering to final reporting. The platform facilitates collaboration between auditors and client stakeholders, tracks evidence, and provides a clear, real-time view of an engagement's status.

Key Features
- End-to-End Audit Management: Manage all audit phases, milestones, and deliverables in one place.
- Streamlined Evidence Collection: Facilitates data gathering, evidence review, and approval workflows.
- Dynamic Control Testing: Create custom requirement profiles for an organization and track the testing of each control.
- Framework Mapping: Map control requirements against major industry standards like ISO 27001, SOC 2 (Type 1 & 2), and more.
- Proactive Task Management: Automatically notifies auditors and stakeholders of pending tasks and deadlines to keep engagements on track.
- AI-Powered Insights: Provides AI analysis on submissions and deliverables, offering key insights for auditor consideration and accelerating the review process.

This project is being built and maintained with AI-assisted development patterns emphasizing system independence, configuration-driven behavior, and modular architecture.

## Architecture Principles
- **System Independence**: Each subsystem operates as a standalone utility with zero cross-dependencies
- **Configuration-Driven Design**: All adjustable settings managed through JSON configuration files
- **Helper Interface Abstraction**: Communication between systems only through well-defined interfaces
- **Living Documentation**: Comprehensive documentation that evolves with the codebase
- **AI-Assisted Development Patterns**: This project is designed for optimal AI-assisted development workflows, emphasizing:
    - **Context Preservation**: Architecture that remains comprehensible after context loss
    - **Modular Independence**: Systems that can be developed and debugged in isolation
    - **Configuration-Driven Behavior**: Designer-friendly parameter exposure without code changes
    - **Self-Documenting Code**: Clear patterns and helper interface abstractions

## Development Workflow

### Database Integration
The application uses a centralized database access layer (`db-manager`) that provides the **only** interface for database operations. All MongoDB access goes through this layer to ensure consistency, security, and maintainability. It is very important that all database access go through the database mananger provided interface.

#### Database Manager (`/src/database/db-manager.js`)
- **Purpose**: Single interface for all database operations
- **Features**: Connection management, CRUD operations, health monitoring
- **Security**: Handles MongoDB authentication and connection credentials
- **Usage**: Import `{ dbManager }` - all other components use this interface

for more inforamtion see: /docs/README.md

### Adding New Systems
1. Create system manager and helper interfaces in `/src/system-name/`
3. Add configuration section to appropriate JSON file in `/config`
4. Update system reference documentation
5. Add health check methods
6. Create integration tests

### Adding New Features & Making Changes
1. **Check Configuration First** - Determine if the feature can be implemented through configuration
2. **System Isolation** - Develop within the appropriate system boundaries
3. **Helper Interface** - Use defined interfaces for cross-system communication
4. **Health Checks** - Add health check methods to new components
5. **Validation** - Run configuration validation after changes
6. **Documentation** - Update system reference docs as features are added

### Testing Approach
- **Unit Tests** - Test individual system components
- **Integration Tests** - Test helper interface communications
- **Configuration Tests** - Validate configuration file integrity
- **Health Check Tests** - Verify system health monitoring

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

## Project Structure
```
  spurilo/
  ├── .claude/                      - Claude AI code assistant settings
  ├── archive/                      - Archived documentation and guides (AI should ignore this folder)
  ├── bugs/                         - Bug tracking and management
  │   ├── closed/                   - Resolved issues
  │   ├── open/                     - Active issues
  │   └── template.md               - Bug report template
  ├── config/                       - Application configuration files
  ├── data-packs/                   - External data resources
  │   └── frameworks/               - Compliance framework data
  ├── design-notes/                 - Notes by and to the designer  (AI should ignore this folder)
  ├── docker/                       - Docker containerization
  ├── docs/                         - Project documentation
  │   └── README.md                 - Main documentation
  ├── src/                          - Main application source
  │   ├── api/                      - API endpoints
  │   │   └── admin/                - Admin API routes
  │   ├── audit-management/         - Audit system module
  │   ├── auth/                     - Authentication module
  │   ├── compliance-frameworks/    - Compliance framework module
  │   ├── config/                   - Configuration management module
  │   ├── database/                 - Database manager module
  │   │   ├── db-manager.js         - Database access interface
  │   │   └── schemas/              - MongoDB schemas
  │   │       └── validators/       - Schema validators
  │   ├── public/                   - Frontend application
  │   │   ├── components/           - React components
  │   │   ├── styles/               - CSS stylesheets
  │   │   ├── utils/                - Frontend utilities
  │   │   ├── App.jsx               - Root React component
  │   │   ├── index.html            - HTML entry point
  │   │   └── main.jsx              - React app bootstrap
  │   ├── routes/                   - Express routes
  │   │   ├── admin/                - Admin route handlers
  │   │   └── auth.routes.js        - Authentication routes
  │   ├── user-role/                - User management module
  │   └── server.js                 - Express server entry
  ├── tests/                        - Test suites
  ├── .gitignore                    - Git ignore rules
  ├── CLAUDE.md                     - Claude AI instructions
  ├── current-workplan.md           - Active development plan
  ├── package-lock.json             - Locked dependencies
  ├── package.json                  - Project dependencies
  ├── postcss.config.js             - PostCSS configuration
  ├── tailwind.config.js            - Tailwind CSS config
  ├── todo.md                       - Project TODO list
  └── vite.config.js                - Vite build configuration
```

## AI Assistant Guidelines

### Context Preservation
- System architecture should be designed to be comprehensible after context loss
- Helper interfaces provide clear system boundaries
- Configuration-driven behavior is favored to reduce complexity
- Self-documenting code patterns must be maintained
- AI assistants should make notes in /current-workplan.md as needed to ensure context isn't lost if the session is interupted.