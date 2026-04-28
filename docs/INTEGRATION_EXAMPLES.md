# Integration Examples

Real-world examples of integrating SEO Audit Pro API into your applications.

---

## Table of Contents

1. [Slack Bot](#slack-bot)
2. [WordPress Plugin](#wordpress-plugin)
3. [Discord Bot](#discord-bot)
4. [Google Sheets](#google-sheets)
5. [Zapier/Automations](#zapierautomations)

---

## Slack Bot

Audit websites and get results in Slack.

### Setup

1. Create Slack app at https://api.slack.com/apps
2. Add permissions: `chat:write`, `commands`, `app_mentions:read`
3. Create slash command `/audit`

### Code

```javascript
// /commands/audit.js
const express = require('express');
const fetch = require('node-fetch');
const { WebClient } = require('@slack/web-api');

const router = express.Router();
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const API_KEY = process.env.SEO_AUDIT_API_KEY;
const API_URL = 'https://full-free-seo-tool.vercel.app/api/public';

router.post('/audit', async (req, res) => {
  const { text: domain, channel_id, user_id } = req.body;

  if (!domain) {
    return res.json({
      text: 'Usage: `/audit example.com`'
    });
  }

  // Acknowledge immediately
  res.json({ response_type: 'in_channel' });

  try {
    // Create audit
    const createRes = await fetch(`${API_URL}/audits/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ domain, maxPages: 50 })
    });

    if (!createRes.ok) {
      throw new Error('Failed to create audit');
    }

    const { auditId } = await createRes.json();

    // Post initial message
    const messageRes = await slack.chat.postMessage({
      channel: channel_id,
      text: `Auditing ${domain}...`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔍 *Auditing:* ${domain}\n⏳ Status: Starting...`
          }
        }
      ]
    });

    const messageTs = messageRes.ts;

    // Poll for results
    let completed = false;
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes

    while (!completed && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000)); // 2 second poll
      attempts++;

      const resultsRes = await fetch(`${API_URL}/audits/${auditId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      if (resultsRes.ok) {
        const audit = await resultsRes.json();

        if (audit.status === 'complete') {
          // Update message with results
          await slack.chat.update({
            channel: channel_id,
            ts: messageTs,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `✅ *SEO Audit Complete: ${domain}*\n\n` +
                    `🎯 *Score:* ${audit.overallScore}/100\n` +
                    `📄 *Pages:* ${audit.pagesAnalyzed}\n` +
                    `⏱️ *Time:* ${new Date(audit.completedAt).toLocaleTimeString()}`
                }
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Top Issues:*\n${audit.crawlResults
                    .filter(r => r.issues.length > 0)
                    .slice(0, 5)
                    .map(r => `• ${r.url}: ${r.issues[0]}`)
                    .join('\n') || 'No issues found'}`
                }
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: 'View Full Report' },
                    url: `https://full-free-seo-tool.vercel.app/audit/${auditId}`,
                    action_id: 'view_report'
                  }
                ]
              }
            ]
          });

          completed = true;
        }
      }
    }

    if (!completed) {
      await slack.chat.postMessage({
        channel: channel_id,
        text: 'Audit timed out. Check the dashboard for results.'
      });
    }
  } catch (error) {
    console.error('Audit error:', error);
    await slack.chat.postMessage({
      channel: channel_id,
      text: `❌ Audit failed: ${error.message}`
    });
  }
});

module.exports = router;
```

### Usage in Slack

```
/audit example.com
```

---

## WordPress Plugin

Display SEO audit scores on posts.

### Plugin File Structure

```
seo-audit-widget/
├── seo-audit-widget.php
├── includes/
│   ├── class-api-client.php
│   ├── class-settings.php
│   └── class-widget.php
└── assets/
    ├── css/
    └── js/
