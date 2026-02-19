const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

const SAFE = {
  top: 140,
  right: 90,
  bottom: 140,
  left: 90
} as const;

type RenderQuoteStoryParams = {
  quote: string;
};

type ShareOrDownloadResult = "shared" | "downloaded";

type ShareOrDownloadOptions = {
  title: string;
  text: string;
};

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
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
  }

  if (current) lines.push(current);

  return lines;
}

function fitQuote(
  ctx: CanvasRenderingContext2D,
  quote: string,
  maxWidth: number,
  maxHeight: number
): { fontSize: number; lineHeight: number; lines: string[] } {
  let fontSize = 80;

  while (fontSize >= 54) {
    ctx.font = `italic 600 ${fontSize}px 'Cormorant Garamond', serif`;
    const lines = wrapLines(ctx, quote, maxWidth);
    const lineHeight = Math.round(fontSize * 1.55);
    const totalHeight = lines.length * lineHeight;

    if (lines.length <= 8 && totalHeight <= maxHeight) {
      return { fontSize, lineHeight, lines };
    }

    fontSize -= 2;
  }

  ctx.font = "italic 600 54px 'Cormorant Garamond', serif";
  const lines = wrapLines(ctx, quote, maxWidth).slice(0, 8);
  return { fontSize: 54, lineHeight: Math.round(54 * 1.55), lines };
}

function drawGrain(ctx: CanvasRenderingContext2D): void {
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = 180;
  grainCanvas.height = 320;

  const gctx = grainCanvas.getContext("2d");
  if (!gctx) return;

  const imageData = gctx.createImageData(grainCanvas.width, grainCanvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.floor(Math.random() * 256);
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 24 + Math.floor(Math.random() * 20);
  }

  gctx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grainCanvas, 0, 0, STORY_WIDTH, STORY_HEIGHT);
  ctx.restore();
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Impossible de générer l'image"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}


function resolveAssetUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    let settled = false;
    const finalizeResolve = () => {
      if (settled) return;
      if (!image.naturalWidth || !image.naturalHeight) return;
      settled = true;
      resolve(image);
    };
    const finalizeReject = () => {
      if (settled) return;
      settled = true;
      reject(new Error(`Image introuvable: ${src}`));
    };

    image.onload = finalizeResolve;
    image.onerror = finalizeReject;
    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      finalizeResolve();
      return;
    }
  });
}

async function loadSignatureLogo(): Promise<HTMLImageElement | null> {
  const candidates = ["/brand/kimsu-logo.png", "/icons/source.png"];

  for (const path of candidates) {
    const src = resolveAssetUrl(path);
    try {
      return await loadImage(src);
    } catch {
      // try next
    }
  }

  return null;
}


function prepareLogoForSignature(logo: HTMLImageElement): HTMLCanvasElement {
  const offscreen = document.createElement("canvas");
  offscreen.width = logo.naturalWidth || logo.width;
  offscreen.height = logo.naturalHeight || logo.height;

  const octx = offscreen.getContext("2d");
  if (!octx) return offscreen;

  octx.drawImage(logo, 0, 0, offscreen.width, offscreen.height);

  try {
    const imageData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue;

      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const alphaFromLuma = Math.max(0, Math.min(1, (luminance - 22) / 150));

      data[i] = 242;
      data[i + 1] = 242;
      data[i + 2] = 247;
      data[i + 3] = Math.round(a * alphaFromLuma);
    }

    octx.putImageData(imageData, 0, 0);
  } catch {
    // Mobile Safari can block pixel reads in some contexts; fallback to original logo render.
  }

  return offscreen;
}

function drawLogoSignature(ctx: CanvasRenderingContext2D, logo: HTMLImageElement): void {
  const cleanedLogo = prepareLogoForSignature(logo);
  const targetWidth = 200;
  const sourceWidth = cleanedLogo.width || logo.naturalWidth || logo.width || 1;
  const sourceHeight = cleanedLogo.height || logo.naturalHeight || logo.height || 1;
  const ratio = sourceHeight / sourceWidth;
  const targetHeight = targetWidth * ratio;

  const logoX = (STORY_WIDTH - targetWidth) / 2;
  const logoY = STORY_HEIGHT - 120 - targetHeight;

  const hairlineY = logoY - 28;
  const halfLine = 270;
  const lineGradient = ctx.createLinearGradient(STORY_WIDTH / 2 - halfLine, hairlineY, STORY_WIDTH / 2 + halfLine, hairlineY);
  lineGradient.addColorStop(0, "rgba(205,189,255,0)");
  lineGradient.addColorStop(0.5, "rgba(205,189,255,0.10)");
  lineGradient.addColorStop(1, "rgba(205,189,255,0)");

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = lineGradient;
  ctx.beginPath();
  ctx.moveTo(STORY_WIDTH / 2 - halfLine, hairlineY);
  ctx.lineTo(STORY_WIDTH / 2 + halfLine, hairlineY);
  ctx.stroke();

  ctx.globalAlpha = 0.74;
  ctx.drawImage(cleanedLogo, logoX, logoY, targetWidth, targetHeight);
  ctx.restore();
}

