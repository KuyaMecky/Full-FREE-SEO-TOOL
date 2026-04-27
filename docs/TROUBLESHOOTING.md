# Troubleshooting Guide

Solutions to common issues with SEO Audit Pro.

## Audit Issues

### Audit Is Stuck or Hanging

Symptoms:
- Progress bar not updating
- Same page count for 5+ minutes
- Loading spinner spinning endlessly

Solutions:

1. Wait a bit longer
   - Large sites (150+ pages) take 10-15 minutes
   - Check if domain is slow to respond

2. Check network connection
   - Verify internet is connected
   - Try refreshing the page

3. Try a different domain
   - Some domains block crawlers
   - Try a smaller site (20-30 pages)

4. Reload the page
   - Refresh browser
   - May pick up progress from background crawl

5. Reduce max pages
   - Set to 25-50 instead of 200
   - Restart audit
   - Faster crawl = faster results

If still stuck after 60 seconds:
- The domain may be blocking automated crawling
- Check if robots.txt prevents crawling
- Verify domain is accessible in browser

### Audit Times Out (30+ seconds with no progress)

Symptoms:
- Red timeout message appears
- Progress shows 0 pages crawled
- "Connection lost" warning

Likely causes:
- Domain too slow to respond
- Domain blocking crawler
- Network connectivity issue

Solutions:

1. Check if domain is accessible
   - Visit domain in browser
   - Verify it loads
   - Check for popup blockers or CAPTCHAs

2. Reduce crawl scope
   - Start with 10-20 pages
   - Gradually increase
   - Find crawl sweet spot

3. Try again later
   - Website may be temporarily overloaded
   - Wait 5-10 minutes
   - Retry audit

4. Check domain settings
   - robots.txt may block crawler
   - Firewall may be blocking IP
   - Contact hosting provider if needed

### Audit Completes But No Results Show

Symptoms:
- Progress bar reaches 100%
- Redirects to dashboard
- Dashboard shows "No data"
- Tabs are empty

Solutions:

1. Wait for data processing
   - Data processing takes 10-30 seconds
   - Dashboard may still be loading
   - Refresh page after 1 minute

2. Check if crawl actually completed
   - Go back to audit list
   - Look for that audit
   - Check if status is "complete"

3. Try a smaller audit
   - 10-page audit is faster to process
   - Verify functionality works
   - Then try larger audits

4. Clear browser cache
   - Ctrl+Shift+Del (Windows/Linux)
   - Command+Shift+Del (Mac)
   - Clear all data
   - Reload page

5. Try different browser
   - Issue may be browser-specific
   - Try Firefox, Chrome, Safari, Edge
   - Different browser = different cache

If still no results:
- Contact support with audit ID
- Include error details
- Provide domain name

### Audit Shows Wrong Page Count

Symptoms:
- Says "50 pages crawled" but site has 100
- Says "10 pages" but actually more
- Count stops increasing mid-crawl

Explanations:

1. Max pages setting
   - You set max to 50
   - It crawls 50 even if more exist
   - To crawl more, run new audit with higher max

2. Redirects not counted
   - Pages that redirect don't count
   - Only final destination counts
   - This is correct behavior

3. Robots.txt restrictions
   - robots.txt may block some pages
   - Crawler respects robots.txt
   - This is correct behavior

4. Crawler found no links
   - Pages not linked from homepage
   - Crawler can only find linked pages
   - Check internal linking structure

To crawl all pages:
- Set high max pages (150-200)
- Provide a sitemap URL to crawler
- Ensure all pages are linked internally

---

## Dashboard Issues

### Keyword Research Not Showing Data

Symptoms:
- Keyword tab empty
- No keywords listed
- "No data found" message

Causes and solutions:

1. Crawl didn't complete
   - Go back to audit list
   - Check status shows "complete"
   - If not complete, wait longer

2. GSC not connected
   - Settings don't show GSC connected
   - Keyword data comes from GSC
   - Connect GSC in settings first

3. Domain has no keywords
   - New domains have no GSC data
   - Takes days/weeks to accumulate
   - GSC needs 100+ impressions
   - Try with established domain

4. Wrong domain in GSC
   - Audit domain different from GSC property
   - Add domain to GSC if not present
   - Verify property name matches

