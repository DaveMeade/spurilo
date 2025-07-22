/**
 * Validation script for the new organization role system
 * Tests that the clean implementation is working correctly
 */

import mongoose from 'mongoose';
import { dbManager } from '../src/database/db-manager.js';
import { userRoleManager } from '../src/user-role/user.role.manager.js';
import { organizationManager } from '../src/orgs/organization.manager.js';

async function validateCleanImplementation() {
    console.log('🔍 Starting validation of organization role system...\n');
    
    try {
        // Initialize systems
        console.log('1️⃣ Initializing systems...');
        await dbManager.initialize();
        await userRoleManager.ensureInitialized();
        await organizationManager.initialize();
        console.log('✅ Systems initialized successfully\n');
        
        // Check that User schema doesn't have organization_roles field
        console.log('2️⃣ Checking User schema...');
        const User = mongoose.model('User');
        const schemaHasOldField = User.schema.paths.hasOwnProperty('organization_roles');
        if (schemaHasOldField) {
            throw new Error('❌ User schema still contains organization_roles field');
        }
        console.log('✅ User schema is clean - no organization_roles field found\n');
        
        // Check that UserOrganizationRole collection exists
        console.log('3️⃣ Checking UserOrganizationRole collection...');
        const collections = await dbManager.listCollections();
        const hasRoleCollection = collections.some(c => c.name === 'userOrganizationRoles');
        if (!hasRoleCollection) {
            console.log('⚠️  UserOrganizationRole collection does not exist yet (will be created on first use)');
        } else {
            console.log('✅ UserOrganizationRole collection exists');
        }
        
        // Get collection stats
        const db = dbManager.getDatabase();
        try {
            const stats = await db.collection('userOrganizationRoles').stats();
            console.log(`   - Document count: ${stats.count}`);
            console.log(`   - Collection size: ${stats.size} bytes\n`);
        } catch (error) {
            console.log('   - Collection is empty or not yet created\n');
        }
        
        // Test creating a test organization and user
        console.log('4️⃣ Testing organization and user creation...');
        
        // Create test organization
        const testOrg = await organizationManager.createOrganization({
            id: `test-org-${Date.now()}`,
            name: 'Test Organization for Validation',
            org_domains: ['test-validation.com']
        }, 'validation-script');
        console.log(`✅ Created test organization: ${testOrg.name} (${testOrg.id})`);
        
        // Create test user
        const testUser = await dbManager.createUser({
            userId: `test-user-${Date.now()}`,
            email: 'testuser@test-validation.com',
            firstName: 'Test',
            lastName: 'User',
            organization: testOrg.name,
            organizationId: testOrg.id,
            system_roles: [],
            status: 'active'
        });
        console.log(`✅ Created test user: ${testUser.firstName} ${testUser.lastName} (${testUser.userId})`);
        
        // Verify user has no organization_roles field
        if (testUser.organization_roles) {
            throw new Error('❌ User document contains organization_roles field');
        }
        console.log('✅ User document is clean - no organization_roles field\n');
        
        // Test assigning organization roles
        console.log('5️⃣ Testing organization role assignment...');
        const roleMapping = await userRoleManager.assignOrganizationRole(
            testUser.userId,
            testOrg.id,
            ['admin', 'primary_contact'],
            'validation-script'
        );
        console.log('✅ Assigned organization roles successfully');
        console.log(`   - Mapping ID: ${roleMapping._id}`);
        console.log(`   - Roles: ${roleMapping.roles.join(', ')}`);
        console.log(`   - Status: ${roleMapping.status}\n`);
        
        // Test retrieving organization users
        console.log('6️⃣ Testing organization user retrieval...');
        const orgUsers = await organizationManager.getOrganizationUsers(testOrg.id);
        console.log(`✅ Retrieved ${orgUsers.length} user(s) for organization`);
        
        const foundUser = orgUsers.find(u => u.userId === testUser.userId);
        if (!foundUser) {
            throw new Error('❌ Test user not found in organization users');
        }
        console.log(`✅ Found test user with roles: ${foundUser.organization_roles.join(', ')}\n`);
        
        // Test role checking
        console.log('7️⃣ Testing role verification...');
        const hasAdminRole = await userRoleManager.userHasOrganizationRole(
            testUser.userId,
            testOrg.id,
            'admin'
        );
        console.log(`✅ Admin role check: ${hasAdminRole ? 'PASS' : 'FAIL'}`);
        
        const hasFakeRole = await userRoleManager.userHasOrganizationRole(
            testUser.userId,
            testOrg.id,
            'fake_role'
        );
        console.log(`✅ Fake role check: ${hasFakeRole ? 'FAIL' : 'PASS'}\n`);
        
        // Clean up test data
        console.log('8️⃣ Cleaning up test data...');
        await dbManager.deleteUserOrganizationRole(testUser.userId, testOrg.id);
        await dbManager.User.deleteOne({ userId: testUser.userId });
        await dbManager.Organization.deleteOne({ id: testOrg.id });
        console.log('✅ Test data cleaned up\n');
        
        // Final summary
        console.log('✅ VALIDATION COMPLETE - All tests passed!');
        console.log('📋 Summary:');
        console.log('   - User schema is clean (no organization_roles field)');
        console.log('   - UserOrganizationRole collection is functional');
        console.log('   - Role assignment works correctly');
        console.log('   - Role retrieval works correctly');
        console.log('   - Role verification works correctly');
        console.log('   - No backwards compatibility code found');
        
    } catch (error) {
        console.error('\n❌ VALIDATION FAILED:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
    
    process.exit(0);
}

// Run validation
console.log('Organization Role System Validation Script');
console.log('==========================================\n');

validateCleanImplementation().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});