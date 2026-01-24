
// services/audio.ts

export type SoundCategory = 'frequency' | 'ambience' | 'custom' | 'none';

export interface SoundOption {
    id: string;
    name: string;
    category: SoundCategory;
    url: string;
    isGenerated?: boolean; 
}

// 初始库，后续将由用户发送的文件填充
export const SOUND_LIBRARY: SoundOption[] = [
    { id: 'none', name: 'Off', category: 'none', url: '' },
    { id: 'white', name: 'White Noise', category: 'frequency', url: '', isGenerated: true },
];

class AudioServiceClass {
    private audio: HTMLAudioElement | null = null;
    private audioCtx: AudioContext | null = null;
    private whiteNoiseNode: AudioBufferSourceNode | null = null;
    private gainNode: GainNode | null = null;

    private currentId: string = 'none';
    private fadeInterval: any = null;
    
    // Volume Management
    private baseVolume: number = 0.5; 
    private dynamicScale: number = 1.0; 
    private isAutoVolumeEnabled: boolean = true; // 预留开关
    private isGlobalMuted: boolean = false;
    
    private customSounds: Map<string, string> = new Map();

    constructor() {}

    private init() {
        if (this.audio) return;
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.crossOrigin = "anonymous";
        
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.isGlobalMuted = true;
                    this.applyVolume(0);
                } else {
                    this.isGlobalMuted = false;
                    this.rampVolumeToTarget();
                }
            });
        }
    }

    setVolume(vol: number) {
        if (!this.audio) this.init();
        this.baseVolume = Math.max(0, Math.min(1, vol));
        this.rampVolumeToTarget();
    }

    // --- 核心：自动音量调节逻辑 ---
    setDynamicVolumeScale(scale: number) {
        if (!this.isAutoVolumeEnabled) {
            this.dynamicScale = 1.0;
        } else {
            this.dynamicScale = scale;
        }
        this.rampVolumeToTarget();
    }

    setAutoVolumeEnabled(enabled: boolean) {
        this.isAutoVolumeEnabled = enabled;
        if (!enabled) this.dynamicScale = 1.0;
        this.rampVolumeToTarget();
    }

    private getTargetVolume() {
        if (this.isGlobalMuted) return 0;
        return this.baseVolume * this.dynamicScale;
    }

    private applyVolume(vol: number) {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        if (this.audio) this.audio.volume = vol;
        if (this.gainNode && this.audioCtx) {
            try {
                this.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
                this.gainNode.gain.setTargetAtTime(vol * 0.15, this.audioCtx.currentTime, 0.1);
            } catch (e) {}
        }
    }

    private rampVolumeToTarget() {
        if (!this.audio) return;
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        const target = this.getTargetVolume();
        
        this.fadeInterval = setInterval(() => {
            if (!this.audio) return;
            const current = this.audio.volume; 
            const diff = target - current;
            
            if (Math.abs(diff) < 0.02) {
                this.applyVolume(target);
                if (this.fadeInterval) clearInterval(this.fadeInterval);
            } else {
                const next = current + (diff > 0 ? 0.02 : -0.02);
                this.audio.volume = Math.max(0, Math.min(1, next));
                if (this.gainNode && this.audioCtx) {
                    this.gainNode.gain.setValueAtTime(next * 0.15, this.audioCtx.currentTime);
                }
            }
        }, 30);
    }

    private initWebAudio() {
        if (!this.audioCtx) {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
                this.gainNode = this.audioCtx.createGain();
                this.gainNode.connect(this.audioCtx.destination);
            }
        }
    }

    private startWhiteNoise() {
        this.initWebAudio();
        if (!this.audioCtx || !this.gainNode) return;
        if (this.whiteNoiseNode) { try { this.whiteNoiseNode.stop(); } catch(e){} }

        const bufferSize = this.audioCtx.sampleRate * 2; 
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }
        this.whiteNoiseNode = this.audioCtx.createBufferSource();
        this.whiteNoiseNode.buffer = buffer;
        this.whiteNoiseNode.loop = true;
        this.whiteNoiseNode.connect(this.gainNode);
        this.whiteNoiseNode.start();
    }

    registerCustomSound(id: string, url: string) {
        this.customSounds.set(id, url);
    }

    async play(id: string) {
        this.init();
        this.initWebAudio();
        if (this.isGlobalMuted) return;
        if (id === 'none') { this.stop(); return; }
        if (this.currentId === id) return;

        this.stop();
        this.currentId = id;
        
        if (id === 'white') {
            this.startWhiteNoise();
            this.rampVolumeToTarget();
            return;
        }

        let url = '';
        const sound = SOUND_LIBRARY.find(s => s.id === id);
        if (sound) url = sound.url;
        else if (this.customSounds.has(id)) url = this.customSounds.get(id)!;

        if (url && this.audio) {
            this.audio.src = url;
            this.audio.currentTime = 0;
            this.audio.volume = 0;
            try {
                await this.audio.play().catch(e => console.warn(`Sound file missing: ${url}`));
                this.rampVolumeToTarget();
            } catch (e) {}
        }
    }

    stop() {
        this.currentId = 'none';
        if (this.whiteNoiseNode) { try { this.whiteNoiseNode.stop(); } catch(e){} this.whiteNoiseNode = null; }
        if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; }
    }

    pause() {
        if (this.audioCtx) this.audioCtx.suspend();
        if (this.audio) this.audio.pause();
    }

    resume() {
        if (this.currentId !== 'none' && !this.isGlobalMuted) {
            this.initWebAudio();
            if (this.audio && this.currentId !== 'white') this.audio.play().catch(e => {});
            this.rampVolumeToTarget();
        }
    }
}

export const AudioService = new AudioServiceClass();
