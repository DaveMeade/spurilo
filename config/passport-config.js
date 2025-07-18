import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { userRoleHelpers } from '../src/UserRole/UserRoleHelpers.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize passport configuration
export function configurePassport() {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.userId);
  });

  // Deserialize user from session
  passport.deserializeUser(async (userId, done) => {
    try {
      const user = await userRoleHelpers.getUser(userId);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await handleOAuthLogin(profile, 'google');
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Microsoft OAuth Strategy
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(new MicrosoftStrategy({
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/microsoft/callback`,
      scope: ['user.read']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await handleOAuthLogin(profile, 'microsoft');
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // LinkedIn OAuth Strategy
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    passport.use(new LinkedInStrategy({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/linkedin/callback`,
      scope: ['r_emailaddress', 'r_liteprofile']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await handleOAuthLogin(profile, 'linkedin');
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }
}

// Handle OAuth login for all providers
async function handleOAuthLogin(profile, provider) {
  try {
    // Extract user information from profile
    const email = getEmailFromProfile(profile, provider);
    const { firstName, lastName } = getNameFromProfile(profile, provider);
    const organization = getOrganizationFromProfile(profile, provider);

    if (!email) {
      throw new Error('No email address provided by OAuth provider');
    }

    // Check if user already exists
    let user = await userRoleHelpers.getUserByEmail(email);

    if (user) {
      // Update last login and OAuth provider info
      await userRoleHelpers.updateUser(user.userId, {
        lastLogin: new Date(),
        [`oauthProviders.${provider}`]: {
          id: profile.id,
          lastUsed: new Date()
        }
      });
      return user;
    } else {
      // Check if this is the first user in the system
      const existingUsers = await userRoleHelpers.getUsersByRole('admin');
      const isFirstUser = existingUsers.length === 0;
      
      console.log('OAuth user creation debug:', {
        email: email,
        existingAdminCount: existingUsers.length,
        isFirstUser: isFirstUser,
        existingAdmins: existingUsers.map(u => u.email)
      });
      
      // Create new user
      const userData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        organization: organization,
        // Legacy roles - keeping for compatibility during migration
        roles: isFirstUser ? ['admin'] : [],
        // New role structure
        system_roles: isFirstUser ? ['admin'] : [],
        organization_roles: [], // No default organization roles
        status: 'active',
        oauthProviders: {
          [provider]: {
            id: profile.id,
            lastUsed: new Date()
          }
        },
        lastLogin: new Date()
      };

      console.log('Creating user with data:', {
        email: userData.email,
        roles: userData.roles,
        isFirstUser: isFirstUser
      });

      user = await userRoleHelpers.createUser(userData);
      
      // Save organization if provided
      if (organization) {
        await saveOrganization(organization, user.userId);
      }

      return user;
    }
  } catch (error) {
    console.error('OAuth login error:', error);
    throw error;
  }
}

// Extract email from different OAuth provider profiles
function getEmailFromProfile(profile, provider) {
  switch (provider) {
    case 'google':
      return profile.emails?.[0]?.value;
    case 'microsoft':
      return profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
    case 'linkedin':
      return profile.emails?.[0]?.value;
    default:
      return profile.emails?.[0]?.value;
  }
}

// Extract name from different OAuth provider profiles
function getNameFromProfile(profile, provider) {
  let firstName = '';
  let lastName = '';

  switch (provider) {
    case 'google':
      firstName = profile.name?.givenName || '';
      lastName = profile.name?.familyName || '';
      break;
    case 'microsoft':
      firstName = profile._json?.givenName || profile.name?.givenName || '';
      lastName = profile._json?.surname || profile.name?.familyName || '';
      break;
    case 'linkedin':
      firstName = profile.name?.givenName || '';
      lastName = profile.name?.familyName || '';
      break;
    default:
      firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
      lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
  }

  return { firstName, lastName };
}

// Extract organization from OAuth provider profiles
function getOrganizationFromProfile(profile, provider) {
  switch (provider) {
    case 'microsoft':
      return profile._json?.companyName || extractDomainFromEmail(getEmailFromProfile(profile, provider));
    case 'linkedin':
      return profile._json?.headline || extractDomainFromEmail(getEmailFromProfile(profile, provider));
    default:
      return extractDomainFromEmail(getEmailFromProfile(profile, provider));
  }
}

// Extract organization from email domain
function extractDomainFromEmail(email) {
  if (!email) return 'Unknown Organization';
  
  const domain = email.split('@')[1];
  if (!domain) return 'Unknown Organization';
  
  // Convert domain to organization name
  const orgName = domain.split('.')[0];
  return orgName.charAt(0).toUpperCase() + orgName.slice(1);
}

// Save organization to database
async function saveOrganization(organizationName, createdBy) {
  try {
    const email = typeof createdBy === 'string' ? createdBy : createdBy.email || createdBy.userId;
    const domain = extractDomainFromEmail(email);
    const organizationData = {
      name: organizationName,
      domain: domain,
      createdBy: email,
      settings: {
        allowSelfRegistration: false,
        defaultUserRole: 'sme',
        requireApproval: true
      }
    };
    
    const organization = await userRoleHelpers.saveOrganization(organizationData);
    console.log(`Saved organization: ${organizationName} created by ${email}`);
    return organization;
  } catch (error) {
    console.error('Failed to save organization:', error);
  }
}

export default passport;