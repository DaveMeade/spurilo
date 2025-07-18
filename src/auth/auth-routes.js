import express from 'express';
import passport from 'passport';

const router = express.Router();

// Middleware to check if user is authenticated
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  }
);

// Microsoft OAuth routes
router.get('/microsoft',
  passport.authenticate('microsoft', { scope: ['user.read'] })
);

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  }
);

// LinkedIn OAuth routes
router.get('/linkedin',
  passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] })
);

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  }
);

// Okta OAuth routes (using generic OAuth2)
router.get('/okta', (req, res) => {
  // Redirect to Okta OAuth endpoint
  const oktaDomain = process.env.OKTA_DOMAIN;
  const clientId = process.env.OKTA_CLIENT_ID;
  const redirectUri = `${process.env.BASE_URL}/auth/okta/callback`;
  
  const authUrl = `https://${oktaDomain}/oauth2/default/v1/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `scope=openid profile email&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${Date.now()}`;
  
  res.redirect(authUrl);
});

router.get('/okta/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect('/auth/failure');
    }

    // Exchange code for token
    const tokenResponse = await fetch(`https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.OKTA_CLIENT_ID,
        client_secret: process.env.OKTA_CLIENT_SECRET,
        code: code,
        redirect_uri: `${process.env.BASE_URL}/auth/okta/callback`
      })
    });

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      return res.redirect('/auth/failure');
    }

    // Get user info
    const userResponse = await fetch(`https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    const userInfo = await userResponse.json();
    
    // Create or update user
    const user = await handleOktaLogin(userInfo);
    
    // Log user in
    req.login(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return res.redirect('/auth/failure');
      }
      res.redirect('/dashboard');
    });

  } catch (error) {
    console.error('Okta callback error:', error);
    res.redirect('/auth/failure');
  }
});

// Handle Okta user login
async function handleOktaLogin(userInfo) {
  const { userRoleHelpers } = await import('../UserRole/UserRoleHelpers.js');
  
  const email = userInfo.email;
  const firstName = userInfo.given_name || '';
  const lastName = userInfo.family_name || '';
  const organization = extractDomainFromEmail(email);

  // Check if user exists
  let user = await userRoleHelpers.getUserByEmail(email);

  if (user) {
    // Update last login
    await userRoleHelpers.updateUser(user.userId, {
      lastLogin: new Date(),
      'oauthProviders.okta': {
        id: userInfo.sub,
        lastUsed: new Date()
      }
    });
    return user;
  } else {
    // Check if this is the first user in the system
    const existingUsers = await userRoleHelpers.getUsersByRole('admin');
    const isFirstUser = existingUsers.length === 0;
    
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
        okta: {
          id: userInfo.sub,
          lastUsed: new Date()
        }
      },
      lastLogin: new Date()
    };

    const user = await userRoleHelpers.createUser(userData);
    
    // Save organization if provided
    if (organization && organization !== 'Unknown Organization') {
      await saveOrganization(organization, user.userId);
    }
    
    return user;
  }
}

// Save organization to database
async function saveOrganization(organizationName, createdBy) {
  try {
    const { userRoleHelpers } = await import('../UserRole/UserRoleHelpers.js');
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

function extractDomainFromEmail(email) {
  if (!email) return 'Unknown Organization';
  const domain = email.split('@')[1];
  if (!domain) return 'Unknown Organization';
  const orgName = domain.split('.')[0];
  return orgName.charAt(0).toUpperCase() + orgName.slice(1);
}

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Authentication failure route
router.get('/failure', (req, res) => {
  res.redirect('/?error=auth_failed');
});

export default router;