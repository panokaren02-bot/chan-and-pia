// Serves a Google Drive file (uploaded from the dashboard) from our own domain, with long caching.
// Same-origin URLs also let CSS masks (the monogram) use uploaded images.
const ID = /^[A-Za-z0-9_-]{20,80}$/;

function sniff(b: Uint8Array): string | null {
  const h = (i: number) => b[i];
  if (h(0) === 0xff && h(1) === 0xd8) return "image/jpeg";
  if (h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4e && h(3) === 0x47) return "image/png";
  if (h(0) === 0x52 && h(1) === 0x49 && h(8) === 0x57 && h(9) === 0x45) return "image/webp";
  if ((h(0) === 0x49 && h(1) === 0x44 && h(2) === 0x33) || (h(0) === 0xff && (h(1) & 0xe0) === 0xe0)) return "audio/mpeg";
  if (h(4) === 0x66 && h(5) === 0x74 && h(6) === 0x79 && h(7) === 0x70) return "audio/mp4";
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) return new Response("Not found", { status: 404 });
  const upstream = await fetch(`https://drive.usercontent.google.com/download?id=${id}&export=download`, { redirect: "follow" });
  if (!upstream.ok) return new Response("Not found", { status: 404 });
  const buf = new Uint8Array(await upstream.arrayBuffer());
  const type = sniff(buf);
  if (!type) return new Response("Unsupported file", { status: 415 }); // never serve HTML/other content from Drive
  return new Response(buf, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
