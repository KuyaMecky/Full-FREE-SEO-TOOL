# Conditional Provider Architecture - Setup Complete

## What Was Done

### 1. **Database Schema Updated** ✅
- Extended `UserSettings` model to include:
  - `ahrefsApiKey: String?` 
  - `pagespeedApiKey: String?`
- Schema synced: `npx prisma db push`
- Prisma client regenerated

### 2. **Provider Availability System** ✅
Created three core pieces:

**A. Availability Utility** (`src/lib/providers/availability.ts`)
```typescript
getAvailableProviders(userId) → { google, ahrefs, pagespeed }
hasAnyProvider(providers) → boolean
hasAllProviders(providers) → boolean
getProviderStatus(providers) → string
```

**B. API Endpoint** (`/api/providers/status`)
- GET: Returns current provider status for logged-in user
- Returns: `{ google: true/false, ahrefs: true/false, pagespeed: true/false }`

**C. Frontend Hook** (`src/lib/hooks/useProviders.ts`)
```typescript
const { providers, loading, error, refetch } = useProviders();

// Check if features are available
if (providers?.ahrefs) { /* Show Ahrefs features */ }
if (providers?.google) { /* Show Google features */ }
```

### 3. **Settings Integration** ✅
Created: `src/app/api/settings/integrations/route.ts`
- GET: Fetch current integrations (masks API keys as `***`)
- POST: Save provider API keys
  - Only sends keys that user updates (partial updates)
  - Sanitizes response (never returns actual keys)

### 4. **Audit Page Updated** ✅
Updated: `src/app/audit-google/page.tsx`
- ✅ Integrated `useProviders` hook
- ✅ Provider selector shows only **configured** providers
- ✅ Warning message if no providers configured
- ✅ "Configure Provider First" message on disabled button
- ✅ Auto-selects default provider based on availability

## How To Use

### For Users: Adding Ahrefs API Key

1. Go to `/settings/integrations`
2. Paste Ahrefs API key
3. App automatically detects it via `/api/providers/status`
4. Audit page shows "Ahrefs API ✓" option

### For Developers: Adding Features Behind Providers

**Example: Ahrefs-only feature**
```typescript
'use client';
import { useProviders } from '@/lib/hooks/useProviders';

export function AhrefsRankTracker() {
  const { providers } = useProviders();
  
  if (!providers?.ahrefs) {
    return <p>Connect Ahrefs to use rank tracking</p>;
  }
  
  return <RankTrackerUI />;
}
```

**Example: Multi-provider feature**
```typescript
if (providers?.google && providers?.ahrefs) {
  return <EnhancedContentGapAnalyzer />;
} else if (providers?.google) {
  return <BasicContentGapAnalyzer />;
}
```

## Next Steps (To Complete Setup)

### 1. **Create Settings UI** (not done yet)
- File: `src/app/settings/integrations/page.tsx`
- Should show:
  - Google: "Connected as [email]" or "Connect" button
  - Ahrefs: Text input for API key (paste)
  - PageSpeed: Text input for API key (paste)
  - Test buttons for each

### 2. **Ahrefs Audit Endpoint** (not done yet)
- File: `src/app/api/audit-ahrefs/route.ts`
- Should accept POST with propertyId
- Call Ahrefs API with stored key
- Save audit results to DB

### 3. **Fix Pre-Existing Issue**
- File: `src/app/components/use-ahrefs-data.ts`
- Contains JSX but named `.ts` (should be `.tsx`)
- Not urgent - doesn't affect new code

## Testing

### Test 1: No Providers Configured
- Result: Audit page shows "Configure provider" warning
- Run button: disabled with "Configure Provider First"

### Test 2: Google Only
- Add Google OAuth
- Audit page shows only "Google APIs ✓" option
- Ahrefs option hidden
- Run button: enabled

### Test 3: Both Providers
- Add Google OAuth + Ahrefs API key
- Audit page shows both options
- Can toggle between them
- Run button: enabled

## Files Created

```
src/lib/providers/
  ├─ availability.ts              (utility functions)
  └─ PROVIDER_ARCHITECTURE.md     (reference guide)

src/lib/hooks/
  └─ useProviders.ts              (React hook)

src/app/api/
  ├─ providers/status/route.ts    (provider status endpoint)
  └─ settings/integrations/route.ts (save/fetch API keys)

src/app/audit-google/
  └─ page.tsx                     (updated with conditional UI)
```

## Files Modified

```
prisma/schema.prisma              (added ahrefsApiKey, pagespeedApiKey)
```

## Current Status

✅ Architecture is fully wired
✅ Conditional rendering ready to use
⏳ Waiting for: Settings UI + Ahrefs audit endpoint
