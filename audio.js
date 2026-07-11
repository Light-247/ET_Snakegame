class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicPlaying = false;
    this.musicInterval = null;
    this.currentStep = 0;
    this.muted = false;
    this.voiceLang = 'ko'; // 'ko', 'en', 'off'
    
    // Warm up speech synthesis voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    
    // Cheerful pentatonic C Major melody
    this.melody = [
      'C4', 'E4', 'G4', 'C5', 'A4', 'G4', 'E4', 'D4',
      'C4', 'E4', 'G4', 'A4', 'G4', 'A4', 'C5', 'E5',
      'D5', 'C5', 'A4', 'G4', 'A4', 'G4', 'E4', 'D4',
      'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'
    ];
    
    this.noteFreqs = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'G4': 392.00, 'A4': 440.00,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.00
    };
  }
  
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  setVoiceLanguage(lang) {
    this.voiceLang = lang; // 'ko', 'en', 'off'
  }

  speak(text) {
    if (this.voiceLang === 'off') return;
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Cancel current speaking for instant feedback
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.voiceLang === 'ko' ? 'ko-KR' : 'en-US';
        
        // Find best voice matching target language
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
        
        utterance.pitch = 1.35; // Playful pitch
        utterance.rate = 1.05;  // Energetic rate
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("TTS Speech failed:", e);
    }
  }

  speakCount(number) {
    const koNumbers = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
    const enNumbers = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    
    let text = "";
    if (this.voiceLang === 'ko') {
      if (number <= 10) text = koNumbers[number];
      else text = number.toString();
    } else {
      if (number <= 10) text = enNumbers[number];
      else text = number.toString();
    }
    this.speak(text);
  }

  speakMath(num1, op, num2, result) {
    let text = "";
    if (this.voiceLang === 'ko') {
      if (op === '+') {
        text = `${num1} 더하기 ${num2}는 ${result}!`;
      } else if (op === '-') {
        text = `${num1} 빼기 ${num2}는 ${result}!`;
      }
    } else {
      if (op === '+') {
        text = `${num1} plus ${num2} equals ${result}!`;
      } else if (op === '-') {
        text = `${num1} minus ${num2} equals ${result}!`;
      }
    }
    this.speak(text);
  }

  speakReaction(type) {
    let text = "";
    if (this.voiceLang === 'ko') {
      switch (type) {
        case 'terrible_two': text = "조심해요! 테러블 투!"; break;
        case 'terrible_two_hit': text = "앗! 테러블 투한테 닿았어요!"; break;
        case 'rainbow': text = "와! 무지개색 일곱!"; break;
        case 'high_five': text = "다섯! 하이 파이브!"; break;
        case 'octoblock': text = "옥토블록 출동!"; break;
        case 'rocket': text = "열! 로켓 발사!"; break;
        case 'magnet': text = "자석 힘!"; break;
        case 'coop_start': text = "아빠랑 같이 하자!"; break;
      }
    } else {
      switch (type) {
        case 'terrible_two': text = "Watch out! Terrible Two!"; break;
        case 'terrible_two_hit': text = "Oops! Hit by Terrible Two!"; break;
        case 'rainbow': text = "Wow! Rainbow Seven!"; break;
        case 'high_five': text = "Five! High five!"; break;
        case 'octoblock': text = "Octoblock, action!"; break;
        case 'rocket': text = "Ten! Rocket blast off!"; break;
        case 'magnet': text = "Magnet force!"; break;
        case 'coop_start': text = "Let's build together!"; break;
      }
    }
    this.speak(text);
  }
  
  playNote(noteName, duration = 0.25, type = 'triangle', volume = 0.05) {
    if (this.muted || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    const freq = this.noteFreqs[noteName];
    if (!freq) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
  }
  
  playPop() {
    this.init();
    if (this.muted || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.1);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }
  
  playFanfare() {
    this.init();
    if (this.muted || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const now = this.ctx.currentTime;
    const notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5'];
    
    notes.forEach((note, index) => {
      const noteTime = now + index * 0.08;
      const freq = this.noteFreqs[note] || 1000;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }
  
  playCrash() {
    this.init();
    if (this.muted || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.35);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.38);
  }
  
  playClick() {
    this.init();
    if (this.muted || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }
  
  playMagnet() {
    this.init();
    if (this.muted || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.15);
    osc.frequency.linearRampToValueAtTime(550, now + 0.3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.32);
  }

  playMagnetPull() {
    this.init();
    if (this.muted || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
    
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.09);
  }

  startMusic() {
    this.init();
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    
    const tempo = 220; 
    
    const tick = () => {
      if (!this.musicPlaying) return;
      
      const note = this.melody[this.currentStep];
      this.playNote(note, 0.3, 'triangle', 0.018);
      
      this.currentStep = (this.currentStep + 1) % this.melody.length;
      this.musicInterval = setTimeout(tick, tempo);
    };
    
    tick();
  }
  
  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }
  
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    } else {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.startMusic();
    }
    return this.muted;
  }
}

// Set globally
window.audio = new AudioManager();
