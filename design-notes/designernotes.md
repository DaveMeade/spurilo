IMPORTANT!
NOTE TO AI AGENTS: Ignore this file. It is not meant to provide guidance in any way and could mislead you.
---

# Spurilo Design Document
This document describes the Spurilo application / platform. This document should be used by developers and AI agents to guide and validate development work.

The envisioned system integrates with other platforms, so it is important that the data structures and API endpoints described in the document are maintained in the final product.

## Overview 

Spurilo is a comprehensive cyber security audit management and facilitation tool presented via a modern clean web application interface. It is designed for planning, scoping, and conducting both readiness assessments and full audit engagements for client organizations. 

Spurilo supports a wide range of audit types, including SOC 2 (Type 1 & 2), ISO 27001, HITRUST, and more. It allows auditors to create "Organizational" or "Engagement" level "Custom Control Frameworks" supporting both custom requirements and the inclusion or cross-walking of requirements from published standards, regulations, and frameworks.

Spurilo tracks required testing activities, evidence submissions and reviews, provides a clear real-time view of an engagement's status, and offers a comprehensive view of an organization's compliance posture across multiple frameworks.

Spurilo proactively manages the entire audit lifecycle with particular focus on planning, scheduling, data gathering, fieldwork tracking, analysis and reporting.

The platform facilitates collaboration between auditors and client stakeholders as OpenID Connect authenticated users. Users are either Auditors assigned by the System Admin (or another user with the 'assign auditor' permission), or are members of a client organization with roles and permissions managed by the Client Admin.

Importantly, Spurilo leverages 'external' tools such as a mongoDB backend, N8N workflows, AI Analysis, and more to proactively manage tasks and deadlines, provide timely communications, and provide draft analysis of submissions and deliverables to offering key insights for auditor consideration and accelerating the review process.

Spurilo supports control owners / custodians by tracking an organization's prior engagements, including prior evidence collected, testing performed, and auditor findings. A Control Custodian can quickly review past responses and evidence as guidance for the current engagement. The platform also provides a comprehensive view of an organization's compliance posture across multiple frameworks to audit and organizational stakeholders.

## Database Access Layer
The application uses a centralized database access layer via a `DB Manager` module that provides the **only** interface for database operations. All MongoDB access goes through this layer to ensure consistency, security, and maintainability.

### DB Manager 
- **Purpose**: Single interface for all database operations
- **Features**: Connection management, CRUD operations, health monitoring
- **Security**: Handles MongoDB authentication and connection credentials
- **Usage**: Import `{ dbManager }` - all other components use this interface

#### Example DB Manager Operations
- `initialize()` - Connect to database and initialize schemas
- `healthCheck()` - Get database health status
- `getConnectionState()` - Get connection state
- `listCollections()` - List database collections
- `find()` - a wrapper for find that takes application context as an argument to select target collection
- `findMany()` - a wrapper ...

## Independant Module / Microservice Design
The application uses a microservice / independent module architecture. Systems are strictly aligned with their given context / scope / related data structures, and provide helper functions to other systems which need to interact with the given system or data elements. 

## Users
_(Mongo db\collection: `suprilo\users`)_

All access to Spurilo is authenticated. Users are authenticated using oAuth OpenID Connect to their preferred authentication provider. 'Sign-in with' options include Google, Microsoft, LinkedIn, or Okta. Spurilo never stores passwords or credentials.

Spurilo tracks key user data including their associated 'organization', preferences, system-level roles, last login datetime, overall status, and more.

### Sample User Record
```json
{
  "_id": "688a2154ca83b052609f5de8",
  "email": "dave@slackspace.net",
  "emailVerified": true,
  "firstName": "David",
  "lastName": "Meade",
  "organization": "Slackspace",
  "organizationId": "org-1752812869122",
  "system_roles": [
    "admin"
  ],
  "preferences": {
    "notifications": true,
    "emailUpdates": true,
    "timezone": "UTC"
  },
  "status": "active",
  "oauthProviders": {
    "google": {
      "id": "###_OAUTH_ID_###",
      "lastUsed": {
        "$date": "2025-07-18T04:28:46.532Z"
      }
    }
  },
  "lastLogin": {
    "$date": "2025-07-18T04:28:00.947Z"
  },
  "createdDate": {
    "$date": "2025-07-18T04:27:49.159Z"
  },
  "lastUpdated": {
    "$date": "2025-07-18T04:28:00.948Z"
  }
} 
```

