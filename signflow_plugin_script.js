(function () {
  'use strict';

  // Prevent multiple instances
  if (window.SignFlowAIInitialized) return;
  window.SignFlowAIInitialized = true;

  // 1. Inject Tailwind CSS if not present
  if (!document.getElementById('tailwind-cdn')) {
    const twScript = document.createElement('script');
    twScript.id = 'tailwind-cdn';
    twScript.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(twScript);
  }

  // 2. Inject Google Fonts & Custom Widget Styles
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap';
  document.head.appendChild(fontLink);

  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .signable-target {
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: 0.5rem;
      position: relative;
    }
    .sign-mode-active .signable-target:hover {
      background-color: rgba(79, 70, 229, 0.08);
      outline: 2px dashed #6366f1;
      outline-offset: 4px;
      cursor: pointer;
    }
    .sign-target-selected {
      background-color: rgba(79, 70, 229, 0.12) !important;
      outline: 2px solid #4f46e5 !important;
      outline-offset: 4px;
      box-shadow: 0 4px 20px -2px rgba(79, 70, 229, 0.18);
    }
    .sign-target-selected::after {
      content: '🤟 Signing Active';
      position: absolute;
      top: -14px;
      right: 10px;
      background: #4f46e5;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 9999px;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.4);
      pointer-events: none;
      z-index: 10;
    }
    .plugin-high-contrast {
      background-color: #000000 !important;
      color: #ffff00 !important;
      border: 2px solid #ffff00 !important;
    }
    .plugin-high-contrast .hc-surface {
      background-color: #111111 !important;
      color: #ffffff !important;
      border-color: #ffff00 !important;
    }
    .plugin-high-contrast .hc-accent {
      background-color: #ffff00 !important;
      color: #000000 !important;
      font-weight: 700 !important;
    }
    .plugin-high-contrast .hc-muted {
      color: #fef08a !important;
    }
    @keyframes soundWaveBar {
      0%, 100% { transform: scaleY(0.25); }
      50% { transform: scaleY(1); }
    }
    .wave-bar {
      transform-origin: center;
      transition: transform 0.15s ease;
    }
    .listening-active .wave-bar {
      animation: soundWaveBar 0.7s ease-in-out infinite;
    }
    .listening-active .wave-bar:nth-child(2) { animation-delay: 0.12s; }
    .listening-active .wave-bar:nth-child(3) { animation-delay: 0.24s; }
    .listening-active .wave-bar:nth-child(4) { animation-delay: 0.36s; }
    .listening-active .wave-bar:nth-child(5) { animation-delay: 0.48s; }
    .listening-active .wave-bar:nth-child(6) { animation-delay: 0.20s; }
    .listening-active .wave-bar:nth-child(7) { animation-delay: 0.08s; }
  `;
  document.head.appendChild(styleEl);

  // Enable sign mode on body by default
  document.body.classList.add('sign-mode-active');

  // 3. Inject Widget HTML Structure
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'signflow-plugin-root';
  widgetContainer.innerHTML = `
    <div id="signflow-widget-root" class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999] flex flex-col items-end font-sans">
      <div id="signflow-panel" class="w-[calc(100vw-2rem)] sm:w-[390px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-300 origin-bottom-right mb-3 flex flex-col">
        
        <!-- Header -->
        <div class="hc-surface bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-inner">
              <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-sm tracking-tight">SignFlow AI</span>
                <span id="langBadge" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">BSL</span>
              </div>
              <p class="hc-muted text-[11px] text-slate-400 leading-none mt-0.5">Synthetic Sign Interpreter</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button id="toggleSizeBtn" title="Toggle Size" class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            </button>
            <button id="toggleContrastBtn" title="High Contrast" class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </button>
            <button id="closePanelBtn" title="Minimize" class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="hc-surface grid grid-cols-3 bg-slate-100 p-1 border-b border-slate-200 text-xs font-semibold">
          <button data-tab="player" class="tab-btn py-1.5 rounded-lg bg-white text-indigo-700 shadow-sm transition">Interpreter</button>
          <button data-tab="sandbox" class="tab-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition">Type & Speech</button>
          <button data-tab="embed" class="tab-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition">Embed Code</button>
        </div>

        <!-- TAB 1: INTERPRETER -->
        <div id="tab-player" class="tab-content flex flex-col">
          <div class="hc-surface px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <select id="signLangSelect" class="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="BSL">🇬🇧 BSL (British)</option>
                <option value="ASL">🇺🇸 ASL (American)</option>
                <option value="ISL">🌐 ISL (International)</option>
              </select>
            </div>
            <div class="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
              <button id="modeClickBtn" class="px-2 py-1 rounded-md bg-white text-slate-900 shadow-sm transition">Click-to-Sign</button>
              <button id="modeHoverBtn" class="px-2 py-1 rounded-md text-slate-600 hover:text-slate-900 transition">Hover</button>
            </div>
          </div>

          <!-- Canvas Stage -->
          <div id="avatarStageContainer" class="relative w-full h-[250px] bg-gradient-to-b from-slate-800 via-slate-900 to-indigo-950 overflow-hidden select-none">
            <canvas id="signAvatarCanvas" class="w-full h-full block"></canvas>
            <div class="absolute top-3 left-3 flex items-center gap-2 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              <span id="statusDot" class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span id="statusLabel" class="text-[11px] font-medium text-white">Ready • Click page text</span>
            </div>
            <div id="activeGlossPill" class="absolute top-3 right-3 bg-indigo-600/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-indigo-400/40 shadow-lg">
              <span id="currentGlossWord" class="font-mono text-[11px] font-bold text-white tracking-wider">HELLO</span>
            </div>
            <div id="canvasSpeechBadge" class="hidden absolute top-11 left-3 right-3 bg-rose-600/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-rose-400/50 shadow-lg flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2 h-2 rounded-full bg-white animate-ping shrink-0"></span>
                <span id="canvasLiveTranscript" class="text-xs font-medium truncate">Listening for speech...</span>
              </div>
              <button id="canvasStopSpeechBtn" class="text-[10px] font-bold uppercase bg-black/30 px-2 py-0.5 rounded">Stop</button>
            </div>
            <div id="subtitleOverlay" class="absolute bottom-2.5 inset-x-3 bg-black/65 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 text-center transition-opacity">
              <p id="glossCaptionLine" class="font-mono text-[11px] font-bold text-indigo-300 tracking-wide uppercase truncate">GLOSS: WELCOME</p>
              <p id="englishCaptionLine" class="text-xs text-white/95 line-clamp-1 mt-0.5">"Click any text on the page..."</p>
            </div>
          </div>

          <!-- Gloss Stream -->
          <div class="hc-surface px-3.5 py-2.5 bg-white border-b border-slate-100">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Gloss Sequence</span>
              <span id="progressCounter" class="font-mono text-[10px] font-semibold text-slate-500">0 / 0 signs</span>
            </div>
            <div id="glossTokenContainer" class="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto py-0.5"></div>
          </div>

          <!-- Controls -->
          <div class="hc-surface p-3.5 bg-slate-50 flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5">
              <button id="playPauseBtn" class="hc-accent inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition">
                <svg id="playIcon" class="w-4 h-4 hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg id="pauseIcon" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              </button>
              <button id="replayBtn" class="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition" title="Replay">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
              <button id="quickMicBtn" class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition" title="Speech to Sign">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
              </button>
              <button id="toggleCaptionsBtn" class="px-2 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold transition">CC</button>
            </div>
            <div class="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-1">
              <button data-speed="0.75" class="speed-btn px-1.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600">0.75x</button>
              <button data-speed="1" class="speed-btn px-1.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white">1x</button>
              <button data-speed="1.25" class="speed-btn px-1.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600">1.25x</button>
              <button data-speed="1.5" class="speed-btn px-1.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600">1.5x</button>
            </div>
          </div>
        </div>

        <!-- TAB 2: TYPE & SPEECH -->
        <div id="tab-sandbox" class="tab-content hidden p-4 space-y-3 bg-white">
          <div class="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button id="studioTypeModeBtn" class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white text-indigo-700 font-bold text-xs shadow-sm transition">Type to Sign</button>
            <button id="studioSpeechModeBtn" class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-slate-600 font-bold text-xs transition">Speech to Sign</button>
          </div>
          <div id="studioTypePanel" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Type text to sign:</label>
              <textarea id="sandboxInput" rows="3" class="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">Welcome to our accessible website! Click any paragraph to translate.</textarea>
            </div>
            <button id="translateSandboxBtn" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition">Translate & Sign Now</button>
          </div>
          <div id="studioSpeechPanel" class="hidden space-y-3">
            <div class="bg-slate-900 rounded-2xl p-4 text-center border border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between text-[11px]">
                <span id="speechStatusBadge" class="inline-flex items-center gap-1.5 font-semibold text-slate-300">
                  <span id="speechStatusDot" class="w-2 h-2 rounded-full bg-slate-500"></span>
                  <span id="speechStatusText">Ready for voice</span>
                </span>
                <span class="font-mono text-[10px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded">ASR</span>
              </div>
              <div id="audioWaveBars" class="h-9 flex items-center justify-center gap-1.5 py-1">
                <span class="wave-bar w-1.5 h-7 rounded-full bg-rose-500"></span>
                <span class="wave-bar w-1.5 h-7 rounded-full bg-indigo-400"></span>
                <span class="wave-bar w-1.5 h-7 rounded-full bg-rose-400"></span>
                <span class="wave-bar w-1.5 h-7 rounded-full bg-indigo-500"></span>
              </div>
              <div class="bg-black/40 rounded-xl p-2.5 min-h-[54px] flex items-center justify-center border border-white/10">
                <p id="speechTranscriptDisplay" class="text-xs text-slate-200 italic">Tap start listening...</p>
              </div>
            </div>
            <button id="toggleMicBtn" class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition">Start Listening</button>
          </div>
        </div>

        <!-- TAB 3: EMBED -->
        <div id="tab-embed" class="tab-content hidden p-4 space-y-3 bg-white">
          <h4 class="text-xs font-bold text-slate-900">Embed Code</h4>
          <pre class="bg-slate-900 text-indigo-300 font-mono text-[11px] p-3 rounded-xl overflow-x-auto">&lt;script src="https://yourdomain.com/signflow-plugin.js" async&gt;&lt;/script&gt;</pre>
          <button id="copyEmbedBtn" class="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">Copy Tag</button>
        </div>

      </div>

      <!-- Floating Launcher -->
      <button id="signflow-launcher" aria-label="Toggle Sign Language" class="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white pl-4 pr-5 py-3.5 rounded-full shadow-2xl border border-indigo-400/30 transition-all hover:scale-105">
        <svg class="w-6 h-6 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
        </svg>
        <div class="text-left">
          <span class="block text-xs font-extrabold uppercase leading-none">Sign Language</span>
          <span id="launcherSubtext" class="block text-[10px] text-indigo-200 font-medium mt-0.5">Interpreter Active</span>
        </div>
      </button>
    </div>
  `;
  document.body.appendChild(widgetContainer);

  // 4. Core Script & Avatar Engine
  const STOP_WORDS = new Set(['a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'to', 'of', 'for', 'and', 'in', 'on', 'at', 'by', 'with', 'that', 'this']);
  const SIGN_POSES = {
    GREETING: { lx: -0.22, ly: -0.25, rx: 0.48, ry: -0.58, lHand: 'open', rHand: 'wave', brow: 0.35, smile: 0.8, headTilt: 0.08, nod: 0.15, motion: 'wave' },
    QUESTION: { lx: -0.36, ly: -0.22, rx: 0.36, ry: -0.22, lHand: 'open', rHand: 'open', brow: 0.65, smile: -0.1, headTilt: 0.12, nod: 0.0, motion: 'shrug' },
    DEFAULT: { lx: -0.26, ly: -0.20, rx: 0.28, ry: -0.26, lHand: 'open', rHand: 'open', brow: 0.1, smile: 0.35, headTilt: 0.0, nod: 0.06, motion: 'conversational' }
  };

  function translateToSignGloss(text) {
    const words = text.replace(/[^\w\s]/g, '').trim().split(/\s+/);
    return words.map(w => ({
      gloss: w.toUpperCase(),
      duration: 700,
      pose: SIGN_POSES.DEFAULT
    }));
  }

  const state = {
    isOpen: true,
    isExpanded: false,
    highContrast: false,
    showCaptions: true,
    interactionMode: 'click',
    language: 'BSL',
    speed: 1.0,
    isPlaying: false,
    sourceText: 'Welcome to our accessible website!',
    glossSequence: [],
    currentIndex: 0,
    tokenElapsed: 0,
    lastTimestamp: 0
  };

  const els = {
    panel: document.getElementById('signflow-panel'),
    launcher: document.getElementById('signflow-launcher'),
    launcherSubtext: document.getElementById('launcherSubtext'),
    closePanelBtn: document.getElementById('closePanelBtn'),
    toggleSizeBtn: document.getElementById('toggleSizeBtn'),
    toggleContrastBtn: document.getElementById('toggleContrastBtn'),
    signLangSelect: document.getElementById('signLangSelect'),
    langBadge: document.getElementById('langBadge'),
    modeClickBtn: document.getElementById('modeClickBtn'),
    modeHoverBtn: document.getElementById('modeHoverBtn'),
    avatarStageContainer: document.getElementById('avatarStageContainer'),
    canvas: document.getElementById('signAvatarCanvas'),
    statusDot: document.getElementById('statusDot'),
    statusLabel: document.getElementById('statusLabel'),
    currentGlossWord: document.getElementById('currentGlossWord'),
    subtitleOverlay: document.getElementById('subtitleOverlay'),
    glossCaptionLine: document.getElementById('glossCaptionLine'),
    englishCaptionLine: document.getElementById('englishCaptionLine'),
    glossTokenContainer: document.getElementById('glossTokenContainer'),
    progressCounter: document.getElementById('progressCounter'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    replayBtn: document.getElementById('replayBtn'),
    toggleCaptionsBtn: document.getElementById('toggleCaptionsBtn'),
    speedBtns: document.querySelectorAll('.speed-btn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    sandboxInput: document.getElementById('sandboxInput'),
    translateSandboxBtn: document.getElementById('translateSandboxBtn')
  };

  const ctx = els.canvas.getContext('2d');
  const avatarRig = { lx: -0.25, ly: 0.12, rx: 0.25, ry: 0.12, brow: 0.0, smile: 0.3, headTilt: 0, nod: 0, mouthOpen: 0, blink: 0, nextBlinkTime: 2500 };

  function resizeCanvas() {
    if (!els.avatarStageContainer) return;
    const rect = els.avatarStageContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    els.canvas.width = rect.width * dpr;
    els.canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function renderAvatarFrame(timestamp) {
    if (!state.lastTimestamp) state.lastTimestamp = timestamp;
    const dt = Math.min(50, timestamp - state.lastTimestamp);
    state.lastTimestamp = timestamp;

    if (state.isPlaying && state.glossSequence.length > 0) {
      const tok = state.glossSequence[state.currentIndex];
      state.tokenElapsed += dt * state.speed;
      if (state.tokenElapsed >= tok.duration) {
        state.tokenElapsed = 0;
        if (state.currentIndex < state.glossSequence.length - 1) {
          state.currentIndex++;
          syncUI();
        } else {
          state.isPlaying = false;
          updatePlayBtn();
        }
      }
    }

    const w = els.canvas.width / (window.devicePixelRatio || 1);
    const h = els.canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    // Simple avatar render
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(w*0.5 - 50, h*0.6, 100, 100, 20);
    ctx.fill();

    ctx.fillStyle = '#f4c29f';
    ctx.beginPath();
    ctx.arc(w*0.5, h*0.4, 30, 0, Math.PI*2);
    ctx.fill();

    requestAnimationFrame(renderAvatarFrame);
  }

  function syncUI() {
    const cur = state.glossSequence[state.currentIndex];
    if (cur) els.currentGlossWord.textContent = cur.gloss;
    els.progressCounter.textContent = `${state.currentIndex + 1} / ${state.glossSequence.length} signs`;
  }

  function updatePlayBtn() {
    els.playIcon.classList.toggle('hidden', state.isPlaying);
    els.pauseIcon.classList.toggle('hidden', !state.isPlaying);
  }

  function loadAndPlay(text) {
    state.sourceText = text;
    state.glossSequence = translateToSignGloss(text);
    state.currentIndex = 0;
    state.tokenElapsed = 0;
    state.isPlaying = true;
    updatePlayBtn();
    syncUI();
  }

  // Auto-scan page elements or add signable classes automatically
  document.querySelectorAll('p, h1, h2, h3, li').forEach(el => {
    if (!el.closest('#signflow-plugin-root')) {
      el.classList.add('signable-target');
      if (!el.getAttribute('data-sign-text')) {
        el.setAttribute('data-sign-text', el.innerText);
      }
      el.addEventListener('click', () => {
        if (state.interactionMode === 'click') {
          loadAndPlay(el.getAttribute('data-sign-text'));
        }
      });
    }
  });

  // Events
  els.launcher.addEventListener('click', () => {
    state.isOpen = !state.isOpen;
    els.panel.classList.toggle('hidden', !state.isOpen);
    if (state.isOpen) resizeCanvas();
  });
  els.closePanelBtn.addEventListener('click', () => {
    state.isOpen = false;
    els.panel.classList.add('hidden');
  });
  els.tabBtns.forEach(b => {
    b.addEventListener('click', () => {
      els.tabBtns.forEach(btn => btn.className = 'tab-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition');
      b.className = 'tab-btn py-1.5 rounded-lg bg-white text-indigo-700 shadow-sm transition';
      els.tabContents.forEach(c => c.classList.add('hidden'));
      document.getElementById(`tab-${b.dataset.tab}`).classList.remove('hidden');
      if (b.dataset.tab === 'player') resizeCanvas();
    });
  });
  els.translateSandboxBtn.addEventListener('click', () => {
    if (els.sandboxInput.value) loadAndPlay(els.sandboxInput.value);
  });

  window.addEventListener('resize', resizeCanvas);
  loadAndPlay(state.sourceText);
  requestAnimationFrame(renderAvatarFrame);
})();