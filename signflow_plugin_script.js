(function () {
  'use strict';

  // 1. Inject Styles
  const style = document.createElement('style');
  style.innerHTML = `
    .plugin-high-contrast { background-color: #000000 !important; color: #ffff00 !important; border: 2px solid #ffff00 !important; }
    .plugin-high-contrast .hc-surface { background-color: #111111 !important; color: #ffffff !important; border-color: #ffff00 !important; }
    .plugin-high-contrast .hc-accent { background-color: #ffff00 !important; color: #000000 !important; font-weight: 700 !important; }
    .plugin-high-contrast .hc-muted { color: #fef08a !important; }
    @keyframes soundWaveBar { 0%, 100% { transform: scaleY(0.25); } 50% { transform: scaleY(1); } }
    .wave-bar { transform-origin: center; transition: transform 0.15s ease; }
    .listening-active .wave-bar { animation: soundWaveBar 0.7s ease-in-out infinite; }
    .listening-active .wave-bar:nth-child(2) { animation-delay: 0.12s; }
    .listening-active .wave-bar:nth-child(3) { animation-delay: 0.24s; }
    .listening-active .wave-bar:nth-child(4) { animation-delay: 0.36s; }
    .listening-active .wave-bar:nth-child(5) { animation-delay: 0.48s; }
  `;
  document.head.appendChild(style);

  // 2. Inject Tailwind CSS if not already present
  if (!document.querySelector('script[src*="tailwindcss"]')) {
    const twScript = document.createElement('script');
    twScript.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(twScript);
  }

  // 3. Create Widget Root & Container HTML
  const container = document.createElement('div');
  container.id = 'signflow-widget-root';
  container.className = 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end font-sans';
  container.innerHTML = `
    <div id="signflow-panel" class="w-[calc(100vw-2rem)] sm:w-[390px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-300 origin-bottom-right mb-3 flex flex-col">
      <div class="hc-surface bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-inner">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
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
          <button id="closePanelBtn" class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>
      <div id="avatarStageContainer" class="relative w-full h-[250px] bg-gradient-to-b from-slate-800 via-slate-900 to-indigo-950 overflow-hidden select-none">
        <canvas id="signAvatarCanvas" class="w-full h-full block"></canvas>
      </div>
    </div>
    <button id="signflow-launcher" class="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white pl-4 pr-5 py-3.5 rounded-full shadow-2xl border border-indigo-400/30 transition-all">
      <span class="text-xs font-extrabold uppercase leading-none">Sign Language</span>
    </button>
  `;
  document.body.appendChild(container);

  // 4. Basic Canvas & Animation Init
  const canvas = document.getElementById('signAvatarCanvas');
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  setTimeout(resizeCanvas, 50);

  function renderLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(canvas.width / 4, canvas.height / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);

  // Toggle button logic
  document.getElementById('signflow-launcher').addEventListener('click', () => {
    const panel = document.getElementById('signflow-panel');
    panel.classList.toggle('hidden');
    setTimeout(resizeCanvas, 50);
  });
  document.getElementById('closePanelBtn').addEventListener('click', () => {
    document.getElementById('signflow-panel').classList.add('hidden');
  });
})();
