export const STORY_CARD_LAYOUT = {
  canvas: {
    width: 1080,
    height: 1920
  },
  background: {
    top: "#2B213A",
    middle: "#221A2E",
    bottom: "#151221"
  },
  halo: {
    centerXRatio: 0.5,
    centerYRatio: 0.56,
    innerRadius: 20,
    outerRadius: 500,
    innerColor: "rgba(205,189,255,0.28)",
    outerColor: "rgba(205,189,255,0)"
  },
  badge: {
    text: "Phrase du jour",
    y: 552,
    textY: 594,
    paddingX: 36,
    height: 64,
    radius: 32,
    font: "600 38px 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    fillColor: "rgba(205,189,255,0.12)",
    borderColor: "rgba(205,189,255,0.34)",
    borderWidth: 2,
    textColor: "rgba(205,189,255,0.9)"
  },
  quote: {
    centerYRatio: 0.58,
    maxWidthPadding: 210,
    lineHeight: 98,
    font: "italic 600 68px 'Cormorant Garamond', Georgia, serif",
    color: "#F2F2F7"
  },
  signature: {
    yOffsetFromBottom: 160,
    font: "500 34px 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "rgba(242,242,247,0.78)"
  }
} as const;
