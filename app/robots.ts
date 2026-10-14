import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ticketlagbe.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/tickets",
          "/tickets/*",
          "/create-listing",
          "/verification-result",
          "/login",
          "/signup",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/dashboard",
          "/dashboard/*",
          "/order/*",
          "/checkout",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
