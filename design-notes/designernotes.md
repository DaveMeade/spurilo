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
_(Mongo db\collection: `spurilo\users`)_

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
Note: these example User Manager functions should call functions from the Database Manager for any actual database access

### The First User
When the application first launches, and no system.admin user exists, it should present a "Spurilo Installation Successful" page that prompts the user to create the initial System.admin and associated Organization.

## Organizations
_(Mongo db\collection: `spurilo\organizations`)_

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
    "slug": "acme",
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
- `getMembers(orgId|slug)` - get all members of the organization
- `findOrg(orgId|slug)` - Find org by orgId or slugfield
- `findOrgByDomain(domain)` - Find org by org_domains inclusion
- `updateOrg(orgId|slug, updateData)` - Update org data
Note: these example Organization Manager functions should call functions from the Database Manager for any actual database access

### Pre-provisioned Users
Users with the requisite permission can provision users in a given organization and assign appropriate roles and permissions. This includes System.admin users, Organization.admin users, and any organizational role that includes 'provision users' permission.

When a pre-provisioned user signs in the for the first time, their roles are already applied to their account (identified by email address).

### Auto-provisioned Users
When an unknown user authenticates to Spurilo they are auto-provisioned as 'pending' user and assigned to either an existing organization (if the users email address domain is included in an organizations org_domains), or into a newly created 'pending' organization based on the registering users email address.

Organization.admins should receive a notification of pending auto-provisioned users.

System.admins should receive a notification of pending auto-provisioned organizations.

## Engagements
_(Mongo db\collection: `spurilo\engagements`)_

A organization can sponsor an 'Engagement'. An Engagement is a multi-phased audit or audit readiness project. Engagements have an assigned Client Owner from its associated organization.

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
Note: these example Engagement Manager functions should call functions from the Database Manager for any actual database access

### Managing Engagement Participants
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
Note: these example Role Manager functions should call functions from the Database Manager for any actual database access

## Collections
Spurilo loads cybersecurity related standards, frameworks, regulations, etc as 'collections' of requirements.
Supported collections are indexed in Mongo db\collection: `spurilo\collections`.

### Index of collections 
_(Mongo db\collection: `spurilo\collections`)_

Each collection record includes a 'slug' property which is used both as the mongoDB collection name which contains the associated requirements,and as a prefix to requirement uids within that collection.

