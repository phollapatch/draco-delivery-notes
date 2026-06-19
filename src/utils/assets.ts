export const REPRESENTATIVE_NAME = "นายพลภัทร ชีช้าง";

export function getAssetUrl(filename: string): string {
  const localKey = "real_" + filename.replace(".", "_");
  const stored = localStorage.getItem(localKey);
  if (stored) {
    return stored;
  }
  
  // Return gorgeous high-fidelity built-in fallback SVGs as base64 data URIs
  if (filename === "logo.png") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="bunnyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#059669" />
        </linearGradient>
      </defs>
      <!-- Geometric Bunny Ears -->
      <path d="M 45 42 C 45 15, 53 10, 53 30 C 53 45, 45 45, 45 42 Z" fill="url(#bunnyGrad)" />
      <path d="M 75 42 C 75 15, 67 10, 67 30 C 67 45, 75 45, 75 42 Z" fill="url(#bunnyGrad)" />
      <!-- Rounded face -->
      <circle cx="60" cy="57" r="22" fill="url(#bunnyGrad)" />
      <!-- Minimalist white eyes -->
      <circle cx="52" cy="54" r="3" fill="#ffffff" />
      <circle cx="68" cy="54" r="3" fill="#ffffff" />
      <!-- Nose/mouth -->
      <path d="M 58 61 L 62 61 L 60 63 Z" fill="#ffffff" />
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg.trim())))}`;
  }
  
  if (filename === "signature.png") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120">
      <!-- Elegant handwriting line representing signature -->
      <path d="M 30 75 C 60 30, 70 20, 80 85 C 95 95, 110 30, 115 50 C 130 90, 160 80, 190 40 C 210 20, 230 90, 245 80 C 260 70, 280 40, 290 55 C 300 70, 310 80, 340 70" fill="none" stroke="#2563eb" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Underline flourish -->
      <path d="M 45 92 C 120 95, 180 88, 360 78 C 300 102, 100 105, 75 99" fill="#2563eb" opacity="0.6" stroke="#2563eb" stroke-width="1.5" />
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg.trim())))}`;
  }
  
  if (filename === "company-stamp.png") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <!-- Outer Circle Ring -->
      <circle cx="100" cy="100" r="92" fill="none" stroke="#2563eb" stroke-width="3" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#2563eb" stroke-width="1" stroke-dasharray="4 2" />
      <!-- Inner Circle Ring -->
      <circle cx="100" cy="100" r="76" fill="none" stroke="#2563eb" stroke-width="1.5" />
      
      <!-- Curved Text Elements -->
      <defs>
        <path id="pathTop" d="M 38 100 A 62 62 0 0 1 162 100" fill="none" />
        <path id="pathBottom" d="M 162 100 A 62 62 0 1 1 38 100" fill="none" />
      </defs>
      
      <!-- Thai Corporate Header -->
      <text fill="#2563eb" font-family="sans-serif" font-size="9px" font-weight="900" style="letter-spacing: 0.8px;">
        <textPath href="#pathTop" startOffset="50%" text-anchor="middle">
          บริษัท บันนี่ คอร์ป จำกัด
        </textPath>
      </text>
      
      <!-- English Corporate Footer -->
      <text fill="#2563eb" font-family="sans-serif" font-size="8px" font-weight="900" style="letter-spacing: 0.5px;">
        <textPath href="#pathBottom" startOffset="50%" text-anchor="middle">
          BUNNY CORP CO., LTD.
        </textPath>
      </text>
      
      <!-- Star dividers -->
      <text fill="#2563eb" font-family="sans-serif" font-size="12px" x="22" y="104">★</text>
      <text fill="#2563eb" font-family="sans-serif" font-size="12px" x="168" y="104">★</text>
      
      <!-- Geometric Minimalist Rabbit Center Motif -->
      <path d="M 88 105 C 88 90, 93 87, 93 97 C 93 105, 88 105, 88 105 Z" fill="#2563eb" />
      <path d="M 112 105 C 112 90, 107 87, 107 97 C 107 105, 112 105, 112 105 Z" fill="#2563eb" />
      <circle cx="100" cy="112" r="10" fill="#2563eb" />
      <circle cx="96" cy="110" r="1.5" fill="#ffffff" />
      <circle cx="104" cy="110" r="1.5" fill="#ffffff" />
      <polygon points="99,114 101,114 100,116" fill="#ffffff" />
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg.trim())))}`;
  }
  
  return `/assets/${filename}`;
}



