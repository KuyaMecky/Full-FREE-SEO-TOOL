# Five-Feature Implementation Roadmap

## Status Summary

| Feature | Status | API | Page | Utility | Est. Time |
|---------|--------|-----|------|---------|-----------|
| **1. Rank Tracking** | ✅ API Done | ✅ | ⏳ 30min | ✅ | 1-2 hrs |
| **2. Content Gap** | 📋 Planned | ⏳ 1hr | ⏳ 1hr | ⏳ 30min | 2.5 hrs |
| **3. Backlink Trends** | 📋 Planned | ⏳ 1.5hr | ⏳ 1.5hr | ⏳ 30min | 3.5 hrs |
| **4. Link Quality** | 📋 Planned | ⏳ 1hr | ⏳ 1hr | ⏳ 30min | 2.5 hrs |
| **5. Keyword Difficulty** | 📋 Planned | ⏳ 30min | ⏳ 30min | ✅ (exists) | 1 hr |
| **TOTAL** | | | | | **~11 hours** |

## Feature 1: Rank Tracking ✅ (API + Utility Done)

### What's Done
- ✅ `/api/rank-tracking/keywords` — Add/remove/list tracked keywords
- ✅ `/api/rank-tracking/poll` — Fetch from GSC and save RankSnapshot
- ✅ `src/lib/rank-tracking/analyzer.ts` — Trend calculation, opportunity scoring

### What's Left
- ⏳ Frontend page (`/rank-tracker`) — keyword table, trend charts
- ⏳ Integrate into sidebar navigation
- ⏳ Optional: Weekly email digest of position changes

### How It Works
```
User adds keyword "best seo tools"
↓
POST /api/rank-tracking/keywords
↓
stored in RankKeyword model
↓
User clicks "Update Rankings Now"
↓
POST /api/rank-tracking/poll fetches from GSC
↓
saves snapshots in RankSnapshot (date, position, clicks, impressions, ctr)
↓
Frontend shows chart of position over time with ↑↓ trend indicators
```

---

## Feature 2: Content Gap Analysis

### What's Needed
1. **API** (`/api/content-gap/analyze`)
   - Input: propertyId
   - Fetch: user's GSC keywords (from latest snapshot)
   - Fetch: competitor keywords (from CompetitorData model)
   - Compare: find keywords competitors rank for that user doesn't
   - Output: gap list with opportunity score

2. **Page** (`/content-gap`)
   - Dropdown to select competitor
   - List of gaps sorted by score
   - Each gap shows: keyword, competitor's position, search volume estimate
   - Button to "Research this keyword" or "Create content"

3. **Utility** (`src/lib/content-gap/analyzer.ts`)
   - Gap detection algorithm
   - Opportunity scoring (volume × difficulty × competitor position)
   - Keyword clustering (group related gaps)

### Implementation Path
```
1. Ensure CompetitorData model populated (keyword field)
2. Build /api/content-gap/analyze endpoint
3. Create /content-gap page with competitor selector
4. Add to sidebar under "Research" section
```

---

## Feature 3: Backlink Trends Tracker

### What's Needed
1. **API** (`/api/backlink-trends/upload`)
   - Accept CSV file upload
   - Parse columns: URL, referring_url, anchor_text, date
   - Store in new BacklinkSnapshot model (or reuse existing)
   - Compare with previous upload to detect gained/lost

2. **API** (`/api/backlink-trends/history`)
   - Get all backlink snapshots for a property
   - Calculate: added, removed, maintained backlinks
   - Time-series data for trend graphs

3. **Page** (`/backlink-trends`)
   - CSV upload dialog
   - Timeline of backlink counts
   - Top sources by DR and link count
   - Gained/lost backlinks table

4. **Utility** (`src/lib/backlink-trends/analyzer.ts`)
   - CSV parsing (handle different formats)
   - Backlink comparison (which URLs are new, gone, changed)
   - Quality scoring (by domain, anchor text)

