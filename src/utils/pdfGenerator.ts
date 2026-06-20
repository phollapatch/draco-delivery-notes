import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { DeliveryNote } from "../types";
import { renderDeliveryNoteHtml } from "../components/DeliveryNotePdfTemplate";

/**
 * Generates an A4 portrait PDF for a DeliveryNote using browser-based HTML rendering.
 * This guarantees 100% correct Thai shaping, positioning, and overall glyph styling.
 */
export async function generateDeliveryNotePdf(note: DeliveryNote): Promise<Uint8Array> {
  // Create absolute offscreen container styled as pristine A4 page
  const container = document.createElement("div");
  container.className = "delivery-note-page-container";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "210mm";
  container.style.height = "297mm";
  container.style.boxSizing = "border-box";
  container.style.backgroundColor = "#ffffff";
  container.style.overflow = "hidden";
  container.style.zIndex = "-1000";

  // Populate structured DOM content using clean HTML template
  container.innerHTML = renderDeliveryNoteHtml(note);

  document.body.appendChild(container);

  try {
    // Wait for all template images to download and load fully
    const imageElements = container.querySelectorAll("img");
    const imagePromises = Array.from(imageElements).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // continue anyway if failed
      });
    });
    
    await Promise.all(imagePromises);

    // Wait for web fonts (Sarabun is dynamically loaded)
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (err) {
        console.warn("Fonts ready loading timed out/failed:", err);
      }
    }

    // Add safe settling timeout
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Convert offscreen rendered DOM block representation of precisely our container into canvas
    const canvas = await html2canvas(container, {
      scale: 2, // 2x for extremely crisp, high-resolution text
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Create jsPDF portrait document of exact size A4
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // A4 dimensions are exactly 210mm x 297mm.
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

    // Output binary buffer unit array representation
    const pdfArrayBuffer = pdf.output("arraybuffer");
    return new Uint8Array(pdfArrayBuffer);
  } finally {
    // Clean up DOM node beautifully to preserve pristine browser document space
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

