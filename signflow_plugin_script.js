/**
 * =====================================================================
 * SIGNFLOW AI ACCESSIBILITY PLUGIN & INTERPRETER ENGINE
 * =====================================================================
 * Pure JavaScript Implementation (Standalone Widget & Sign Interpreter)
 */

(function () {
  'use strict';

  // Inject plugin styles into the host page dynamically
  const styleEl = document.createElement('style');
  styleEl.textContent = `
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

  // Load Tailwind CSS script dynamically if not present
  if (!document.querySelector('script[src*="tailwindcss"]')) {
    const twScript = document.createElement('script');
    twScript.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(twScript);
  }

  // Inject Widget Root HTML
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'signflow-widget-root';
  widgetContainer.className = 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end font-sans';
  widgetContainer.innerHTML = `
    <div id="signflow-panel" class="w-[calc(100vw-2rem)] sm:w-[390px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-300 origin-bottom-right mb-3 flex flex-col">
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
          <button id="toggleSizeBtn" title="Toggle Compact / Expanded Player" class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          </button>
          <button id="toggleContrastBtn" title="Toggle High Contrast Mode" class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </button>
          <button id="closePanelBtn" title="Minimize Plugin" class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>

      <div class="hc-surface grid grid-cols-3 bg-slate-100 p-1 border-b border-slate-200 text-xs font-semibold">
        <button data-tab="player" class="tab-btn py-1.5 rounded-lg bg-white text-indigo-700 shadow-sm transition">Interpreter</button>
        <button data-tab="sandbox" class="tab-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition">Type & Speech</button>
        <button data-tab="embed" class="tab-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition">Embed Code</button>
      </div>

      <div id="tab-player" class="tab-content flex flex-col">
        <div class="hc-surface px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <label for="signLangSelect" class="sr-only">Sign Language</label>
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
            <button id="canvasStopSpeechBtn" class="text-[10px] font-bold uppercase bg-black/30 hover:bg-black/50 px-2 py-0.5 rounded shrink-0">Stop</button>
          </div>
          <div id="subtitleOverlay" class="absolute bottom-2.5 inset-x-3 bg-black/65 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 text-center transition-opacity">
            <p id="glossCaptionLine" class="font-mono text-[11px] font-bold text-indigo-300 tracking-wide uppercase truncate">
              GLOSS: WELCOME TO SIGNFLOW AI
            </p>
            <p id="englishCaptionLine" class="text-xs text-white/95 line-clamp-1 mt-0.5">
              "Welcome to SignFlow AI accessibility plugin..."
            </p>
          </div>
        </div>

        <div class="hc-surface px-3.5 py-2.5 bg-white border-b border-slate-100">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Gloss Sequence</span>
            <span id="progressCounter" class="font-mono text-[10px] font-semibold text-slate-500">0 / 0 signs</span>
          </div>
          <div id="glossTokenContainer" class="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto py-0.5"></div>
        </div>

        <div class="hc-surface p-3.5 bg-slate-50 flex items-center justify-between gap-1.5">
          <div class="flex items-center gap-1.5">
            <button id="playPauseBtn" class="hc-accent inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition" title="Play / Pause">
              <svg id="playIcon" class="w-4 h-4 hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              <svg id="pauseIcon" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button id="replayBtn" class="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition" title="Replay Translation">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
            <button id="quickMicBtn" class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition" title="Speech to Sign (Voice Input)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            </button>
            <button id="toggleCaptionsBtn" class="px-2 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold transition" title="Toggle Gloss Captions">
              CC
            </button>
          </div>
          <div class="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-1">
            <button data-speed="0.75" class="speed-btn px-1.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100">0.75x</button>
            <button data-speed="1" class="speed-btn px-1.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white">1x</button>
            <button data-speed="1.25" class="speed-btn px-1.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100">1.25x</button>
            <button data-speed="1.5" class="speed-btn px-1.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100">1.5x</button>
          </div>
        </div>
      </div>

      <div id="tab-sandbox" class="tab-content hidden p-4 space-y-3 bg-white">
        <div class="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button id="studioTypeModeBtn" class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white text-indigo-700 font-bold text-xs shadow-sm transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            <span>Type to Sign</span>
          </button>
          <button id="studioSpeechModeBtn" class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-slate-600 hover:text-slate-900 font-bold text-xs transition">
            <svg class="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            <span>Speech to Sign</span>
          </button>
        </div>

        <div id="studioTypePanel" class="space-y-3">
          <div>
            <label for="sandboxInput" class="block text-xs font-bold text-slate-700 mb-1">Type any sentence to translate & sign:</label>
            <textarea id="sandboxInput" rows="3" class="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Hello, welcome to our website!">Welcome to SignFlow AI sign language accessibility plugin.</textarea>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button class="preset-phrase text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition">How can I get help?</button>
            <button class="preset-phrase text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition">I need accessibility support.</button>
            <button class="preset-phrase text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition">Thank you for your assistance!</button>
          </div>
          <button id="translateSandboxBtn" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2">
            <span>Translate & Sign Now</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>

        <div id="studioSpeechPanel" class="hidden space-y-3">
          <div id="speechVisualizerBox" class="bg-slate-900 rounded-2xl p-4 text-center border border-slate-800 space-y-2.5">
            <div class="flex items-center justify-between text-[11px]">
              <span id="speechStatusBadge" class="inline-flex items-center gap-1.5 font-semibold text-slate-300">
                <span id="speechStatusDot" class="w-2 h-2 rounded-full bg-slate-500"></span>
                <span id="speechStatusText">Ready for voice input</span>
              </span>
              <span class="font-mono text-[10px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">LIVE ASR</span>
            </div>
            <div id="audioWaveBars" class="h-9 flex items-center justify-center gap-1.5 py-1">
              <span class="wave-bar w-1.5 h-7 rounded-full bg-rose-500"></span>
              <span class="wave-bar w-1.5 h-7 rounded-full bg-indigo-400"></span>
              <span class="wave-bar w-1.5 h-7 rounded-full bg-rose-400"></span>
              <span class="wave-bar w-1.5 h-7 rounded-full bg-indigo-500"></span>
              <span class="wave-bar w-1.5 h-7 rounded-full bg-rose-500"></span>
              <span class="wave-bar w-1.5 h-7 rounded-full bg-indigo-400"></span>
              <span class="wave-bar w-1.5 h-7 rounded-full bg-rose-400"></span>
            </div>
            <div class="bg-black/40 rounded-xl p-2.5 min-h-[54px] flex items-center justify-center border border-white/10">
              <p id="speechTranscriptDisplay" class="text-xs text-slate-200 italic leading-relaxed">
                Tap "Start Listening" and speak clearly, or use the simulated voice demo below.
              </p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-2">
            <button id="toggleMicBtn" class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
              <span id="toggleMicBtnLabel">Start Listening (Microphone)</span>
            </button>
            <button id="simulateSpeechBtn" class="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs transition flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
              <span>Simulate Voice Announcement</span>
            </button>
          </div>
        </div>
      </div>

      <div id="tab-embed" class="tab-content hidden p-4 space-y-3 bg-white">
        <div class="space-y-1">
          <h4 class="text-xs font-bold text-slate-900">Install SignFlow on Your Website</h4>
          <p class="text-[11px] text-slate-500">Paste this asynchronous snippet before your closing <code class="text-indigo-600 font-mono">&lt;/body&gt;</code> tag.</p>
        </div>
        <div class="relative">
          <pre id="embedCodeBlock" class="bg-slate-900 text-indigo-300 font-mono text-[11px] p-3 rounded-xl overflow-x-auto leading-relaxed border border-slate-800">&lt;!-- SignFlow AI Accessibility Widget --&gt;
&lt;script src="https://cdn.signflow.ai/widget.v2.js"
  data-site-key="sf_live_98a72b10c4"
  data-default-lang="BSL"
  data-position="bottom-right"
  data-auto-detect="true" async&gt;
&lt;/script&gt;</pre>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span id="copyFeedback" class="text-xs font-semibold text-emerald-600 opacity-0 transition-opacity">Copied to clipboard!</span>
          <button id="copyEmbedBtn" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            <span>Copy Snippet</span>
          </button>
        </div>
      </div>
    </div>

    <button id="signflow-launcher" aria-label="Toggle Sign Language Interpreter" class="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white pl-4 pr-5 py-3.5 rounded-full shadow-2xl shadow-indigo-950/40 border border-indigo-400/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer">
      <div class="relative flex items-center justify-center">
        <span class="absolute -inset-1 rounded-full bg-white/25 animate-ping opacity-75 group-hover:opacity-100"></span>
        <svg class="w-6 h-6 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
        </svg>
      </div>
      <div class="text-left">
        <span class="block text-xs font-extrabold tracking-wide uppercase leading-none">Sign Language</span>
        <span id="launcherSubtext" class="block text-[10px] text-indigo-200 font-medium mt-0.5">Interpreter Active</span>
      </div>
    </button>
  `;
  document.body.appendChild(widgetContainer);

  // Core Script Logic
  (function () {
    'use strict';

    const STOP_WORDS = new Set([
      'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been',
      'to', 'of', 'for', 'and', 'in', 'on', 'at', 'by', 'with', 'that', 'this'
    ]);

    const SIGN_POSES = {
      GREETING: { lx: -0.22, ly: -0.25, rx: 0.48, ry: -0.58, lHand: 'open', rHand: 'wave', brow: 0.35, smile: 0.8, headTilt: 0.08, nod: 0.15, motion: 'wave' },
      QUESTION: { lx: -0.36, ly: -0.22, rx: 0.36, ry: -0.22, lHand: 'open', rHand: 'open', brow: 0.65, smile: -0.1, headTilt: 0.12, nod: 0.0, motion: 'shrug' },
      TRANSPORT: { lx: -0.25, ly: -0.15, rx: 0.32, ry: -0.28, lHand: 'flat', rHand: 'point', brow: 0.1, smile: 0.2, headTilt: -0.04, nod: 0.1, motion: 'forward' },
      ALERT: { lx: -0.35, ly: -0.45, rx: 0.35, ry: -0.45, lHand: 'open', rHand: 'open', brow: -0.45, smile: -0.3, headTilt: 0.0, nod: 0.2, motion: 'pulse' },
      HELP: { lx: -0.14, ly: -0.18, rx: 0.14, ry: -0.26, lHand: 'flat', rHand: 'fist', brow: 0.25, smile: 0.5, headTilt: 0.05, nod: 0.12, motion: 'lift' },
      TIME: { lx: -0.18, ly: -0.12, rx: 0.12, ry: -0.16, lHand: 'fist', rHand: 'point', brow: 0.15, smile: 0.1, headTilt: -0.05, nod: 0.05, motion: 'tap' },
      LOCATION: { lx: -0.28, ly: -0.20, rx: 0.42, ry: -0.36, lHand: 'open', rHand: 'point', brow: 0.2, smile: 0.3, headTilt: 0.06, nod: 0.08, motion: 'arc' },
      AFFIRM: { lx: -0.20, ly: -0.18, rx: 0.24, ry: -0.35, lHand: 'open', rHand: 'thumbs', brow: 0.3, smile: 0.85, headTilt: 0.03, nod: 0.25, motion: 'nod_pulse' },
      DEFAULT: { lx: -0.26, ly: -0.20, rx: 0.28, ry: -0.26, lHand: 'open', rHand: 'open', brow: 0.1, smile: 0.35, headTilt: 0.0, nod: 0.06, motion: 'conversational' }
    };

    const LEXICON_CATEGORIES = {
      GREETING: ['hello', 'welcome', 'hi', 'thank', 'thanks', 'please', 'passenger', 'passengers'],
      QUESTION: ['where', 'what', 'when', 'how', 'who', 'which', 'check', 'view', 'can', 'get'],
      TRANSPORT: ['train', 'trains', 'metrolink', 'transit', 'platform', 'station', 'airport', 'express', 'coastal', 'departing', 'departures', 'boarding'],
      ALERT: ['urgent', 'notice', 'delayed', 'delay', 'maintenance', 'signal', 'warning', 'emergency'],
      HELP: ['help', 'assistance', 'support', 'accessible', 'accessibility', 'wheelchair', 'step', 'free', 'companion', 'deaf', 'sign', 'language', 'interpreter'],
      TIME: ['time', 'today', 'now', 'hours', 'minutes', 'weekend'],
      LOCATION: ['central', 'terminal', 'northgate', 'university', 'harbor', 'office', 'elevator', 'concourse', 'here', 'page'],
      AFFIRM: ['yes', 'available', 'active', 'eligible', 'discount', 'instant', 'ready', 'on']
    };

    function translateToSignGloss(rawText, lang) {
      const cleaned = rawText.replace(/[^\w\s:'-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!cleaned) return [];
      const words = cleaned.split(' ');
      const isQuestion = rawText.includes('?');
      let tokens = [];

      words.forEach((word) => {
        const lower = word.toLowerCase();
        if (STOP_WORDS.has(lower) && words.length > 3) return;
        let gloss = word.toUpperCase();
        if (gloss.endsWith('ING') && gloss.length > 5) {
          gloss = gloss.slice(0, -3);
        }
        let category = 'DEFAULT';
        for (const [cat, keywords] of Object.entries(LEXICON_CATEGORIES)) {
          if (keywords.some(k => lower.includes(k))) {
            category = cat;
            break;
          }
        }
        tokens.push({
          gloss,
          original: word,
          category,
          pose: SIGN_POSES[category] || SIGN_POSES.DEFAULT,
          duration: Math.min(1150, Math.max(580, 480 + gloss.length * 55))
        });
      });

      if (lang === 'BSL' || lang === 'ASL') {
        const whWords = tokens.filter(t => ['WHERE', 'WHAT', 'WHEN', 'HOW', 'WHO', 'WHICH'].includes(t.gloss));
        const nonWhWords = tokens.filter(t => !['WHERE', 'WHAT', 'WHEN', 'HOW', 'WHO', 'WHICH'].includes(t.gloss));
        if (whWords.length > 0 && nonWhWords.length > 0) {
          tokens = [...nonWhWords, ...whWords];
        }
      }
      if (isQuestion && tokens.length > 0) {
        tokens[tokens.length - 1].pose = SIGN_POSES.QUESTION;
      }
      return tokens;
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
      sourceText: 'Welcome to SignFlow AI sign language accessibility plugin.',
      glossSequence: [],
      currentIndex: 0,
      tokenElapsed: 0,
      lastTimestamp: 0,
      hoverDebounceTimer: null
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
      translateSandboxBtn: document.getElementById('translateSandboxBtn'),
      presetPhrases: document.querySelectorAll('.preset-phrase'),
      copyEmbedBtn: document.getElementById('copyEmbedBtn'),
      embedCodeBlock: document.getElementById('embedCodeBlock'),
      copyFeedback: document.getElementById('copyFeedback'),
      quickMicBtn: document.getElementById('quickMicBtn')
    };

    const ctx = els.canvas.getContext('2d');
    const avatarRig = {
      lx: -0.25, ly: 0.12,
      rx: 0.25, ry: 0.12,
      brow: 0.0,
      smile: 0.3,
      headTilt: 0.0,
      nod: 0.0,
      mouthOpen: 0.0,
      blink: 0.0,
      nextBlinkTime: 2500
    };

    function lerp(a, b, t) { return a + (b - a) * t; }

    function resizeCanvas() {
      const rect = els.avatarStageContainer.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      els.canvas.width = rect.width * dpr;
      els.canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawArticulatedHand(ctx, x, y, isRight, handShape, phase) {
      ctx.save();
      ctx.translate(x, y);
      const dir = isRight ? 1 : -1;
      const wristAngle = isRight ? -0.25 + Math.sin(phase) * 0.15 : 0.25 - Math.sin(phase) * 0.15;
      ctx.rotate(wristAngle);

      ctx.fillStyle = '#f4c29f';
      ctx.strokeStyle = '#c98e6b';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(-10, -11, 20, 22, 7);
      ctx.fill();
      ctx.stroke();

      if (handShape === 'point') {
        ctx.beginPath();
        ctx.roundRect(-3 * dir - 2, -25, 5, 16, 2.5);
        ctx.fill();
        ctx.stroke();
      } else if (handShape === 'fist') {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.roundRect(i * 5 - 2.5, -13, 5, 7, 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (handShape === 'thumbs') {
        ctx.beginPath();
        ctx.roundRect(-12 * dir, -20, 6, 14, 3);
        ctx.fill();
        ctx.stroke();
      } else {
        const spread = handShape === 'wave' ? 0.16 : 0.08;
        const fingerHeights = [13, 16, 15, 12];
        for (let i = 0; i < 4; i++) {
          ctx.save();
          const offset = (i - 1.5) * 4.5;
          ctx.translate(offset, -10);
          ctx.rotate((i - 1.5) * spread);
          ctx.beginPath();
          ctx.roundRect(-2.1, -fingerHeights[i], 4.2, fingerHeights[i], 2.1);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.save();
      ctx.translate(-10 * dir, 1);
      ctx.rotate(-0.55 * dir);
      ctx.beginPath();
      ctx.roundRect(-2.5, -11, 5, 12, 2.5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    function renderAvatarFrame(timestamp) {
      if (!state.lastTimestamp) state.lastTimestamp = timestamp;
      const dt = Math.min(50, timestamp - state.lastTimestamp);
      state.lastTimestamp = timestamp;

      if (state.isPlaying && state.glossSequence.length > 0) {
        const currentToken = state.glossSequence[state.currentIndex];
        state.tokenElapsed += dt * state.speed;

        if (state.tokenElapsed >= currentToken.duration) {
          state.tokenElapsed = 0;
          if (state.currentIndex < state.glossSequence.length - 1) {
            state.currentIndex++;
            syncUIWithCurrentToken();
          } else {
            state.isPlaying = false;
            updatePlaybackButtons();
            els.statusDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
            els.statusLabel.textContent = 'Completed • Click Replay';
          }
        }
      }

      const w = els.canvas.width / (window.devicePixelRatio || 1);
      const h = els.canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.56;
      const glow = ctx.createRadialGradient(cx, cy - 20, 15, cx, cy, Math.max(w, h) * 0.65);
      glow.addColorStop(0, 'rgba(99, 102, 241, 0.28)');
      glow.addColorStop(0.6, 'rgba(30, 27, 75, 0.12)');
      glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const tSec = timestamp * 0.001;
      const breath = Math.sin(tSec * 2.2) * 2.5;
      let targetPose = {
        lx: -0.26, ly: 0.24,
        rx: 0.26, ry: 0.24,
        brow: 0.05, smile: 0.35, headTilt: 0, nod: 0,
        lHand: 'open', rHand: 'open', motion: 'idle'
      };

      let phase = tSec * 6.5;

      if (state.isPlaying && state.glossSequence[state.currentIndex]) {
        const tok = state.glossSequence[state.currentIndex];
        const progress = state.tokenElapsed / tok.duration;
        const envelope = Math.sin(progress * Math.PI);
        targetPose = { ...tok.pose };

        if (tok.pose.motion === 'wave') {
          targetPose.rx += Math.sin(progress * Math.PI * 4) * 0.09;
        } else if (tok.pose.motion === 'forward') {
          targetPose.ry -= envelope * 0.08;
          targetPose.rx += envelope * 0.06;
        } else if (tok.pose.motion === 'pulse' || tok.pose.motion === 'lift') {
          targetPose.ly -= envelope * 0.10;
          targetPose.ry -= envelope * 0.10;
        } else if (tok.pose.motion === 'tap') {
          targetPose.ry += Math.abs(Math.sin(progress * Math.PI * 3)) * 0.09;
        } else if (tok.pose.motion === 'arc') {
          targetPose.rx += Math.cos(progress * Math.PI) * 0.12;
          targetPose.ry -= Math.sin(progress * Math.PI) * 0.08;
        } else {
          targetPose.rx += Math.sin(progress * Math.PI * 2) * 0.06;
          targetPose.ly += Math.cos(progress * Math.PI * 2) * 0.05;
        }
        avatarRig.mouthOpen = lerp(avatarRig.mouthOpen, envelope * 0.55, 0.22);
      } else {
        avatarRig.mouthOpen = lerp(avatarRig.mouthOpen, 0, 0.15);
      }

      const smooth = 0.14;
      avatarRig.lx = lerp(avatarRig.lx, targetPose.lx, smooth);
      avatarRig.ly = lerp(avatarRig.ly, targetPose.ly, smooth);
      avatarRig.rx = lerp(avatarRig.rx, targetPose.rx, smooth);
      avatarRig.ry = lerp(avatarRig.ry, targetPose.ry, smooth);
      avatarRig.brow = lerp(avatarRig.brow, targetPose.brow, smooth);
      avatarRig.smile = lerp(avatarRig.smile, targetPose.smile, smooth);
      avatarRig.headTilt = lerp(avatarRig.headTilt, targetPose.headTilt, smooth);
      avatarRig.nod = lerp(avatarRig.nod, targetPose.nod * Math.sin(tSec * 7), smooth);

      if (timestamp > avatarRig.nextBlinkTime) {
        avatarRig.blink = 1;
        if (timestamp > avatarRig.nextBlinkTime + 130) {
          avatarRig.blink = 0;
          avatarRig.nextBlinkTime = timestamp + 2400 + Math.random() * 2500;
        }
      }

      const scale = Math.min(w / 360, h / 250);
      ctx.save();
      ctx.translate(cx, cy + breath * 0.5);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-64, 95);
      ctx.quadraticCurveTo(-68, 22, -38, 12);
      ctx.lineTo(38, 12);
      ctx.quadraticCurveTo(68, 22, 64, 95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.moveTo(-18, 12);
      ctx.lineTo(0, 48);
      ctx.lineTo(18, 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e5ae8a';
      ctx.beginPath();
      ctx.roundRect(-12, -10, 24, 26, 8);
      ctx.fill();

      ctx.save();
      ctx.translate(0, -44 + avatarRig.nod * 14);
      ctx.rotate(avatarRig.headTilt);

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(0, -4, 33, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();

      ctx.fillStyle = '#f4c29f';
      ctx.strokeStyle = '#d49a76';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(-27, -6);
      ctx.quadraticCurveTo(-24, -35, 2, -34);
      ctx.quadraticCurveTo(27, -33, 27, -6);
      ctx.quadraticCurveTo(14, -22, -4, -18);
      ctx.quadraticCurveTo(-18, -16, -27, -6);
      ctx.fill();

      const browY = -9 - avatarRig.brow * 4.5;
      const browTilt = avatarRig.brow * 0.18;
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';

      ctx.save();
      ctx.translate(-10, browY);
      ctx.rotate(-browTilt);
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(0, -2, 6, 0);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(10, browY);
      ctx.rotate(browTilt);
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(0, -2, 6, 0);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#0f172a';
      if (avatarRig.blink > 0.5) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, -2); ctx.lineTo(-6, -2);
        ctx.moveTo(6, -2); ctx.lineTo(14, -2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(-10, -2, 2.6, 0, Math.PI * 2);
        ctx.arc(10, -2, 2.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-9.2, -2.8, 0.9, 0, Math.PI * 2);
        ctx.arc(10.8, -2.8, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#c98e6b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.lineTo(-2, 7);
      ctx.lineTo(2, 8);
      ctx.stroke();

      ctx.strokeStyle = '#9f4a4a';
      ctx.fillStyle = '#7f2d2d';
      ctx.lineWidth = 2;
      const mouthY = 16;
      const smileCurve = avatarRig.smile * 5;
      ctx.beginPath();
      ctx.moveTo(-8, mouthY);
      ctx.quadraticCurveTo(0, mouthY + smileCurve + avatarRig.mouthOpen * 7, 8, mouthY);
      if (avatarRig.mouthOpen > 0.15) {
        ctx.quadraticCurveTo(0, mouthY + smileCurve - 2, -8, mouthY);
        ctx.fill();
      }
      ctx.stroke();

      ctx.restore();

      const lShoulder = { x: -46, y: 22 };
      const rShoulder = { x: 46, y: 22 };
      const lHandPos = { x: avatarRig.lx * 190, y: avatarRig.ly * 150 + 18 };
      const rHandPos = { x: avatarRig.rx * 190, y: avatarRig.ry * 150 + 18 };

      const lElbow = {
        x: (lShoulder.x + lHandPos.x) * 0.5 - 24,
        y: Math.max(lShoulder.y + 28, (lShoulder.y + lHandPos.y) * 0.5 + 22)
      };
      const rElbow = {
        x: (rShoulder.x + rHandPos.x) * 0.5 + 24,
        y: Math.max(rShoulder.y + 28, (rShoulder.y + rHandPos.y) * 0.5 + 22)
      };

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 17;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lShoulder.x, lShoulder.y);
      ctx.quadraticCurveTo(lElbow.x, lElbow.y, lHandPos.x, lHandPos.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rShoulder.x, rShoulder.y);
      ctx.quadraticCurveTo(rElbow.x, rElbow.y, rHandPos.x, rHandPos.y);
      ctx.stroke();

      drawArticulatedHand(ctx, lHandPos.x, lHandPos.y, false, targetPose.lHand, phase);
      drawArticulatedHand(ctx, rHandPos.x, rHandPos.y, true, targetPose.rHand, phase);

      ctx.restore();
      requestAnimationFrame(renderAvatarFrame);
    }

    const speechState = {
      isListening: false,
      recognition: null,
      simTimer: null,
      sampleAnnouncements: [
        'Welcome to SignFlow AI plugin. Click any page text or type a phrase to sign.',
        'Our sign language avatar translates English into BSL and ASL in real time.',
        'Need assistance? Contact support or check our online documentation.'
      ],
      simIndex: 0
    };

    const speechEls = {
      studioTypeModeBtn: document.getElementById('studioTypeModeBtn'),
      studioSpeechModeBtn: document.getElementById('studioSpeechModeBtn'),
      studioTypePanel: document.getElementById('studioTypePanel'),
      studioSpeechPanel: document.getElementById('studioSpeechPanel'),
      audioWaveBars: document.getElementById('audioWaveBars'),
      speechStatusDot: document.getElementById('speechStatusDot'),
      speechStatusText: document.getElementById('speechStatusText'),
      speechTranscriptDisplay: document.getElementById('speechTranscriptDisplay'),
      toggleMicBtn: document.getElementById('toggleMicBtn'),
      toggleMicBtnLabel: document.getElementById('toggleMicBtnLabel'),
      simulateSpeechBtn: document.getElementById('simulateSpeechBtn'),
      quickMicBtn: document.getElementById('quickMicBtn'),
      canvasSpeechBadge: document.getElementById('canvasSpeechBadge'),
      canvasLiveTranscript: document.getElementById('canvasLiveTranscript'),
      canvasStopSpeechBtn: document.getElementById('canvasStopSpeechBtn')
    };

    function switchStudioMode(mode) {
      const isSpeech = mode === 'speech';
      speechEls.studioTypePanel.classList.toggle('hidden', isSpeech);
      speechEls.studioSpeechPanel.classList.toggle('hidden', !isSpeech);

      speechEls.studioTypeModeBtn.className = !isSpeech
        ? 'flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white text-indigo-700 font-bold text-xs shadow-sm transition'
        : 'flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-slate-600 hover:text-slate-900 font-bold text-xs transition';

      speechEls.studioSpeechModeBtn.className = isSpeech
        ? 'flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white text-rose-600 font-bold text-xs shadow-sm transition'
        : 'flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-slate-600 hover:text-slate-900 font-bold text-xs transition';
    }

    function updateSpeechListeningUI(listening, statusMessage) {
      speechState.isListening = listening;
      speechEls.audioWaveBars.classList.toggle('listening-active', listening);

      if (listening) {
        speechEls.speechStatusDot.className = 'w-2 h-2 rounded-full bg-rose-500 animate-ping';
        speechEls.speechStatusText.textContent = statusMessage || 'Listening... Speak now';
        speechEls.toggleMicBtn.className = 'w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2';
        speechEls.toggleMicBtnLabel.textContent = 'Stop Listening';
        speechEls.quickMicBtn.className = 'p-2 rounded-xl bg-rose-600 text-white border border-rose-600 animate-pulse transition';
        speechEls.canvasSpeechBadge.classList.remove('hidden');
      } else {
        speechEls.speechStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
        speechEls.speechStatusText.textContent = statusMessage || 'Ready for voice input';
        speechEls.toggleMicBtn.className = 'w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2';
        speechEls.toggleMicBtnLabel.textContent = 'Start Listening (Microphone)';
        speechEls.quickMicBtn.className = 'p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition';
        speechEls.canvasSpeechBadge.classList.add('hidden');
      }
    }

    function stopSpeechRecognition() {
      clearInterval(speechState.simTimer);
      speechState.simTimer = null;
      if (speechState.recognition) {
        try { speechState.recognition.stop(); } catch (e) {}
      }
      updateSpeechListeningUI(false, 'Ready for voice input');
    }

    function startSpeechToSign(autoReturnToPlayer = false) {
      if (speechState.isListening) {
        stopSpeechRecognition();
        return;
      }
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        runSimulatedSpeechToSign(autoReturnToPlayer);
        return;
      }
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;
        speechState.recognition = recognition;
        let finalTranscript = '';

        recognition.onstart = () => {
          updateSpeechListeningUI(true, 'Listening... Speak now');
          speechEls.speechTranscriptDisplay.textContent = 'Listening...';
          speechEls.canvasLiveTranscript.textContent = 'Listening... Speak now';
        };
        recognition.onresult = (event) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalTranscript += transcript;
            else interimTranscript += transcript;
          }
          const display = (finalTranscript || interimTranscript).trim();
          if (display) {
            speechEls.speechTranscriptDisplay.textContent = `"${display}"`;
            speechEls.canvasLiveTranscript.textContent = `"${display}"`;
            els.sandboxInput.value = display;
          }
        };
        recognition.onerror = () => {
          stopSpeechRecognition();
          runSimulatedSpeechToSign(autoReturnToPlayer);
        };
        recognition.onend = () => {
          const spokenText = finalTranscript.trim() || speechEls.speechTranscriptDisplay.textContent.replace(/^"|"$/g, '').trim();
          updateSpeechListeningUI(false, 'Translating speech to sign...');
          if (spokenText && spokenText !== 'Listening...' && !spokenText.startsWith('Tap ')) {
            loadAndPlayText(spokenText, true);
          }
        };
        recognition.start();
      } catch (err) {
        runSimulatedSpeechToSign(autoReturnToPlayer);
      }
    }

    function runSimulatedSpeechToSign(switchToPlayerOnFinish = true) {
      stopSpeechRecognition();
      const phrase = speechState.sampleAnnouncements[speechState.simIndex % speechState.sampleAnnouncements.length];
      speechState.simIndex++;
      const words = phrase.split(' ');
      let idx = 0;
      updateSpeechListeningUI(true, 'Simulating voice stream...');
      speechEls.speechTranscriptDisplay.textContent = '""';
      speechEls.canvasLiveTranscript.textContent = 'Receiving live audio...';

      speechState.simTimer = setInterval(() => {
        idx++;
        const partial = words.slice(0, idx).join(' ');
        speechEls.speechTranscriptDisplay.textContent = `"${partial}${idx < words.length ? '...' : ''}"`;
        speechEls.canvasLiveTranscript.textContent = `"${partial}"`;
        els.sandboxInput.value = partial;

        if (idx >= words.length) {
          clearInterval(speechState.simTimer);
          speechState.simTimer = null;
          updateSpeechListeningUI(false, 'Speech translated to Sign!');
          if (switchToPlayerOnFinish) {
            loadAndPlayText(phrase, true);
          } else {
            setTimeout(() => loadAndPlayText(phrase, true), 450);
          }
        }
      }, 160);
    }

    speechEls.studioTypeModeBtn.addEventListener('click', () => switchStudioMode('type'));
    speechEls.studioSpeechModeBtn.addEventListener('click', () => switchStudioMode('speech'));
    speechEls.toggleMicBtn.addEventListener('click', () => startSpeechToSign(false));
    speechEls.simulateSpeechBtn.addEventListener('click', () => runSimulatedSpeechToSign(false));
    speechEls.quickMicBtn.addEventListener('click', () => startSpeechToSign(true));
    speechEls.canvasStopSpeechBtn.addEventListener('click', stopSpeechRecognition);

    function loadAndPlayText(text, autoStart = true) {
      if (!text || !text.trim()) return;
      openWidget();
      switchTab('player');
      state.sourceText = text.trim();
      state.glossSequence = translateToSignGloss(state.sourceText, state.language);
      state.currentIndex = 0;
      state.tokenElapsed = 0;
      state.isPlaying = autoStart && state.glossSequence.length > 0;
      renderGlossChips();
      syncUIWithCurrentToken();
      updatePlaybackButtons();
    }

    function renderGlossChips() {
      els.glossTokenContainer.innerHTML = '';
      state.glossSequence.forEach((token, idx) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.textContent = token.gloss;
        chip.dataset.index = idx;
        chip.className = 'gloss-chip font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md border transition cursor-pointer bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-400';
        chip.addEventListener('click', () => {
          state.currentIndex = idx;
          state.tokenElapsed = 0;
          state.isPlaying = true;
          syncUIWithCurrentToken();
          updatePlaybackButtons();
        });
        els.glossTokenContainer.appendChild(chip);
      });
    }

    function syncUIWithCurrentToken() {
      const total = state.glossSequence.length;
      const current = state.glossSequence[state.currentIndex];
      els.progressCounter.textContent = total > 0 ? `${state.currentIndex + 1} / ${total} signs` : '0 / 0 signs';
      els.currentGlossWord.textContent = current ? current.gloss : 'READY';

      const fullGlossString = state.glossSequence.map(t => t.gloss).join(' ');
      els.glossCaptionLine.textContent = fullGlossString ? `GLOSS (${state.language}): ${fullGlossString}` : 'GLOSS: READY';
      els.englishCaptionLine.textContent = `"${state.sourceText}"`;

      if (state.isPlaying) {
        els.statusDot.className = 'w-2 h-2 rounded-full bg-indigo-400 animate-ping';
        els.statusLabel.textContent = `Signing ${state.language} (${state.speed}x)`;
      }

      const chips = els.glossTokenContainer.querySelectorAll('.gloss-chip');
      chips.forEach((chip, i) => {
        if (i === state.currentIndex) {
          chip.className = 'gloss-chip font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105';
          chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else if (i < state.currentIndex) {
          chip.className = 'gloss-chip font-mono text-[11px] font-medium px-2 py-0.5 rounded-md border transition cursor-pointer bg-indigo-50 text-indigo-700 border-indigo-200';
        } else {
          chip.className = 'gloss-chip font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md border transition cursor-pointer bg-slate-100 text-slate-700 border-slate-200';
        }
      });
    }

    function updatePlaybackButtons() {
      if (state.isPlaying) {
        els.playIcon.classList.add('hidden');
        els.pauseIcon.classList.remove('hidden');
      } else {
        els.playIcon.classList.remove('hidden');
        els.pauseIcon.classList.add('hidden');
      }
    }

    function clearSelectedHighlights() {
      document.querySelectorAll('.sign-target-selected').forEach(el => {
        el.classList.remove('sign-target-selected');
      });
    }

    function handleHostElementActivation(targetEl) {
      const textToSign = targetEl.getAttribute('data-sign-text') || targetEl.innerText;
      if (!textToSign || !textToSign.trim()) return;
      clearSelectedHighlights();
      targetEl.classList.add('sign-target-selected');
      loadAndPlayText(textToSign, true);
    }

    function attachHostListeners() {
      // Auto-tag paragraphs, headings, and alert boxes on host page if not tagged
      document.querySelectorAll('p, h1, h2, h3, h4, li, blockquote').forEach(el => {
        if (!el.classList.contains('signable-target') && !el.closest('#signflow-widget-root')) {
          el.classList.add('signable-target');
          if (!el.hasAttribute('data-sign-text')) {
            el.setAttribute('data-sign-text', el.innerText.trim());
          }
        }
      });
      document.body.classList.add('sign-mode-active');

      document.querySelectorAll('.signable-target').forEach(el => {
        el.addEventListener('click', (e) => {
          if (state.interactionMode === 'click') {
            e.stopPropagation();
            handleHostElementActivation(el);
          }
        });
        el.addEventListener('mouseenter', () => {
          if (state.interactionMode === 'hover') {
            clearTimeout(state.hoverDebounceTimer);
            state.hoverDebounceTimer = setTimeout(() => {
              handleHostElementActivation(el);
            }, 260);
          }
        });
        el.addEventListener('mouseleave', () => {
          clearTimeout(state.hoverDebounceTimer);
        });
      });
    }

    function openWidget() {
      state.isOpen = true;
      els.panel.classList.remove('hidden', 'scale-95', 'opacity-0', 'pointer-events-none');
      els.launcherSubtext.textContent = 'Interpreter Open';
      setTimeout(resizeCanvas, 20);
    }

    function closeWidget() {
      state.isOpen = false;
      state.isPlaying = false;
      updatePlaybackButtons();
      els.panel.classList.add('hidden');
      els.launcherSubtext.textContent = 'Click to Open';
    }

    function switchTab(tabName) {
      els.tabBtns.forEach(btn => {
        const active = btn.dataset.tab === tabName;
        btn.className = active
          ? 'tab-btn py-1.5 rounded-lg bg-white text-indigo-700 shadow-sm transition'
          : 'tab-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';
      });
      els.tabContents.forEach(content => {
        content.classList.toggle('hidden', content.id !== `tab-${tabName}`);
      });
      if (tabName === 'player') setTimeout(resizeCanvas, 20);
    }

    els.launcher.addEventListener('click', () => state.isOpen ? closeWidget() : openWidget());
    els.closePanelBtn.addEventListener('click', closeWidget);

    els.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    els.toggleSizeBtn.addEventListener('click', () => {
      state.isExpanded = !state.isExpanded;
      if (state.isExpanded) {
        els.panel.classList.remove('sm:w-[390px]');
        els.panel.classList.add('sm:w-[480px]');
        els.avatarStageContainer.classList.remove('h-[250px]');
        els.avatarStageContainer.classList.add('h-[330px]');
      } else {
        els.panel.classList.remove('sm:w-[480px]');
        els.panel.classList.add('sm:w-[390px]');
        els.avatarStageContainer.classList.remove('h-[330px]');
        els.avatarStageContainer.classList.add('h-[250px]');
      }
      setTimeout(resizeCanvas, 30);
    });

    els.toggleContrastBtn.addEventListener('click', () => {
      state.highContrast = !state.highContrast;
      els.panel.classList.toggle('plugin-high-contrast', state.highContrast);
    });

    els.signLangSelect.addEventListener('change', (e) => {
      state.language = e.target.value;
      els.langBadge.textContent = state.language;
      loadAndPlayText(state.sourceText, true);
    });

    els.modeClickBtn.addEventListener('click', () => {
      state.interactionMode = 'click';
      els.modeClickBtn.className = 'px-2 py-1 rounded-md bg-white text-slate-900 shadow-sm transition';
      els.modeHoverBtn.className = 'px-2 py-1 rounded-md text-slate-600 hover:text-slate-900 transition';
    });
    els.modeHoverBtn.addEventListener('click', () => {
      state.interactionMode = 'hover';
      els.modeHoverBtn.className = 'px-2 py-1 rounded-md bg-white text-slate-900 shadow-sm transition';
      els.modeClickBtn.className = 'px-2 py-1 rounded-md text-slate-600 hover:text-slate-900 transition';
    });

    els.playPauseBtn.addEventListener('click', () => {
      if (state.glossSequence.length === 0) {
        loadAndPlayText(state.sourceText, true);
        return;
      }
      state.isPlaying = !state.isPlaying;
      updatePlaybackButtons();
      syncUIWithCurrentToken();
    });

    els.replayBtn.addEventListener('click', () => {
      state.currentIndex = 0;
      state.tokenElapsed = 0;
      state.isPlaying = true;
      updatePlaybackButtons();
      syncUIWithCurrentToken();
    });

    els.toggleCaptionsBtn.addEventListener('click', () => {
      state.showCaptions = !state.showCaptions;
      els.subtitleOverlay.classList.toggle('opacity-0', !state.showCaptions);
    });

    els.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.speed = parseFloat(btn.dataset.speed);
        els.speedBtns.forEach(b => {
          b.className = b === btn
            ? 'speed-btn px-2 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white'
            : 'speed-btn px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100';
        });
        syncUIWithCurrentToken();
      });
    });

    els.translateSandboxBtn.addEventListener('click', () => {
      const customText = els.sandboxInput.value.trim();
      if (customText) {
        clearSelectedHighlights();
        loadAndPlayText(customText, true);
      }
    });

    els.presetPhrases.forEach(btn => {
      btn.addEventListener('click', () => {
        els.sandboxInput.value = btn.textContent;
        clearSelectedHighlights();
        loadAndPlayText(btn.textContent, true);
      });
    });

    els.copyEmbedBtn.addEventListener('click', () => {
      const codeText = els.embedCodeBlock.innerText;
      const tempTextarea = document.createElement('textarea');
      tempTextarea.value = codeText;
      tempTextarea.style.position = 'fixed';
      tempTextarea.style.opacity = '0';
      document.body.appendChild(tempTextarea);
      tempTextarea.select();
      try {
        document.execCommand('copy');
        els.copyFeedback.classList.remove('opacity-0');
        setTimeout(() => els.copyFeedback.classList.add('opacity-0'), 2400);
      } catch (err) {}
      document.body.removeChild(tempTextarea);
    });

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('load', () => {
      resizeCanvas();
      attachHostListeners();
      loadAndPlayText(state.sourceText, true);
      requestAnimationFrame(renderAvatarFrame);
    });
  })();
})();
