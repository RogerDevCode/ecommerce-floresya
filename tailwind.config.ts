import type { Config } from 'tailwindcss'

export default {
  content: [
    './public/**/*.html',
    './public/**/*.{js,ts}',
    './public/pages/**/*.html',
    './src/frontend/**/*.{js,ts}',
    './src/**/*.{js,ts}',
    './*.html'
  ],
  theme: {
    extend: {
      colors: {
        // FloresYa Primary Colors - Premium Conversion-Optimized Palette
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777', // Main brand color
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#641625',
        },
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9e1437',
          900: '#831631',
          950: '#641021',
        },
        // Conversion-optimized urgency colors
        urgency: {
          orange: '#ea580c', // High-converting orange for CTA buttons
          red: '#dc2626',    // Critical urgency (low stock, limited time)
          yellow: '#d97706', // Moderate urgency (popular item)
        },
        // FloresYa brand extensions for emotional connection
        floresya: {
          pink: '#db2777',
          'pink-light': '#f9a8d4',
          'pink-dark': '#be185d',
          green: '#22c55e',
          'green-light': '#86efac',
          'green-dark': '#16a34a',
          // New conversion colors
          'coral': '#ff6b6b',
          'mint': '#51cf66',
          'lavender': '#845ef7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'], // For headings and prices
      },
      fontSize: {
        // Optimized typography scale for e-commerce
        'price-sm': ['1.125rem', { lineHeight: '1.375rem', fontWeight: '700' }],
        'price-base': ['1.5rem', { lineHeight: '2rem', fontWeight: '800' }],
        'price-lg': ['2rem', { lineHeight: '2.5rem', fontWeight: '900' }],
        'cta': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        // Container query friendly sizes
        'container-xs': '20rem',
        'container-sm': '24rem',
        'container-md': '28rem',
        'container-lg': '32rem',
      },
      aspectRatio: {
        'product': '1 / 1.2', // Optimized for product cards
        'hero': '16 / 9',
        'carousel': '3 / 2',
      },
      animation: {
        // Enhanced animations for conversion
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s infinite',
        'heart-beat': 'heartBeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        }
      },
      boxShadow: {
        // E-commerce optimized shadows
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 20px -4px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 32px -4px rgba(0, 0, 0, 0.12), 0 12px 48px -8px rgba(0, 0, 0, 0.08)',
        'cta': '0 4px 16px -2px rgba(234, 88, 12, 0.3)', // Orange CTA shadow
        'cta-hover': '0 8px 24px -4px rgba(234, 88, 12, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    // FloresYa Conversion-Optimized Components Plugin
    function({ addUtilities, addComponents, addVariant, theme }) {
      // Container Queries Support
      addVariant('container-xs', '@container (min-width: 20rem)')
      addVariant('container-sm', '@container (min-width: 24rem)')
      addVariant('container-md', '@container (min-width: 28rem)')
      addVariant('container-lg', '@container (min-width: 32rem)')

      // Conversion-optimized utilities
      addUtilities({
        // Primary color utilities (enhanced)
        '.text-primary-600': { color: theme('colors.primary.600') },
        '.bg-primary-600': { backgroundColor: theme('colors.primary.600') },
        '.border-primary-600': { borderColor: theme('colors.primary.600') },
        '.text-primary-500': { color: theme('colors.primary.500') },
        '.bg-primary-500': { backgroundColor: theme('colors.primary.500') },

        // Hover states
        '.hover\\:text-primary-600:hover': { color: theme('colors.primary.600') },
        '.hover\\:bg-primary-600:hover': { backgroundColor: theme('colors.primary.600') },
        '.hover\\:text-primary-700:hover': { color: theme('colors.primary.700') },
        '.hover\\:bg-primary-700:hover': { backgroundColor: theme('colors.primary.700') },

        // Container queries
        '.container-query': {
          containerType: 'inline-size',
        },

        // Touch-friendly sizing
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
        },

        // Conversion-focused text truncation
        '.line-clamp-1': {
          display: '-webkit-box',
          '-webkit-line-clamp': '1',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-2': {
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-3': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
      })

      // Premium E-commerce Components
      addComponents({
        // Primary CTA Button - Optimized for Conversion
        '.btn-buy-now': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem 1.5rem',
          fontSize: theme('fontSize.cta')[0],
          fontWeight: theme('fontSize.cta')[1].fontWeight,
          lineHeight: theme('fontSize.cta')[1].lineHeight,
          borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: theme('boxShadow.cta'),
          minHeight: '44px',
          '&:hover': {
            background: 'linear-gradient(135deg, #c2410c 0%, #b91c1c 100%)',
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.cta-hover'),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            opacity: '0.6',
            cursor: 'not-allowed',
            transform: 'none',
          },
        },

        // Secondary CTA - Add to Cart
        '.btn-add-cart': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem 1.5rem',
          fontSize: theme('fontSize.cta')[0],
          fontWeight: theme('fontSize.cta')[1].fontWeight,
          lineHeight: theme('fontSize.cta')[1].lineHeight,
          borderRadius: '0.75rem',
          backgroundColor: theme('colors.primary.600'),
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '44px',
          '&:hover': {
            backgroundColor: theme('colors.primary.700'),
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },

        // Product Card Container
        '.product-card': {
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: theme('boxShadow.card'),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          containerType: 'inline-size',
          '&:hover': {
            boxShadow: theme('boxShadow.card-hover'),
            transform: 'translateY(-4px)',
          },
        },

        // Price Display
        '.price-display': {
          fontFamily: theme('fontFamily.display'),
          fontSize: theme('fontSize.price-base')[0],
          lineHeight: theme('fontSize.price-base')[1].lineHeight,
          fontWeight: theme('fontSize.price-base')[1].fontWeight,
          color: theme('colors.gray.900'),
        },

        // Trust Badge
        '.trust-badge': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          borderRadius: '9999px',
          backgroundColor: theme('colors.green.100'),
          color: theme('colors.green.800'),
          border: `1px solid ${theme('colors.green.200')}`,
        },

        // Urgency Badge
        '.urgency-badge': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          borderRadius: '9999px',
          backgroundColor: theme('colors.red.100'),
          color: theme('colors.red.800'),
          border: `1px solid ${theme('colors.red.200')}`,
          animation: 'pulse 2s infinite',
        },
      })
    }
  ],
} satisfies Config