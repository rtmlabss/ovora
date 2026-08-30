import path from "node:path";

const nextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;