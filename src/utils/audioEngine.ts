"use client";

/**
 * DIAMOND AUDIO ENGINE
 * Motor de audio de alta fidelidad para simuladores CEN Labs.
 * Utiliza síntesis sustractiva, FM y modelado físico para crear una 
 * experiencia inmersiva sin necesidad de archivos externos pesados.
 */

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | GainNode | null = null;
  public isMuted: boolean = false;
  private ambientNodes: any = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.createReverb();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Simulación de Reverb para dar profundidad de "Laboratorio"
  private createReverb() {
    if (!this.ctx || !this.masterGain) return;
    
    // Creamos un nodo de reverberación algorítmica simple
    const length = 2.0;
    const decay = 2.0;
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(2, sampleRate * length, sampleRate);
    
    for (let i = 0; i < 2; i++) {
      const channel = buffer.getChannelData(i);
      for (let j = 0; j < channel.length; j++) {
        channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / channel.length, decay);
      }
    }
    
    const reverb = this.ctx.createConvolver();
    reverb.buffer = buffer;
    
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.15; // 15% de efecto "espacio"
    
    reverbGain.connect(this.masterGain);
    reverb.connect(reverbGain);
    this.reverbNode = reverb;
  }

  private playSound(type: 'sine' | 'square' | 'sawtooth' | 'triangle', freq: number, duration: number, volume: number, decay: number = 0.1, pan: number = 0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    panner.pan.value = pan;

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    
    // Conectar también al reverb si es un sonido "físico"
    if (this.reverbNode) gain.connect(this.reverbNode as any);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playClick() {
    // Sonido de click mecánico: un "thump" corto + un transitorio agudo
    this.playSound('sine', 1200, 0.05, 0.1, 0.01, -0.1);
    this.playSound('triangle', 150, 0.08, 0.05, 0.02, 0);
  }

  public playPop() {
    this.playSound('sine', 800, 0.15, 0.2, 0.05, 0.1);
    this.playSound('sine', 400, 0.1, 0.1, 0.05, 0.1);
  }

  public playSuccess() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx!.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde de C Maj
    
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.playSound('sine', f, 1.5, 0.1, 1.2, (i - 1.5) * 0.2);
        this.playSound('triangle', f/2, 1.0, 0.05, 0.8, (i - 1.5) * 0.2);
      }, i * 100);
    });
  }

  public playNotification() {
    this.playSound('sine', 880, 0.2, 0.1, 0.2, 0);
  }

  public playError() {
    this.playSound('sawtooth', 120, 0.5, 0.1, 0.4, 0);
    this.playSound('sawtooth', 110, 0.5, 0.1, 0.4, 0.1);
  }

  public playLoading() {
    this.playSound('sine', 880, 0.1, 0.05, 0.05, 0);
  }

  /**
   * EFECTOS ATÓMICOS ESPECIALIZADOS
   */
  public playProton() {
    // Tono ascendente y brillante
    this.playSound('sine', 440, 0.2, 0.1, 0.1, -0.2);
    this.playSound('sine', 880, 0.1, 0.05, 0.05, -0.2);
  }

  public playNeutron() {
    // Tono sólido y grave
    this.playSound('triangle', 220, 0.3, 0.1, 0.2, 0.2);
  }

  public playElectron() {
    // Zap eléctrico rápido
    this.playSound('square', 1200, 0.05, 0.03, 0.01, 0.5);
    this.playSound('sine', 2400, 0.05, 0.02, 0.01, 0.5);
  }

  public playRemove() {
    // Sonido descendente corto para representar remoción
    this.playSound('sine', 400, 0.1, 0.05, 0.05, 0);
    this.playSound('sine', 200, 0.15, 0.02, 0.1, 0);
  }

  /**
   * ATMÓSFERAS DINÁMICAS POR MATERIA
   */
  public startAmbient(subject: string = 'general') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.stopAmbient();

    const nodes: any[] = [];

    // 1. Hum Base (Ventilación de Laboratorio)
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    hum.type = 'sine';
    hum.frequency.value = 50; 
    humGain.gain.value = 0.005;
    hum.connect(humGain);
    humGain.connect(this.masterGain);
    hum.start();
    nodes.push(hum);

    // 2. Filtro de "Suavizado" (Low Pass) para eliminar frecuencias chirriantes
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Cortar todo lo que suene a estática
    filter.connect(this.masterGain);

    // 3. Capas específicas por materia
    if (subject === 'quimica') {
      // Síntesis de burbujeo suave (Ondas Seno puras)
      const interval = setInterval(() => {
        if (Math.random() > 0.8) {
          const osc = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx!.currentTime);
          g.gain.setValueAtTime(0, this.ctx!.currentTime);
          g.gain.linearRampToValueAtTime(0.003, this.ctx!.currentTime + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.2);
          osc.connect(g);
          g.connect(filter);
          osc.start();
          osc.stop(this.ctx!.currentTime + 0.2);
        }
      }, 600);
      this.ambientNodes = { nodes, interval };
    } else if (subject === 'fisica') {
      // Zumbido eléctrico cálido (Sin armónicos agresivos)
      const buzz = this.ctx.createOscillator();
      buzz.type = 'triangle'; // Mucho más suave que sawtooth
      buzz.frequency.value = 60;
      
      const bGain = this.ctx.createGain();
      bGain.gain.value = 0.002; // Volumen muy bajo
      
      buzz.connect(bGain);
      bGain.connect(filter);
      buzz.start();
      nodes.push(buzz);
      this.ambientNodes = { nodes };
    } else if (subject === 'biologia') {
      // Pulsos orgánicos lentos (Sub-bajo)
      const pulse = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      pulse.frequency.value = 40;
      pGain.gain.value = 0;
      
      const now = this.ctx.currentTime;
      pGain.gain.setValueAtTime(0, now);
      pGain.gain.setTargetAtTime(0.01, now, 2);
      
      pulse.connect(pGain);
      pGain.connect(this.masterGain);
      pulse.start();
      nodes.push(pulse);
      this.ambientNodes = { nodes };
    } else {
      this.ambientNodes = { nodes };
    }
  }

  public stopAmbient() {
    if (this.ambientNodes) {
      if (this.ambientNodes.nodes) {
        this.ambientNodes.nodes.forEach((n: any) => { try { n.stop(); } catch(e) {} });
      }
      if (this.ambientNodes.interval) clearInterval(this.ambientNodes.interval);
      this.ambientNodes = null;
    }
  }

  public playGuide(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes('es-MX') && v.name.includes('Google')) || 
                  voices.find(v => v.lang.includes('es-MX')) || 
                  voices.find(v => v.lang.includes('es'));
    if (voice) ut.voice = voice;
    ut.rate = 1.0;
    ut.pitch = 1.1; // Un poco más agudo para el Dr. Quantum
    window.speechSynthesis.speak(ut);
  }

  public stopGuide() {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }
}

export const audio = new AudioEngine();
