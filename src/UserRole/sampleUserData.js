/**
 * Sample User Data for testing the UserRole system
 * Demonstrates different user types and engagement participation patterns
 */

const sampleUsers = [
    // System Users
    {
        userId: 'admin-001',
        email: 'admin@slackspace.dev',
        firstName: 'System',
        lastName: 'Administrator',
        organization: 'Slackspace',
        department: 'Administration',
        title: 'System Administrator',
        phone: '+1-555-0001',
        roles: ['admin'],
        status: 'active'
    },
    {
        userId: 'auditor-001',
        email: 'jane.auditor@slackspace.dev',
        firstName: 'Jane',
        lastName: 'Auditor',
        organization: 'Slackspace',
        department: 'Consulting',
        title: 'Senior Security Auditor',
        phone: '+1-555-0002',
        roles: ['auditor'],
        status: 'active'
    },

    // Customer Organization Users - Acme Corp
    {
        userId: 'owner-001',
        email: 'john.doe@acmecorp.com',
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Acme Corp',
        department: 'Information Security',
        title: 'CISO',
        phone: '+1-555-1001',
        roles: ['owner'],
        status: 'active'
    },
    {
        userId: 'sme-001',
        email: 'alice.smith@acmecorp.com',
        firstName: 'Alice',
        lastName: 'Smith',
        organization: 'Acme Corp',
        department: 'Information Security',
        title: 'Security Architect',
        phone: '+1-555-1002',
        roles: ['sme', 'controlOwner'],
        status: 'active'
    },
    {
        userId: 'controlowner-001',
        email: 'bob.johnson@acmecorp.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        organization: 'Acme Corp',
        department: 'IT Operations',
        title: 'IT Operations Manager',
        phone: '+1-555-1003',
        roles: ['controlOwner'],
        status: 'active'
    },
    {
        userId: 'manager-001',
        email: 'carol.wilson@acmecorp.com',
        firstName: 'Carol',
        lastName: 'Wilson',
        organization: 'Acme Corp',
        department: 'Risk Management',
        title: 'Risk Manager',
        phone: '+1-555-1004',
        roles: ['manager'],
        status: 'active'
    },
    {
        userId: 'executive-001',
        email: 'david.ceo@acmecorp.com',
        firstName: 'David',
        lastName: 'Thompson',
        organization: 'Acme Corp',
        department: 'Executive',
        title: 'Chief Executive Officer',
        phone: '+1-555-1005',
        roles: ['executive'],
        status: 'active'
    },

    // Customer Organization Users - TechStart Inc
    {
        userId: 'owner-002',
        email: 'sarah.tech@techstart.com',
        firstName: 'Sarah',
        lastName: 'Rodriguez',
        organization: 'TechStart Inc',
        department: 'Security',
        title: 'Head of Security',
        phone: '+1-555-2001',
        roles: ['owner'],
        status: 'active'
    },
    {
        userId: 'sme-002',
        email: 'mike.dev@techstart.com',
        firstName: 'Mike',
        lastName: 'Chen',
        organization: 'TechStart Inc',
        department: 'Engineering',
        title: 'Lead DevOps Engineer',
        phone: '+1-555-2002',
        roles: ['sme', 'controlOwner'],
        status: 'active'
    },
    {
        userId: 'controlowner-002',
        email: 'lisa.ops@techstart.com',
        firstName: 'Lisa',
        lastName: 'Parker',
        organization: 'TechStart Inc',
        department: 'Operations',
        title: 'Operations Director',
        phone: '+1-555-2003',
        roles: ['controlOwner', 'manager'],
        status: 'active'
    }
];

// Sample engagement participant mappings
const sampleEngagementParticipants = [
    {
        engagementId: 'eng-001', // Q1 2024 Gap Assessment
        participants: [
            {
                userId: 'auditor-001',
                roles: ['auditor'],
                assignedControls: [],
                status: 'active'
            },
            {
                userId: 'owner-001',
                roles: ['owner'],
                assignedControls: [],
                status: 'active'
            },
            {
                userId: 'sme-001',
                roles: ['sme', 'controlOwner'],
                assignedControls: ['CC6.1', 'CC6.7', 'CC7.1'],
                status: 'active'
            },
            {
                userId: 'controlowner-001',
                roles: ['controlOwner'],
                assignedControls: ['CC6.2', 'CC6.3', 'CC8.1'],
                status: 'active'
            },
            {
                userId: 'manager-001',
                roles: ['manager'],
                assignedControls: [],
                status: 'active'
            },
            {
                userId: 'executive-001',
                roles: ['executive'],
                assignedControls: [],
                status: 'active'
            }
        ]
    },
    {
        engagementId: 'eng-002', // SOC 2 Internal Audit
        participants: [
            {
                userId: 'auditor-001',
                roles: ['auditor'],
                assignedControls: [],
                status: 'active'
            },
            {
                userId: 'owner-002',
                roles: ['owner'],
                assignedControls: [],
                status: 'active'
            },
            {
                userId: 'sme-002',
                roles: ['sme', 'controlOwner'],
                assignedControls: ['CC1.1', 'CC2.1', 'CC5.1'],
                status: 'active'
            },
            {
                userId: 'controlowner-002',
                roles: ['controlOwner', 'manager'],
                assignedControls: ['CC3.1', 'CC4.1'],
                status: 'active'
            }
        ]
    }
];