### Example User Manager helper functions:
- `createUser(userData)` - Create new user with validation
- `findUserByUserId(userId)` - Find user by userId field
- `findUserByEmail(email)` - Find user by email
- `findUsers(query)` - Find users with custom query
- `findUsersByRole(roleTypeObj, role)` - Find users by role
- `updateUser(userId, updateData)` - Update user data
Note: these examples should use the Database Manager for any actual database access

### The First User
When the application first launches, and no system.admin user exists, it should present a "Spurilo Installation Successful" page that prompts the user to create the initial System.admin and associated Organization.

## Organizations
_(Mongo db\collection: `suprilo\organizations`)_

Organizations are stored in the 'organizations' collection within the 'spurilo' database.

An organization represents a Client Organization and provides the logical segregation context for 'customers' in the Spurilo platform. Users are assigned or invited to an organization by a user with the 'manage users' permission for the given organization (see Roles and Permissions in a later section).

```json
{
    "id": "acme001",
    "crm_link": "https://slackspace.capsulecrm.com/party/272828446",
    "name": "Automatic Express",
    "aka_names": { 
        "formal_name": "Automatic Express, LLC",
        "friendly_name": "Automatic",
        "short_name": "ACME",
        "dba": "",
        "_comment": "name variants used in deliverables."
    },
    "status": "pending|active|paused|disabled|archived",
    "org_domains": ["org-domain.org", "client-domain.com"],    
    "settings": {
      "defaultOrganizationRole": "pending",
      "defaultEngagementRole": "sme"
    },
    "members": [{
        "user_id": "user@org-domain.org",
        "roles": ["admin"],
        "_comment": "These roles are scoped to the organization only."
    }],    
    "createdBy": "user-1752812035794",
    "createdDate": "2025-07-18T03:46:09.251+00:00",
    "lastUpdated": "2025-07-18T04:13:55.798+00:00"
}
```

### Example Organization Manager helper functions:
- `getMembers(orgId)` - get all members of the organization
- `findOrgByorgId(orgId)` - Find org by orgId field
- `findorgByfomain(domain)` - Find org by org_domains
- `updateOrg(orgId, updateData)` - Update org data
Note: these examples should use the Database Manager for any actual database access

### Pre-provisioned Users
Users with the requisite permission can provision users in a given organization and assign appropriate roles and permissions. This includes System.admin users, Organization.admin users, and any organizational role that includes 'provision users' permission.

When a pre-provisioned user signs in the for the first time, their roles are already applied to their account (identified by email address).

### Auto-provisioned Users
When an unknown user authenticates to Spurilo they are auto-provisioned as 'pending' user and assigned to either an existing organization (if the users email address domain is included in an organizations org_domains), or into a newly created 'pending' organization based on the registering users email address.

Organization.admins should receive a notification of pending auto-provisioned users.

System.admins should receive a notification of pending auto-provisioned organizations.

## Engagements
_(Mongo db\collection: `suprilo\engagements`)_

A organization can sponsor an 'Engagement'. An Engagement is a multi-phased audit or audit readiness project. Engagements have an assigned Client Owner from the parent organization.

```json
{
    "_id": "68890b91b4a366adb54a6abc",
    "org": "orgID",
    "type": "engagement_type",
    "engagement_uid": "orgID_engagement_type_####:v",
    "name": "Organization Internal Audit - YYYY.MM (####)",
    "frameworks": [{
        "framework": "SOC2",
        "components": ["security", "availability", "processing integrity", "confidentiality", "privacy" ]
    },
    {
        "framework": "ISO27001"
    }],
    "status": "pending|scheduled|active|extended|closed",
    "stage": "onboarding|fieldwork|deliverable creation|deliverable review|wrap-up",
    "timeline": {
        "start_date": "date/timestamp",
        "onboard_survey_due": "date/timestamp",
        "irl_delivery": "date/timestamp",
        "kickoff_call": "",
        "fieldwork_start": "date/timestamp",
        "fieldwork_end": "date/timestamp",
        "evidence_cutoff": "date/timestamp",
        "closing_call": "",
        "draft_report_delivery": "date/timestamp",
        "end_date": "date/timestamp",
        "deliverables_due": "date/timestamp"
    },
    "engagement_owner": "emailaddress@org-domain.org",
    "participants": [{
        "user_id": "user@org-domain.org",
        "roles": ["engagement owner", "requirement owner", "sme"],
        "_comment": "These roles are scoped to the engagement only."
    }],
    "notes": "",
    "portal_url": "/engagements/${this.id}",
    "created": "date/timestamp",
    "modified": "date/timestamp"
  }
```

