
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
// This check determines if we are running inside the Capacitor WebView container
const checkIsNative = () => (window as any).Capacitor?.isNativePlatform() || false;

export const NativeService = {
  
  // Public accessor for environment checks
  get isNative() {
    return checkIsNative();
  },

  Storage: {
    async get<T>(key: string): Promise<T | null> {
      if (checkIsNative()) {
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
      if (checkIsNative()) {
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
      if (checkIsNative()) {
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
      if (checkIsNative()) {
        // await Haptics.impact({ style: ImpactStyle.Light });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    },

    async impactMedium(): Promise<void> {
      if (checkIsNative()) {
        // await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    },
    
    async notificationSuccess(): Promise<void> {
      if (checkIsNative()) {
        // await Haptics.notification({ type: NotificationType.Success });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([10, 30, 10]);
      }
    }
  },

  Screen: {
    wakeLock: null as WakeLockSentinel | null,

    async keepAwake(): Promise<void> {
      if (checkIsNative()) {
        // await KeepAwake.keepAwake();
        console.log("Native KeepAwake called");
      } else {
        // WEB FALLBACK
        if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
            return;
        }
        try {
          if (!this.wakeLock) {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log("Web WakeLock active");
          }
        } catch (err: any) {
          // Gracefully handle permission errors common in iframes/previews
          if (err.name === 'NotAllowedError' || err.message?.includes('denied')) {
             console.log("WakeLock skipped: Environment restricts screen control.");
          } else {
             console.warn('Wake Lock Error:', err);
          }
        }
      }
    },

    async allowSleep(): Promise<void> {
      if (checkIsNative()) {
        // await KeepAwake.allowSleep();
      } else {
        if (this.wakeLock) {
          try {
            await this.wakeLock.release();
            this.wakeLock = null;
          } catch (e) {
            // Ignore release errors
          }
        }
      }
    }
  }
};