Example: if a collection has a slug of 'nist_csf-2_0_0', then the requirements for that collection will be stored in the mongoDB collection 'spurilo-collections\nist_csf-2_0_0', and the uids of the requirements will be prefixed with 'nist_csf-2_0_0_'.

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
  "uri": "https://www.nist.gov/cyberframework",
  "availability": "public",
  "license": { "name": "CC BY 4.0", "url": "https://creativecommons.org/licenses/by/4.0/" }
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
  "uri": "https://slackspace.net",
  "availability": "subscription",
  "license": { "name": "Slackspace Subscription", "url": "https://slackspace.net" }
},
{
  "_id": "688a9581945ae546cc2b163e",
  "type": "Custom Requirement Catalogue",  
  "name": "Acme Custom Control Framework",
  "description": "ISO 27001, SOC2 Security, and custom requirements",
  "shortName": "ACME CCF",
  "version": "1",
  "slug": "acme_ccf-1",
  "status": "draft",
  "maintainer": "Slackspace",
  "uri": "https://slackspace.net",
  "availability": "Organizational",
  "org": "orgSlug",
  "owner": "userId"
}
```

### Custom Collections (aka: SoA / Control Profile)

Organizations can create a 'Custom Collections' to design a customized collection of requirements. Custom Collections can include: 1) Manually entered or imported requirements, 2) Cloned requirements from any other of the organization's collections, or 3) any item cloned from a collection listed in the collection index that the organization has access to.

Organizational Custom Requirement Catalogues are organization specific and can only be leveraged by the owning organization.


## Requirements
_(Mongo db\collection: `spurilo-collections\{$collection.slug}`)_

Requirements are stored in mongo database spurilo-collections, in collections named for the collection slug.

Requirements included in the scope of an engagement detail the requirements and testing objectives that will be included in the assessment.

### Example for SSRC_0_1_0 defined above
_(Mongo db\collection: `spurilo\ssrc-0_1_0`)_

```json
{
  "_id": "686c624a82bce9fe182a6c2b",
  "type": "Requirement",
  "_comment": "Requirements.type can be any of: Requirement | Implementation Guidance | Implementation Example | Testing Requirement | Required Evidence",
  "source": {
    "shortName": "SSRC",
    "version": "0.1.0",
    "type": "Custom Requirement Catalogue"
  },
  "uid": "ssrc-0_1_0:X.1",
  "ref": "X.1",
  "parent": "ssrc-0_1_0:X",  
  "domain": "Leadership",
  "name": "Leadership Commitment to Ethics",
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

  ============================================================================================================================
  *** Rethinking **
  ============================================================================================================================

I'm building the design documentation for an app to support cyber compliance assessments. I've been trying to keep a very segmented and compartmentalized design, with each component having a single responsibility. I'm using mongoDB on the back end, and I've struggled with how to store data relating to engagements, the associated requirements that will be assessed, and the evidence that will be collected. 

The json below demonstrates the data / relationship structure I imagine being required by the application. The ARL section could be quite large, and given that the 'response' section is stored with the requirement, could grow with each response or message thread (which is also in this data structure). More than one engagement could be in progress at the same time, and potentially more than auditor could be using the platform at the same time.  My concern is performance and integrity.

My instinct is to break this into several collections, but given the one to many relationships between many components, I'm not sure how to best structure this.

The application database is called `spurilo`. The json below could be a record in `spurilo\engagements`, or it could be broken into several collections. Engagements and all associated data (requirements, responses, etc.) are 'owned' by an 'organization', but I  know of no way to model `spurilo\organization_name\engagements\requirements` in mongo.

Please revire the json below, and help me determine the best way to structure this data in mongo. Feel free to suggest improvements to the data model itself, or point out any issues or concerns you may have.

```json
[{
    "_id": "68890b91b4a366adb54a6abc",
    "org": "orgID",
    "type": "engagement_type",
    "engagement_uid": "orgID_engagement_type_####:v",
    "name": "Organization Internal Audit - YYYY.MM (####)",
    "slug": "orgSlug_engagement_type_####",
    "frameworks": [{
        "framework": "SOC2",
        "components": ["security", "availability", "processing integrity", "confidentiality", "privacy" ]
    },
    {
        "framework": "ISO27001"
    }],
    "scope": "",
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
    "notes": [],
    "portal_url": "/engagements/${this.id}",
    "created": "date/timestamp",
    "modified": "date/timestamp",
    "artifacts": [
      {
        "files": [
          {
            "_id": "68890b91b4a366adb54a6abc",
            "fileName": "file1.pdf",
            "type": "pdf",
            "uri": "s3://example-bucket/path/to/file1.pdf", 
            "size": 1024,
            "sha256": "sha256 hash of file",
            "md5": "md5 hash of file",
            "sha1": "sha1 hash of file",
            "name": "Physical Security Policy Document",
            "description": "Description of file1.pdf (Physical Security Policy Document)",
            "frequentReference": true,
            "submitter": "userID",
            "submitDate": "2024-03-01T00:00:00Z",
            "usedFor": ["requirement1", "requirement2"]
          }
        ],
        "statements": [
          {
            "_id": "68890b91b4a366adb54a6def",
            "name": "Cloud Based Infrastructure Statement",
            "type": "Statement",
            "statement": "free form text statement, that can be applied to one or more requirements in bulk.",
            "usedFor": ["requirement1", "requirement2"],
            "submitter": "userID",
            "submitDate": "2024-03-01T00:00:00Z"
          }
        ]
      }
    ],
    "messages": [
      {
        "threadId": "uid",
        "channel": "engagement|requirement",
        "channelType": "direct|group",
        "messages": [
          {
            "_id": "uid",
            "text": "free form text message",
            "submitDate": "2024-03-01T00:00:00Z",
            "from": "userID",
            "to": "userID",
            "_to-comment": "Not needed if channelType is group",
            "inreplyto": "_id",
            "attachments": ["artifacts.files.fileid1", "artifacts.files.fileid2"]
          }
        ]
      }
    ],
    "ARL": [
      {
        "createDate": "2024-03-01T00:00:00Z",
        "statusHistory": [
          {
            "_id": "uid",
            "status": "drafting",
            "notes": "free form text notes about the status change",
            "appliedBy": "userID",
            "date": "2024-03-01T00:00:00Z"
          }
        ],
        "requirements": [{
          "_id": "686c624a82bce9fe182a6c2b",
          "type": "Requirement",
          "_comment": "Requirements.type can be any of: Requirement | Implementation Guidance | Implementation Example | Testing Requirement | Required Evidence",
          "source": {
            "shortName": "SSRC",
            "version": "0.1.0",
            "type": "Custom Requirement Catalogue"
          },
          "uid": "ssrc-0_1_0:X.1",
          "ref": "X.1",
          "parent": "ssrc-0_1_0:X",  
          "domain": "Leadership",
          "name": "Leadership Commitment to Ethics",
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
          ],    
          "response": {
            "files": ["artifacts.files.fileid1", "artifacts.files.fileid2"],
            "statements": ["artifacts.statements.statementid1", "artifacts.statements.statementid2"],
            "response": "free form text response to the requirement",
            "responder": "userID",
            "responseDate": "2024-03-20T00:00:00Z",
            "responseAcceptedDate": "2024-03-20T00:00:00Z",
            "responseAcceptedBy": "userID",
            "messages": ["messages.threadID1", "messages.threadID2"]
          }
        }
      ]
    }
  ]
}]
```

## Mappings
_(Mongo db\collection: `spurilo\mappings`)_

Mappings allow control requirement profiles or frameworks to map across one or more other standards, frameworks, regulations, etc; allowing an assessment to demonstrate an organizations compliance stance across multiple standard from a single engagement scope.

```json
{
  "_id": "6887ddd6631fcdbb0fb1a135",
  "ref_id": "ssrc-0_1_0:X.3",
  "base_requirement_uid": "ssrc-0_1_0:X.3",
  "mapped_requirements": [{
    "uid": "nist_csf-2_0_0:GV.OC-03",
    "mapping_to_base": "subset",
    "justification": "The mapped requirement addresses X but not Y from the base requirement.",
    "confidence": 0.9,
    "created_by": "Davo",
    "created_at": "2025-07-26T12:34:56Z",
    "notes": {
      "text": "Some notes about this mapping",
      "private": true,
      "author": "Davo",
      "date": "2025-07-26T12:34:56Z"
    }    
  }]
}
```
```json
{
  "_id": "6887ddd6631fcdbb0fb1a135",
  "base_requirement_uid": "ssrc-0_1_0:X.3",
  "mapped_requirements": [{
    "uid": "nist_csf-2_0_0:GV.OC-03",
    "mapping_to_base": "subset",
    "justification": "The mapped requirement addresses X but not Y from the base requirement.",
    "confidence": 0.9,
    "created_by": "Davo",
    "created_at": "2025-07-26T12:34:56Z",
    "notes": {
      "text": "Some notes about this mapping",
      "private": true,
      "author": "Davo",
      "date": "2025-07-26T12:34:56Z"
    }    
  }]
}
```


  ============================================================================================================================
  ****************************************************************************************************************************
  ============================================================================================================================

  [TBC] - control profile (with scope section) / submissions / notes / messages / etc

  ============================================================================================================================
  ****************************************************************************************************************************
  ============================================================================================================================




## Integrations & Jobs
_(Mongo db\collection: `spurilo\jobqueue`)_

Spurilo integrates with external tools (e.g., MongoDB backend, N8N workflows, AI analysis engines) to validate completeness of scope, normalize control requirements profiles, flag missing mappings, propose draft justifications for exclusions, and more.   

This system manages long-running external processes using a shared job table as the source of truth combined with real-time event streaming. When a user initiates a process, the web application creates a job record in the database and passes the Job ID to the external service (e.g., an n8n workflow). The external service updates this job record at key stages (e.g., in-progress, completed) either directly or through a backend API.

Clients can always retrieve the latest job state by querying the job record, ensuring status is recoverable even if the application was offline during processing. For a real-time user experience, the backend also exposes a Server-Sent Events (SSE) endpoint (/jobs/updates) that pushes status changes to any connected clients. This avoids polling and provides immediate feedback to users while jobs are running.

Because the database is the single source of truth, the system is resilient to missed updates and scales easily to multiple clients or external services. The pattern is fully decoupled: external services only need to update the job record, and the frontend can subscribe to updates or query historical status as needed.

## Audit Engagement Lifecycle

Spurilo tracks each audit engagement through multiple lifecycle phases.

### 1) Org Data Gathering

* **Introduction of Audit Team**
  * Purpose: Establish rapport, clarify roles

* **Delivery of Business Questionnaire**
  * Purpose: Understand business context, systems, and key risks

* **Review Org Details, Assertions, and Business Requirements**
  * Purpose: Understand business context, systems, and key risks.
  * Tasks: Review Org chart, system architecture documentation, compliance requirements and prior audit deliverables

### 2) Pre-Fieldwork

* **Creation of Control Requirements Profile**
  In the Pre-Fieldwork phase, Spurilo guides auditors and client stakeholders through scoping discussions, framework selection, and control alignment.
  * Purpose: Identify and document the the included and in-scope compliance requirements for the engagement
  * Deliverables:Control Requirements Profile, Statement of Applicability, framework mappings (SOC 2, ISO, etc.)

  #### Core Capabiliies:
    - **Create Draft Control Requirements Profile**
      - When creating the Control Requirements Profile for an engagement, Spurilo offers several options:
        - Clone a Control Requirements Profile from one of the organizations previous engagements
        - Create a 'blank' Control Requirements Profile (into which requirements can later be added)
        - Create a Control Requirements Profile by selecting all or part of one or more collections. (Spurilo collections contain recognized standards such as SOC 2, ISO 27001, HITRUST, HIPAA, NIST CSF, etc. as well custom requirement collections stored for the organization.)
          - Auditors can select one or more recognized standards (SOC 2, ISO 27001, HITRUST, HIPAA, NIST CSF, etc.) from Spurilo’s Collections library, including any custom collections stored for the organization.
          - Requirements from the selected collections are added to the Control Requirements Profile
      - Requirements included in Control Requirements Profile may be added, edited, or deleted (with a tracked justification) by the auditor.
      - Engagement Scope can be narrowed by system boundaries, business units, services, or time periods, with Spurilo capturing this metadata in the Scope section of the Control Requirements Profile.
    - **Requirements Consolidation & Normalization**
      - When ready the auditor marks the Draft Control Requirements Profile as 'Ready for QA'. This creates a 'job' for asynchronous off-system AI analysis.
      - AI-assisted analysis:
        - pulls in relevant control criteria and cross-maps overlapping requirements across frameworks
        - reduces duplication by identifying semantically equivalent requirements (e.g., SOC 2 CC6.6 ↔ ISO 27001 A.12.6.1).    
      - The system maintains traceability between the original authoritative source and the normalized representation.  
    - **Versioning & Audit Trail**
      - Spurilo maintains historical versions of each Control Requirements Profile, ensuring that changes are tracked, attributable, and reviewable.  
      - Prior profiles from earlier engagements can be cloned or referenced to reduce set-up time.  

* **Assignment of Requirements**
Once the Control Requirements Profile has been established, Spurilo enables the systematic assignment of responsibilities and testing objectives. This step ensures each requirement is clearly owned, managed, and prepared for evidence collection and evaluation.
  * Purpose: Assign audit areas and responsibilities to stakeholders
  * Deliverables: Assigned requirements list, auditor testing plan  

  #### Core Capabilities:
    - **Role-Based Assignment**
      - Requirements from the Control Requirements Profile can be assigned to specific client stakeholders (control custodians, control owners, process managers) based on their organizational role. 
      - Auditors are assigned to testing requirements withing the control profile.  
      - Client stakeholders are assigned to "Requirement" or "Required Evidence" items in the control profile. This value should default to the Client Admin.
      - Spurilo enforces role-based access control: assignments can only be made to authorized users defined by the Client Admin.      
      - Assignments are tracked within the engagement record for planning and scheduling.  
      - A single requirement may be assigned to multiple custodians, with primary/secondary responsibility clearly marked.
    - **Custom Instructions & Guidance**
      - "Implementation Guidance" or "Implementation Example" from the control profile are included with their associated requirement.
      - Auditors can include additional notes, reference documents, or prior findings as guidance for custodians.    
      - Spurilo surfaces related evidence or auditor comments from prior engagements to help custodians understand expectations.  
    - **Progress & Accountability Tracking**
      - Real-time dashboards display the percentage of requirements assigned, accepted, or pending.  
      - Notifications and reminders are sent automatically via integrated N8N workflows to ensure timely responses.  
    - **Versioning & Audit Trail**
      - Changes to assignments (e.g., reassignment due to staff turnover) are tracked with justification.  
      - Spurilo preserves historical assignment records for reference in subsequent engagements.

  ### Deliverables Produced
  - **Assigned Requirements List** with mapped custodians, auditors, and testing objectives.  
  - **Auditor Testing Plan** documenting assigned responsibilities and planned test activities.  

  ### Collaboration & Workflow
  - Spurilo facilitates transparent collaboration: custodians can ask clarifying questions directly within the platform, and auditors can respond in threaded discussions tied to each requirement.  
  - Assignments and submissions can trigger workflow automations:  
    - N8N workflows notify custodians of new assignments. 
    - N8N workflows perform AI analysis upon completed assignment submission
    - N8N workflows notify auditors of newly submitted and AI reviewed submission. 
  - All communication, acknowledgements, and changes are logged to maintain a defensible audit trail.  







  ============================================================================================================================
  ****************************************************************************************************************************
  ============================================================================================================================





* **Generation of Information Request List (IRL)**
  * Purpose: Create the Audit Information Request List  
  * Deliverables: Audit Information Request List
   
  The Audit Information Request List ... [TBC]

* **Scheduling and Kickoff**
  * Purpose: Schedule remaining audit phases, and confirm logistics and availability

### 3) Fieldwork ~~~ pending fixes

* **Kickoff Meeting**
  * Purpose: Align stakeholders, reconfirm scope
  * Deliverable: Audit Request List


* **Control Testing and Walkthroughs**
  * Purpose: For each requirement in the control requirement profile ...  [TBC]

  Spurilo provides ... [TBC]

* **Interim Findings and Communication**
  * Purpose: Early validation and transparency
  * Deliverables: Draft issues list

  At any point in the audit, the Auditor may note a 'finding' or ... [TBC]

### 4) Reporting

* **Drafting Report and Validating Findings**

  * Deliverables: Draft report, business impact analysis
  * IIA: Req. 24 (Result communication)
  * CISA: Risk articulation, clear language

* **Management Response and Action Plans**

  * Deliverables: Remediation plans, due dates
  * IIA: Req. 25 (Final report components)

* **Final Issuance**

  * Audience: Executives, Board, Audit Committee
  * Deliverables: Final audit report
  * Communication: Closing meeting or summary memo

### 5) Post-Audit Follow-up

* **Remediation Monitoring**

  * Deliverables: Tracking logs, closure memos
  * IIA: Req. 26 (Action monitoring)
  * CISA: Domain 5 (Remediation validation)

* **Engagement Retrospective**

  * Purpose: Team lessons learned
  * Deliverables: Improvements, methodology updates
  * IIA: Domain 4 (QA and improvement)

### 6) Quality Assurance

* **Internal QA Review of Engagement**

  * Purpose: Compliance with standards
  * Deliverables: QA checklist, peer review notes
  * IIA: Req. 12 (QAIP program)

* **Annual Self-Assessment or 5-Year External Review**

  * Deliverables: QA program summary or external opinion
  * IIA: Required every 5 years for full conformance


## Response & Evidence Collection
{TBC}

## Analysis and Review
{TBC}

## Deliverables
{TBC}