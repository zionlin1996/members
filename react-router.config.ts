import type { Config } from '@react-router/dev/config'

export default {
  ssr: false,
  async prerender() {
    return ['/']
  },
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config
