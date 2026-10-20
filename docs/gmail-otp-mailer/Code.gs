/**
 * SafeShare OTP mailer.
 *
 * A tiny web app that sends an e-mail from the Gmail account that owns this script.
 * SafeShare's backend calls it over HTTPS, so it works on hosts that block SMTP.
 * Setup: see README.md in this folder.
 *
 * Request (POST, JSON): { "secret": "...", "to": "user@example.com", "subject": "...", "text": "..." }
 * Reply (JSON):         { "ok": true }  or  { "ok": false, "error": "..." }
 */

// Messages above these sizes are refused, so the script cannot be abused to send long spam
var MAX_SUBJECT = 200;
var MAX_TEXT = 2000;

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Only the SafeShare backend knows this secret (Project Settings > Script properties > MAIL_SECRET)
    var secret = PropertiesService.getScriptProperties().getProperty("MAIL_SECRET");
    if (!secret || !data.secret || !sameText(String(data.secret), secret)) {
      return reply({ ok: false, error: "forbidden" });
    }

    var to = String(data.to || "");
    if (!/^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/.test(to)) {
      return reply({ ok: false, error: "bad address" });
    }

    var subject = String(data.subject || "").slice(0, MAX_SUBJECT);
    var text = String(data.text || "").slice(0, MAX_TEXT);
    if (!subject || !text) {
      return reply({ ok: false, error: "empty message" });
    }

    MailApp.sendEmail({ to: to, subject: subject, body: text, name: "SafeShare" });
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: "failed" });
  }
}

// Open this URL in a browser to check that the deployment is alive (it sends nothing)
function doGet() {
  return reply({ ok: true, service: "safeshare-otp-mailer", mailLeftToday: MailApp.getRemainingDailyQuota() });
}

// Compares in constant time, so the secret cannot be guessed from response timing
function sameText(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
