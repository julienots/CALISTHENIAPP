import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.gravitas.calisthenics',
  appName: 'GRAVITAS',
  webDir: 'dist',
  backgroundColor: '#05060a',
  android: {
    allowMixedContent: false,
  },
}

export default config
