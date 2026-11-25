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
var INVITES_SHEET = 'Invites';
var INVITE_HEAD = ['Name', 'Nickname', 'Role', 'Status', 'Responded At'];
var STATUSES = ['Pending', 'Approved', 'Declined'];
var CHUNK = 40000;        // a cell holds max 50,000 characters
var HISTORY_KEEP = 30;    // previous versions kept for recovery

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  invitesSheet(); // creates the Invites tab with its header and Status dropdown
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
  if (action === 'content') return json({ ok: true, content: readContent(), invites: readInvites() });
  if (action === 'invites') return json({ ok: true, invites: readInvites() });
  return json({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'Invalid JSON' }); }

  if (d.action === 'rsvp') return json(saveRsvp(d));            // public
  if (d.action === 'respond') return json(respondInvite(d));    // public: invitee accepts / declines
  if (d.action === 'inviteMessage') return json(inviteMessage(d)); // public: invitee leaves a message for the couple
  if (!checkSecret(d.secret)) return json({ ok: false, error: 'Unauthorized' });

  switch (d.action) {
    case 'saveContent': return json(writeContent(d.content));
    case 'upload':      return json(upload(d));
    case 'rsvps':       return json({ ok: true, rows: readRsvps() });
    case 'saveInvites': return json(writeInvites(d.invites, d.loaded));
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
  rsvpAppend({ submittedAt: d.submittedAt || new Date().toISOString(), name: name, attending: d.attending,
    guests: Number(d.guests) || 0, message: String(d.message || '').slice(0, 1000), link: d.guestLink });
  return { ok: true };
}

/*
 * The RSVP tab is read by its header names, so you can reorder columns, add your own (Table, Notes…)
 * or type replies by hand: "Yes", "Y", "Attending" all count as yes. Blank rows are skipped.
 */
var RSVP_COLS = {
  submittedAt: ['submitted at', 'submitted', 'date', 'timestamp'],
  name: ['name', 'full name', 'guest'],
  attending: ['attending', 'reply', 'response', 'rsvp'],
  guests: ['guests', 'pax', 'seats', 'number of guests'],
  message: ['message', 'wish', 'wishes', 'note'],
  link: ['personal link', 'link', 'invite']
};
var RSVP_TITLES = { submittedAt: 'Submitted At', name: 'Name', attending: 'Attending', guests: 'Guests', message: 'Message', link: 'Personal Link' };

/** The RSVP sheet and the column number of each field (missing columns are added to the header row). */
function rsvpSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(RSVP_SHEET);
  if (!sh) { setup(); sh = ss.getSheetByName(RSVP_SHEET); }
  var width = Math.max(sh.getLastColumn(), 1);
  var head = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var col = {};
  Object.keys(RSVP_COLS).forEach(function (k) {
    for (var i = 0; i < head.length; i++) if (RSVP_COLS[k].indexOf(head[i]) !== -1) { col[k] = i + 1; return; }
  });
  Object.keys(RSVP_COLS).forEach(function (k) {
    if (col[k]) return;
    var at = head.length + 1;
    if (head.length === 1 && !head[0]) at = 1; // brand-new empty sheet
    sh.getRange(1, at).setValue(RSVP_TITLES[k]).setFontWeight('bold');
    head[at - 1] = RSVP_TITLES[k].toLowerCase();
    col[k] = at;
  });
  return { sh: sh, col: col, width: head.length };
}

function rsvpAppend(o) {
  var t = rsvpSheet(), row = [];
  for (var i = 0; i < t.width; i++) row.push('');
  row[t.col.submittedAt - 1] = o.submittedAt || new Date().toISOString();
  row[t.col.name - 1] = safeCell(o.name);
  row[t.col.attending - 1] = o.attending;
  row[t.col.guests - 1] = Number(o.guests) || 0;
  row[t.col.message - 1] = safeCell(o.message || '');
  row[t.col.link - 1] = safeCell(o.link || '');
  t.sh.appendRow(row);
}

