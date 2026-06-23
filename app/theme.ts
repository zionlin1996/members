import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
  shadows: {
    card: '0 2px 10px 0 rgba(0,0,0,.4)',
  },
  colors: {
    brand: {
      500: '#5865f2',
      600: '#4752c4',
      700: '#3c45a5',
    },
    surface: {
      canvas: '#1e1f22',
      base: '#2b2d31',
      input: '#1e1f22',
    },
    // Google Sign-In — dark variant per brand guidelines
    // https://developers.google.com/identity/branding-guidelines
    google: {
      bg: '#131314',
      hover: '#1e1e1e',
      active: '#242424',
      border: '#8E918F',
      text: '#E3E3E3',
    },
    // Telegram — brand blue
    telegram: {
      bg: '#0088CC',
      hover: '#0077B5',
      active: '#006699',
    },
  },

  semanticTokens: {
    colors: {
      'bg.canvas': { default: 'surface.canvas' },
      'bg.base': { default: 'surface.base' },
      'bg.input': { default: 'surface.input' },
      'bg.brand-subtle': { default: 'rgba(88, 101, 242, 0.12)' },
      'text.primary': { default: '#ffffff' },
      'text.secondary': { default: '#949ba4' },
      'text.muted': { default: '#6d6f78' },
    },
  },

  styles: {
    global: {
      'html, body': {
        bg: 'bg.canvas',
        color: 'text.primary',
        margin: 0,
      },
    },
  },

  components: {
    Input: {
      variants: {
        app: {
          field: {
            bg: 'bg.input',
            border: 'none',
            borderRadius: 'sm',
            color: 'text.primary',
            h: 10,
            _placeholder: { color: 'text.muted' },
            _hover: { bg: 'bg.input' },
            _focus: {
              bg: 'bg.input',
              boxShadow: '0 0 0 2px var(--chakra-colors-brand-500)',
            },
          },
        },
      },
      defaultProps: { variant: 'app' },
    },

    Button: {
      variants: {
        brand: {
          bg: 'brand.500',
          color: 'white',
          borderRadius: 'sm',
          fontWeight: 'medium',
          fontSize: 'sm',
          _hover: { bg: 'brand.600' },
          _active: { bg: 'brand.700' },
          _disabled: {
            opacity: 0.4,
            cursor: 'not-allowed',
            _hover: { bg: 'brand.500' },
          },
        },

        // Native auth methods (password, passkey) — same structure as google
        native: {
          width: 'full',
          height: 10,
          bg: 'bg.input',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'whiteAlpha.200',
          borderRadius: 'sm',
          fontWeight: 'medium',
          fontSize: 'sm',
          _hover: { bg: 'bg.input', borderColor: 'whiteAlpha.400' },
          _active: { bg: 'bg.input' },
        },

        google: {
          width: 'full',
          height: 10,
          bg: 'google.bg',
          color: 'google.text',
          border: '1px solid',
          borderColor: 'google.border',
          borderRadius: 'sm',
          fontWeight: 'medium',
          fontSize: 'sm',
          _hover: { bg: 'google.hover' },
          _active: { bg: 'google.active' },
        },

        telegram: {
          width: 'full',
          height: 10,
          bg: 'telegram.bg',
          color: 'white',
          border: '1px solid',
          borderColor: 'whiteAlpha.200',
          borderRadius: 'sm',
          fontWeight: 'medium',
          fontSize: 'sm',
          _hover: { bg: 'telegram.hover' },
          _active: { bg: 'telegram.active' },
        },
      },
    },

    FormLabel: {
      baseStyle: {
        color: 'text.secondary',
        fontSize: 'xs',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 'wider',
        mb: '6px',
      },
    },

    Modal: {
      baseStyle: {
        dialog: {
          bg: 'bg.base',
        },
        header: {
          color: 'text.primary',
          fontSize: 'lg',
          fontWeight: 'bold',
          pb: 2,
        },
        body: {
          pb: 4,
        },
        closeButton: {
          color: 'text.muted',
          _hover: { bg: 'whiteAlpha.100' },
        },
      },
    },
  },
})