```

### Main Plugin File

```php
<?php
/**
 * Plugin Name: SEO Audit Widget
 * Description: Display SEO audit scores on posts
 * Version: 1.0.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SEO_AUDIT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SEO_AUDIT_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once SEO_AUDIT_PLUGIN_DIR . 'includes/class-api-client.php';
require_once SEO_AUDIT_PLUGIN_DIR . 'includes/class-settings.php';
require_once SEO_AUDIT_PLUGIN_DIR . 'includes/class-widget.php';

// Initialize
add_action('init', function() {
    $settings = new SEO_Audit_Settings();
    $settings->init();
});

// Admin menu
add_action('admin_menu', function() {
    add_options_page(
        'SEO Audit Settings',
        'SEO Audit',
        'manage_options',
        'seo-audit-settings',
        function() {
            include SEO_AUDIT_PLUGIN_DIR . 'admin-page.php';
        }
    );
});

// Register widget
add_action('widgets_init', function() {
    register_widget('SEO_Audit_Widget');
});

// Activation hook
register_activation_hook(__FILE__, function() {
    // Create table for storing audit history
    global $wpdb;
    $table = $wpdb->prefix . 'seo_audits';
    
    $wpdb->query("CREATE TABLE IF NOT EXISTS $table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        audit_id VARCHAR(255),
        score INT,
        pages_analyzed INT,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY(post_id)
    )");
});
?>
```

### API Client Class

```php
<?php
class SEO_Audit_API_Client {
    private $api_key;
    private $api_url = 'https://full-free-seo-tool.vercel.app/api/public';

    public function __construct($api_key) {
        $this->api_key = $api_key;
    }

    public function create_audit($domain, $max_pages = 50) {
        $response = wp_remote_post($this->api_url . '/audits/create', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'domain' => $domain,
                'maxPages' => $max_pages
            ])
        ]);

        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        return json_decode(wp_remote_retrieve_body($response), true);
    }

    public function get_audit($audit_id) {
        $response = wp_remote_get(
            $this->api_url . '/audits/' . $audit_id,
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->api_key,
                ]
            ]
        );

        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        return json_decode(wp_remote_retrieve_body($response), true);
    }

    public function wait_for_completion($audit_id, $timeout = 300) {
        $start = time();

        while (time() - $start < $timeout) {
            $audit = $this->get_audit($audit_id);

            if ($audit['status'] === 'complete') {
                return $audit;
            }

            if ($audit['status'] === 'error') {
                throw new Exception('Audit failed');
            }

            sleep(2);
        }

        throw new Exception('Audit timeout');
    }
}
?>
```

### Widget Class

```php
<?php
class SEO_Audit_Widget extends WP_Widget {
    public function __construct() {
        parent::__construct(
            'seo_audit_widget',
            'SEO Audit Score',
            ['description' => 'Display SEO audit score for current post']
        );
    }

    public function widget($args, $instance) {
        global $post, $wpdb;
        
        if (!is_single()) return;

        $api_key = get_option('seo_audit_api_key');
        if (!$api_key) return;

        $table = $wpdb->prefix . 'seo_audits';
        $audit = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE post_id = %d",
            $post->ID
        ));

        echo $args['before_widget'];
        echo '<div class="seo-audit-widget">';

        if ($audit && $audit->score) {
            $color = $audit->score >= 80 ? 'green' : ($audit->score >= 60 ? 'orange' : 'red');
            echo '<div class="seo-score" style="color: ' . $color . '">';
            echo '<strong>SEO Score:</strong> ' . $audit->score . '/100<br>';
            echo '<small>Last audited: ' . $audit->completed_at . '</small>';
            echo '</div>';
        } else {
            echo '<button class="seo-audit-btn">Run SEO Audit</button>';
        }

        echo '</div>';
        echo $args['after_widget'];
    }
}
?>
```

---

## Discord Bot

Real-time audit notifications in Discord.

```javascript
// discord-bot.js
const { Client, Intents } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES] });
const API_KEY = process.env.SEO_AUDIT_API_KEY;
const API_URL = 'https://full-free-seo-tool.vercel.app/api/public';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!audit ')) {
    const domain = message.content.slice(7).trim();

    if (!domain) {
      return message.reply('Usage: `!audit example.com`');
    }

    try {
      // Create audit
      const createRes = await fetch(`${API_URL}/audits/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain, maxPages: 50 })
      });

      const { auditId } = await createRes.json();
      await message.reply(`Auditing ${domain}... (ID: ${auditId})`);

      // Poll for results
      let completed = false;
      for (let i = 0; i < 150; i++) {
        await new Promise(r => setTimeout(r, 2000));

        const resultsRes = await fetch(`${API_URL}/audits/${auditId}`, {
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        const audit = await resultsRes.json();

        if (audit.status === 'complete') {
          const embed = {
            title: `✅ SEO Audit: ${domain}`,
            fields: [
              { name: 'Score', value: `${audit.overallScore}/100`, inline: true },
              { name: 'Pages', value: String(audit.pagesAnalyzed), inline: true },
              {
                name: 'Issues',
                value: audit.crawlResults
                  .filter(r => r.issues.length > 0)
                  .slice(0, 3)
                  .map(r => `${r.url}: ${r.issues[0]}`)
                  .join('\n') || 'None'
              }
            ],
            color: audit.overallScore >= 80 ? 0x00ff00 : 0xffaa00
          };

          await message.reply({ embeds: [embed] });
          completed = true;
          break;
        }
      }
    } catch (error) {
      message.reply(`Error: ${error.message}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
```

---

## Google Sheets

Log audit results to Google Sheets.

```javascript
// sheets-logger.js
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const fetch = require('node-fetch');

async function logAuditToSheets(domain) {
  const API_KEY = process.env.SEO_AUDIT_API_KEY;
  const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

  // Create audit
  const createRes = await fetch('https://full-free-seo-tool.vercel.app/api/public/audits/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ domain })
  });

  const { auditId } = await createRes.json();

  // Wait for completion
  let audit;
  let completed = false;
  for (let i = 0; i < 150; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const resultsRes = await fetch(`https://full-free-seo-tool.vercel.app/api/public/audits/${auditId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    audit = await resultsRes.json();

    if (audit.status === 'complete') {
      completed = true;
      break;
    }
  }

  if (!completed) throw new Error('Audit timeout');

  // Log to Google Sheets
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_KEY_FILE
  });

  const spreadsheet = await sheets.spreadsheets.get({
    auth,
    spreadsheetId: SHEETS_ID
  });

  await sheets.spreadsheets.values.append({
    auth,
    spreadsheetId: SHEETS_ID,
    range: 'Audits!A:F',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[
        new Date().toLocaleDateString(),
        domain,
        audit.overallScore,
        audit.pagesAnalyzed,
        audit.crawlResults.filter(r => r.issues.length > 0).length,
        new Date(audit.completedAt).toLocaleTimeString()
      ]]
    }
  });

  return audit;
}

// Usage
logAuditToSheets('example.com');
```

---

## Zapier/Automations

Trigger actions based on audit results.

### Zap Setup

1. Create Zap in Zapier
2. Trigger: Webhook (custom)
3. Action: Send Slack message, create Sheet row, etc.

### Webhook Setup

```bash
# 1. Get webhook URL from Zapier
# 2. Create trigger in SEO Audit Pro

POST /api/webhooks
Authorization: Bearer YOUR_API_KEY

{
  "url": "https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID",
  "event": "audit.completed",
  "secret": "optional_hmac_secret"
}
```

### Example Actions

**Send Slack Alert**
```
If audit score < 70, post to #alerts
```

**Create Google Sheet Row**
```
On audit.completed, append:
- Domain
- Score
- Pages Analyzed
- Date
```

**Send Email Report**
```
On audit.completed, send email with:
- Attached PDF report
- Summary of issues
- Recommendations
```

---

## Best Practices

1. **Error Handling** - Always wrap API calls in try-catch
2. **Rate Limiting** - Respect rate limits and implement backoff
3. **Polling** - Use exponential backoff for status checks
4. **Caching** - Cache results for 24 hours to reduce API calls
5. **Webhooks** - Use webhooks instead of polling when available
6. **Validation** - Validate domains before creating audits
7. **User Feedback** - Show progress to users during audits

---

## Support

- **Issues**: https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/issues
- **Discussions**: https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/discussions
- **Email**: support@example.com
