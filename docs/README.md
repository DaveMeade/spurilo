# Spurilo : An intelligent platform for managing and streamlining cybersecurity audits.

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

## Core Systems (so far imagined)

| System | Purpose | Documentation | Configuration | Status |
|--------|---------|---------------|---------------|---------|
| Database Manager | Centralized database access layer for all MongoDB operations | See Database Access Layer section below | MongoDB connection via env vars | Implemented - see `/src/database/db-manager.js` |
| Framework Management | Manage security standard, frameworks, regulations, and other compliance requirements (NIST, ISO 27001, SOC 2) | [compliance-frameworks-reference.md](compliance-frameworks-reference.md) | app.settings.json | Partial - see `/src/compliance-frameworks/` |
| Organization Management | Manage organizations who contract engagements | TBD | TBD | Partial - schemas exist, API partially implemented |
| Engagement Management | Manage and create engagements for client organizations | TBD | TBD | TBD |
| Control Profile Management | Manage and update the requirements profile for a given organization | TBD | TBD | TBD |
| Audit Management | Track audit schedules, findings, and remediation | [audit-management-reference.md](audit-management-reference.md) | audit.settings.json | Partial - see `/src/audit-management/` |
| Request Management | Manage requests and responses between auditor and participants | TBD | TBD | TBD |
| Authentication Manager | OAuth and session management | TBD | OAuth providers via env vars | Implemented - see `/src/config/passport.config.js` |
| User Management | Manage and create users within or across organizations (depending on permissions) | TBD | TBD | Implemented - see `/src/user-role/` |
| Roles and Permissions Manager | Manage users, roles, and engagement participants | TBD | user.roles.json | Implemented - see schemas and user-role system |
| Message Manager | Manage tracked communications between the auditor and participants | TBD | TBD | Schema implemented |

## Database Access Layer

The application uses a centralized database access layer (`db-manager`) that provides the **only** interface for database operations. All MongoDB access goes through this layer to ensure consistency, security, and maintainability.

### Database Manager (`/src/database/db-manager.js`)
- **Purpose**: Single interface for all database operations
- **Features**: Connection management, CRUD operations, health monitoring
- **Security**: Handles MongoDB authentication and connection credentials
- **Usage**: Import `{ dbManager }` - all other components use this interface

#### Available Database Operations
**User Management:**
- `createUser(userData)` - Create new user with validation
- `findUserByUserId(userId)` - Find user by userId field
- `findUserByEmail(email)` - Find user by email
- `findUsers(query)` - Find users with custom query
- `findUsersByRole(role)` - Find users by role
- `updateUser(userId, updateData)` - Update user data

**Organization Management:**
- `createOrganization(orgData)` - Create new organization
- `findOrganizationByDomain(domain)` - Find org by domain
- `findOrganizationById(id)` - Find org by ID
- `findOrCreateOrganizationByDomain(userData, orgData)` - Find or create org
- `getAllOrganizations()` - Get all organizations
- `updateOrganization(id, updateData)` - Update organization

**Engagement Management:**
- `findEngagementById(engagementId)` - Find engagement by ID
- `getEngagementParticipants(engagementId)` - Get participants
- `updateEngagementParticipants(engagementId, participants)` - Update participants
- `findUsersInEngagement(engagementId)` - Find users in engagement

**System Operations:**
- `initialize()` - Connect to database and initialize schemas
- `healthCheck()` - Get database health status
- `getConnectionState()` - Get connection state
- `listCollections()` - List database collections

### Schema Organization
- **Location**: `/src/database/schemas/`
- **Access Method**: **Only through db-manager** - direct schema imports are prohibited
- **Documentation**: Schema definitions align with `/design-notes/example-json-data.jsonc`

