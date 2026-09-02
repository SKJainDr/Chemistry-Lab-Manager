/**
 * Chemistry Laboratory Manager — Google Sheet sync backend
 * ------------------------------------------------------
 * Paste this whole file into the Apps Script editor attached to your Google
 * Sheet (Extensions → Apps Script), then deploy it as a Web App. Full,
 * step-by-step instructions are in README.md → "Sync data through Google
 * Drive". You do not need to change anything in this file except SHARED_TOKEN
 * below (recommended, not required).
 *
 * What it does:
 *   - Stores two JSON blobs in this spreadsheet: one for app data (students,
 *     experiments, attendance, marks) and one for accounts (admin + teacher
 *     logins). Each lives in its own sheet tab, in cell A1.
 *   - Exposes them over HTTP so the web app (index.html) can load and save
 *     them, from any device, without any of it touching your GitHub repo.
 *
 * Security note: anyone who has both your deployed Web App URL AND the
 * SHARED_TOKEN below can read/write this data. Treat the URL + token like a
 * password — don't post them publicly. This is a lightweight safeguard, not
 * bank-grade security; it's appropriate for a small trusted lab team.
 */

// Change this to your own random string before deploying, then use the
// exact same string as SHEET_SYNC_CONFIG.token in index.html.
var SHARED_TOKEN = "ChemistryLabManager@Github-26-27";

var SHEET_NAMES = {
  data: "app_data",
  auth: "app_auth",
};

function doGet(e) {
  // Visiting the deployed URL directly in a browser lands here — useful to
  // confirm the deployment is live.
  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok", message: "Chemistry Lab Manager sync endpoint is running." })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var body = {};
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonOut({ error: "Invalid request body." });
    }

    if (body.token !== SHARED_TOKEN) {
      return jsonOut({ error: "Unauthorized — token did not match." });
    }

    var type = body.type;
    if (type !== "data" && type !== "auth") {
      return jsonOut({ error: "Unknown type: " + type });
    }

    var sheet = getOrCreateSheet(type);

    if (body.action === "load") {
      var value = sheet.getRange("A1").getValue();
      return jsonOut({ value: value ? String(value) : null });
    }

    if (body.action === "save") {
      if (typeof body.payload !== "string") {
        return jsonOut({ error: "Missing payload." });
      }
      sheet.getRange("A1").setValue(body.payload);
      sheet.getRange("A2").setValue("Last updated: " + new Date().toISOString());
      return jsonOut({ ok: true });
    }

    return jsonOut({ error: "Unknown action: " + body.action });
  } catch (err) {
    return jsonOut({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(type) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = SHEET_NAMES[type];
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange("A1").setValue("");
    sheet.getRange("B1").setValue("← JSON data lives in cell A1. Don't edit this by hand while the app is running — the app will overwrite it.");
  }
  return sheet;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