// Function to create sample users
async function createSampleUsers(userRoleManager) {
    const results = {
        created: [],
        failed: []
    };

    for (const userData of sampleUsers) {
        try {
            const user = await userRoleManager.createUser(userData);
            results.created.push({
                userId: user.userId,
                name: `${user.firstName} ${user.lastName}`,
                roles: user.roles
            });
        } catch (error) {
            results.failed.push({
                userId: userData.userId,
                error: error.message
            });
        }
    }

    return results;
}

// Function to setup engagement participants
async function setupEngagementParticipants(userRoleManager) {
    const results = {
        success: [],
        failed: []
    };

    for (const engagement of sampleEngagementParticipants) {
        try {
            for (const participant of engagement.participants) {
                await userRoleManager.addUserToEngagement(
                    participant.userId,
                    engagement.engagementId,
                    participant.roles,
                    participant.assignedControls
                );
            }
            results.success.push(engagement.engagementId);
        } catch (error) {
            results.failed.push({
                engagementId: engagement.engagementId,
                error: error.message
            });
        }
    }

    return results;
}

// Function to run complete sample data setup
async function setupSampleData(userRoleManager) {
    console.log('Setting up sample user data...');
    
    try {
        // Create users
        const userResults = await createSampleUsers(userRoleManager);
        console.log(`Created ${userResults.created.length} users successfully`);
        if (userResults.failed.length > 0) {
            console.log(`Failed to create ${userResults.failed.length} users`);
        }

        // Setup engagement participants
        const participantResults = await setupEngagementParticipants(userRoleManager);
        console.log(`Setup participants for ${participantResults.success.length} engagements`);
        if (participantResults.failed.length > 0) {
            console.log(`Failed to setup participants for ${participantResults.failed.length} engagements`);
        }

        return {
            users: userResults,
            participants: participantResults
        };
    } catch (error) {
        console.error('Failed to setup sample data:', error);
        throw error;
    }
}

// Function to demonstrate system capabilities
async function demonstrateSystem(userRoleManager) {
    console.log('\n=== User Role System Demonstration ===\n');

    try {
        // Get all users
        console.log('1. Getting all users...');
        const users = await userRoleManager.users.find({});
        console.log(`Found ${users.length} users in the system\n`);

        // Get users by role
        console.log('2. Getting users by role...');
        const auditors = await userRoleManager.getUsersByRole('auditor');
        const owners = await userRoleManager.getUsersByRole('owner');
        console.log(`Auditors: ${auditors.length}, Owners: ${owners.length}\n`);

        // Get engagement participants
        console.log('3. Getting engagement participants...');
        const eng001Participants = await userRoleManager.getEngagementParticipants('eng-001');
        console.log(`Engagement eng-001 has ${eng001Participants.length} participants\n`);

        // Check permissions
        console.log('4. Checking permissions...');
        const canCreateEngagement = await userRoleManager.userHasPermission('admin-001', 'create_engagement');
        const canViewReports = await userRoleManager.userHasPermission('executive-001', 'view_reports', 'eng-001');
        console.log(`Admin can create engagement: ${canCreateEngagement}`);
        console.log(`Executive can view reports: ${canViewReports}\n`);

        // Health check
        console.log('5. System health check...');
        const health = await userRoleManager.healthCheck();
        console.log(`System status: ${health.status}`);
        console.log(`Users: ${health.userCount}, Active: ${health.activeUsers}\n`);

        console.log('=== Demonstration Complete ===\n');
    } catch (error) {
        console.error('Demonstration failed:', error);
    }
}

module.exports = {
    sampleUsers,
    sampleEngagementParticipants,
    createSampleUsers,
    setupEngagementParticipants,
    setupSampleData,
    demonstrateSystem
};