### Example Engagement Manager helper functions:
- `getParticipants(engagementId)` - get all participants of the engagement
- `addParticipants(engagementId, userId, role)` - add a participant to the engagement
- `removeParticipants(engagementId, userId)` - remove a participant to the engagement
- `applyRole(engagementId, userId, role)` - apply a role to a participant in the engagement
- `removeRole(engagementId, userId, role)` - remove a role from a participant in the engagement
- `findEngagementById(engagementId)` - Find an engagement by engagementId
- `getAllOrgEngagements(orgId)` - get all engagements for an organization
- `updateEngagement(engagementId, updateData)` - Update engagement data
Note: these examples should use the Database Manager for any actual database access

### Managing Participants
The Client Owner of an engagement can add organizational users as participants in an engagement, remove them, pre-provision / invite new users (with org_domains email addresses), and manage engagement specific roles and permissions for participants.

## Roles, and Permissions

The platform has three permission scopes: System, Organizational, and Engagement.
Each scope has named roles within. Roles in any scope provide NO permissions in other scopes. 
For example:
 - A user with the engagement['a'].manageUsers permission can manage users ONLY in engagement A, but not in any other easement.
 - An organization['acme'].admin can manage organization.users, but not system.users.

### Example User Manager helper functions:
- `listPermissions(roleTypeObj, roleName)` - list a roles permissions
- `createRole(roleTypeObj, roleName)` - Create new role of the given type
- `addPermissionToRole(roleTypeObj, permissionObj)` - add a permission to a role
- `removePermissionFromRole(roleTypeObj, permissionObj)` - remove a permission from a role
- `findUsersByRole(roleTypeObj, roleName)` - Find users by role
- `getRolesForUser(userEmail)` - get all roles applied to a user
Note: these examples should use the Database Manager for any actual database access

## Collections
Spurilo loads cybersecurity related standards, frameworks, regulations, etc as 'collections' of requirements.
Supported collections are indexed in Mongo db\collection: `suprilo\collections`.

### Index of collections 
_(Mongo db\collection: `suprilo\collections`)_

Each collection record includes a 'slug' property which is used both as the mongoDB collection name for the related requirements, and as a prefix to requirement uids.

```json
{
  "_id": "6869835ace7f16c6fce84f8b",
  "type": "Published Framework",
  "name": "NIST Cybersecurity Framework",
  "shortName": "NIST CSF",
  "version": "2.0.0",
  "slug": "nist_csf-2_0_0",
  "status": "final",
  "maintainer": "NIST",
  "website": "https://www.nist.gov/cyberframework"
},
{
  "_id": "688a6ac557c1d00a61563d1c",
  "type": "Private Catalogue",
  "name": "Slackspace Requirements Catalogue",
  "description": "",
  "shortName": "SSRC",
  "version": "0.1.0",
  "slug": "ssrc-0_1_0",
  "status": "draft",
  "maintainer": "Slackspace",
  "website": "https://slackspace.net"
}
```

### Custom Requirement Profiles (aka: SoA / Control Profile)
_(Mongo db\collection: `suprilo\requirement-profiles`)_

Organizations can create a 'Custom Requirement Profiles' to design a customized collection of requirements. These can include both custom requirements as well as cloned items from any available published frameworks / standards / etc listed in the collection index.

Organizational Custom Requirement Catalogues are organization specific and can only be leveraged by the owning organization.

