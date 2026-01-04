import type { NextConfig } from "next";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://kairos.localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy Frappe API calls (but not our own /api routes)
        {
          source: "/api/resource/:path*",
          destination: FRAPPE_URL + "/api/resource/:path*",
        },
        {
          source: "/api/method/:path*", 
          destination: FRAPPE_URL + "/api/method/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
