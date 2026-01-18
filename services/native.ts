
/**
 * services/native.ts
 * 
 * THE BRIDGE: Connects React to Device Capabilities.
 * 
 * HYBRID IMPLEMENTATION:
 * Automatically detects if running in a Capacitor (Native) environment or Web Browser.
 * - Native: Uses official Capacitor plugins.
 * - Web: Uses Browser APIs (localStorage, Navigator) as fallbacks.
 */

// We use 'any' for window.Capacitor to avoid TS errors without installing types yet
const isNative = () => (window as any).Capacitor?.isNativePlatform();

// Helper to safely import plugins only when needed (Optional, but good practice)
// For this strict version, we assume plugins are available globally if isNative is true,
// or we keep the import logic simple.
// Since we can't dynamic import easily in this setup without complex bundler config,
// we will simulate the bridge pattern.

// NOTE: In a real build, you would import these at the top.
// import { Preferences } from '@capacitor/preferences';
// import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
// import { KeepAwake } from '@capacitor/keep-awake';

// Mocking the plugin calls for the XML output validity while explaining the logic
// In your real Capacitor project, uncomment the imports above and remove these mocks if installed.

export const NativeService = {
  
  Storage: {
    async get<T>(key: string): Promise<T | null> {
      if (isNative()) {
        // const { value } = await Preferences.get({ key });
        // return value ? JSON.parse(value) : null;
        console.log('Native Storage GET called (Simulated for now)');
        return null; 
      } else {
        // WEB FALLBACK
        return new Promise((resolve) => {
          try {
            const item = localStorage.getItem(key);
            resolve(item ? JSON.parse(item) : null);
          } catch (e) {
            console.error(`Error loading key ${key}`, e);
            resolve(null);
          }
        });
      }
    },

    async set(key: string, value: any): Promise<void> {
      if (isNative()) {
        // await Preferences.set({ key, value: JSON.stringify(value) });
        console.log('Native Storage SET called');
      } else {
        // WEB FALLBACK
        return new Promise((resolve) => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
            resolve();
          } catch (e) {
            console.error(`Error saving key ${key}`, e);
            resolve();
          }
        });
      }
    },

    async remove(key: string): Promise<void> {
      if (isNative()) {
        // await Preferences.remove({ key });
      } else {
        return new Promise((resolve) => {
          localStorage.removeItem(key);
          resolve();
        });
      }
    }
  },

  Haptics: {
    async impactLight(): Promise<void> {
      if (isNative()) {
        // await Haptics.impact({ style: ImpactStyle.Light });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    },

    async impactMedium(): Promise<void> {
      if (isNative()) {
        // await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    },
    
    async notificationSuccess(): Promise<void> {
      if (isNative()) {
        // await Haptics.notification({ type: NotificationType.Success });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([10, 30, 10]);
      }
    }
  },

  Screen: {
    wakeLock: null as WakeLockSentinel | null,

    async keepAwake(): Promise<void> {
      if (isNative()) {
        // await KeepAwake.keepAwake();
        console.log("Native KeepAwake called");
      } else {
        try {
          if ('wakeLock' in navigator && !this.wakeLock) {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log("Web WakeLock active");
          }
        } catch (err) {
          console.warn('Wake Lock denied', err);
        }
      }
    },

    async allowSleep(): Promise<void> {
      if (isNative()) {
        // await KeepAwake.allowSleep();
      } else {
        if (this.wakeLock) {
          await this.wakeLock.release();
          this.wakeLock = null;
        }
      }
    }
  }
};