export async function renderQuoteStoryCanvas({ quote }: RenderQuoteStoryParams): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas indisponible");
  }

  ctx.fillStyle = "#221A2E";
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  const vertical = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);
  vertical.addColorStop(0, "#2A2139");
  vertical.addColorStop(0.55, "#221A2E");
  vertical.addColorStop(1, "#14111E");
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  const lavenderGlow = ctx.createRadialGradient(
    STORY_WIDTH * 0.5,
    STORY_HEIGHT * 0.53,
    10,
    STORY_WIDTH * 0.5,
    STORY_HEIGHT * 0.53,
    780
  );
  lavenderGlow.addColorStop(0, "rgba(205,189,255,0.15)");
  lavenderGlow.addColorStop(0.22, "rgba(205,189,255,0.125)");
  lavenderGlow.addColorStop(0.52, "rgba(205,189,255,0.065)");
  lavenderGlow.addColorStop(0.78, "rgba(205,189,255,0.024)");
  lavenderGlow.addColorStop(1, "rgba(205,189,255,0)");
  ctx.fillStyle = lavenderGlow;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  const warmGlow = ctx.createRadialGradient(
    STORY_WIDTH * 0.5,
    STORY_HEIGHT * 0.72,
    20,
    STORY_WIDTH * 0.5,
    STORY_HEIGHT * 0.72,
    520
  );
  warmGlow.addColorStop(0, "rgba(255,214,201,0.06)");
  warmGlow.addColorStop(1, "rgba(255,214,201,0)");
  ctx.fillStyle = warmGlow;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  drawGrain(ctx);


  const badgeText = "Phrase du jour";
  const badgeY = SAFE.top + 60;
  const badgeHalfLine = 210;

  ctx.font = "700 34px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(222,214,245,0.72)";
  ctx.fillText(badgeText, STORY_WIDTH / 2, badgeY);

  const badgeLineY = badgeY + 24;
  const badgeLineGradient = ctx.createLinearGradient(
    STORY_WIDTH / 2 - badgeHalfLine,
    badgeLineY,
    STORY_WIDTH / 2 + badgeHalfLine,
    badgeLineY
  );
  badgeLineGradient.addColorStop(0, "rgba(205,189,255,0)");
  badgeLineGradient.addColorStop(0.5, "rgba(205,189,255,0.12)");
  badgeLineGradient.addColorStop(1, "rgba(205,189,255,0)");

  ctx.lineWidth = 1;
  ctx.strokeStyle = badgeLineGradient;
  ctx.beginPath();
  ctx.moveTo(STORY_WIDTH / 2 - badgeHalfLine, badgeLineY);
  ctx.lineTo(STORY_WIDTH / 2 + badgeHalfLine, badgeLineY);
  ctx.stroke();
  const quoteMaxWidth = 672;
  const quoteMaxHeight = 760;
  const quoteCenterY = STORY_HEIGHT * 0.53;
  const quoteSafeWidth = Math.min(quoteMaxWidth, STORY_WIDTH - SAFE.left - SAFE.right);

  const fitted = fitQuote(ctx, quote, quoteSafeWidth, quoteMaxHeight);
  ctx.font = `italic 600 ${fitted.fontSize}px 'Cormorant Garamond', serif`;
  ctx.fillStyle = "#F2F2F7";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(5,5,8,0.30)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  const blockHeight = fitted.lines.length * fitted.lineHeight;
  const startY = quoteCenterY - blockHeight / 2;

  fitted.lines.forEach((line, index) => {
    ctx.fillText(line, STORY_WIDTH / 2, startY + index * fitted.lineHeight);
  });

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  const logo = await loadSignatureLogo();
  if (logo) {
    drawLogoSignature(ctx, logo);
  }

  return canvasToPngBlob(canvas);
}

export async function shareOrDownloadImage(file: File, options: ShareOrDownloadOptions): Promise<ShareOrDownloadResult> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: options.title,
      text: options.text
    });
    return "shared";
  }

  const objectUrl = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = file.name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);

  return "downloaded";
}