function toAttending(v) {
  v = String(v || '').trim().toLowerCase();
  if (/^(y|yes|attending|accept|accepted|joyfully accept|going|coming|true|1)$/.test(v)) return 'yes';
  if (/^(n|no|not attending|decline|declined|regretfully decline|not going|false|0)$/.test(v)) return 'no';
  return v ? v : '';
}

function readRsvps() {
  var t = rsvpSheet(), sh = t.sh, c = t.col;
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, t.width).getValues().map(function (r, i) {
    var guests = Number(r[c.guests - 1]);
    var attending = toAttending(r[c.attending - 1]);
    return {
      row: i + 2,
      submittedAt: asIso(r[c.submittedAt - 1]),
      name: String(r[c.name - 1]).trim(),
      attending: attending,
      guests: attending === 'yes' ? (guests > 0 ? guests : 1) : (guests > 0 ? guests : 0),
      message: String(r[c.message - 1]).trim(),
      guestLink: String(r[c.link - 1]).trim()
    };
  }).filter(function (x) { return x.name || x.message; });
}

/* ───────── personal invites ─────────
 * One row per person in the "Invites" tab. You can add, edit or reorder rows right in the sheet;
 * the website picks them up within about 5 minutes (or right away after a dashboard save).
 * Only people whose Status is "Approved" are shown in the Entourage section of the site.
 */

function invitesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(INVITES_SHEET);
  if (!sh) {
    sh = ss.insertSheet(INVITES_SHEET);
    sh.appendRow(INVITE_HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, INVITE_HEAD.length).setFontWeight('bold');
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build();
    sh.getRange(2, 4, sh.getMaxRows() - 1, 1).setDataValidation(rule);
  }
  return sh;
}

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toStatus(v) {
  v = String(v || '').toLowerCase();
  return v === 'approved' || v === 'declined' ? v : 'pending';
}

function asIso(v) {
  if (v instanceof Date) return v.toISOString();
  return v ? String(v) : '';
}

/** null when the Invites tab doesn't exist yet (the site then falls back to the dashboard's saved list). */
function readInvites() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVITES_SHEET);
  if (!sh) return null;
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, INVITE_HEAD.length).getValues()
    .filter(function (r) { return String(r[0]).trim(); })
    .map(function (r) {
      return { name: String(r[0]).trim(), nickname: String(r[1]).trim(), role: String(r[2]).trim(), status: toStatus(r[3]), respondedAt: asIso(r[4]) };
    });
}

/**
 * Replaces the list from the dashboard, but keeps any reply that arrived after the dashboard loaded,
 * and any row added straight in the sheet after it loaded (`loaded` = the names the dashboard started with).
 */
function writeInvites(list, loaded) {
  if (!Array.isArray(list)) return { ok: false, error: 'Invalid invites' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var current = {};
    (readInvites() || []).forEach(function (i) { current[slugify(i.name)] = i; });
    var safe = function (v) { v = String(v == null ? '' : v).slice(0, 200); return /^[=+\-@]/.test(v) ? "'" + v : v; };
    var keep = list.filter(function (i) { return i && String(i.name || '').trim(); });
    if (Array.isArray(loaded)) {
      var seen = {};
      loaded.concat(keep.map(function (i) { return i.name; })).forEach(function (n) { seen[slugify(n)] = true; });
      (readInvites() || []).forEach(function (i) { if (!seen[slugify(i.name)]) keep.push(i); });
    }
    var changed = [];
    var rows = keep.map(function (i) {
      var status = toStatus(i.status), at = String(i.respondedAt || '');
      var cur = current[slugify(i.name)];
      if (cur && cur.respondedAt && (!at || cur.respondedAt > at)) { status = cur.status; at = cur.respondedAt; }
      if (status !== (cur ? cur.status : 'pending')) changed.push([String(i.name).trim(), status]);
      var label = status.charAt(0).toUpperCase() + status.slice(1);
      return [safe(String(i.name).trim()), safe(i.nickname), safe(i.role), label, at];
    });
    var sh = invitesSheet();
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, INVITE_HEAD.length).clearContent();
    if (rows.length) sh.getRange(2, 1, rows.length, INVITE_HEAD.length).setValues(rows);
    changed.forEach(function (c) { syncRsvp(c[0], c[1]); });
    return { ok: true, invites: readInvites() };
  } finally {
    lock.releaseLock();
  }
}

