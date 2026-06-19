export const REPRESENTATIVE_NAME = "นายพลภัทร ชีช้าง";

function drawCircularText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  radius: number,
  totalAngle: number,
  baseRotation: number,
  isBottom: boolean
) {
  ctx.save();
  const chars = text.split("");
  const step = totalAngle / Math.max(1, chars.length - 1);
  const startAngle = baseRotation - (totalAngle / 2);

  chars.forEach((char, i) => {
    // If bottom, read characters left-to-right (from right angle side to left)
    const angle = isBottom ? (baseRotation + (totalAngle / 2) - i * step) : (startAngle + i * step);
    ctx.save();
    ctx.translate(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
    // Rotate text characters correctly depending on arc side
    ctx.rotate(angle + (isBottom ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function renderLogoToPng(): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 120;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Draw cute emerald bunny head
  ctx.fillStyle = "#10b981";

  // Left ear
  ctx.beginPath();
  ctx.ellipse(46, 44, 9, 24, Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Right ear
  ctx.beginPath();
  ctx.ellipse(74, 44, 9, 24, -Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();

  // Face circle
  ctx.beginPath();
  ctx.arc(60, 68, 21, 0, Math.PI * 2);
  ctx.fill();

  // Cute white eyes
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(52, 65, 3, 0, Math.PI * 2);
  ctx.arc(68, 65, 3, 0, Math.PI * 2);
  ctx.fill();

  // Nose triangle
  ctx.beginPath();
  ctx.moveTo(58, 72);
  ctx.lineTo(62, 72);
  ctx.lineTo(60, 75);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL("image/png");
}

function renderSignatureToPng(): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Draw elegant ink blue handwritten lines
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(40, 75);
  ctx.bezierCurveTo(70, 20, 80, 15, 90, 85);
  ctx.bezierCurveTo(105, 95, 120, 25, 125, 50);
  ctx.bezierCurveTo(140, 90, 170, 80, 200, 35);
  ctx.bezierCurveTo(220, 15, 240, 95, 255, 80);
  ctx.bezierCurveTo(270, 70, 290, 35, 300, 50);
  ctx.bezierCurveTo(310, 65, 320, 75, 350, 65);
  ctx.stroke();

  // Clear underline flourish
  ctx.strokeStyle = "rgba(37, 99, 235, 0.55)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(55, 94);
  ctx.bezierCurveTo(130, 97, 190, 90, 365, 80);
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

function renderStampToPng(): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const blueColor = "#2563eb";
  
  // Double concentric circle rings
  ctx.strokeStyle = blueColor;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(100, 100, 90, 0, Math.PI * 2);
  ctx.stroke();

  // Dotted inner circle ring
  ctx.lineWidth = 1.0;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(100, 100, 82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Solid innermost ring
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(100, 100, 74, 0, Math.PI * 2);
  ctx.stroke();

  // Draw corporate text elements curved elegantly
  ctx.fillStyle = blueColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Thai text on top arc
  ctx.font = "900 9px sans-serif";
  drawCircularText(ctx, "บริษัท บันนี่ คอร์ป จำกัด", 100, 100, 61, Math.PI * 0.72, -Math.PI / 2, false);

  // English text on bottom arc
  ctx.font = "900 8.5px sans-serif";
  drawCircularText(ctx, "BUNNY CORP CO., LTD.", 100, 100, 61, Math.PI * 0.72, Math.PI / 2, true);

  // Star markers
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("★", 38, 100);
  ctx.fillText("★", 162, 100);

  // Center rabbit profile icon
  // Ears
  ctx.beginPath();
  ctx.ellipse(93, 104, 3.5, 9, Math.PI / 12, 0, Math.PI * 2);
  ctx.ellipse(107, 104, 3.5, 9, -Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();

  // Face circle
  ctx.beginPath();
  ctx.arc(100, 112, 9, 0, Math.PI * 2);
  ctx.fill();

  // Eyes highlight
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(97, 110, 1.2, 0, Math.PI * 2);
  ctx.arc(103, 110, 1.2, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL("image/png");
}

export function getAssetUrl(filename: string): string {
  const localKey = "real_" + filename.replace(".", "_");
  
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(localKey);
    if (stored) {
      return stored;
    }
  }
  
  // Return gorgeous pre-compiled raster fallbacks instead of SVG to guarantee html2canvas compatibility
  if (filename === "logo.png") {
    return renderLogoToPng();
  }
  
  if (filename === "signature.png") {
    return renderSignatureToPng();
  }
  
  if (filename === "company-stamp.png") {
    return renderStampToPng();
  }
  
  return `/assets/${filename}`;
}



