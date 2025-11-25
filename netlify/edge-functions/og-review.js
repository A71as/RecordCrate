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

    // We extract the domain from our url, is more flexible than a static constant
    const domain = `${url.protocol}//${url.hostname}`;

    console.log("fetching review...");
    // Fetch review data from your backend
    // Ideally this should be after the if statement below. But the id given is not the album id
    const review = await fetch(`${domain}:4000/api/reviews/${id}`)
        .then(res => res.json());
    console.log("fetched review.");

    // Here lies the redirect url for real users. Make sure this points to an actual page
    if (isBot) {
        return Response.redirect(`${domain}:5173/album/${review.albumId}`, 302);
    }

    // Image url, is created by the netlify function called og-image
    const ogImageUrl =
        `${domain}/.netlify/functions/og-image?id=${id}`;

    // Meta tags for the crawler/bot to read
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <meta property="og:title" content="${review.albumName}" />
      <meta property="og:description" content="My ${review.overallRating}% review of ${review.albumName}" />
      <meta property="og:image" content="${ogImageUrl}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${domain}/og/review/${id}" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${review.albumName}" />
      <meta name="twitter:description" content="My ${review.overallRating}% review of ${review.albumName}" />
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