To fix:
1. Connect Google Search Console
2. Verify domain in GSC
3. Wait for impressions to accumulate
4. Try again in 2-3 days

### Content Analysis Shows No Pages

Symptoms:
- Content tab empty
- No pages in analysis
- Only shows summary stats

Causes:

1. Crawl incomplete
   - Wait for crawl to finish
   - Check audit status
   - Refresh page

2. No pages crawled
   - Crawl found 0 pages
   - Domain may be inaccessible
   - robots.txt may block all pages

3. Analysis not processed
   - Analysis takes 10-30 seconds
   - Refresh page after waiting
   - Check browser console for errors

Solutions:

1. Wait and refresh
   - Give it 2-3 minutes
   - Refresh page with F5

2. Try different domain
   - Use a known accessible site
   - Example: wikipedia.org (public)
   - Verify feature works

3. Check domain access
   - Can you visit domain in browser?
   - Does domain have pages?
   - Is domain accessible to external crawlers?

### Competitor Analysis Shows No Data

Symptoms:
- Competitor tab empty
- "No competitors added" message
- Comparison cards missing

Solution:

Simple: You didn't add competitors

1. Go back to audit form
2. Create new audit
3. In "Competitors" section, add domains:
   - competitor1.com
   - competitor2.com
   - (one per line)
4. Complete audit
5. Competitor Analysis should show data

Note: Competitor crawling is simulated (mock data) in current version. Real competitor crawling coming soon.

### Rank Tracking Shows No Keywords

Symptoms:
- Rank Tracker tab empty
- No keywords showing
- "No keywords being tracked"

Causes:

1. GSC not connected
   - Rank data from GSC is automatic
   - Manual tracking requires adding keywords
   - Connect GSC in settings

2. No manual keywords added
   - Click "Track New Keyword" button
   - Enter keyword and position
   - Click "Add"

3. Domain has no GSC data
   - Needs 100+ impressions
   - Takes weeks to accumulate
   - Try tracking manually

Solutions:

1. To add manual keywords:
   - Click "Track New Keyword"
   - Enter keyword (example: "seo audit")
   - Enter current position (example: 25)
   - Click "Add"

2. To use GSC data:
   - Connect Google Search Console
   - In settings, authorize GSC
   - Verify domain property exists
   - Refresh dashboard

---

## Account & Login Issues

### Can't Log In

Symptoms:
- Login button does nothing
- Error message on login page
- Page redirects back to login

Solutions:

1. Check email/password
   - Verify spelling
   - Check caps lock is off
   - Try resetting password

2. Clear cookies/cache
   - Ctrl+Shift+Del
   - Clear cookies
   - Clear cache
   - Retry login

3. Try incognito mode
   - Open in private/incognito window
   - No cookies = fresh login
   - If works, issue is browser cache

4. Different browser
   - Try Chrome, Firefox, Safari, Edge
   - Issue may be browser-specific

5. Reset password
   - Click "Forgot Password"
   - Enter email
   - Check email for reset link
   - Set new password
   - Login with new password

### Account Has No Audits

Symptoms:
- Audit list is empty
- "No audits created yet" message

Explanation:
- You haven't created any audits yet
- All audits are associated with your account
- Only you can see your audits

Solution:
- Click "Start New Audit"
- Create first audit
- It will appear in list

### Can't Save Settings

Symptoms:
- Settings don't save
- Changes revert on refresh
- Error message on save

Solutions:

1. Check required fields
   - Some fields are required
   - Fill in all required fields
   - Try saving again

2. Clear browser cache
   - Ctrl+Shift+Del
   - Clear cookies
   - Clear cache
   - Retry

3. Try different browser
   - Browser-specific issue
   - Try different browser
   - Check if issue persists

4. Check internet connection
   - Verify connected to internet
   - Network may have dropped
   - Retry with stable connection

---

## Performance Issues

### Page Loads Slowly

Symptoms:
- Dashboard takes 10+ seconds to load
- Components loading slowly
- Buttons laggy

Causes:

1. Network connection
   - Slow internet = slow page load
   - Check your internet speed
   - Try different network

2. Browser performance
   - Browser might be slow
   - Too many tabs open
   - Try closing other tabs

