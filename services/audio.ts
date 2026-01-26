export type SoundCategory = 'frequency' | 'ambience' | 'custom' | 'none';

export interface SoundOption {
    id: string;
    name: string;
    category: SoundCategory;
    url: string;
    isGenerated?: boolean; 
}

export const SOUND_LIBRARY: SoundOption[] = [
    { id: 'none', name: 'Off', category: 'none', url: '' },
    { id: 'pink', name: 'Pink Noise', category: 'frequency', url: '', isGenerated: true },
    { id: 'brown', name: 'Deep Brown', category: 'frequency', url: '', isGenerated: true },
    { id: 'rain_proc', name: 'Procedural Rain', category: 'ambience', url: '', isGenerated: true },
    { id: 'gamma_40', name: '40Hz Gamma', category: 'frequency', url: '', isGenerated: true },
    { id: 'cafe_remote', name: 'Paris Cafe', category: 'ambience', url: 'https://assets.mixkit.co/active_storage/sfx/243/243-preview.mp3' },
];

class AudioServiceClass {
    private audio: HTMLAudioElement | null = null;
    private audioCtx: AudioContext | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private gainNode: GainNode | null = null;
    private filterNode: BiquadFilterNode | null = null;
    private activeOsc: OscillatorNode | null = null;

    private currentId: string = 'none';
    private fadeInterval: any = null;
    private baseVolume: number = 0.5; 
    private dynamicScale: number = 1.0; 
    private isAutoVolumeEnabled: boolean = true;
    
    private customSounds: Map<string, string> = new Map();

    private init() {
        if (this.audio) return;
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.crossOrigin = "anonymous";
    }

    private initWebAudio() {
        if (!this.audioCtx) {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
                this.gainNode = this.audioCtx.createGain();
                this.filterNode = this.audioCtx.createBiquadFilter();
                this.gainNode.connect(this.audioCtx.destination);
            }
        }
        if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
    }

    setVolume(vol: number) {
        this.init();
        this.baseVolume = Math.max(0, Math.min(1, vol));
        this.rampVolumeToTarget();
    }

    setDynamicVolumeScale(scale: number) {
        this.dynamicScale = this.isAutoVolumeEnabled ? scale : 1.0;
        this.rampVolumeToTarget();
    }

    setAutoVolumeEnabled(enabled: boolean) {
        this.isAutoVolumeEnabled = enabled;
        if (!enabled) this.dynamicScale = 1.0;
        this.rampVolumeToTarget();
    }

    private rampVolumeToTarget() {
        if (!this.audio) this.init();
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        const target = this.baseVolume * this.dynamicScale;
        
        this.fadeInterval = setInterval(() => {
            if (!this.audio) return;
            const current = this.audio.volume; 
            const diff = target - current;
            if (Math.abs(diff) < 0.02) {
                this.audio.volume = target;
                if (this.gainNode && this.audioCtx) this.gainNode.gain.setTargetAtTime(target * 0.15, this.audioCtx.currentTime, 0.1);
                clearInterval(this.fadeInterval);
            } else {
                const next = current + (diff > 0 ? 0.02 : -0.02);
                this.audio.volume = Math.max(0, Math.min(1, next));
                if (this.gainNode && this.audioCtx) this.gainNode.gain.setValueAtTime(next * 0.15, this.audioCtx.currentTime);
            }
        }, 30);
    }

    private startProcedural(id: string) {
        this.initWebAudio();
        if (!this.audioCtx || !this.gainNode) return;
        this.stopSource();
        const bufferSize = this.audioCtx.sampleRate * 2;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        if (id === 'pink') {
            let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
            for (let i = 0; i < bufferSize; i++) {
                let white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759; b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856; b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            }
        } else if (id === 'brown' || id === 'rain_proc') {
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                let white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i]; data[i] *= 3.5;
            }
        } else if (id === 'gamma_40') {
            const osc = this.audioCtx.createOscillator();
            osc.frequency.setValueAtTime(40, this.audioCtx.currentTime);
            osc.connect(this.gainNode); osc.start(); this.activeOsc = osc; return;
        }

        this.sourceNode = this.audioCtx.createBufferSource();
        this.sourceNode.buffer = buffer; this.sourceNode.loop = true;
        if (id === 'rain_proc' && this.filterNode) {
            this.filterNode.type = 'lowpass'; this.filterNode.frequency.value = 1000;
            this.sourceNode.connect(this.filterNode); this.filterNode.connect(this.gainNode);
        } else this.sourceNode.connect(this.gainNode);
        this.sourceNode.start();
    }

    private stopSource() {
        if (this.sourceNode) { try { this.sourceNode.stop(); } catch(e){} this.sourceNode = null; }
        if (this.activeOsc) { try { this.activeOsc.stop(); } catch(e){} this.activeOsc = null; }
    }

    registerCustomSound(id: string, url: string) { this.customSounds.set(id, url); }

    async play(id: string) {
        this.init(); this.initWebAudio();
        if (id === 'none') { this.stop(); return; }
        if (this.currentId === id) return;
        this.stop(); this.currentId = id;
        const sound = SOUND_LIBRARY.find(s => s.id === id);
        if (sound?.isGenerated) { this.startProcedural(id); this.rampVolumeToTarget(); return; }
        let url = sound ? sound.url : this.customSounds.get(id);
        if (url && this.audio) {
            this.audio.src = url; this.audio.currentTime = 0; this.audio.volume = 0;
            try { await this.audio.play(); this.rampVolumeToTarget(); } catch (e) { console.warn('Autoplay blocked'); }
        }
    }

    stop() { this.currentId = 'none'; this.stopSource(); if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; } }
    pause() { if (this.audioCtx) this.audioCtx.suspend(); if (this.audio) this.audio.pause(); }
    resume() { this.initWebAudio(); if (this.currentId !== 'none') this.rampVolumeToTarget(); }
}

export const AudioService = new AudioServiceClass();