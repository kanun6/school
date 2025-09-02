// next.config.ts
import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
let SUPABASE_HOST: string | null = null;
try {
  if (SUPABASE_URL) SUPABASE_HOST = new URL(SUPABASE_URL).hostname;
} catch {
  SUPABASE_HOST = null;
}

const remotePatterns: RemotePattern[] = [
  // เผื่อกรณีโดเมน supabase เปลี่ยน region
  { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/**' },
  { protocol: 'https', hostname: '**.supabase.in', pathname: '/storage/v1/object/**' },
  { protocol: 'https', hostname: '**.supabase.net', pathname: '/storage/v1/object/**' },
];

// ระบุโฮสต์ของโปรเจ็กต์คุณแบบเจาะจงจาก .env (ถ้ามี)
if (SUPABASE_HOST) {
  remotePatterns.unshift({
    protocol: 'https',
    hostname: SUPABASE_HOST,
    pathname: '/storage/v1/object/**',
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // หากต้องการปิด optimizer ทั้งเว็บ:
    // unoptimized: true,
  },
};

export default nextConfig;
