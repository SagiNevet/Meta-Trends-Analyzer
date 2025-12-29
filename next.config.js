/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    // Ignore papaparse in webpack analysis for server-side
    if (isServer) {
      config.externals = config.externals || [];
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          (context) => {
            if (context.request === 'papaparse') {
              return 'commonjs papaparse';
            }
          },
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push('papaparse');
      } else {
        config.externals = [config.externals, 'papaparse'];
      }
    }
    return config;
  },
  // Mark papaparse as external for server-side only
  serverExternalPackages: ['papaparse'],
}

module.exports = nextConfig

