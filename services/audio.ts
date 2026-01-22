
// services/audio.ts

export interface SoundOption {
    id: string;
    name: string;
    icon: string;
    url: string;
}

// Google Actions sounds are reliable public links for testing/production
export const SOUND_LIBRARY: SoundOption[] = [
    { id: 'none', name: 'Off', icon: 'Off', url: '' },
    { id: 'rain', name: 'Rain', icon: '🌧️', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
    { id: 'forest', name: 'Forest', icon: '🌲', url: 'https://actions.google.com/sounds/v1/relaxing/forest_sounds.ogg' },
    { id: 'cafe', name: 'Cafe', icon: '☕', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
    { id: 'white', name: 'White Noise', icon: '🌊', url: 'https://actions.google.com/sounds/v1/relaxing/white_noise.ogg' },
];

class AudioServiceClass {
    private audio: HTMLAudioElement;
    private currentId: string = 'none';
    private fadeInterval: any = null;
    private isGlobalMuted: boolean = false;
    private customSounds: Map<string, string> = new Map();

    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.crossOrigin = "anonymous";
        
        // Auto-pause when backgrounded logic
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.isGlobalMuted = true;
                    this.fadeOut();
                } else {
                    this.isGlobalMuted = false;
                    // Auto resume logic is handled by React component state checks usually,
                    // but we can resume if we were playing.
                }
            });
        }
    }

    setVolume(vol: number) {
        this.audio.volume = Math.max(0, Math.min(1, vol));
    }

    registerCustomSound(id: string, url: string) {
        this.customSounds.set(id, url);
    }

    async play(id: string) {
        if (this.isGlobalMuted) return;
        if (id === 'none') {
            this.stop();
            return;
        }

        if (this.currentId === id && !this.audio.paused) return;

        let url = '';
        const defaultSound = SOUND_LIBRARY.find(s => s.id === id);
        if (defaultSound) {
            url = defaultSound.url;
        } else if (this.customSounds.has(id)) {
            url = this.customSounds.get(id)!;
        }

        if (!url) return;

        // Smooth switch
        if (!this.audio.paused && this.currentId !== id) {
            this.audio.src = url;
            this.currentId = id;
            try {
                await this.audio.play();
            } catch (e) {
                console.warn("Autoplay blocked", e);
            }
        } else {
            this.audio.src = url;
            this.currentId = id;
            try {
                await this.audio.play();
                this.fadeIn();
            } catch (e) {
                console.warn("Autoplay blocked", e);
            }
        }
    }

    stop() {
        this.currentId = 'none';
        this.fadeOut(() => {
            this.audio.pause();
            this.audio.currentTime = 0;
        });
    }

    pause() {
        this.fadeOut(() => this.audio.pause());
    }

    resume() {
        if (this.currentId !== 'none' && !this.isGlobalMuted) {
            this.audio.play().catch(e => console.warn(e));
            this.fadeIn();
        }
    }

    private fadeIn() {
        clearInterval(this.fadeInterval);
        // Simple implementation for now
    }

    private fadeOut(onComplete?: () => void) {
        clearInterval(this.fadeInterval);
        if (onComplete) onComplete();
    }
}

export const AudioService = new AudioServiceClass();
