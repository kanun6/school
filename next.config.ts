import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // ถ้าจะปิด optimizer ทั้งเว็บ (ไม่แนะนำถ้าไม่จำเป็น):
    // unoptimized: true,
  },
};

export default nextConfig;
