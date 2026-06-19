import { triggerFileDownload } from "./excel";

// In-memory cache to store temporary Blob URLs for active session
const localBlobUrls = new Map<string, string>();

/**
 * Saves or uploads the generated PDF.
 * If in mock mode (development), it creates an in-memory blob URL.
 * In a real Cloudflare deployment, it makes a POST request to our Pages Function endpoint (/api/upload-pdf).
 */
export async function uploadPdfToR2(documentNo: string, pdfBytes: Uint8Array): Promise<string> {
  // Convert document suffix e.g. BC26/001 to safe filename e.g. BC26_001.pdf
  const safeFilename = `${documentNo.replace("/", "_")}.pdf`;

  // 1. Production Mode: check if we should hit the real Pages Function API endpoint
  const metaEnv = (import.meta as any).env || {};
  if (metaEnv.PROD && metaEnv.VITE_MOCK_R2_STORAGE !== "true") {
    try {
      const formData = new FormData();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      formData.append("file", pdfBlob, safeFilename);
      formData.append("documentNo", documentNo);

      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url; // Returns the public Cloudflare R2 url of the saved PDF
      } else {
        throw new Error(`Upload failed with status code: ${response.status}`);
      }
    } catch (err) {
      console.warn("R2 Upload failed, falling back to local Blob storage:", err);
    }
  }

  // 2. Fallback / Dev Mock: Generate local client-side BLOB URL which behaves exactly
  // like a hosted PDF link for downloading, sharing and iframe previewing.
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  
  // Cache in-memory for active session
  localBlobUrls.set(documentNo, blobUrl);

  // Safely cache in sessionStorage as dataURL fallback (isolated quota, self-clearing, doesn't affect localStorage)
  try {
    const base64Str = await blobToBase64(blob);
    sessionStorage.setItem(`draco_pdf_${documentNo}`, base64Str);
  } catch (e) {
    // Ignore if sessionStorage is full or unavailable - Blob URL is sufficient
  }

  return blobUrl;
}

/**
 * Retrieve saved PDF bytes from mock sessionStorage Base64 or Blob storage
 */
export function getStoredPdf(documentNo: string): string | null {
  // First check in-memory active Blob URL
  const cachedUrl = localBlobUrls.get(documentNo);
  if (cachedUrl) return cachedUrl;

  // Fallback to sessionStorage
  try {
    const base64Str = sessionStorage.getItem(`draco_pdf_${documentNo}`);
    if (base64Str) {
      if (base64Str.startsWith("data:")) return base64Str;
      return `data:application/pdf;base64,${base64Str}`;
    }
  } catch (e) {
    // ignored
  }
  return null;
}

/**
 * Downloads a stored PDF immediately by document number
 */
export function downloadPdfBytes(documentNo: string, pdfBytes: Uint8Array) {
  const safeFilename = `${documentNo.replace("/", "_")}.pdf`;
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(",")[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
