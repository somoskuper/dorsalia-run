type ShareCardInput = {
  title: string;
  organizer: string;
  imageUrl?: string | null;
  status: string;
  finalized: boolean;
  views: number;
  saves: number;
  rating: number;
  reviewCount: number;
};

const WIDTH = 1080;
const HEIGHT = 1920;
const BODY_FONT = '"Plus Jakarta Sans", Arial, sans-serif';

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    image.src = url;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  const consumed = lines.join(" ").length;
  if (consumed < text.trim().length && lines.length) {
    let last = lines[lines.length - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.trim()}…`;
  }
  return lines;
}

function count(value: number) {
  return new Intl.NumberFormat("es-MX").format(Math.max(0, Number(value) || 0));
}

export async function createEventShareCard(input: ShareCardInput): Promise<Blob> {
  await document.fonts?.load(`700 72px ${BODY_FONT}`).catch(() => undefined);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no puede crear la imagen para compartir");

  ctx.fillStyle = "#030403";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(930, 80, 0, 930, 80, 1100);
  glow.addColorStop(0, "rgba(201,242,75,.20)");
  glow.addColorStop(1, "rgba(201,242,75,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const imageX = 195;
  const imageY = 70;
  const imageWidth = 690;
  const imageHeight = 920;
  roundedPath(ctx, imageX, imageY, imageWidth, imageHeight, 40);
  ctx.fillStyle = "#111411";
  ctx.fill();
  if (input.imageUrl) {
    try {
      const flyer = await loadImage(input.imageUrl);
      ctx.save();
      roundedPath(ctx, imageX, imageY, imageWidth, imageHeight, 40);
      ctx.clip();
      drawCoverImage(ctx, flyer, imageX, imageY, imageWidth, imageHeight);
      ctx.restore();
    } catch {
      // The branded layout remains useful even when a third-party image blocks CORS.
    }
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 58px ${BODY_FONT}`;
  const titleLines = wrapLines(ctx, input.title, 940, 3);
  let titleY = 1082;
  for (const line of titleLines) {
    ctx.fillText(line, 70, titleY);
    titleY += 66;
  }

  const presenterY = 1305;
  ctx.fillStyle = "rgba(255,255,255,.52)";
  ctx.font = `600 29px ${BODY_FONT}`;
  ctx.fillText("Presentado por", 70, presenterY);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 29px ${BODY_FONT}`;
  ctx.fillText(input.organizer, 270, presenterY, 740);

  ctx.fillStyle = "#c9f24b";
  ctx.fillRect(70, 1360, 84, 7);
  ctx.font = `700 43px ${BODY_FONT}`;
  ctx.fillText(input.status.toUpperCase(), 70, 1433);

  if (input.finalized) {
    ctx.fillStyle = "#c9f24b";
    ctx.font = `700 72px ${BODY_FONT}`;
    ctx.fillText("★", 70, 1562);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(input.reviewCount ? input.rating.toFixed(1) : "—", 152, 1562);
    ctx.font = `600 31px ${BODY_FONT}`;
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.fillText(`${count(input.reviewCount)} ${input.reviewCount === 1 ? "reseña" : "reseñas"}`, 320, 1556);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 38px ${BODY_FONT}`;
    ctx.fillText("Entra y deja tu reseña", 70, 1640);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 50px ${BODY_FONT}`;
    ctx.fillText(count(input.views), 70, 1555);
    ctx.fillText(count(input.saves), 550, 1555);
    ctx.font = `600 28px ${BODY_FONT}`;
    ctx.fillStyle = "#c9f24b";
    ctx.fillText("VISITAS", 70, 1598);
    ctx.fillText("GUARDADOS", 550, 1598);
  }

  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.font = `600 31px ${BODY_FONT}`;
  const footerCopy = input.finalized
    ? "Comparte tu experiencia con la comunidad runner."
    : "Puntúa, recomienda y sigue los mejores eventos en Dorsalia.";
  const footerLines = wrapLines(ctx, footerCopy, 940, 2);
  footerLines.forEach((line, index) => ctx.fillText(line, 70, 1730 + index * 42));

  try {
    const logo = await loadImage("/branding/dorsalia-logo.svg");
    const logoWidth = 255;
    const logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth);
    ctx.drawImage(logo, 70, 1830, logoWidth, logoHeight);
  } catch {
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 38px ${BODY_FONT}`;
    ctx.fillText("DORSALIA", 70, 1870);
  }
  ctx.fillStyle = "#c9f24b";
  ctx.font = `700 24px ${BODY_FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("dorsalia.run", 1010, 1870);
  ctx.textAlign = "left";

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen")), "image/png", 1);
  });
}
