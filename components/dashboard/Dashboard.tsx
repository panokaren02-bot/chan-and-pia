"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultWedding, photoSlotInfo, slugify, type PhotoSlotKey, type Wedding } from "@/lib/wedding";
import { Area, Card, Grid, NumberField, ObjectList, PhotoGrid, PhotoPicker, Section, StringList, Text } from "./fields";
import { Icon } from "./icons";
import Rsvps from "./Rsvps";
import LayoutEditor from "./LayoutEditor";
import { customRoleFrom, roleCore, roleSuggestions, statusOf } from "@/lib/entourage";
import type { InvitesSource } from "@/lib/content";
import EntourageEditor from "./EntourageEditor";
import InvitesTable from "./InvitesTable";

const NAV = [
  ["couple", "Couple & Date"], ["layout", "Page Layout"], ["venues", "Ceremony & Reception"], ["photos", "Photos"], ["dress", "Dress Code"],
  ["entourage", "Entourage"], ["invites", "Personal Invites"], ["messages", "Messages"], ["rsvp", "RSVP & Reminders"],
  ["gifts", "Gifts"], ["music", "Music"], ["responses", "RSVP Responses"],
] as const;
const SHORT: Partial<Record<Tab, string>> = { layout: "Layout", venues: "Venues", invites: "Invites", rsvp: "RSVP", responses: "Responses" };
type Tab = (typeof NAV)[number][0];

