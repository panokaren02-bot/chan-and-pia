// Resize in the browser, then upload through /api/admin/upload (→ Apps Script → Google Drive).

type Opts = { maxEdge?: number; keepPng?: boolean };

function blobToBase64(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
}

async function resizeImage(file: File, { maxEdge = 2200, keepPng = false }: Opts): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const png = keepPng && file.type === "image/png";
  if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), png ? "image/png" : "image/jpeg", 0.84)
  );
}

export async function uploadFile(file: File, opts: Opts = {}): Promise<string> {
  let blob: Blob = file;
  let type = file.type;
  if (file.type.startsWith("image/")) {
    blob = await resizeImage(file, opts);
    type = blob.type;
  } else if (!file.type.startsWith("audio/")) {
    throw new Error("Please choose an image or an audio file.");
  }
  if (blob.size > 4 * 1024 * 1024) throw new Error("File is larger than 4 MB after processing.");
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, mimeType: type === "audio/mp3" ? "audio/mpeg" : type, data: await blobToBase64(blob) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.url as string;
}
