#!/usr/bin/env node

/**
 * Muslim Atlas — Automated Waitlist Release Email Dispatcher
 *
 * Usage:
 *   node scripts/notify-waitlist-release.js --test
 *   node scripts/notify-waitlist-release.js --test-to user@example.com
 *   node scripts/notify-waitlist-release.js --send-all
 *   node scripts/notify-waitlist-release.js --dry-run
 */

const fs = require('fs');
const path = require('path');

// 1. Resolve RESEND_API_KEY from environment or website .env.local
let apiKey = process.env.RESEND_API_KEY;
let defaultTo = process.env.WAITLIST_EMAIL_TO || 'yusuf@yqwebstudio.com';

const websiteEnvPath = path.resolve(__dirname, '../../muslim-atlas-website/.env.local');
if (fs.existsSync(websiteEnvPath)) {
  const envContent = fs.readFileSync(websiteEnvPath, 'utf8');
  const keyMatch = envContent.match(/RESEND_API_KEY=(.+)/);
  if (keyMatch) apiKey = apiKey || keyMatch[1].trim();

  const toMatch = envContent.match(/WAITLIST_EMAIL_TO=(.+)/);
  if (toMatch) defaultTo = toMatch[1].trim();
}

if (!apiKey) {
  console.error('❌ Error: RESEND_API_KEY not found in process.env or ../muslim-atlas-website/.env.local');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isSendAll = args.includes('--send-all');
const testToIndex = args.indexOf('--test-to');
const testRecipient = testToIndex !== -1 ? args[testToIndex + 1] : (args.includes('--test') ? defaultTo : null);

const versionIndex = args.indexOf('--version');
const releaseVersion = versionIndex !== -1 ? args[versionIndex + 1] : '1.1.0';

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '164f141d-a403-4ab5-ab92-1f32e58d7777';
const FROM_EMAIL = 'Muslim Atlas <noreply@notifications.yqwebstudio.com>';
const GITHUB_DOWNLOAD_URL = `https://github.com/Muslim-Atlas/app/releases/download/v${releaseVersion}/MuslimAtlas-v${releaseVersion}.apk`;
const GITHUB_RELEASE_URL = `https://github.com/Muslim-Atlas/app/releases/tag/v${releaseVersion}`;

function generateEmailHtml(version, recipientEmail = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Muslim Atlas v${version} Released</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1329; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b1329; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 40px 32px 24px 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <div style="display: inline-block; padding: 8px 16px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; margin-bottom: 16px;">
                <span style="color: #10b981; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">🕌 New Release Available</span>
              </div>
              <h1 style="color: #ffffff; font-size: 32px; font-weight: 800; margin: 0 0 12px 0; letter-spacing: -0.5px;">
                Muslim Atlas v${version}
              </h1>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 auto; max-width: 480px;">
                A major update introducing prayer time notifications, a complete app redesign with dark mode, and distance unit preferences.
              </p>
            </td>
          </tr>

          <!-- Primary CTA Button -->
          <tr>
            <td align="center" style="padding: 28px 32px 16px 32px;">
              <a href="${GITHUB_DOWNLOAD_URL}" 
                 style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; padding: 16px 36px; border-radius: 14px; box-shadow: 0 8px 20px rgba(5, 150, 105, 0.4);">
                Download Android APK (v${version})
              </a>
              <div style="margin-top: 12px;">
                <a href="${GITHUB_RELEASE_URL}" style="color: #38bdf8; font-size: 13px; text-decoration: underline;">
                  View Full Release Notes on GitHub →
                </a>
              </div>
            </td>
          </tr>

          <!-- Changelog Highlights -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0 0 16px 0; border-left: 4px solid #10b981; padding-left: 12px;">
                What's New in v${version}
              </h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <!-- Item 1 -->
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <strong style="color: #10b981; font-size: 15px;">🔔 Prayer Time Notifications</strong>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 4px 0 0 0;">
                      Muslim Atlas can now notify you when it's time to pray! Enable notifications for any of the 5 daily prayers, plus optional advance reminders so you always have time to prepare.
                    </p>
                  </td>
                </tr>
                <!-- Item 2 -->
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <strong style="color: #38bdf8; font-size: 15px;">🎨 Complete App Redesign &amp; Dark Mode</strong>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 4px 0 0 0;">
                      The entire app has been redesigned from the ground up — home screen, map, mosque details, and directions — with a clean modern interface and full dark mode support.
                    </p>
                  </td>
                </tr>
                <!-- Item 3 -->
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <strong style="color: #f59e0b; font-size: 15px;">📏 Distance Units (Miles &amp; Kilometers)</strong>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 4px 0 0 0;">
                      Choose between <strong>Miles</strong> and <strong>Kilometers</strong> in Settings. All distances across the app — mosques, public transit stations, and walking routes — now consistently follow your preference.
                    </p>
                  </td>
                </tr>
                <!-- Item 4 -->
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <strong style="color: #a855f7; font-size: 15px;">⚙️ Customizable Prayer Calculations</strong>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 4px 0 0 0;">
                      Select your preferred prayer calculation method (such as London Unified or Muslim World League) and adjust Asr timing directly in Settings.
                    </p>
                  </td>
                </tr>
                <!-- Item 5 -->
                <tr>
                  <td style="padding: 12px 0;">
                    <strong style="color: #06b6d4; font-size: 15px;">📲 In-App Update Alerts</strong>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 4px 0 0 0;">
                      Get notified inside the app whenever a new version is released so you can easily see what is new and update.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Step-by-Step Android Installation Guide -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="background-color: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">
                  📲 How to Install or Update on Android:
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.8;">
                  <li><strong style="color: #f8fafc;">Download</strong>: Tap the green button above to download the APK.</li>
                  <li><strong style="color: #f8fafc;">Open</strong>: Tap the download notification on your device, or find <code style="color: #38bdf8;">MuslimAtlas-v${version}.apk</code> in your Downloads folder.</li>
                  <li><strong style="color: #f8fafc;">Permission</strong>: If Android asks for permission, tap <em>Settings</em> and toggle <em>Allow from this source</em>.</li>
                  <li><strong style="color: #f8fafc;">Install</strong>: Tap <em>Install</em> (or <em>Update</em>). All your saved masjids and timetable settings remain intact!</li>
                </ol>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #090e1a; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
              <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 8px 0;">
                You received this email because you subscribed to the Muslim Atlas waitlist.<br />
                JazakAllah khair for supporting the development of Muslim Atlas.<br />
                &copy; 2026 Muslim Atlas. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px;">
                <a href="https://muslimatlas.app/unsubscribe?email=${encodeURIComponent(recipientEmail || '')}" style="color: #94a3b8; text-decoration: underline;">
                  Unsubscribe from waitlist
                </a>
                <span style="color: #475569; margin: 0 6px;">&bull;</span>
                <a href="mailto:hello@muslimatlas.app?subject=Unsubscribe%20Waitlist&body=Please%20unsubscribe%20my%20email%20from%20the%20Muslim%20Atlas%20waitlist." style="color: #94a3b8; text-decoration: underline;">
                  Email Unsubscribe
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendEmailViaResend(to, subject, html, recipientEmail = to) {
  const unsubUrl = `https://muslimatlas.app/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>, <mailto:hello@muslimatlas.app?subject=Unsubscribe%20Waitlist>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Resend API error: ${response.status}`);
  }
  return data;
}

