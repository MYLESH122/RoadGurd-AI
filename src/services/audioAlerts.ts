class AudioAlertSystem {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 1.0; // Max volume
  private isSpeaking: boolean = false;
  private lastWarningPlayedTime: number = 0;
  private lastDangerPlayedTime: number = 0;
  private lastCriticalPlayedTime: number = 0;

  constructor() {
    // Enable audio unlocking on any window interaction
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock);
      window.addEventListener('keydown', unlock);
      window.addEventListener('touchstart', unlock);
    }
  }

  public unlockAudio(): void {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // Prime with an inaudible buffer to satisfy browser autoplay security
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      // Prime SpeechSynthesis engine
      if ('speechSynthesis' in window && !window.speechSynthesis.speaking) {
        const primeUtterance = new SpeechSynthesisUtterance(' ');
        primeUtterance.volume = 0.01;
        window.speechSynthesis.speak(primeUtterance);
      }
    } catch (e) {
      console.warn("AudioContext unlock error:", e);
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Immediately stops all active sirens, oscillators, and ongoing speech alerts
   */
  public stopAllAlerts(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (this.audioCtx && this.audioCtx.state === 'running') {
        this.audioCtx.suspend().then(() => {
          setTimeout(() => {
            if (this.audioCtx) this.audioCtx.resume();
          }, 150);
        });
      }
      this.isSpeaking = false;
      const now = Date.now();
      // Add a 4-second quiet period on alarms
      this.lastWarningPlayedTime = now;
      this.lastDangerPlayedTime = now;
      this.lastCriticalPlayedTime = now;
    } catch (e) {
      console.warn("Error stopping alerts:", e);
    }
  }

  /**
   * Plays a pleasant ascending dual-tone chime when driver acknowledges / recovers
   */
  public playClearSound(): void {
    if (this.isMuted) return;
    this.unlockAudio();
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      [520, 780].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.01, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(this.volume * 0.5, now + idx * 0.12 + 0.02);
        gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.12 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.12);
      });
      setTimeout(() => this.speak("Driver alert confirmed. Safe driving resumed."), 280);
    } catch {
      // Ignored
    }
  }

  /**
   * Generates a self-contained PCM WAV Data URL for 100% reliable HTML5 Audio fallback
   */
  private generateWavBeep(freq: number, durationSec: number, vol: number = 0.85): string {
    const sampleRate = 22050;
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46); // 'RIFF'
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45); // 'WAVE'
    // 'fmt ' sub-chunk
    view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16 bits per sample
    // 'data' sub-chunk
    view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61);
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1.0, i / (sampleRate * 0.02));
      const decay = Math.min(1.0, (numSamples - i) / (sampleRate * 0.02));
      const envelope = attack * decay;
      const sample = Math.sin(2 * Math.PI * freq * t) * 32767 * vol * envelope;
      view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.floor(sample))), true);
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  private playFallbackAudio(wavUrl: string) {
    try {
      const audio = new Audio(wavUrl);
      audio.volume = this.volume;
      audio.play().catch(() => {});
    } catch {
      // Ignored
    }
  }

  /**
   * LEVEL 1: High-audibility Automotive Warning Beep Sequence
   * 3 rapid, loud, distinctive alert tones (950Hz -> 1250Hz -> 1100Hz)
   */
  public playWarningSound() {
    if (this.isMuted) return;
    this.unlockAudio();

    // 1. Primary: Web Audio API Oscillator
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const frequencies = [950, 1250, 1100];

      frequencies.forEach((freq, idx) => {
        const startTime = now + idx * 0.14;
        const duration = 0.11;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.9, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn("Web Audio warning playback error, falling back:", e);
    }

    // 2. Secondary Bulletproof Fallback: Direct HTML5 Audio element
    try {
      const wav = this.generateWavBeep(1100, 0.35, this.volume * 0.9);
      this.playFallbackAudio(wav);
    } catch {
      // Fallback
    }
  }

  /**
   * LEVEL 2: Danger Audio Alert (Loud two-tone alarm)
   */
  public playDangerAlarm() {
    if (this.isMuted) return;
    this.unlockAudio();

    try {
      const ctx = this.getAudioContext();
      for (let i = 0; i < 4; i++) {
        const startTime = ctx.currentTime + i * 0.22;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, startTime);
        osc.frequency.setValueAtTime(1050, startTime + 0.1);

        gain.gain.setValueAtTime(this.volume * 0.9, startTime);
        gain.gain.linearRampToValueAtTime(0.01, startTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      }
    } catch (e) {
      console.warn("Audio danger playback error:", e);
    }

    try {
      const wav = this.generateWavBeep(850, 0.6, this.volume * 0.95);
      this.playFallbackAudio(wav);
    } catch {
      // Fallback
    }
  }

  /**
   * LEVEL 3: Critical Audio Alert (Piercing pulsating siren)
   */
  public playCriticalAlarm() {
    if (this.isMuted) return;
    this.unlockAudio();

    try {
      const ctx = this.getAudioContext();
      for (let i = 0; i < 5; i++) {
        const startTime = ctx.currentTime + i * 0.26;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, startTime);
        osc.frequency.linearRampToValueAtTime(2000, startTime + 0.13);

        gain.gain.setValueAtTime(this.volume * 1.0, startTime);
        gain.gain.linearRampToValueAtTime(0.01, startTime + 0.23);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.23);
      }
    } catch (e) {
      console.warn("Audio critical playback error:", e);
    }

    try {
      const wav = this.generateWavBeep(1400, 0.8, this.volume * 1.0);
      this.playFallbackAudio(wav);
    } catch {
      // Fallback
    }
  }

  /**
   * Voice Alert Text-to-Speech
   */
  public speak(message: string, priority: 'normal' | 'high' = 'normal') {
    if (this.isMuted || !('speechSynthesis' in window)) return;

    try {
      if (this.isSpeaking && priority !== 'high') {
        return; // Don't interrupt an existing alert unless it's higher priority
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.pitch = priority === 'high' ? 1.25 : 1.1;
      utterance.volume = this.volume;
      utterance.lang = 'en-US';

      utterance.onstart = () => { this.isSpeaking = true; };
      utterance.onend = () => { this.isSpeaking = false; };
      utterance.onerror = () => { this.isSpeaking = false; };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS synthesis error:", e);
    }
  }

  /**
   * Triggers level-specific audio and voice alert immediately with strict cooldown throttling
   */
  public triggerAlert(level: 'warning' | 'danger' | 'critical' | 'sos') {
    const now = Date.now();

    if (level === 'warning') {
      if (now - this.lastWarningPlayedTime > 2200) {
        this.lastWarningPlayedTime = now;
        this.playWarningSound();
        setTimeout(() => this.speak("PLEASE STAY ALERT."), 400);
      }
    } else if (level === 'danger') {
      if (now - this.lastDangerPlayedTime > 3000) {
        this.lastDangerPlayedTime = now;
        this.playDangerAlarm();
        setTimeout(() => this.speak("WARNING! SIGNS OF DRIVER FATIGUE DETECTED. PLEASE TAKE A SAFE BREAK.", 'high'), 500);
      }
    } else if (level === 'critical' || level === 'sos') {
      if (now - this.lastCriticalPlayedTime > 3200) {
        this.lastCriticalPlayedTime = now;
        this.playCriticalAlarm();
        const msg = level === 'sos'
          ? "EMERGENCY S.O.S. ACTIVATED. NOTIFYING CONTACTS."
          : "DANGER! PLEASE STOP AT A SAFE PLACE.";
        setTimeout(() => this.speak(msg, 'high'), 500);
      }
    }
  }

  /**
   * LEVEL 4: Unconsciousness / Fainting / Medical Emergency Alert (Mayakkam)
   */
  public triggerUnconsciousAlert(reason?: string) {
    const now = Date.now();
    if (now - this.lastCriticalPlayedTime > 3200) {
      this.lastCriticalPlayedTime = now;
      this.playCriticalAlarm();
      setTimeout(() => {
        this.speak("CRITICAL EMERGENCY! DRIVER UNRESPONSIVE! PLEASE WAKE UP!", 'high');
      }, 500);
    }
  }

  public testAudioLevel(level: 'warning' | 'danger' | 'critical') {
    if (level === 'warning') {
      this.playWarningSound();
      setTimeout(() => this.speak("PLEASE STAY ALERT."), 500);
    } else if (level === 'danger') {
      this.playDangerAlarm();
      setTimeout(() => this.speak("WARNING! SIGNS OF DRIVER FATIGUE DETECTED. PLEASE TAKE A SAFE BREAK.", 'high'), 600);
    } else if (level === 'critical') {
      this.playCriticalAlarm();
      setTimeout(() => this.speak("DANGER! PLEASE STOP AT A SAFE PLACE.", 'high'), 700);
    }
  }
}

export const audioAlertSystem = new AudioAlertSystem();