/** Public: the invitee taps "Yes" / "Sorry" on their personal letter. */
function respondInvite(d) {
  var answer = d.answer === 'approved' || d.answer === 'declined' ? d.answer : '';
  var slug = slugify(d.to);
  if (!answer || !slug) return { ok: false, error: 'Invalid response' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVITES_SHEET);
    if (!sh || sh.getLastRow() < 2) return { ok: false, error: 'Invite not found' };
    var names = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < names.length; i++) {
      if (slugify(names[i][0]) === slug) {
        var at = new Date().toISOString();
        sh.getRange(i + 2, 4, 1, 2).setValues([[answer === 'approved' ? 'Approved' : 'Declined', at]]);
        syncRsvp(String(names[i][0]), answer);
        return { ok: true, status: answer, respondedAt: at };
      }
    }
    return { ok: false, error: 'Invite not found' };
  } finally {
    lock.releaseLock();
  }
}

/* ───────── invite answer → RSVP guest list ─────────
 * Saying yes to a personal invite counts as an RSVP: the person is added to the "RSVP" tab
 * (Attending: yes, 1 guest, their personal link) so they don't need to fill in the RSVP form.
 * Declining later flips that row to "no". The row is matched by the Personal Link column.
 */
function syncRsvp(name, status) {
  if (status !== 'approved' && status !== 'declined') return;
  var slug = slugify(name);
  if (!slug) return;
  var t = rsvpSheet(), sh = t.sh, c = t.col;
  var attending = status === 'approved' ? 'yes' : 'no';
  var row = rsvpRowFor(t, slug);
  if (row) {
    var cur = toAttending(sh.getRange(row, c.attending).getValue());
    if (cur !== attending) {
      sh.getRange(row, c.attending).setValue(attending);
      sh.getRange(row, c.guests).setValue(attending === 'yes' ? Math.max(1, Number(sh.getRange(row, c.guests).getValue()) || 1) : 0);
    }
    return;
  }
  if (attending !== 'yes') return; // only a yes creates a guest-list entry
  rsvpAppend({ name: name, attending: 'yes', guests: 1, message: '', link: slug });
}

/** Row number of the newest RSVP row for a personal link, or 0. */
function rsvpRowFor(t, slug) {
  var last = t.sh.getLastRow();
  if (last < 2) return 0;
  var links = t.sh.getRange(2, t.col.link, last - 1, 1).getValues();
  for (var i = links.length - 1; i >= 0; i--) if (slugify(links[i][0]) === slug) return i + 2;
  return 0;
}

function safeCell(v) {
  v = String(v == null ? '' : v).slice(0, 1000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

/** Runs by itself when someone edits the sheet by hand: a Status changed in "Invites" updates the RSVP tab too. */
function onEdit(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getName() !== INVITES_SHEET || e.range.getColumn() > 4 || e.range.getLastColumn() < 4) return;
  var first = Math.max(2, e.range.getRow()), lastRow = e.range.getLastRow();
  if (lastRow < first) return;
  var rows = sh.getRange(first, 1, lastRow - first + 1, 4).getValues();
  rows.forEach(function (r) { if (String(r[0]).trim()) syncRsvp(String(r[0]).trim(), toStatus(r[3])); });
}

/** Public: after saying yes, the invitee leaves a message. It goes on their RSVP row, so it shows on the wishes wall. */
function inviteMessage(d) {
  var slug = slugify(d.to);
  var message = String(d.message || '').trim().slice(0, 1000);
  if (!slug || message.length < 3) return { ok: false, error: 'Invalid message' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var name = '';
    (readInvites() || []).forEach(function (i) { if (slugify(i.name) === slug) name = i.name; });
    if (!name) return { ok: false, error: 'Invite not found' };
    syncRsvp(name, 'approved'); // make sure their guest-list row exists
    var t = rsvpSheet(), row = rsvpRowFor(t, slug);
    if (!row) return { ok: false, error: 'Invite not found' };
    t.sh.getRange(row, t.col.message).setValue(safeCell(message));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
