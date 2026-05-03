# Provider Architecture: Conditional Feature Gates

This document explains how to integrate multiple audit providers (Google APIs, Ahrefs, etc.) with graceful degradation.

## Overview

Features are **gated by provider availability**. If a user connects Ahrefs, Ahrefs-specific features appear. If they disconnect it, those features disappear. No breaking changes.

## How It Works

### 1. **Provider Status** (`/api/providers/status`)
Returns what's currently configured:
```json
{
  "google": true,
  "ahrefs": false,
  "pagespeed": true
}
```

### 2. **Storage** (`UserSettings` model)
Provider API keys are stored in the database:
- `ahrefsApiKey` — Ahrefs API token
- `pagespeedApiKey` — PageSpeed Insights API key
- Google OAuth is stored separately in `GoogleAccount`

### 3. **Frontend Hook** (`useProviders`)
```typescript
const { providers, loading, error } = useProviders();

if (providers?.ahrefs) {
  // Show Ahrefs audit option
}
if (providers?.google) {
  // Show Google audit option
}
```

### 4. **API Endpoints**
- `POST /api/audit-google` — Run Google-powered audit
- `POST /api/audit-ahrefs` — Run Ahrefs-powered audit (future)
- `POST /api/settings/integrations` — Save provider keys

## Adding a New Provider

### Step 1: Add to Prisma Schema
```prisma
model UserSettings {
  id           String  @id @default(cuid())
  userId       String  @unique
  newProviderApiKey String?  // Add this
  // ...
}
```

### Step 2: Add to Availability Check
Update `src/lib/providers/availability.ts`:
```typescript
export type AvailableProviders = {
  google: boolean;
  ahrefs: boolean;
  newProvider: boolean;  // Add this
};

return {
  google: !!googleAccount?.accessToken,
  ahrefs: !!settings?.ahrefsApiKey,
  newProvider: !!settings?.newProviderApiKey,  // Add this
};
```

### Step 3: Use in Frontend
```typescript
const { providers } = useProviders();

if (providers?.newProvider) {
  // Show option to run new provider audit
}
```

### Step 4: Create Audit Endpoint
```typescript
// src/app/api/audit-newprovider/route.ts
export async function POST(request: NextRequest) {
  // Validate API key
  // Run audit using that provider's API
  // Save results to Audit model
}
```

## Feature Examples

### Example 1: Google-Only Features
- Rank tracking (uses GSC Search Analytics)
- Content gap (uses GSC keywords)
- Backlink trends (CSV imports)

These work with just **Google OAuth** connected.

### Example 2: Ahrefs-Only Features
- Live backlinks (Ahrefs API)
- Keyword difficulty (Ahrefs API)
- Domain authority (Ahrefs API)

These require **Ahrefs API key** configured.

### Example 3: Multi-Provider Features
When **both** Google + Ahrefs are available:
- Enhanced content gap (GSC keywords + Ahrefs competitor analysis)
- Link quality scoring (CSV backlinks + Ahrefs link scores)
- Rank comparison (GSC positions + Ahrefs visibility)

## Testing

1. **No providers:** App shows "Configure provider" message
2. **Google only:** Google audit button visible, Ahrefs hidden
3. **Ahrefs only:** Ahrefs audit button visible, Google hidden
4. **Both:** User can switch between audit types

## Migration Path

Current state: Google APIs only
1. ✅ Schema extended (ahrefsApiKey field added)
2. ✅ Availability check wired (/api/providers/status)
3. ✅ Frontend uses useProviders hook
4. ⏳ Ahrefs audit endpoint (POST /api/audit-ahrefs) — create next
5. ⏳ Settings UI to paste Ahrefs key — create next