// "2027-05-14T13:30:00+08:00" <-> "2027-05-14T13:30" for <input type="datetime-local">
const toLocal = (iso: string) => iso.slice(0, 16);
const fromLocal = (v: string) => `${v}:00+08:00`;
const labelFor = (v: string) =>
  new Date(`${v}:00+08:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });

export default function Dashboard({ initial, connected, invitesSource, sheetUrl }: { initial: Wedding; connected: boolean; invitesSource?: InvitesSource; sheetUrl?: string }) {
  const [c, setC] = useState<Wedding>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [tab, setTab] = useState<Tab>("couple");
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "ok" | "err"; msg?: string }>({ kind: "idle" });
  const [menu, setMenu] = useState(false);
  const dirty = useMemo(() => JSON.stringify(c) !== saved, [c, saved]);

  const go = (t: Tab) => { setTab(t); setMenu(false); window.scrollTo({ top: 0 }); };
  const discard = () => { if (window.confirm("Discard all unsaved changes?")) { setC(JSON.parse(saved)); setStatus({ kind: "idle" }); } };

  // lock page scroll + Esc closes while the sections sheet is open
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [menu]);

  const up = useCallback((fn: (d: Wedding) => void) => setC((prev) => { const n = structuredClone(prev); fn(n); return n; }), []);
  // Personal invites are the one list of people; the Entourage tab is a grouped view of them.
  // Changing someone's status from the dashboard stamps it, so the sheet knows it's newer than an older reply.
  const setInvites = useCallback((v: Wedding["invites"]) => up((d) => {
    d.invites = v.map((x, i) => {
      const old = d.invites[i];
      return old && old.name === x.name && statusOf(old) !== statusOf(x) && old.respondedAt === x.respondedAt
        ? { ...x, respondedAt: new Date().toISOString() } : x;
    });
  }), [up]);
  const roles = useMemo(() => roleSuggestions(c), [c]);
  // a new role (e.g. Candle Sponsors): its people get their own heading in the Entourage
  const addRole = useCallback((r: { label: string; ask: string }) => up((d) => {
    const list = d.customRoles ?? [];
    if (!list.some((x) => roleCore(x.ask) === roleCore(r.ask) || roleCore(x.label) === roleCore(r.label))) d.customRoles = [...list, r];
  }), [up]);
  // names already saved to the sheet: only their links work yet
  const savedNames = useMemo(() => new Set((JSON.parse(saved) as Wedding).invites.map((i) => slugify(i.name))), [saved]);

  const save = useCallback(async () => {
    if (!connected) return;
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: { ...c, _loadedInvites: [...savedNames] } }) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { window.location.reload(); return; }
      if (!res.ok || !data.ok) throw new Error(data.error || `Save failed (${res.status})`);
      // take the sheet's invite list back: it includes replies that arrived while the dashboard was open
      const next = Array.isArray(data.invites) ? { ...c, invites: data.invites } : c;
      setC(next);
      setSaved(JSON.stringify(next));
      setStatus({ kind: "ok", msg: "Saved — the live site is updated." });
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Save failed" });
    }
  }, [c, connected, savedNames]);

  // ⌘/Ctrl + S saves; warn before leaving with unsaved changes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); if (dirty) save(); } };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  }, [dirty, save]);

  useEffect(() => { if (status.kind === "ok") { const t = setTimeout(() => setStatus({ kind: "idle" }), 3500); return () => clearTimeout(t); } }, [status]);

  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.reload(); };
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const idx = NAV.findIndex(([id]) => id === tab);
  const next = NAV[idx + 1];
  const prev = NAV[idx - 1];
  const showBar = dirty || status.kind === "saving" || status.kind === "err";

  return (
    <div className={`db ${showBar ? "db-has-bar" : ""}`}>
      <header className="db-top">
        <div className="db-top-row">
          <div className="db-brand">
            <span className="db-mono" style={{ WebkitMaskImage: `url("${c.monogramImage}")`, maskImage: `url("${c.monogramImage}")` }} />
            <div>
              <strong>{c.groom} &amp; {c.bride}</strong>
              <small className="db-desk-only">Invitation dashboard</small>
              <small className={`db-mob-status db-status-${dirty ? "dirty" : status.kind === "err" ? "err" : "ok"}`}>
                {status.kind === "saving" ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}
              </small>
            </div>
          </div>
          <div className="db-top-actions">
            <span className={`db-status db-status-${dirty ? "dirty" : status.kind === "err" ? "err" : "ok"}`}>
              {status.kind === "saving" ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}
            </span>
            {sheetUrl && (
              <a className="db-btn db-btn-ghost db-icon-btn db-desk" href={sheetUrl} target="_blank" rel="noopener noreferrer" aria-label="Open Google Sheet">
                <Icon name="sheet" /><span>Google Sheet</span>
              </a>
            )}
            <a className="db-btn db-btn-ghost db-icon-btn" href="/" target="_blank" rel="noopener noreferrer" aria-label="View site">
              <Icon name="external" /><span>View site</span>
            </a>
            <button className="db-btn db-btn-ghost db-desk" onClick={logout}><Icon name="logout" />Log out</button>
            <button className="db-btn db-menu-btn db-mob" onClick={() => setMenu(true)} aria-label={`Sections, now on ${NAV[idx][1]}`} aria-expanded={menu}>
              <Icon name="menu" /><b>{SHORT[tab] ?? NAV[idx][1]}</b>
            </button>
          </div>
        </div>
      </header>

      {!connected && (
        <div className="db-banner">
          <strong>Not connected to Google Sheets.</strong> You can look around, but saving and uploads are off until
          <code>APPS_SCRIPT_URL</code> and <code>APPS_SCRIPT_SECRET</code> are set (see <code>google-apps-script/Code.gs</code>).
        </div>
      )}

      <div className="db-body">
        <nav className="db-nav" aria-label="Sections">
          {NAV.map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => go(id)}><Icon name={id} />{label}</button>
          ))}
        </nav>

        <main className="db-main">
          {tab === "couple" && (
            <Section id="couple" title="Couple & Date" desc="Names, wedding date and the monogram shown across the site.">
              <Card title="The couple">
                <Grid>
                  <Text label="Groom (short name)" value={c.groom} onChange={(v) => up((d) => { d.groom = v; })} />
                  <Text label="Bride (short name)" value={c.bride} onChange={(v) => up((d) => { d.bride = v; })} />
                  <Text label="Groom (full name)" value={c.groomFull} onChange={(v) => up((d) => { d.groomFull = v; })} />
                  <Text label="Bride (full name)" value={c.brideFull} onChange={(v) => up((d) => { d.brideFull = v; })} />
                  <Text label="Hashtag" value={c.hashtag} onChange={(v) => up((d) => { d.hashtag = v; })} />
                </Grid>
              </Card>
              <Card title="Date">
                <Grid>
                  <Text label="Ceremony date & time (Philippine time)" type="datetime-local" value={toLocal(c.dateISO)}
                    onChange={(v) => v && up((d) => { d.dateISO = fromLocal(v); d.dateLabel = labelFor(v); })} hint="Drives the countdown, calendar and add-to-calendar buttons." />
                  <Text label="Date as written" value={c.dateLabel} onChange={(v) => up((d) => { d.dateLabel = v; })} hint="Filled in automatically when you change the date." />
                </Grid>
              </Card>
              <Card title="Monogram">
                <Grid>
                  <PhotoPicker label="Monogram image" value={c.monogramImage} enabled={connected} keepPng maxEdge={1200}
                    onChange={(v) => up((d) => { d.monogramImage = v || "/monogram/monogram-web.png"; })}
                    hint="Transparent PNG with dark shapes. The site recolours it automatically." />
                  <div>
                    <Grid>
                      <Text label="Initial 1" value={c.monogram[0]} onChange={(v) => up((d) => { d.monogram[0] = v; })} />
                      <Text label="Initial 2" value={c.monogram[1]} onChange={(v) => up((d) => { d.monogram[1] = v; })} />
                    </Grid>
                    <small className="db-hint">Used for screen readers.</small>
                  </div>
                </Grid>
              </Card>
              <Card title="Sharing preview">
                <Grid>
                  <Text label="Page title" value={c.meta.title} onChange={(v) => up((d) => { d.meta.title = v; })} />
                  <Text label="Description" value={c.meta.description} onChange={(v) => up((d) => { d.meta.description = v; })} />
                  <div className="db-wide">
                    <PhotoPicker label="Link preview image (1200 × 630)" value={c.meta.image ?? ""} enabled={connected} maxEdge={1200}
                      onChange={(v) => up((d) => { d.meta.image = v || "/og/save-the-date.jpg"; })}
                      hint="Shown when the link is shared in Messenger, Viber, WhatsApp and iMessage. Apps cache previews, so changes can take a while to appear." />
                  </div>
                </Grid>
              </Card>
            </Section>
          )}

          {tab === "layout" && (
            <LayoutEditor order={c.layout?.order ?? []} hidden={c.layout?.hidden ?? []}
              onChange={(order, hidden) => up((d) => { d.layout = { order: [...order], hidden: [...hidden] }; })} />
          )}

          {tab === "venues" && (
            <Section id="venues" title="Ceremony & Reception">
              {(["ceremony", "reception"] as const).map((k) => (
                <Card key={k} title={k === "ceremony" ? "Ceremony" : "Reception"}>
                  <Grid>
                    <Text label="Venue name" value={c[k].name} onChange={(v) => up((d) => { d[k].name = v; })} />
                    <Text label="Address / area" value={c[k].address} onChange={(v) => up((d) => { d[k].address = v; })} />
                    <Text label="Time" value={c[k].time} onChange={(v) => up((d) => { d[k].time = v; })} />
                    <Text label="Google Maps link" value={c[k].mapUrl} onChange={(v) => up((d) => { d[k].mapUrl = v; })} />
                  </Grid>
                  <PhotoGrid label="Venue photos (slideshow)" items={c[k].images ?? []} enabled={connected}
                    onChange={(v) => up((d) => { d[k].images = v; })} hint="Landscape photos work best. They wipe in one after another." />
                </Card>
              ))}
              <Card title="Day schedule">
                <ObjectList label="Timeline" items={c.schedule} onChange={(v) => up((d) => { d.schedule = v; })} addLabel="Add moment"
                  make={() => ({ time: "", label: "", note: "" })} titleOf={(it) => it.label} subOf={(it) => it.time}
                  fields={[{ key: "time", label: "Time" }, { key: "label", label: "Moment" }, { key: "note", label: "Note (optional)", wide: true }]} />
              </Card>
            </Section>
          )}

          {tab === "photos" && (
            <Section id="photos" title="Photos" desc="Photos are resized in your browser before uploading, so large camera files are fine.">
              <Card title="Hero slideshow">
                <p className="db-hint">The photos that slowly crossfade behind the names at the top of the site (5 recommended). Add a <b>portrait</b> photo for phones and a <b>landscape</b> one for computers.</p>
                <ObjectList label="Slides" items={c.photos.heroSlides} uploadsEnabled={connected} addLabel="Add slide"
                  onChange={(v) => up((d) => { d.photos.heroSlides = v; })}
                  make={() => ({ m: "", d: "" })} titleOf={(_, i) => `Slide ${i + 1}`}
                  subOf={(it) => [it.m && "phone", it.d && "computer"].filter(Boolean).join(" + ") || "no photo yet"}
                  fields={[{ key: "m", label: "Phone (portrait)", type: "photo" }, { key: "d", label: "Computer (landscape)", type: "photo" }]} />
              </Card>
              <Card title="Section photos">
                <p className="db-hint">Each section can have a <b>portrait</b> photo for phones and a <b>landscape</b> one for computers. If only one is set, it&apos;s used everywhere.</p>
                <div className="db-slots">
                  {(Object.keys(photoSlotInfo) as PhotoSlotKey[]).filter((k) => k !== "ceremony" && k !== "reception").map((k) => <SlotEditor key={k} c={c} slot={k} up={up} connected={connected} titled />)}
                </div>
              </Card>
              <Card title="Gallery">
                <PhotoGrid label="Gallery photos" items={c.photos.gallery} enabled={connected} onChange={(v) => up((d) => { d.photos.gallery = v; })}
                  hint="Shown in the “Our Story in Frames” section. Select several files at once to add them together." />
              </Card>
              <Card title="Opening collage">
                <PhotoGrid label="Collage prints" items={c.photos.collage} enabled={connected} fixed onChange={(v) => up((d) => { d.photos.collage = v; })}
                  hint="The 12 photos scattered behind the envelope. Use ⟳ to replace one. Prints 1, 3, 5, 7, 8, 10 and 12 are portrait polaroids; 2, 4, 6, 9 and 11 are landscape prints." />
              </Card>
            </Section>
          )}

          {tab === "dress" && (
            <Section id="dress" title="Dress Code">
              <Card>
                <Area label="Introduction" value={c.dressCode.intro} onChange={(v) => up((d) => { d.dressCode.intro = v; })} />
              </Card>
              <Card title="Color motif">
                <ObjectList label="Colors" items={c.motif} onChange={(v) => up((d) => { d.motif = v; })}
                  make={() => ({ name: "", hex: "#c5aa83" })} titleOf={(it) => it.name} subOf={(it) => it.hex}
                  fields={[{ key: "name", label: "Name" }, { key: "hex", label: "Color", type: "color" }]} />
              </Card>
              <Card title="Attire by group">
                <ObjectList label="Groups" items={c.dressCode.groups as Wedding["dressCode"]["groups"][number][]}
                  onChange={(v) => up((d) => { d.dressCode.groups = v; })}
                  make={() => ({ title: "", gentlemen: "", ladies: "", colors: [], note: "" })} titleOf={(it) => it.title}
                  fields={[
                    { key: "title", label: "Group", wide: true }, { key: "gentlemen", label: "Gentlemen" }, { key: "ladies", label: "Ladies" },
                    { key: "colors", label: "Palette", type: "colors" }, { key: "note", label: "Note (optional)", wide: true },
                  ]} />
              </Card>
            </Section>
          )}

          {tab === "entourage" && (
            <Section id="entourage" title="Entourage"
              desc="Everyone here also has a personal invite, so adding or renaming someone here updates Personal Invites too. Only Approved people appear in the Entourage on the website.">
              <SheetNotice source={invitesSource} />
              <EntourageEditor w={c} onChange={setInvites} />
            </Section>
          )}

          {tab === "invites" && (
            <Section id="invites" title="Personal Invites"
              desc="Each person gets their own link that opens a personal letter (“Hello, Tito Orly … Will you be our Ninong?”). The list is stored in the “Invites” tab of your Google Sheet. An entourage role adds the person to the Entourage, and they appear on the website once their status is Approved.">
              <SheetNotice source={invitesSource} />
              <InvitesTable w={c} savedNames={savedNames} origin={origin} roles={roles} onChange={setInvites} onAddRole={addRole} />
              <Card title="Roles">
                <p className="db-hint">
                  Built in: Ninong, Ninang, Best Man, Maid of Honor, Groom’s &amp; Bride’s Squad, Bearers and Flower Girls.
                  Add your own below. Anyone whose role matches gets their own heading in the Entourage (once Approved).
                </p>
                <ObjectList label="Your own roles" items={c.customRoles ?? []} addLabel="Add role"
                  onChange={(v) => up((d) => { d.customRoles = v; })}
                  make={() => ({ label: "", ask: "" })} titleOf={(it) => it.label || "New role"} subOf={(it) => it.ask && `“Will you be ${it.ask}?”`}
                  fields={[{ key: "label", label: "Heading in the Entourage", hint: "e.g. Candle Sponsors" }, { key: "ask", label: "Role (Will you be …?)", hint: "e.g. our candle sponsor" }]} />
                <div className="db-role-quick">
                  <span className="db-label">Quick add</span>
                  {["our candle sponsor", "our veil sponsor", "our cord sponsor", "our coin sponsor", "our Bible reader", "our offertory sponsor"]
                    .map(customRoleFrom).filter((r) => !(c.customRoles ?? []).some((x) => roleCore(x.ask) === roleCore(r.ask)))
                    .map((r) => <button key={r.ask} type="button" className="db-chip" onClick={() => addRole(r)}>+ {r.label}</button>)}
                </div>
              </Card>
              <Card title="Letter" aside={
                <button className="db-btn db-btn-ghost" onClick={() => window.confirm("Replace the letter paragraphs and role paragraphs with the suggested wording?") &&
                  up((d) => { d.letter.lines = [...defaultWedding.letter.lines]; d.letter.notes = { ...defaultWedding.letter.notes }; })}>Use suggested wording</button>}>
                <p className="db-hint">The letter opens with “Dear {"{nickname}"},”, then these paragraphs, then a paragraph for their role, then the question: “Will you be our Ninong?” with Yes / No buttons.</p>
                <StringList label="Paragraphs" multiline items={c.letter.lines} onChange={(v) => up((d) => { d.letter.lines = v; })} addLabel="Add paragraph" />
                <div className="db-grid db-grid-2">
                  {([["sponsors", "For ninongs & ninangs"], ["honor", "For best man & maid of honor"], ["squad", "For the groom’s & bride’s squads"], ["little", "For bearers & flower girls"]] as const).map(([k, label]) => (
                    <Area key={k} label={label} rows={4} value={c.letter.notes?.[k] ?? ""} onChange={(v) => up((d) => { d.letter.notes = { ...defaultWedding.letter.notes, ...d.letter.notes, [k]: v }; })} />
                  ))}
                </div>
                <Text label="Sign-off" value={c.letter.signoff} onChange={(v) => up((d) => { d.letter.signoff = v; })} />
                <Area label="Share message" rows={4} value={c.letter.shareMessage} onChange={(v) => up((d) => { d.letter.shareMessage = v; })}
                  hint="Pre-filled when you tap Share. Use {nickname}, {name}, {role}, {couple} and {link}." />
              </Card>
              <a className="db-btn db-btn-ghost db-inv-all" href="/invites" target="_blank" rel="noopener noreferrer"><Icon name="external" size={16} />Open the printable list of all links</a>
            </Section>
          )}

          {tab === "messages" && (
            <Section id="messages" title="Messages">
              <Card title="Invitation">
                <Area label="“With grateful hearts” message" value={c.invitation} onChange={(v) => up((d) => { d.invitation = v; })} />
              </Card>
              <Card title="Thank you">
                <Grid>
                  <Text label="Title line 1" value={c.thanks.title[0]} onChange={(v) => up((d) => { d.thanks.title[0] = v; })} />
                  <Text label="Title line 2" value={c.thanks.title[1]} onChange={(v) => up((d) => { d.thanks.title[1] = v; })} />
                </Grid>
                <Area label="Message" rows={4} value={c.thanks.body} onChange={(v) => up((d) => { d.thanks.body = v; })} />
              </Card>
            </Section>
          )}

          {tab === "rsvp" && (
            <Section id="rsvp" title="RSVP & Reminders">
              <Card title="RSVP">
                <Grid>
                  <Text label="Deadline" value={c.rsvp.deadline} onChange={(v) => up((d) => { d.rsvp.deadline = v; })} />
                  <NumberField label="Max guests per reply" value={c.rsvp.maxGuests} onChange={(v) => up((d) => { d.rsvp.maxGuests = v; })} />
                </Grid>
                <Area label="Message" value={c.rsvp.message} onChange={(v) => up((d) => { d.rsvp.message = v; })} />
                <label className="db-check">
                  <input type="checkbox" checked={c.rsvp.showWishes !== false} onChange={(e) => up((d) => { d.rsvp.showWishes = e.target.checked; })} />
                  <span>Show the wishes wall (guests&apos; RSVP messages) below the RSVP section</span>
                </label>
              </Card>
              <Card title="Ceremony do's & don'ts">
                <Grid>
                  <StringList label="Do" multiline items={c.reminders.dos} onChange={(v) => up((d) => { d.reminders.dos = v; })} />
                  <StringList label="Don't" multiline items={c.reminders.donts} onChange={(v) => up((d) => { d.reminders.donts = v; })} />
                </Grid>
              </Card>
            </Section>
          )}

          {tab === "gifts" && (
            <Section id="gifts" title="Gifts">
              <Card>
                <Area label="Introduction" value={c.gifts.intro} onChange={(v) => up((d) => { d.gifts.intro = v; })} />
              </Card>
              <Card title="Accounts">
                <ObjectList label="Accounts" items={c.gifts.accounts} uploadsEnabled={connected} onChange={(v) => up((d) => { d.gifts.accounts = v; })}
                  make={() => ({ bank: "", accountName: "", accountNumber: "", qr: "" })} titleOf={(it) => it.bank} subOf={(it) => it.accountName}
                  fields={[
                    { key: "bank", label: "Bank / wallet" }, { key: "accountName", label: "Account name" },
                    { key: "accountNumber", label: "Account number" }, { key: "qr", label: "QR code", type: "photo" },
                  ]} />
              </Card>
            </Section>
          )}

          {tab === "music" && (
            <Section id="music" title="Music" desc="Plays after the guest opens the envelope, with a play/pause button.">
              <Card>
                <PhotoPicker label="Song (MP3 or M4A, up to 4 MB)" audio accept="audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a" value={c.music} enabled={connected}
                  onChange={(v) => up((d) => { d.music = v; })} hint="TikTok/YouTube links can't be played on the site — download the song as an MP3 first." />
              </Card>
            </Section>
          )}

          {tab === "responses" && (
            <Rsvps connected={connected} hidden={c.rsvp.hiddenWishes ?? []}
              onToggleHidden={(id) => up((d) => {
                const h = new Set(d.rsvp.hiddenWishes ?? []);
                if (h.has(id)) h.delete(id); else h.add(id);
                d.rsvp.hiddenWishes = [...h];
              })} />
          )}

          <div className="db-pager">
            {prev && (
              <button className="db-next db-prev" onClick={() => go(prev[0])}>
                <Icon name="left" /><span><small>Previous</small>{SHORT[prev[0]] ?? prev[1]}</span>
              </button>
            )}
            {next && (
              <button className="db-next" onClick={() => go(next[0])}>
                <span><small>Next</small>{next[1]}</span><Icon name="right" />
              </button>
            )}
          </div>
        </main>
      </div>

      {showBar && (
        <div className={`db-savebar ${status.kind === "err" ? "is-err" : ""}`} role="status">
          <span className="db-savebar-msg">
            {status.kind === "err" ? status.msg : status.kind === "saving" ? "Saving…" : !connected ? "Not connected — can’t save" : "Unsaved changes"}
          </span>
          <span className="db-savebar-actions">
            <button className="db-btn db-btn-ghost" onClick={discard} disabled={!dirty || status.kind === "saving"}>Discard</button>
            <button className="db-btn db-btn-primary" onClick={save} disabled={!dirty || !connected || status.kind === "saving"}>
              {status.kind === "saving" ? "Saving…" : "Save"}
            </button>
          </span>
        </div>
      )}
      {status.kind === "ok" && !dirty && <div className="db-toast" role="status"><Icon name="check" />{status.msg}</div>}

      {menu && (
        <div className="db-sheet-wrap" onClick={() => setMenu(false)}>
          <div className="db-sheet" role="dialog" aria-modal="true" aria-label="Sections" onClick={(e) => e.stopPropagation()}>
            <div className="db-sheet-head">
              <strong>Sections</strong>
              <button className="db-btn db-btn-ghost db-icon-btn" onClick={() => setMenu(false)} aria-label="Close"><Icon name="close" /></button>
            </div>
            <div className="db-sheet-grid">
              {NAV.map(([id, label]) => (
                <button key={id} className={tab === id ? "on" : ""} onClick={() => go(id)}><Icon name={id} size={22} /><span>{label}</span></button>
              ))}
            </div>
            <div className="db-sheet-foot">
              <a className="db-btn" href="/" target="_blank" rel="noopener noreferrer"><Icon name="external" />View site</a>
              <a className="db-btn" href="/invites" target="_blank" rel="noopener noreferrer"><Icon name="invites" />Invite links</a>
              {sheetUrl && <a className="db-btn" href={sheetUrl} target="_blank" rel="noopener noreferrer"><Icon name="sheet" />Google Sheet</a>}
              <button className="db-btn" onClick={logout}><Icon name="logout" />Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Explains why no names came from Google, and how to fix it. */
function SheetNotice({ source }: { source?: InvitesSource }) {
  if (source === "old-script") return (
    <div className="db-banner db-sheet-notice">
      <strong>Names can’t load from Google yet: your Apps Script is an older version.</strong> In the Google Sheet open Extensions → Apps Script,
      paste the new <code>google-apps-script/Code.gs</code>, save, then Deploy → Manage deployments → Edit (pencil) → Version: <b>New version</b> → Deploy.
    </div>
  );
  if (source === "no-tab") return (
    <div className="db-banner db-sheet-notice">
      <strong>Your Google Sheet has no “Invites” tab yet.</strong> In Apps Script choose the function <code>setup</code> and click Run. It creates the tab
      with the columns Name, Nickname, Role, Status and Responded At. Then add the names there and reload this page.
    </div>
  );
  return null;
}

function SlotEditor({ c, slot, up, connected, titled }: {
  c: Wedding; slot: PhotoSlotKey; up: (fn: (d: Wedding) => void) => void; connected: boolean; titled?: boolean;
}) {
  const s = c.photos.slots[slot] ?? {};
  const set = (k: "m" | "d", v: string) => up((d) => {
    const cur = { ...(d.photos.slots[slot] ?? {}) };
    if (v) cur[k] = v; else delete cur[k];
    d.photos.slots[slot] = cur;
  });
  return (
    <div className="db-slot">
      {titled && <h4>{photoSlotInfo[slot]}</h4>}
      <Grid>
        <PhotoPicker label="Phone (portrait)" value={s.m ?? ""} enabled={connected} maxEdge={1800} onChange={(v) => set("m", v)} />
        <PhotoPicker label="Computer (landscape)" value={s.d ?? ""} enabled={connected} maxEdge={2400} onChange={(v) => set("d", v)} />
      </Grid>
    </div>
  );
}

