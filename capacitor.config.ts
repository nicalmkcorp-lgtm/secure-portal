
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nicalmkcorp.app',
  appName: 'Nica Lmk Corp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  plugins: {
    ScreenOrientation: {
      orientation: 'portrait-primary'
    }
  }
};

export default config;
