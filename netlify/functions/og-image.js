import satori from "satori";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const handler = async (event) => {
  const id = event.queryStringParameters.id;
  
  // Extract domain from event url to get review info
  const url = new URL(event.rawUrl);
  const domain = `${url.protocol}//${url.hostname}`;

  // Fetch Review details from backend
  const review = await fetch(`${domain}:4001/api/reviews/og/${id}`)
    .then(res => res.json());
    
  // Extract Review details
  const albumName = review.albumName;
  const artists = review.albumArtists;
  const albumImageUrl = review.albumImage;
  const songRatings = review.songRatings.map(
    s => ({
      name: s.trackName, 
      rating: s.rating
    })
  );
  const overallRating = review.overallRating
  // Limit to max 6 songs for display
  const songRatingsLength = songRatings.length < 7 ? songRatings.length : 6;
  
  // Compute per-position star types (full / half / empty) for a 5-star display.
  const songStarTypes = songRatings.map((s) => {
    const types = [];
    for (let pos = 0; pos < 5; pos++) {
      if (s.rating >= pos + 1) 
        types.push('full');
      else if (s.rating >= pos + 0.5) 
        types.push('half');
      else 
        types.push('empty');
    }
    return types;
  });
  
  // Fetch & process album Image
  const imageResponse = await fetch(albumImageUrl);
  const imageArrayBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = Buffer.from(imageArrayBuffer).toString("base64");
  const imageData = `data:${imageResponse.headers.get("content-type")};base64,${imageBase64}`;

  // Font Data
  const fontPath = path.resolve(process.cwd(), "public", "fonts", "Inter_24pt-Medium.ttf");
  const InterData = fs.readFileSync(fontPath);
  
  // Create SVG with satori
  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "1200px",
          height: "630px",
          background: "linear-gradient(180deg, rgba(18,18,20,0.95), rgba(22,22,22,0.98))",
          color: "white",
          padding: "40px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "40px",
        },
        children: [
          // Album cover
          {
            type: "img",
            props: {
              src: imageData,
              style: {
                width: "400px",
                height: "400px",
                borderRadius: "12px",
                objectFit: "cover",
                boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.04)",
              },
            },
          },

          // Text content
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              },
              children: [
                {
                  type: "h1",
                  props: {
                    style: {
                      fontSize: "56px",
                      marginBottom: "14px",
                      fontWeight: 700,
                      lineHeight: 1.05,
                      maxWidth: "760px",
                      whiteSpace: "normal",
                      overflowWrap: "break-word",
                    },
                    children: albumName,
                  },
                },
                // Artist line (if present)
                {
                  type: "p",
                  props: {
                    style: { fontSize: "26px", opacity: 0.75, marginTop: "-6px", marginBottom: "10px" },
                    children: artists || "",
                  },
                },
                {
                  type: "p",
                  props: {
                    style: { fontSize: "42px", opacity: 0.9, marginBottom: "14px" },
                    children: overallRating !== undefined ? `${overallRating}% Rating` : "",
                  },
                },
                // thin divider similar to template
                {
                  type: "div",
                  props: { style: { width: "100%", height: "1px", background: "rgba(255,255,255,0.06)", margin: "14px 0" } },
                },

                // Song-by-song ratings
                ...(songRatings && songRatings.length
                  ? [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            maxWidth: "760px",
                          },
                          children: songRatings.slice(0, songRatingsLength).map((t, i) => ({
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "26px",
                                opacity: 0.95,
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: { display: "flex", flexDirection: "row", alignItems: "center", gap: "12px" },
                                    children: [
                                      {
                                        type: "div",
                                        props: {
                                          style: {
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "9999px",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "15px",
                                            color: "#cfead0",
                                            background: "rgba(255,255,255,0.02)",
                                          },
                                          children: `${i + 1}`,
                                        },
                                      },
                                      { type: "span", props: { style: { color: "#eaeaea", flex: "1 1 auto", minWidth: 0 }, children: `${t.name}` } },
                                    ],
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    style: { display: "flex", gap: "6px", alignItems: "center", paddingRight: "64px", flex: "0 0 auto" },
                                    children: songStarTypes[i].map((st, si) => {
                                      const clipId = `starClip-${i}-${si}`;
                                      const starPath = "M12 .587l3.668 7.431 8.2 1.192-5.934 5.788 1.402 8.168L12 18.896 4.664 23.166l1.402-8.168L.132 9.21l8.2-1.192z";
                                      if (st === 'full') {
                                        return {
                                          type: 'svg',
                                          props: {
                                            width: '16',
                                            height: '16',
                                            viewBox: '0 0 24 24',
                                            xmlns: 'http://www.w3.org/2000/svg',
                                            children: [
                                              { type: 'path', props: { d: starPath, fill: '#f5c542' } },
                                            ],
                                          },
                                        };
                                      }
                                      if (st === 'half') {
                                        return {
                                          type: 'svg',
                                          props: {
                                            width: '16',
                                            height: '16',
                                            viewBox: '0 0 24 24',
                                            xmlns: 'http://www.w3.org/2000/svg',
                                            children: [
                                              {
                                                type: 'defs',
                                                props: {
                                                  children: [
                                                    {
                                                      type: 'clipPath',
                                                      props: {
                                                        id: clipId,
                                                        children: [
                                                          { type: 'rect', props: { x: '0', y: '0', width: '12', height: '24' } },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                              { type: 'path', props: { d: starPath, fill: '#f5c542', 'clip-path': `url(#${clipId})` } },
                                              { type: 'path', props: { d: starPath, fill: 'none', stroke: 'rgba(255,255,255,0.12)', 'stroke-width': '1' } },
                                            ],
                                          },
                                        };
                                      }
                                      return {
                                        type: 'svg',
                                        props: {
                                          width: '16',
                                          height: '16',
                                          viewBox: '0 0 24 24',
                                          xmlns: 'http://www.w3.org/2000/svg',
                                          children: [
                                            { type: 'path', props: { d: starPath, fill: 'none', stroke: 'rgba(255,255,255,0.12)', 'stroke-width': '1' } },
                                          ],
                                        },
                                      };
                                    }),
                                  },
                                },
                              ],
                            },
                          })),
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: InterData,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: InterData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  // convert SVG → PNG
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=604800",
    },
    body: png.toString("base64"),
    isBase64Encoded: true,
  };
};