### Schema Needed
```prisma
model BacklinkSnapshot {
  id        String   @id @default(cuid())
  propertyId String
  url       String
  referringUrl String
  anchorText String?
  domainRating Int?
  date      DateTime @default(now())
  uploadedAt DateTime
  
  @@unique([propertyId, url, referringUrl, uploadedAt])
}
```

---

## Feature 4: Link Quality Scoring with Ahrefs

### What's Needed
1. **API** (`/api/link-quality/analyze`)
   - Call getAhrefsBacklinks() (already exists!)
   - Score each link: toxicity, DR, anchor text, link type
   - Flag risky/toxic links
   - Recommend cleanup

2. **Page** (`/link-quality`)
   - List of backlinks from Ahrefs with quality scores
   - Filter by: toxic, low-DR, spam indicators
   - "Cleanup guide" showing which links to request removal
   - Export list for outreach

3. **Utility** (`src/lib/link-quality/scorer.ts`)
   - Toxicity scoring algorithm
   - Anchor text quality check (keyword stuffing?)
   - Link type classification (dofollow vs nofollow value)

### Implementation Path
```
1. Use existing getAhrefsBacklinks() from ahrefs/client.ts
2. Add scoring algorithm
3. Create simple page showing high-risk links
4. Add to sidebar under "Research" → "Link Quality"
```

---

## Feature 5: Keyword Difficulty (Ahrefs)

### What's Needed
1. **API** (`/api/keywords/ahrefs-difficulty`)
   - Call Ahrefs keywords API for each keyword
   - Fetch: difficulty, search volume, CPC, trends
   - Cache results (difficulty changes monthly)

2. **Page** (Update existing `/keywords` page)
   - Add "Difficulty" column if Ahrefs connected
   - Add "Opportunity Score" (volume ÷ difficulty)
   - Filter by: difficulty range, volume range
   - Color code: green (easy), yellow (medium), red (hard)

3. **Utility** (analyzer already exists in keywords section)
   - Just integrate Ahrefs data into existing KeywordData model

### Schema Update Needed
```prisma
// Already exists, add to KeywordData:
difficulty Float?        // 0-100 Ahrefs difficulty
searchVolume Int?        // Monthly search volume
cpc Float?              // Cost per click
trends String @default("[]")  // Monthly trend data
```

---

## Build Order Recommendation

### Fastest Path (3-4 hours)
1. **Finish Rank Tracking** (30min) — just add frontend page
2. **Add Keyword Difficulty** (1 hour) — easiest, highest ROI
3. **Content Gap** (2 hours) — uses existing data, high value
4. **Link Quality** (1.5 hours) — leverages existing Ahrefs client

**Backlink Trends last** — requires CSV handling, lower priority

### High-Value Quick Wins
1. **Rank Tracking** — immediate insight into ranking performance
2. **Keyword Difficulty** — helps prioritize which keywords to target
3. **Content Gap** — shows exactly what to write about next

---

## Parallel Work Possible

These can be built simultaneously:
- Rank Tracking frontend + Keyword Difficulty API (independent)
- Content Gap + Link Quality (both use existing APIs)
- Backlink Trends (totally independent)

---

## User Preference Questions

Before I continue, which approach do you prefer?

**Option A: Complete All 5** (11 hours work)
- Comprehensive feature set
- Everything wired end-to-end
- Takes longer but maximum value

**Option B: Focus on Top 3** (4-5 hours)
1. ✅ Rank Tracking (finish it)
2. 🔧 Keyword Difficulty (Ahrefs integration)
3. 🔧 Content Gap Analysis (find writing opportunities)

**Option C: Depends on API**
- Rank Tracking + Content Gap + Keyword Difficulty (if Ahrefs key exists)
- Link Quality + Backlink Trends (optional add-ons)

**Option D: Just Finish Rank Tracking**
- Get one feature fully working
- Demo it, then decide on others

Which would you prefer?
