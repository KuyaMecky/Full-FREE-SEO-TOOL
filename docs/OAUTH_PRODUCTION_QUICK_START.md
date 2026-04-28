# OAuth Production Setup - Quick Start

Your app is deployed at: **https://full-free-seo-tool.vercel.app**

Add GitHub and Gmail OAuth in 10 minutes.

## GitHub OAuth Setup

### Step 1: Create OAuth App on GitHub
1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: SEO Audit Pro
   - **Homepage URL**: `https://full-free-seo-tool.vercel.app`
   - **Authorization callback URL**: `https://full-free-seo-tool.vercel.app/api/auth/github`
4. Click **Register application**

### Step 2: Get Credentials
1. Copy your **Client ID**
2. Click **Generate a new client secret** and copy it

### Step 3: Add to Vercel
1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings
2. Go to **Environment Variables**
3. Add three variables:
   - `GITHUB_CLIENT_ID` = (paste Client ID)
   - `GITHUB_CLIENT_SECRET` = (paste Client Secret)
   - `GITHUB_REDIRECT_URI` = `https://full-free-seo-tool.vercel.app/api/auth/github`
4. Click **Save** and **Redeploy**

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**

### Step 2: Set Up OAuth Consent Screen
1. Click **Create Credentials** → **OAuth client ID**
2. If prompted, set up consent screen:
   - User Type: **External**
   - App name: **SEO Audit Pro**
   - User support email: (your email)
   - Developer contact: (your email)
   - Scopes: Add `openid`, `email`, `profile`
   - Click **Save**

### Step 3: Create OAuth Credentials
1. Back to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Under "Authorized redirect URIs" add:
   - `https://full-free-seo-tool.vercel.app/api/auth/google`
4. Click **Create**
5. Copy **Client ID** and **Client Secret**

### Step 4: Add to Vercel
1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings
2. Go to **Environment Variables**
3. Add three variables:
   - `GOOGLE_CLIENT_ID` = (paste Client ID)
   - `GOOGLE_CLIENT_SECRET` = (paste Client Secret)
   - `GOOGLE_REDIRECT_URI` = `https://full-free-seo-tool.vercel.app/api/auth/google`
4. Click **Save** and **Redeploy**

---

## Test It

After redeployment (2-3 minutes):

1. Visit https://full-free-seo-tool.vercel.app/login
2. Click "Sign in with GitHub" or "Sign in with Google"
3. You should see OAuth provider's auth screen
4. After approval, you're logged in

---

## Done!

Your app now has OAuth. Users can sign in with GitHub or Gmail without remembering passwords.

Need more details? See `OAUTH_SETUP.md` for complete documentation.
