/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    // Tailwind CSS v4 with full configuration support
    '@tailwindcss/postcss': {
      // Enable all v4 features
      experimental: {
        matchVariant: true,
      }
    },
    // Autoprefixer for browser compatibility
    autoprefixer: {
      // Support for last 2 versions of major browsers
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'not dead',
        'not ie <= 11'
      ]
    },
  },
};