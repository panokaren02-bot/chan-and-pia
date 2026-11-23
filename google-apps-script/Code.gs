/**
 * Wedding invitation backend — content, photos and RSVPs.
 *
 * SETUP (once per client):
 * 1. Create a Google Sheet → Extensions → Apps Script → replace Code.gs with this file → Save.
 * 2. In the editor, choose the function `setup` and click Run. Approve the permissions.
 *    It creates the sheets, a "Wedding Photos" Drive folder, and an admin secret.
 *    Open View → Logs (or the Execution log) and copy the ADMIN SECRET it prints.
 * 3. Deploy → New deployment → type "Web app" → Execute as: Me, Who has access: Anyone → Deploy.
 *    Copy the Web app URL.
 * 4. In the website's environment variables set:
 *      APPS_SCRIPT_URL    = the Web app URL
 *      APPS_SCRIPT_SECRET = the admin secret from step 2
 *      DASHBOARD_PASSWORD = the password you'll type on /dashboard
 *
 * After editing this file later: Deploy → Manage deployments → edit → Version: New version → Deploy
 * (the URL stays the same).
 */

var CONTENT_SHEET = 'Content';
var HISTORY_SHEET = 'History';
var RSVP_SHEET = 'RSVP';
var CHUNK = 40000;        // a cell holds max 50,000 characters
var HISTORY_KEEP = 30;    // previous versions kept for recovery

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [CONTENT_SHEET, HISTORY_SHEET, RSVP_SHEET].forEach(function (n) { if (!ss.getSheetByName(n)) ss.insertSheet(n); });
  var rsvp = ss.getSheetByName(RSVP_SHEET);
  if (rsvp.getLastRow() === 0) rsvp.appendRow(['Submitted At', 'Name', 'Attending', 'Guests', 'Message', 'Personal Link']);
  var hist = ss.getSheetByName(HISTORY_SHEET);
  if (hist.getLastRow() === 0) hist.appendRow(['Saved At', 'Content JSON (first ' + CHUNK + ' chars)']);

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PHOTO_FOLDER_ID')) {
    var folder = DriveApp.createFolder('Wedding Photos — ' + ss.getName());
    props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  }
  if (!props.getProperty('ADMIN_SECRET')) {
    props.setProperty('ADMIN_SECRET', Utilities.getUuid() + Utilities.getUuid().replace(/-/g, ''));
  }
  Logger.log('ADMIN SECRET (put this in APPS_SCRIPT_SECRET): ' + props.getProperty('ADMIN_SECRET'));
  Logger.log('Photo folder: https://drive.google.com/drive/folders/' + props.getProperty('PHOTO_FOLDER_ID'));
}

/* ───────── HTTP ───────── */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'content';
  if (action === 'content') return json({ ok: true, content: readContent() });
  return json({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'Invalid JSON' }); }

  if (d.action === 'rsvp') return json(saveRsvp(d));            // public
  if (!checkSecret(d.secret)) return json({ ok: false, error: 'Unauthorized' });

  switch (d.action) {
    case 'saveContent': return json(writeContent(d.content));
    case 'upload':      return json(upload(d));
    case 'rsvps':       return json({ ok: true, rows: readRsvps() });
    default:            return json({ ok: false, error: 'Unknown action' });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function checkSecret(s) {
  var real = PropertiesService.getScriptProperties().getProperty('ADMIN_SECRET');
  return Boolean(real) && typeof s === 'string' && s === real;
}

/* ───────── content ───────── */

function readContent() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);
  if (!sh || sh.getLastRow() === 0) return null;
  var text = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(function (r) { return r[0]; }).join('');
  if (!text) return null;
  try { return JSON.parse(text); } catch (err) { return null; }
}

function writeContent(content) {
  if (!content || typeof content !== 'object') return { ok: false, error: 'Invalid content' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(CONTENT_SHEET) || ss.insertSheet(CONTENT_SHEET);
    var text = JSON.stringify(content);
    var rows = [];
    for (var i = 0; i < text.length; i += CHUNK) rows.push([text.slice(i, i + CHUNK)]);
    sh.clearContents();
    sh.getRange(1, 1, rows.length, 1).setNumberFormat('@').setValues(rows);

    var hist = ss.getSheetByName(HISTORY_SHEET) || ss.insertSheet(HISTORY_SHEET);
    hist.appendRow([new Date(), text.slice(0, CHUNK)]);
    var extra = hist.getLastRow() - 1 - HISTORY_KEEP;
    if (extra > 0) hist.deleteRows(2, extra);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ───────── photos ───────── */

function upload(d) {
  var allowed = ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a'];
  if (allowed.indexOf(d.mimeType) === -1) return { ok: false, error: 'File type not allowed' };
  var folderId = PropertiesService.getScriptProperties().getProperty('PHOTO_FOLDER_ID');
  if (!folderId) return { ok: false, error: 'Run setup() first' };
  var blob = Utilities.newBlob(Utilities.base64Decode(d.data), d.mimeType, String(d.name || 'upload'));
  var file = DriveApp.getFolderById(folderId).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // the website loads it by link
  return { ok: true, id: file.getId() };
}

/* ───────── RSVP ───────── */

function saveRsvp(d) {
  var name = String(d.name || '').slice(0, 120);
  if (!name || (d.attending !== 'yes' && d.attending !== 'no')) return { ok: false, error: 'Invalid RSVP' };
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RSVP_SHEET);
  if (!sh) { setup(); sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RSVP_SHEET); }
  // prefix with ' so names starting with = + - @ are never treated as formulas
  var safe = function (v) { v = String(v == null ? '' : v); return /^[=+\-@]/.test(v) ? "'" + v : v; };
  sh.appendRow([d.submittedAt || new Date().toISOString(), safe(name), d.attending, Number(d.guests) || 0, safe(String(d.message || '').slice(0, 1000)), safe(d.guestLink)]);
  return { ok: true };
}

function readRsvps() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RSVP_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues().map(function (r) {
    return { submittedAt: String(r[0]), name: String(r[1]), attending: String(r[2]), guests: Number(r[3]) || 0, message: String(r[4]), guestLink: String(r[5]) };
  });
}
