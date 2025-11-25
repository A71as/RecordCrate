import satori from "satori";
import sharp from "sharp";
import fs from "fs";

export const handler = async (event) => {
  console.log("called");
  const id = event.queryStringParameters.id;
  
  const url = new URL(event.rawUrl);
  // We extract the domain from our url, is more flexible than a static constant
  const domain = `${url.protocol}//${url.hostname}`;

  const review = await fetch(`${domain}:4000/api/reviews/${id}`)
    .then(res => res.json());

  const InterData = fs.readFileSync("public/fonts/Inter_24pt-Medium.ttf");

  const svg = await satori({
      type: "div",
      props: {
        style: {
          width: "1200px",
          height: "630px",
          background: "#121212",
          color: "white",
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        },
        children: [
          {
            type: "h1",
            props: {
              style: { fontSize: "64px", marginBottom: "20px" },
              children: review.albumName,
            },
          },
          {
            type: "p",
            props: {
              style: { fontSize: "48px", opacity: 0.8 },
              children: `${review.overallRating}% Rating`,
            },
          },
        ],
      },
    },
    { 
      width: 1200, height: 630, 
      fonts: [{ 
        name: "Inter", data: InterData, weight: 400 
      }]
    }
  );

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