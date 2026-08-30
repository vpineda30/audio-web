import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.dotaudio.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/settings/",
          "/login/",
          "/register/",
          "/reset-password/",
          "/verify-email/",
          "/share/"
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}