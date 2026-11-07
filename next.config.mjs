/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // @react-pdf/renderer optionally requires "canvas" (Node only). We only
    // render PDFs in the browser, so tell webpack to ignore it.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