```json
{
  "_id": "688a9581945ae546cc2b163e",
  "type": "Custom Requirement Catalogue",  
  "orgId": "orgId",
  "name": "Acme Custom Control Framework",
  "description": "ISO 27001, SOC2 Security, and custom requirements",
  "shortName": "ACME CCF",
  "version": "1",
  "slug": "acme_ccf-1",
  "owner": "userId",
  "status": "active"
}
```

## Requirements
_(Mongo db\collection: `suprilo\{$collection.slug}`)_
_(Mongo db\collection: `suprilo\{$requirement-profile.slug}`)_

Requirements are stored in mongo collections associated with their source collection (ex: NIST CSF, ISO 27001, SOC2, or a Custom Requirements Profile). 

Requirements included in the scope of an engagement detail the requirements and testing objectives that will be included in the assessment.

### Example for SSRC_0_1_0 defined above
_(Mongo db\collection: `suprilo\ssrc-0_1_0`)_

```json
{
  "_id": "686c624a82bce9fe182a6c2b",
  "source": {
    "shortName": "SSRC",
    "version": "0.1.0",
    "type": "Custom Requirement Catalogue"
  },
  "ref": "X.1",
  "uid": "ssrc-0_1_0:X.1",
  "type": "Requirement",
  "_comment": "Requirements.type can be any of: Requirement | Implementation Guidance | Implementation Example | Testing Requirement",
  "parent": "ssrc-0_1_0:X",
  "title": "Example requirement",
  "text": "The entity demonstrates a commitment to integrity and ethical values.",
  "tags": [
    "example",
    "ethics"
  ],
  "testPlans": [
    {
      "id": "ssrc-0_1_0:X.1:1_default",
      "description": "Review ethics training logs and signed code of conduct attestations for at least 2 years.",
      "author": "Slackspace",
      "date": "2024-03-01T00:00:00Z"
    }
  ],
  "notes": [
    {
      "text": "Some notes about this requirement",
      "data": [{
        "_comment": "Arbitrary data elements stored with the note.",
        "key": "keyword",
        "value": "value"
      }],
      "private": true,
      "author": "Slackspace",
      "date": "2023-10-01T00:00:00Z",
      "_comment": "notes can be used to provide additional context or information about the requirement to the auditor."
    }
  ]    
}
```

## Mappings
_(Mongo db\collection: `suprilo\mappings`)_

Mappings allow control requirement profiles or frameworks to map across one or more other standards, frameworks, regulations, etc; allowing an assessment to demonstrate an organizations compliance stance across multiple standard from a single engagement scope.

```json
{
  "_id": "6887ddd6631fcdbb0fb1a135",
  "base_requirement_uid": "ssrc-0_1_0:X.3",
  "mapped_requirements": [{
    "uid": "nist_csf-2_0_0:GV.OC-03",
    "mapping_to_base": "subset",
    "justification": "The mapped requirement addresses X but not Y from the base requirement.",
    "confidence": 0.9,
    "created_by": "davo",
    "created_at": "2025-07-26T12:34:56Z",
    "notes": {
      "text": "Some notes about this mapping",
      "private": true,
      "author": "davo",
      "date": "2025-07-26T12:34:56Z"
    }    
  }]
}
```

## Integrations & Jobs
_(Mongo db\collection: `suprilo\jobqueue`)_

This system manages long-running external processes using a shared job table as the source of truth combined with real-time event streaming. When a user initiates a process, the web application creates a job record in the database and passes the Job ID to the external service (e.g., an n8n workflow). The external service updates this job record at key stages (e.g., in-progress, completed) either directly or through a backend API.

Clients can always retrieve the latest job state by querying the job record, ensuring status is recoverable even if the application was offline during processing. For a real-time user experience, the backend also exposes a Server-Sent Events (SSE) endpoint (/jobs/updates) that pushes status changes to any connected clients. This avoids polling and provides immediate feedback to users while jobs are running.

Because the database is the single source of truth, the system is resilient to missed updates and scales easily to multiple clients or external services. The pattern is fully decoupled: external services only need to update the job record, and the frontend can subscribe to updates or query historical status as needed.

## Audit Workflow Management
{TBC}

## Response & Evidence Collection
{TBC}

## Analysis and Review
{TBC}

## Deliverables
{TBC}