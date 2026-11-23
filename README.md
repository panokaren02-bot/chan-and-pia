# Wedding Invitation

Next.js one-page wedding invitation.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Dashboard (edit content & upload photos online)
Go to **/dashboard** and log in with `DASHBOARD_PASSWORD`. Everything on the site can be edited there:
names and date, venues, schedule, every photo (section photos, gallery, opening collage), dress code, entourage,
personal invites, messages, RSVP settings, gifts/QR codes and music. **Save** updates the live site immediately.
RSVP replies appear under *RSVP Responses* (with CSV download).

How it works: text is stored in a Google Sheet and photos in a Google Drive folder, through the Apps Script in
`google-apps-script/Code.gs`. Photos are resized in the browser before upload and served from `/api/photo/<id>`.

One-time setup per client:
1. Follow the steps at the top of `google-apps-script/Code.gs` (create Sheet → paste script → run `setup` → deploy as Web app).
2. Set `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET` and `DASHBOARD_PASSWORD` (see `.env.example`) locally in `.env.local`
   and in Vercel's Environment Variables, then redeploy.

`lib/wedding.ts` holds the **defaults**: anything not yet saved from the dashboard falls back to it.
The Sheet's *History* tab keeps the last 30 saved versions in case you need to recover something.

## Customize per client (code)
- **Default text/content** → `lib/wedding.ts` (names, date, venues, schedule, dress code, entourage, RSVP, reminders, gifts).
- **Photos** → put originals in `public/mobile-image` / `public/desktop-image`, edit `MAP` in `scripts/optimize-images.mjs`, run `npm run images`. Optimized WebP files land in `public/images` (also update `lib/images.ts` if you add names).
- **Gift QR codes** → add the image to `public/images/` and set `qr` on the account in `lib/wedding.ts`.
- **Music** → add an mp3 to `public/music/` and set `music` in `lib/wedding.ts`.
- **RSVP to Google Sheets** → handled by the same Apps Script; replies land in the Sheet's *RSVP* tab.

## Personal invite links
Each entourage member in `wedding.invites` gets a personal letter ("Hello, Tito Orly … Will you be our Ninong?").
Open **/invites** to view and copy every person's link (format: `/?to=orlando-balbuena`).
