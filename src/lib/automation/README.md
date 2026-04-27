# Automated SEO Content Generation

A fully automated system for generating, writing, and publishing SEO-optimized content.

## How It Works

### Automation Pipeline

The automation system follows a 4-step pipeline:

1. **Generate Ideas** - Analyze GSC data to find content opportunities
   - Quick wins from queries ranking positions 4-20
   - Topic expansions for existing content
   - New pillar topics to own

2. **Create Drafts** - Auto-create content drafts from generated ideas
   - Converts ideas into draft records
   - Prepares metadata and structure

3. **Write Content** - Generate full SEO-optimized articles
   - AI-powered article generation
   - Internal linking suggestions
   - Schema markup included
   - Meta titles and descriptions

4. **Schedule Publishing** - Auto-schedule publishing to WordPress
   - Configurable publish delay (default: 7 days)
   - Requires WordPress connection
   - Optional: auto-publish on schedule

### Database Models

#### ContentAutomation
Tracks configuration and status for each property
- `enabled`: Master on/off switch
- `autoGenerateIdeas`: Enable idea generation
- `autoDraftIdeas`: Enable draft creation
- `autoWriteContent`: Enable content writing
- `autoSchedulePublish`: Enable scheduled publishing
- `maxDraftsPerRun`: Limit items per automation run
- `scheduleAfterDays`: Days to delay publishing
- Schedule: `scheduledDayOfWeek` + `scheduledHourUtc` (UTC timezone)

#### GeneratedContentIdea
Tracks individual ideas through the pipeline
- `status`: pending → draft_created → written → scheduled → published
- Links to ContentDraft once created
- Tracks all metadata from AI generation

#### AutomationLog
Records each automation run
- Timestamps and duration
- Items processed and failures
- Error details for debugging

## API Endpoints

### GET /api/automation/config?propertyId=...
Get automation configuration for a property

### POST /api/automation/config
Create or update automation configuration
```json
{
  "propertyId": "...",
  "enabled": true,
  "autoGenerateIdeas": true,
  "autoDraftIdeas": true,
  "autoWriteContent": true,
  "autoSchedulePublish": false,
  "maxDraftsPerRun": 5,
  "businessType": "SaaS",
  "seedTopics": ["topic1", "topic2"],
  "scheduleAfterDays": 7,
  "wpConnectionId": "..."
}
```

### POST /api/automation/run
Manually trigger an automation run
```json
{
  "automationId": "..."
}
```

### GET /api/automation/status?automationId=...
Get automation status and statistics

### GET /api/cron/automation-scheduled
Cron job for scheduled automation runs (requires CRON_SECRET)

## Usage

### Via UI

1. Navigate to **Content Planner** → **Automation** tab
2. Select your website
3. Configure automation settings:
   - Enable the features you want
   - Set max items per run
   - Add seed topics (optional)
   - Connect WordPress account for publishing
4. Click **Save Configuration**
5. Click **Run Now** to trigger immediately
6. Monitor status and recent runs

### Via API

```bash
# Create automation config
curl -X POST http://localhost:3000/api/automation/config \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "prop123",
    "enabled": true,
    "autoGenerateIdeas": true,
    "maxDraftsPerRun": 5
  }'

# Trigger a run
curl -X POST http://localhost:3000/api/automation/run \
  -H "Content-Type: application/json" \
  -d '{"automationId": "auto123"}'

# Check status
curl http://localhost:3000/api/automation/status?automationId=auto123
```

### Via Cron

Set up a scheduled task to call `/api/cron/automation-scheduled`:

```bash
# Every day at 2 AM UTC
0 2 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/automation-scheduled
```

Or with Vercel:
```json
{
  "crons": [{
    "path": "/api/cron/automation-scheduled",
    "schedule": "0 2 * * *"
  }]
}
```

## Configuration

### Environment Variables

- `CRON_SECRET`: Secret for cron endpoint authorization
- AI Configuration (from Global Settings):
  - `AI_PROVIDER`: anthropic, openai, gemini
  - `AI_API_KEY`: Your API key
  - `AI_MODEL`: Model to use

### AI Token Limits

All AI calls are capped at 2000 tokens (per feedback_ai_token_limits.md):
- Idea generation: 1400 tokens
- Article writing: 1400 tokens

Adjust in `src/lib/ai/content.ts` and `src/lib/ai/write.ts` if needed.

## Monitoring

### Logs

Each run creates an AutomationLog entry with:
- Items processed
- Items failed
- Error details (JSON)
- Duration in milliseconds

Query recent logs:
```typescript
const logs = await prisma.automationLog.findMany({
  where: { automationId: "..." },
  orderBy: { createdAt: "desc" },
  take: 20,
});
```

### Statistics

Track content generation progress:
```typescript
const stats = await prisma.generatedContentIdea.groupBy({
  by: ["status"],
  where: { automationId: "..." },
  _count: true,
});
```

## Troubleshooting

### Automation not running on schedule
- Check `scheduledDayOfWeek` and `scheduledHourUtc` are set correctly
- Verify CRON_SECRET is configured
- Check cron job is actually being called
- Review AutomationLog for run attempts

### Ideas not generating
- Ensure GSC data is available (recent snapshot)
- Check business type and seed topics are relevant
- Review AI provider configuration
- Check error details in AutomationLog

### Content writing failing
- Verify AI API key and model are configured
- Check token limits haven't been exceeded
- Review error details in AutomationLog
- Ensure outline is properly formatted

### Publishing not working
- Verify WordPress connection is valid
- Check `autoSchedulePublish` is enabled
- Ensure `wpConnectionId` is set
- Check WordPress user permissions
