import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.gravitas.calisthenics',
  appName: 'GRAVITAS',
  webDir: 'dist',
  backgroundColor: '#100a07',
  android: {
    allowMixedContent: false,
  },
}

export default config
