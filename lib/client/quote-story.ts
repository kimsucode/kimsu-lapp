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
  brand: string;
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

export async function renderQuoteStoryCanvas({ quote, brand }: RenderQuoteStoryParams): Promise<Blob> {
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
  lavenderGlow.addColorStop(0, "rgba(205,189,255,0.14)");
  lavenderGlow.addColorStop(0.6, "rgba(205,189,255,0.06)");
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

  const pillText = "Phrase du jour";
  ctx.font = "600 38px 'DM Sans', sans-serif";
  ctx.textAlign = "center";

  const pillPaddingX = 36;
  const pillHeight = 72;
  const pillRadius = 36;
  const pillWidth = ctx.measureText(pillText).width + pillPaddingX * 2;
  const pillX = STORY_WIDTH / 2 - pillWidth / 2;
  const pillY = SAFE.top + 20;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillRadius);
  ctx.fillStyle = "rgba(205,189,255,0.10)";
  ctx.fill();
  ctx.strokeStyle = "rgba(205,189,255,0.30)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(222,214,245,0.90)";
  ctx.letterSpacing = "0.08em";
  ctx.fillText(pillText, STORY_WIDTH / 2, pillY + 47);

  const quoteMaxWidth = 760;
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

  const hairlineY = STORY_HEIGHT - SAFE.bottom - 76;
  ctx.strokeStyle = "rgba(242,242,247,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(STORY_WIDTH / 2 - 180, hairlineY);
  ctx.lineTo(STORY_WIDTH / 2 + 180, hairlineY);
  ctx.stroke();

  ctx.font = "500 34px 'DM Sans', sans-serif";
  ctx.fillStyle = "rgba(242,242,247,0.76)";
  ctx.textAlign = "center";
  ctx.fillText(brand, STORY_WIDTH / 2, STORY_HEIGHT - 120);

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