### Available Schemas
| Schema | Purpose | Key Validations |
|--------|---------|-----------------|
| Organization | Customer organizations | Domain validation, status transitions |
| User | User accounts and authentication | Email domain matching, role compatibility |
| Engagement | Audit engagements | ID format, timeline consistency |
| EngagementControlProfile | Control assessments | Status transitions, evidence validation |
| EngagementType | Engagement type definitions | Type settings, configuration |
| EngagementTypeSettings | Engagement type configurations | Setting validation |
| Message | Communication system | Mention extraction, read tracking |
| Notification | User notifications | Read status, delivery tracking |
| Permission | Permission definitions | Permission scope validation |
| SystemRole | System-wide roles | Role permissions |
| OrganizationRole | Organization-specific roles | Organization scope |
| EngagementRole | Engagement-specific roles | Engagement scope |
| RoleCategory | Role categorization | Category hierarchy |
| AccessLevel | Access level definitions | Access scope validation |
| RoleAssignment | User role assignments | Assignment validation |

### Schema Features
- **Business Rule Validation**: Enforces state transitions, role compatibility, and data relationships
- **Configuration-Driven Limits**: Max participants, role counts, etc. controlled by configuration
- **Smart Defaults**: Auto-generates IDs, timestamps, and computed fields
- **Performance Optimization**: Proper indexes for common queries

### Database Access Usage

**Critical:** All database operations must go through `db-manager`. Direct schema imports and database calls are prohibited outside the database layer.

```javascript
// CORRECT: Use db-manager for all database operations
import { dbManager } from './database/db-manager.js';

// Initialize db-manager (handles connection and schema setup)
if (!dbManager.initialized) {
    await dbManager.initialize();
}

// Create user through db-manager
const user = await dbManager.createUser({
    email: 'user@company.com',
    firstName: 'Jane',
    lastName: 'Doe',
    organizationId: 'org-123',
    system_roles: ['admin'],
    status: 'active'
});

// Find users through db-manager
const users = await dbManager.findUsersByRole('admin');
const user = await dbManager.findUserByEmail('user@company.com');

// Organization operations
const org = await dbManager.findOrganizationByDomain('company.com');
const newOrg = await dbManager.createOrganization({
    name: 'Company Inc',
    org_domains: ['company.com'],
    status: 'active',
    createdBy: 'admin@company.com'
});

// Health monitoring
const health = await dbManager.healthCheck();
console.log('Database status:', health.status);
```

**Prohibited:**
```javascript
// NEVER import schemas directly outside /src/database/
import { User } from './database/schemas/user.schema.js'; // ❌ Wrong
const user = new User(data); // ❌ Wrong
await user.save(); // ❌ Wrong
```

## Configuration System
- **Master Configuration**: `/config/app.settings.json` - Core application settings
- **System Configurations**: Individual JSON files per system
- **Debug Configuration**: `/config/debug.settings.json` - Development and testing settings
- **Runtime Updates**: Configuration changes applied without restart where possible

### Configuration Paths
- `systems.compliance.frameworks` - Available compliance frameworks
- `systems.compliance.defaultFramework` - Default compliance framework setting
- `systems.compliance.autoUpdateFrameworks` - Auto-update framework definitions

## System Interrelations & Data Flow

### Initialization Sequence
1. Load master configuration from app.settings.json
2. Initialize compliance-frameworks system with framework definitions
3. Load audit-management system with existing audit data
4. Initialize user-role system with role definitions

### Essential Helper Functions
- `ConfigManager.get(path, defaultValue)` - Get configuration value
- `ConfigManager.set(path, value)` - Update configuration at runtime
- `dbManager.initialize()` - Initialize database connection
- `dbManager.healthCheck()` - Check database health status

## Making Changes & Contributions

### For AI Agents & Developers
1. **Configuration First**: Check if change can be made through configuration rather than hardcoding values
2. **Database Access**: Use only `db-manager` for database operations - never import schemas directly
3. **System Isolation**: Develop and test systems independently
4. **Helper Interface**: Use defined interfaces for system communication
5. **Documentation**: Update system reference docs with changes
6. **Bug Tracking**: Use `/bugs/` folder for comprehensive issue tracking

### Available Commands
- `npm start` - Start development environment with Docker
- `npm run dev` - Run Vite development server
- `npm run build` - Build for production
- `npm run stop` - Stop Docker containers