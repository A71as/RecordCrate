export default async (request) => {
    const url = new URL(request.url);
    const id = url.pathname.split("review/").pop();

    const ua = request.headers.get("user-agent")?.toLowerCase() || "";

    // For a site to show our preview, add their bot to this list
    const bots = [
        "facebookexternalhit",
        "twitterbot",
        "discordbot",
        "whatsapp",
        "slackbot",
        "googlebot",
        "linkedinbot",
        "pinterest",
        "bingbot",
    ];
    // Boolean that is true if user is a bot (crawler) or false if not
    const isBot = bots.some(bot => ua.includes(bot));

    // origin includes hostname and port (if present) and is appropriate for link generation
    const origin = url.origin;
    // API host for backend (server runs on port 4001 in this setup)
    const apiHost = `${url.protocol}//${url.hostname}:4001`;

    // Fetch review data from your backend
    // Ideally this should be after the if statement below. But the id given is not the album id
    const review = await fetch(`${apiHost}/api/reviews/${id}`)
        .then(res => res.json()).catch(() => ({}));

    // Here lies the redirect url for real users. Make sure this points to an actual page
    if (!isBot) {
        return Response.redirect(`${domain}:8888/album/${review.albumId}`, 302);
    }

    // Image url, created by the netlify function called og-image
    const ogImageUrl = `${origin}/.netlify/functions/og-image?id=${id}`;

    // Short excerpt for description (if available)
    const excerpt = (review.writeup || '').replace(/\s+/g, ' ').trim().slice(0, 200);

    // Meta tags for the crawler/bot to read
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${review.albumName} — ${review.overallRating}% review</title>
    <meta name="description" content="${excerpt || `My ${review.overallRating}% review of ${review.albumName} on RecordCrate.`}" />
    <meta property="og:site_name" content="RecordCrate" />
    <meta property="og:title" content="${review.albumName} — ${review.overallRating}%" />
    <meta property="og:description" content="${excerpt || `My ${review.overallRating}% review of ${review.albumName} on RecordCrate.`}" />
      <meta property="og:image" content="${ogImageUrl}" />
      <meta property="og:type" content="website" />
    <meta property="og:url" content="${origin}/og/review/${id}" />

      <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${review.albumName} — ${review.overallRating}%" />
    <meta name="twitter:description" content="${excerpt || `My ${review.overallRating}% review of ${review.albumName} on RecordCrate.`}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    </head>
    <body></body>
    </html>
  `;

    return new Response(html, {
        headers: { "content-type": "text/html" },
    });
}

// This config constant determines which path will trigger the function
export const config = { path: "/og/review/:id" };