async function fetchAudienceContacts() {
  const response = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    console.warn('⚠️ Could not query Resend audience contacts:', data.message);
    return [];
  }
  return data?.data?.map((c) => c.email).filter(Boolean) || [];
}

async function main() {
  console.log('=====================================================');
  console.log(`🕌 Muslim Atlas v${releaseVersion} Release Announcement Dispatcher`);
  console.log('=====================================================');

  const subject = `🕌 Muslim Atlas v${releaseVersion} is Live — What's New & Download`;

  if (isDryRun) {
    const previewHtml = generateEmailHtml(releaseVersion, 'user@example.com');
    const previewFile = path.resolve(__dirname, `release-v${releaseVersion}-email-preview.html`);
    fs.writeFileSync(previewFile, previewHtml, 'utf8');
    console.log(`✅ Dry run complete. Email HTML saved to:\n   ${previewFile}`);
    return;
  }

  if (testRecipient) {
    console.log(`📨 Sending test release email to: ${testRecipient}...`);
    try {
      const emailHtml = generateEmailHtml(releaseVersion, testRecipient);
      const res = await sendEmailViaResend(testRecipient, `[TEST] ${subject}`, emailHtml, testRecipient);
      console.log(`✅ Test email successfully sent! Resend ID: ${res.id}`);
      console.log(`   Check ${testRecipient} to review the design, copy, and unsubscribe link.`);
    } catch (err) {
      console.error(`❌ Failed to send test email: ${err.message}`);
    }
    return;
  }

  if (isSendAll) {
    console.log(`📡 Fetching waitlist contacts from Resend Audience (${AUDIENCE_ID})...`);
    const contacts = await fetchAudienceContacts();

    // Load unsubscribed emails from website storage if exists
    let unsubscribedEmails = new Set();
    const unsubFile = path.resolve(__dirname, '../../muslim-atlas-website/data/unsubscribed.json');
    if (fs.existsSync(unsubFile)) {
      try {
        const unsubs = JSON.parse(fs.readFileSync(unsubFile, 'utf8'));
        unsubs.forEach((entry) => {
          const email = typeof entry === 'string' ? entry : entry.email;
          if (email) unsubscribedEmails.add(email.toLowerCase().trim());
        });
        console.log(`Loaded ${unsubscribedEmails.size} unsubscribed contact(s) to suppress.`);
      } catch (e) {
        console.warn('Could not read unsubscribed.json:', e.message);
      }
    }

    // Include owner, filter out unsubs
    const allRecipients = Array.from(new Set([defaultTo, ...contacts]))
      .filter((email) => !unsubscribedEmails.has(email.toLowerCase().trim()));
    console.log(`Found ${allRecipients.length} eligible recipient(s) to notify.`);

    for (const email of allRecipients) {
      process.stdout.write(`Sending to ${email}... `);
      try {
        const emailHtml = generateEmailHtml(releaseVersion, email);
        const res = await sendEmailViaResend(email, subject, emailHtml, email);
        console.log(`✅ Sent (${res.id})`);
      } catch (e) {
        console.log(`❌ Error: ${e.message}`);
      }
      // Delay 150ms between emails to respect rate limits
      await new Promise((r) => setTimeout(r, 150));
    }

    console.log('🎉 Waitlist announcement broadcast complete!');
    return;
  }

  console.log(`
Please specify an action:
  --test                    Send test email to ${defaultTo}
  --test-to <email>         Send test email to specified address
  --dry-run                 Write preview HTML file without sending
  --send-all                Broadcast release announcement to all waitlist contacts
  `);
}

main().catch(console.error);
