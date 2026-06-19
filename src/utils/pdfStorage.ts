// In-memory cache to store temporary Blob URLs for the active browse session
const localBlobUrls = new Map<string, string>();

/**
 * Saves and caches the generated PDF in the browser memory as a Blob URL.
 * Keeps storage overhead extremely lightweight and works fully offline.
 */
export async function storePdfLocally(documentNo: string, pdfBytes: Uint8Array): Promise<string> {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  
  // Cache in-memory active session Blob URL
  localBlobUrls.set(documentNo, blobUrl);

  // Fallback cache in sessionStorage for page refreshes
  try {
    const base64Str = await blobToBase64(blob);
    sessionStorage.setItem(`draco_pdf_${documentNo}`, base64Str);
  } catch (e) {
    // SessionStorage quota full - active Blob URL is sufficient
  }

  return blobUrl;
}

/**
 * Retrieve saved PDF data URL from in-memory Blob or sessionStorage
 */
export function getStoredPdf(documentNo: string): string | null {
  const cachedUrl = localBlobUrls.get(documentNo);
  if (cachedUrl) return cachedUrl;

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
 * Triggers direct browser download of the compiled PDF document
 */
export function downloadPdfBytes(documentNo: string, pdfBytes: Uint8Array) {
  const safeFilename = `DeliveryNote_${documentNo.replace("/", "_")}.pdf`;
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
