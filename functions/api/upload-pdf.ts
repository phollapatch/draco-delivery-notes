/**
 * Cloudflare Pages Function: /api/upload-pdf
 * Handles file uploads from the frontend and saves them directly to Cloudflare R2 Storage.
 */

interface Env {
  DRACO_PDF_BUCKET: R2Bucket;
  APP_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { env, request } = context;

    // Check if R2 Bucket is bound
    if (!env.DRACO_PDF_BUCKET) {
      return new Response(
        JSON.stringify({ error: "Cloudflare R2 Bucket 'DRACO_PDF_BUCKET' binding is missing." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentNo = formData.get("documentNo") as string | null;

    if (!file || !documentNo) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: file and documentNo." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert document number series to safe filename
    const safeFilename = `${documentNo.replace("/", "_")}.pdf`;
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Cloudflare R2 Bucket
    await env.DRACO_PDF_BUCKET.put(safeFilename, arrayBuffer, {
      httpMetadata: {
        contentType: "application/pdf",
        cacheControl: "public, max-age=31536000",
      },
      customMetadata: {
        documentNo: documentNo,
        uploadedAt: new Date().toISOString(),
      }
    });

    // Construct the public URL
    const appUrl = env.APP_URL || new URL(request.url).origin;
    const r2PublicUrl = `${appUrl}/api/pdf/${safeFilename}`;

    return new Response(
      JSON.stringify({
        success: true,
        filename: safeFilename,
        url: r2PublicUrl,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Server error occurred during R2 upload", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

