/**
 * Cloudflare Pages Function: /api/pdf/[filename]
 * Serves uploaded PDFs directly out of our Cloudflare R2 bucket.
 */

interface Env {
  DRACO_PDF_BUCKET: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const filename = params.filename as string;

  if (!filename) {
    return new Response("Filename is required", { status: 400 });
  }

  // Check if R2 Bucket is bound
  if (!env.DRACO_PDF_BUCKET) {
    return new Response(
      JSON.stringify({ error: "Cloudflare R2 Bucket 'DRACO_PDF_BUCKET' binding is missing." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const object = await env.DRACO_PDF_BUCKET.get(filename);
    
    if (!object) {
      return new Response("Document not found in storage", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Content-Type", "application/pdf");
    // Disable indexing of client document links for security
    headers.set("X-Robots-Tag", "noindex, nofollow");

    return new Response(object.body, {
      headers,
    });
  } catch (err: any) {
    return new Response(`Error retrieving PDF: ${err.message}`, { status: 500 });
  }
};