3. Device performance
   - Old device = slower
   - Close background apps
   - Restart browser

Solutions:

1. Wait for page to fully load
   - Initial load takes 3-5 seconds
   - Components load progressively
   - Be patient on first visit

2. Close unnecessary tabs
   - Each tab uses memory
   - Close extra tabs
   - Run dashboard only

3. Use modern browser
   - Chrome/Firefox/Safari/Edge
   - Old browser = slower
   - Update browser if old

4. Check internet
   - Test speed at speedtest.net
   - Should be 5+ Mbps for smooth use
   - If slow, restart router

### Dashboard Charts Not Loading

Symptoms:
- Charts showing loading spinner
- Charts blank after load
- "No data to display"

Solutions:

1. Wait longer
   - Charts take 5-10 seconds
   - Data is being processed
   - Wait for all sections to load

2. Refresh page
   - F5 to refresh
   - Wait for full load
   - Check charts again

3. Check browser console
   - F12 to open developer tools
   - Check "Console" tab
   - Look for red errors
   - Report errors if found

---

## Connection Issues

### Connection Lost Message

Symptoms:
- Yellow warning: "Connection lost"
- "Trying to reconnect" message
- Progress updates stop

Causes:

1. Network disconnected
   - Internet went down
   - WiFi disconnected
   - Network unstable

2. Server issue
   - Rare but possible
   - Server might be down
   - Vercel status page shows this

Solutions:

1. Check internet
   - Is WiFi connected?
   - Does other site load?
   - Restart router if needed

2. Wait for reconnection
   - Component auto-reconnects
   - Usually reconnects in 5 seconds
   - Wait for "Connected" message

3. Refresh page
   - If stuck, refresh with F5
   - Reconnect to server
   - Resume progress

4. Check server status
   - Vercel status: vercel.com/status
   - If red, server has issues
   - Wait for server recovery

### SSE Stream Not Updating

Symptoms:
- Progress bar frozen
- Page count doesn't increase
- Connection shows connected but no updates

Causes:

1. Firewall blocking SSE
   - Firewall may block long connections
   - Enterprise networks sometimes do this
   - Try different network

2. Browser extension blocking
   - Ad blocker might block SSE
   - Disable extensions temporarily
   - Check if works without

3. Server issue
   - Server might not be streaming
   - Usually auto-fixes
   - Refresh if stuck over 2 minutes

Solutions:

1. Try different network
   - Corporate network might block
   - Try home network
   - Try mobile hotspot

2. Disable browser extensions
   - Temporarily disable all
   - Retry audit
   - Re-enable if works

3. Refresh page
   - F5 to refresh
   - Reconnect to stream
   - Should resume progress

---

## API Issues (Developers)

### 401 Unauthorized Error

Cause: User not authenticated

Solution:
- Login first
- Verify JWT token valid
- Check auth cookies set

### 404 Not Found Error

Cause: API endpoint doesn't exist

Solution:
- Check endpoint path
- Verify route file exists
- Check spelling

### 500 Internal Server Error

Cause: Server error processing request

Solution:
- Check server logs
- Verify database connected
- Check for exceptions
- Contact support with error details

---

## General Tips

1. Always wait for full page load
   - Don't click too quickly
   - Let all components render
   - Be patient on first load

2. Try refreshing first
   - F5 refreshes page
   - Fixes 50% of issues
   - Always try refresh first

3. Clear cache if stuck
   - Ctrl+Shift+Del on Windows/Linux
   - Cmd+Shift+Del on Mac
   - Clear all data
   - Reload

4. Try different browser
   - Browser-specific issues exist
   - Try Chrome, Firefox, Safari, Edge
   - See if issue persists

5. Check basics
   - Internet connection stable?
   - Domain accessible in browser?
   - Browser updated?
   - Sufficient disk space?

---

## Getting Help

If issues persist:

1. Check documentation
   - Complete User Guide
   - Quick Start Guide
   - Demo pages for examples

2. Try demo pages
   - Visit /demo/loaders
   - Visit /demo/advanced-loaders
   - See if basic functionality works

3. Report issue
   - Include audit ID
   - Include error message
   - Include steps to reproduce
   - Include browser/OS info

---

Version: 1.0
Last Updated: April 28, 2026
