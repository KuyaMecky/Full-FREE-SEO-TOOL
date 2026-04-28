# OAuth Setup Guide

Complete guide to set up GitHub and Gmail OAuth authentication for SEO Audit Pro.

## Overview

The app now supports authentication via:
- **GitHub** - Sign in with your GitHub account
- **Gmail/Google** - Sign in with your Google account
- **Email/Password** - Traditional email-based signup (still available)

Users who sign up with OAuth can later connect their Google Search Console account and use all features.

## GitHub OAuth Setup

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App** (or **OAuth Apps** → **New OAuth App**)
3. Fill in the following information:

   | Field | Value |
   |-------|-------|
   | Application name | SEO Audit Pro |
   | Homepage URL | `https://full-free-seo-tool.vercel.app` (production) or `http://localhost:3000` (local) |
   | Authorization callback URL | `https://full-free-seo-tool.vercel.app/api/auth/github` (production) or `http://localhost:3000/api/auth/github` (local) |

4. Click **Register application**

### 2. Get Credentials

1. You'll see your **Client ID** on the app page
2. Click **Generate a new client secret**
3. Copy both values

### 3. Add to Environment

#### Local Development (.env.local)

```
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github
```

#### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   - `GITHUB_CLIENT_ID` = your Client ID
   - `GITHUB_CLIENT_SECRET` = your Client Secret
   - `GITHUB_REDIRECT_URI` = `https://full-free-seo-tool.vercel.app/api/auth/github`

4. Redeploy after adding variables

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services** → **Credentials**

### 2. Create OAuth 2.0 Credentials

1. Click **Create Credentials** → **OAuth client ID**
2. If prompted, set up the OAuth consent screen first:
   - Choose **External** user type
   - Fill in app name, user support email, and developer contact
   - Add scopes: `openid`, `email`, `profile`
   - Add test users if you want (optional)

3. Return to **Create OAuth client ID**
4. Select **Web application** as the application type
5. Add Authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/google`
   - Production: `https://full-free-seo-tool.vercel.app/api/auth/google`

6. Click **Create**

### 3. Get Credentials

You'll see a popup with:
- **Client ID**
- **Client Secret**

Copy both values.

### 4. Add to Environment

#### Local Development (.env.local)

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google
```

#### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   - `GOOGLE_CLIENT_ID` = your Client ID
   - `GOOGLE_CLIENT_SECRET` = your Client Secret
   - `GOOGLE_REDIRECT_URI` = `https://full-free-seo-tool.vercel.app/api/auth/google`

4. Redeploy after adding variables

## Testing Locally

1. Update `.env.local` with your OAuth credentials
2. Run `npm run dev`
3. Visit `http://localhost:3000/login`
4. Click "Sign in with GitHub" or "Sign in with Google"
5. You should be redirected to the provider and back to the app after auth

## How It Works

### OAuth Flow

1. User clicks "Sign in with GitHub" or "Sign in with Google"
2. Redirected to provider's auth page
3. User approves app permissions
4. Provider redirects back to app with auth code
5. App exchanges code for access token (server-side)
6. App retrieves user email and profile info
7. User is created or logged in
8. JWT token set in secure cookie
9. User redirected to dashboard

### Database

- Users created via OAuth have:
  - `oauthProvider`: 'github' or 'google'
  - `oauthId`: Provider's user ID
  - `password`: null (no password set)
  - `email`: From provider
  - `name`: From provider (if available)

- Email remains unique identifier
- Users can later add password or connect other services

## Deployment Checklist

- [ ] GitHub OAuth App created with correct redirect URI
- [ ] Google OAuth credentials created with correct redirect URI
- [ ] Environment variables added to Vercel
- [ ] App redeployed after adding variables
- [ ] Tested "Sign in with GitHub" on production
- [ ] Tested "Sign in with Google" on production
- [ ] New user signup works
- [ ] Existing user login still works
- [ ] Users can connect integrations (GSC, etc.)

## Troubleshooting

### "Invalid redirect_uri"

- Check redirect URI matches exactly in provider settings
- No trailing slashes
- Match HTTP/HTTPS
- Common mistake: `localhost:3000` vs `127.0.0.1:3000`

### "OAuth code expired"

- User took too long to approve
- Have them try again

### "User already exists with email"

- Email from provider already registered with password
- User should sign in with password or use "forgot password"
- Both auth methods work with same email

### Missing email from provider

- GitHub: Email not public or no verified email
- Google: Usually has email
- App creates fallback: `{github_username}@github.local`

### Vercel: Environment variables not working

- Redeploy after adding variables (deployment captures env)
- Check variable name exactly matches code
- Ensure no extra spaces or special characters

## Next Steps

1. Set up GitHub OAuth (5 minutes)
2. Set up Google OAuth (5 minutes)
3. Deploy to production
4. Test both authentication methods
5. Monitor for any errors in logs

## Additional Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

Last Updated: April 28, 2026
