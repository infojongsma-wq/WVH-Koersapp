/** @type {import('next').NextConfig} */
const nextConfig = {
  // Off because react-leaflet v4 re-initializes its MapContainer on strict-mode
  // double-invoke and throws "Map container is already initialized".
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
