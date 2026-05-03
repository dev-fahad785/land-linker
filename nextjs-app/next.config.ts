import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins:[
    "http://localhost:3000",
    "http://192.168.10.18:3000",
    "https://land-linker.vercel.app"
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
