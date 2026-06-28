const header = document.querySelector('.site-header');
const onScroll = () => header?.classList.toggle('elevated', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    
    event.preventDefault();
    
    // Disable snapping temporarily to prevent animation fights
    document.documentElement.classList.add('no-snap');
    
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Re-enable snapping when scrolling stops
    let scrollTimeout;
    const onScrollEnd = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.documentElement.classList.remove('no-snap');
        window.removeEventListener('scroll', onScrollEnd);
      }, 150);
    };
    
    window.addEventListener('scroll', onScrollEnd);
    
    // Fallback re-enable in case we're already at target scroll position
    setTimeout(() => {
      document.documentElement.classList.remove('no-snap');
    }, 1000);
  });
});

/* ── Interactive Auditing Network Canvas ─────────────────────────────── */
const canvas = document.getElementById('hero-canvas');
const heroSection = document.getElementById('top');

if (canvas && heroSection) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width = heroSection.offsetWidth;
  let height = canvas.height = heroSection.offsetHeight;
  
  let nodes = [];
  
  const colors = [
    '#f38ba8', // Red (Vulnerability)
    '#a6e3a1', // Green (Secure)
    '#89b4fa', // Blue (Trace Path)
    '#94e2d5'  // Teal (Compiler Hint)
  ];
  
  const mouse = { x: null, y: null, active: false };
  
  class AuditNode {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.baseRadius = 2 + Math.random() * 2.5;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.pulseSpeed = 0.02 + Math.random() * 0.03;
      this.pulseTime = Math.random() * Math.PI * 2;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      // Boundaries
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      
      this.pulseTime += this.pulseSpeed;
    }
    
    draw() {
      const radius = this.baseRadius + Math.sin(this.pulseTime) * 1.2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      
      // Node glow
      ctx.shadowBlur = 8 + Math.sin(this.pulseTime) * 4;
      ctx.shadowColor = this.color;
      ctx.fill();
    }
  }
  
  function init() {
    nodes = [];
    const count = Math.min(45, Math.floor((width * height) / 25000));
    for (let i = 0; i < count; i++) {
      nodes.push(new AuditNode());
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections (behind nodes)
    ctx.shadowBlur = 0;
    
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      nodeA.update();
      
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 140) {
          const alpha = (1 - dist / 140) * 0.18;
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.strokeStyle = nodeA.color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      }
      
      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = nodeA.x - mouse.x;
        const dy = nodeA.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 220) {
          const alpha = (1 - dist / 220) * 0.28;
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = '#cba6f7'; // Mauve connection line for mouse interaction
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 1.0;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      }
    }
    
    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].draw();
    }
    
    ctx.shadowBlur = 0;
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('resize', () => {
    width = canvas.width = heroSection.offsetWidth;
    height = canvas.height = heroSection.offsetHeight;
    init();
  });
  
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  
  heroSection.addEventListener('mouseleave', () => {
    mouse.active = false;
  });
  
  init();
  animate();
}

const zoomSections = document.querySelectorAll('.hero, .section, .final-cta');

// Track which sections have had their .reveal children triggered
const revealedSections = new WeakSet();

function smoothstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

function updateZoom() {
  const vh = window.innerHeight;

  zoomSections.forEach((el) => {
    // Skip the hero — it's always fully visible
    if (el.classList.contains('hero')) return;

    const rect = el.getBoundingClientRect();
    const elHeight = rect.height || 1;

    // How far the element's top has entered from the bottom of the viewport
    //   0 = element top is at or below viewport bottom
    //   1 = element top has reached the top of the viewport
    const enterProgress = (vh - rect.top) / vh;

    // How much of the element is visible (for very tall sections)
    const visiblePortion = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0)) / elHeight;

    // Combine: use enterProgress mainly, boosted by visiblePortion for tall sections
    const raw = Math.max(enterProgress, visiblePortion);

    // Map to 0→1 range: starts zooming when 10% entered, fully zoomed at 50% entered
    const t = smoothstep(Math.max(0, Math.min(1, (raw - 0.1) / 0.4)));

    const scale = 0.88 + t * 0.12;
    const opacity = t;

    el.style.setProperty('--zoom', scale);
    el.style.setProperty('--zoom-opacity', opacity);

    // Trigger child .reveal elements once section is sufficiently visible
    if (t > 0.3 && !revealedSections.has(el)) {
      revealedSections.add(el);
      el.querySelectorAll('.reveal').forEach((child) => child.classList.add('visible'));
      if (el.classList.contains('reveal')) el.classList.add('visible');
    }
  });

  requestAnimationFrame(updateZoom);
}

// Start the loop
requestAnimationFrame(updateZoom);

// Still observe standalone .reveal elements not inside zoom-sections
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach((node) => {
  if (!node.closest('.zoom-section')) {
    revealObserver.observe(node);
  }
});

const stages = {
  detector: { kicker: '01 / Detector layer', title: 'Compiler-aware structure first.', copy: 'Chainvet starts with Solidity structure, compiler metadata, and fallback parsing so later checks have a consistent view of contracts and functions.', code: 'frontend: Solidity structure\nfallback: parser hints\noutput: normalized contracts' },
  path: { kicker: '02 / Path reasoning', title: 'Suspicious flows get deeper attention.', copy: 'The hybrid pipeline follows risky branches and state transitions around functions that look security-sensitive.', code: 'seed: suspicious function\ntrace: branch constraints\nresult: feasible risk path' },
  runtime: { kicker: '03 / Runtime evidence', title: 'Signals become executable evidence.', copy: 'Runtime traces help distinguish theoretical warnings from externally-triggered behavior such as reentrant callbacks and failed calls.', code: 'input: generated sequence\ntrace: external call + storage\nevidence: callback before finalize' },
  surface: { kicker: '04 / Surface & report', title: 'One reportable finding set.', copy: 'Chainvet deduplicates findings, suppresses low-signal output, and produces Markdown or styled PDF reports.', code: 'dedupe: file + function + kind\nreview: optional model pass\noutput: audit report' }
};
const stageTabs = document.querySelectorAll('.stage-tab');
const stageKicker = document.querySelector('#stage-kicker');
const stageTitle = document.querySelector('#stage-title');
const stageCopy = document.querySelector('#stage-copy');
const stageCode = document.querySelector('#stage-code code');
stageTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const stage = stages[tab.dataset.stage];
    if (!stage) return;
    stageTabs.forEach((item) => item.classList.toggle('active', item === tab));
    stageKicker.textContent = stage.kicker;
    stageTitle.textContent = stage.title;
    stageCopy.textContent = stage.copy;
    stageCode.textContent = stage.code;
  });
});

const reportButtons = document.querySelectorAll('[data-pdf-page]');
reportButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const pdf = document.querySelector('.pdf-frame');
    const page = button.dataset.pdfPage || '1';
    if (pdf) {
      pdf.src = 'assets/chainvet-sample-report.pdf#page=' + page + '&view=FitH&toolbar=0';
      pdf.focus();
    }
    reportButtons.forEach((item) => item.classList.toggle('active', item === button));
  });
});

/* ── Terminal Console Tabs & Copy ───────────────────────────────────── */
const consoleTabs = document.querySelectorAll('.console-tab');
const consoleCopyBtn = document.querySelector('.console-copy');

consoleTabs.forEach((tab) => {
  tab.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    consoleTabs.forEach((t) => t.classList.toggle('active', t === tab));
    const targetId = `console-${tab.dataset.console}`;
    document.querySelectorAll('.hero-console .console-body').forEach((body) => {
      body.style.display = body.id === targetId ? 'block' : 'none';
    });
  });
});

if (consoleCopyBtn) {
  consoleCopyBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const activeBody = document.querySelector('.hero-console .console-body:not([style*="display: none"]):not([style*="display:none"])');
    if (!activeBody) return;
    
    // Extract only command lines (those with em or starting with $)
    const commandParagraphs = Array.from(activeBody.querySelectorAll('p')).filter(p => p.querySelector('em') || p.textContent.trim().startsWith('$'));
    const textToCopy = commandParagraphs.map(p => {
      let txt = p.textContent.trim();
      if (txt.startsWith('$')) {
        txt = txt.slice(1).trim();
      }
      return txt;
    }).join('\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
      consoleCopyBtn.classList.add('copied');
      const originalSvg = consoleCopyBtn.innerHTML;
      // Change icon to checkmark
      consoleCopyBtn.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>`;
      setTimeout(() => {
        consoleCopyBtn.classList.remove('copied');
        consoleCopyBtn.innerHTML = originalSvg;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  });
}

/* ── VS Code replica interactions ────────────────────────────────────── */

const vscodeStatus = document.querySelector('#vscode-status');
const vscodeOutput = document.querySelector('#vscode-output');

/* Sidebar toolbar action buttons */
const actionText = {
  file:      ['Analysis complete', '▶ Chainvet: Analyze Current File\n$ chainvet --hybrid Reentrancy.sol --json\n  frontend   Solidity structure loaded\n  pipeline   detector + path + runtime evidence\n  surface    deduplicate & suppress low-signal\n✓ 3 findings surfaced (1 high · 1 medium · 1 low)\n✓ diagnostics updated'],
  workspace: ['Analysis complete', '▶ Chainvet: Analyze Workspace\n$ chainvet --hybrid ./contracts --json\n  frontend   17 Solidity files loaded\n  pipeline   detector + path + runtime evidence\n  surface    deduplicate & suppress low-signal\n✓ 12 findings surfaced\n✓ diagnostics updated\n✓ report cache updated'],
  target:    ['Analysis complete', '▶ Chainvet: Analyze Selected File/Folder\n  target     /home/anan/project/contracts selected\n  frontend   Solidity structure loaded\n✓ hybrid analysis queued'],
  pdf:       ['Analysis complete', '▶ Chainvet: Generate PDF Report\n  source     using cached hybrid analysis\n  layout     cover · summary · findings · PoC\n✓ chainvet-hybrid-report.pdf ready'],
  md:        ['Analysis complete', '▶ Chainvet: Generate Markdown Report\n  source     using cached hybrid analysis\n✓ chainvet-hybrid-report.md ready'],
  refresh:   ['Analysis complete', '↻ Chainvet: Refresh Findings View\n✓ sidebar tree refreshed']
};

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.querySelectorAll('[data-action]').forEach((item) => item.classList.toggle('active', item === button));
    const state = actionText[button.dataset.action] || ['Analysis complete', 'Ready'];
    if (vscodeStatus) vscodeStatus.textContent = state[0];
    if (vscodeOutput) vscodeOutput.textContent = state[1];
  });
});

/* Tree group collapse/expand */
document.querySelectorAll('.tree-group-header').forEach((header) => {
  header.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    header.closest('.tree-group')?.classList.toggle('open');
  });
});

/* Finding item click → highlight code line + update output */
document.querySelectorAll('.finding-item').forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Update active state
    document.querySelectorAll('.finding-item').forEach((entry) => entry.classList.toggle('active', entry === item));
    // Highlight the corresponding line
    document.querySelectorAll('.code-editor [data-line]').forEach((line) => line.classList.remove('active-line'));
    const targetLine = document.querySelector('.code-editor [data-line="' + item.dataset.line + '"]');
    targetLine?.classList.add('active-line');
    // Update status and output
    const label = item.querySelector('.tree-label')?.textContent || 'Finding';
    const desc = item.querySelector('.tree-desc')?.textContent || '';
    const sev = item.dataset.severity || 'unknown';
    if (vscodeStatus) vscodeStatus.textContent = 'Analysis complete';
    if (vscodeOutput) {
      vscodeOutput.textContent = '▶ Finding detail\n  kind       ' + label + '\n  severity   ' + sev + '\n  location   ' + desc + '\n  line       ' + item.dataset.line;
    }
  });
});

/* ── Web UI replica interactions ────────────────────────────────────── */
const webuiTabs = document.querySelectorAll('.browser-tab');
const webuiViews = {
  'Dashboard': 'dash-view-dashboard',
  'Findings': 'dash-view-findings',
  'Settings': 'dash-view-settings'
};

webuiTabs.forEach((tab) => {
  tab.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle active tab style
    webuiTabs.forEach((t) => t.classList.toggle('active', t === tab));
    
    // Show corresponding view content
    const activeViewId = webuiViews[tab.textContent.trim()];
    Object.values(webuiViews).forEach((viewId) => {
      const viewEl = document.getElementById(viewId);
      if (viewEl) {
        viewEl.style.display = viewEl.id === activeViewId ? 'block' : 'none';
      }
    });
  });
});

// Findings filter buttons
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach((btn) => {
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
    
    const filterValue = btn.dataset.filter;
    const rows = document.querySelectorAll('.dash-finding-row');
    rows.forEach((row) => {
      if (filterValue === 'all' || row.dataset.severity === filterValue) {
        row.style.display = 'grid';
      } else {
        row.style.display = 'none';
      }
    });
  });
});

/* ── Interactive Section Canvas Backdrops (rAF & Observers) ────────── */
const sectionCanvases = [
  { id: 'canvas-pipeline', init: initPipelineCanvas, draw: drawPipelineCanvas },
  { id: 'canvas-reports', init: initReportsCanvas, draw: drawReportsCanvas },
  { id: 'canvas-webui', init: initWebuiCanvas, draw: drawWebuiCanvas },
  { id: 'canvas-extension', init: initExtensionCanvas, draw: drawExtensionCanvas },
  { id: 'canvas-cicd', init: initCicdCanvas, draw: drawCicdCanvas },
  { id: 'canvas-evaluation', init: initEvaluationCanvas, draw: drawEvaluationCanvas }
];

const canvasStates = new Map();

// Global intersection observer to only animate visible canvases
const canvasVisibilityObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const canvasId = entry.target.querySelector('canvas')?.id;
    if (!canvasId) return;
    const state = canvasStates.get(canvasId);
    if (state) {
      state.visible = entry.isIntersecting;
      if (entry.isIntersecting) {
        // Re-initialize layouts once visible to capture finalized coordinates
        const sc = sectionCanvases.find(c => c.id === canvasId);
        if (sc) sc.init(state);
        
        if (!state.animating) {
          state.animating = true;
          renderCanvas(state);
        }
      }
    }
  });
}, { threshold: 0.05 });

// Register each section canvas
sectionCanvases.forEach((sc) => {
  const canvasEl = document.getElementById(sc.id);
  const parent = canvasEl?.closest('section');
  if (!canvasEl || !parent) return;

  const state = {
    el: canvasEl,
    ctx: canvasEl.getContext('2d'),
    parent: parent,
    width: canvasEl.offsetWidth,
    height: canvasEl.offsetHeight,
    visible: false,
    animating: false,
    mouse: { x: null, y: null, active: false },
    data: [],
    drawCallback: sc.draw
  };

  canvasEl.width = state.width;
  canvasEl.height = state.height;

  // Handle local mouse events on parent section container
  parent.addEventListener('mousemove', (e) => {
    const rect = parent.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
    state.mouse.active = true;
  });

  parent.addEventListener('mouseleave', () => {
    state.mouse.active = false;
  });

  // Init local particle/line parameters
  sc.init(state);

  // Cache state and observe
  canvasStates.set(sc.id, state);
  canvasVisibilityObserver.observe(parent);

  // Resize handler
  window.addEventListener('resize', () => {
    state.width = canvasEl.width = canvasEl.offsetWidth;
    state.height = canvasEl.height = canvasEl.offsetHeight;
    sc.init(state);
  });
});

function renderCanvas(state) {
  if (!state.visible) {
    state.animating = false;
    return;
  }
  state.ctx.clearRect(0, 0, state.width, state.height);
  state.drawCallback(state);
  requestAnimationFrame(() => renderCanvas(state));
}

/* Helper to get element coordinates relative to parent container, ignoring CSS transitions/transforms */
function getLayoutCoords(element, parent) {
  let x = 0;
  let y = 0;
  let curr = element;
  while (curr && curr !== parent) {
    x += curr.offsetLeft;
    y += curr.offsetTop;
    curr = curr.offsetParent;
  }
  return { x, y };
}

/* 1. Pipeline Canvas: Hybrid Merger (Static + Symbolic + Fuzzing -> Synthesis) */
function initPipelineCanvas(state) {
  state.data = []; // Will hold active particles
  
  const bubbles = document.querySelectorAll('.intro-band > div');
  const h2 = document.querySelector('.pipeline-section h2');
  
  // Default fallback coords if elements aren't ready
  const defaultSources = [
    { x: state.width * 0.2, y: state.height * 0.15, color: '#94e2d5', label: 'Static' },
    { x: state.width * 0.5, y: state.height * 0.15, color: '#89b4fa', label: 'Symbolic' },
    { x: state.width * 0.8, y: state.height * 0.15, color: '#fab387', label: 'Fuzzing' }
  ];
  const defaultDest = { x: state.width * 0.25, y: state.height * 0.45, color: '#a6e3a1', label: 'Synthesis', pulse: 0 };
  
  state.sources = [];
  const colors = ['#94e2d5', '#89b4fa', '#fab387'];
  
  if (bubbles.length === 3) {
    bubbles.forEach((b, idx) => {
      const coords = getLayoutCoords(b, state.parent);
      state.sources.push({
        x: coords.x + b.offsetWidth / 2,
        y: coords.y + b.offsetHeight / 2,
        color: colors[idx]
      });
    });
  } else {
    state.sources = defaultSources;
  }
  
  if (h2) {
    const coords = getLayoutCoords(h2, state.parent);
    // Position exactly 24px to the left of the "Hybrid" header text start, perfectly centered vertically
    state.dest = {
      x: coords.x - 24,
      y: coords.y + h2.offsetHeight / 2 + 1,
      color: '#a6e3a1',
      pulse: 0
    };
  } else {
    state.dest = defaultDest;
  }

  // Generate 40 particles
  for (let i = 0; i < 40; i++) {
    const srcIdx = Math.floor(Math.random() * state.sources.length);
    state.data.push({
      srcIndex: srcIdx,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.005,
      size: 2.2 + Math.random() * 2.2,
      // Random control point offsets for curved organic paths
      ctrlX: (Math.random() - 0.5) * 140,
      ctrlY: 80 + Math.random() * 120
    });
  }
}

function drawPipelineCanvas(state) {
  const { ctx, width, height, mouse, data, sources, dest } = state;
  if (!sources || sources.length === 0 || !dest) return;

  // 1. Draw connecting guide lines behind particles
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(108, 112, 134, 0.14)';
  sources.forEach((src) => {
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    // Draw Bezier curves connecting bubbles down to the Synthesis node
    ctx.bezierCurveTo(
      src.x, src.y + 120,
      dest.x, dest.y - 120,
      dest.x, dest.y
    );
    ctx.stroke();
  });

  // 2. Draw source hubs (concentric rings inside the bubbles)
  sources.forEach((src) => {
    ctx.beginPath();
    ctx.arc(src.x, src.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = src.color;
    ctx.globalAlpha = 0.48;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  });

  // Dest hub pulse effect
  dest.pulse -= 0.05;
  if (dest.pulse < 0) dest.pulse = 0;
  const destRadius = 8 + Math.sin(dest.pulse) * 6;

  // Pulsing Synthesis node beside the "Hybrid" header
  ctx.beginPath();
  ctx.arc(dest.x, dest.y, destRadius, 0, Math.PI * 2);
  ctx.fillStyle = dest.color;
  ctx.globalAlpha = 0.45 + Math.sin(dest.pulse) * 0.45;
  ctx.shadowBlur = 12;
  ctx.shadowColor = dest.color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;

  // 3. Update and draw particles
  data.forEach((p) => {
    p.progress += p.speed;
    if (p.progress > 1) {
      p.progress = 0;
      dest.pulse = Math.PI * 2; // Trigger pulse when merging into destination node
    }

    const src = sources[p.srcIndex];
    if (!src) return;
    
    const t = p.progress;
    
    // Calculate Bezier coordinates (BezierCurveTo path matching guide lines)
    const cp1x = src.x;
    const cp1y = src.y + 120;
    const cp2x = dest.x;
    const cp2y = dest.y - 120;

    // Cubic Bezier curve formula
    const mt = 1 - t;
    let px = mt * mt * mt * src.x + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * dest.x;
    let py = mt * mt * mt * src.y + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * dest.y;

    // Mouse magnetic warp
    if (mouse.active) {
      const dx = mouse.x - px;
      const dy = mouse.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 160) {
        const pull = (1 - dist / 160) * 0.4;
        px += (mouse.x - px) * pull;
        py += (mouse.y - py) * pull;
      }
    }

    // Draw particle
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fillStyle = src.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  });
}

/* 2. Reports Canvas: Page Compilation Particles */
function initReportsCanvas(state) {
  state.data = [];
  const pageCount = 10;
  for (let i = 0; i < pageCount; i++) {
    state.data.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height + state.height,
      w: 45 + Math.random() * 20,
      h: 60 + Math.random() * 25,
      angle: (Math.random() - 0.5) * 0.4,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      speed: 0.4 + Math.random() * 0.5,
      opacity: 0.35 + Math.random() * 0.35, // Increased page opacity
      offsetx: (Math.random() - 0.5) * 240   // Unique scatter offset so pages don't align in a straight line
    });
  }
}

function drawReportsCanvas(state) {
  const { ctx, width, height, mouse, data } = state;
  ctx.lineWidth = 1;

  data.forEach((p) => {
    p.y -= p.speed;
    p.angle += p.rotationSpeed;
    if (mouse.active) {
      // Pages drift gently towards the mouse with their unique offsets to remain scattered
      p.x += (mouse.x + p.offsetx - p.x) * 0.015;
    }

    // Wrap around screen
    if (p.y + p.h < 0) {
      p.y = height + 40;
      p.x = Math.random() * width;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.strokeStyle = '#cba6f7'; // Mauve page color
    ctx.globalAlpha = p.opacity;
    
    // Draw card outline
    ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
    
    // Draw mini code lines inside page outlines
    ctx.beginPath();
    ctx.moveTo(-p.w / 2 + 8, -p.h / 2 + 12);
    ctx.lineTo(p.w / 2 - 8, -p.h / 2 + 12);
    ctx.moveTo(-p.w / 2 + 8, -p.h / 2 + 22);
    ctx.lineTo(p.w / 2 - 16, -p.h / 2 + 22);
    ctx.moveTo(-p.w / 2 + 8, -p.h / 2 + 32);
    ctx.lineTo(p.w / 2 - 12, -p.h / 2 + 32);
    ctx.strokeStyle = '#89b4fa';
    ctx.stroke();

    ctx.restore();
  });
  ctx.globalAlpha = 1.0;
}

/* 3. Web UI Canvas: Hexagonal Grid Scan */
function initWebuiCanvas(state) {
  state.data = [];
  const hexRadius = 40;
  const cols = Math.ceil(state.width / (hexRadius * 1.5)) + 1;
  const rows = Math.ceil(state.height / (hexRadius * Math.sqrt(3))) + 1;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = c * hexRadius * 1.5;
      const cy = r * hexRadius * Math.sqrt(3) + (c % 2 ? (hexRadius * Math.sqrt(3)) / 2 : 0);
      state.data.push({
        x: cx,
        y: cy,
        r: hexRadius,
        glow: 0,
        color: ['#f38ba8', '#fab387', '#89b4fa'][Math.floor(Math.random() * 3)]
      });
    }
  }
}

function drawWebuiCanvas(state) {
  const { ctx, mouse, data } = state;
  ctx.lineWidth = 0.8;

  data.forEach((hex) => {
    let targetGlow = 0;
    if (mouse.active) {
      const dx = mouse.x - hex.x;
      const dy = mouse.y - hex.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 150) {
        targetGlow = (1 - dist / 150) * 0.95;
      }
    }

    // Smooth hover transition
    hex.glow += (targetGlow - hex.glow) * 0.1;

    // Draw faint base hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = hex.x + Math.cos(angle) * hex.r;
      const y = hex.y + Math.sin(angle) * hex.r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (hex.glow > 0.02) {
      ctx.strokeStyle = hex.color;
      ctx.globalAlpha = 0.15 + hex.glow * 0.55; // Brighter hex outline
      ctx.stroke();
      
      // Faint hex center fill
      ctx.fillStyle = hex.color;
      ctx.globalAlpha = hex.glow * 0.18; // More visible fill
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(108, 112, 134, 0.16)'; // More visible grid lines
      ctx.globalAlpha = 1.0;
      ctx.stroke();
    }
  });
  ctx.globalAlpha = 1.0;
}

/* 4. Extension Canvas: Editor Code Stream */
function initExtensionCanvas(state) {
  state.data = [];
  const codeTokens = [
    'pragma', 'solidity', 'contract', 'require', 'payable', 'address',
    'balances', 'withdraw', 'transfer', 'mapping', 'msg.sender', 'msg.value',
    'require(ok)', 'uint256', 'function', 'revert()', 'owner'
  ];
  const count = 18;
  for (let i = 0; i < count; i++) {
    state.data.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height + state.height,
      text: codeTokens[Math.floor(Math.random() * codeTokens.length)],
      speed: 0.35 + Math.random() * 0.4,
      size: 11 + Math.random() * 4,
      color: ['#a6e3a1', '#94e2d5', '#cba6f7', '#89b4fa'][Math.floor(Math.random() * 4)],
      opacity: 0.35 + Math.random() * 0.35 // Brighter text streams
    });
  }
}

function drawExtensionCanvas(state) {
  const { ctx, width, height, mouse, data } = state;
  ctx.font = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  data.forEach((t) => {
    t.y -= t.speed;

    if (mouse.active) {
      const dx = mouse.x - t.x;
      const dy = mouse.y - t.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 120) {
        // Push characters away from cursor
        const force = (120 - dist) * 0.08;
        t.x -= (dx / dist) * force;
      }
    }

    if (t.y < -20) {
      t.y = height + 30;
      t.x = Math.random() * width;
    }

    ctx.fillStyle = t.color;
    ctx.globalAlpha = t.opacity;
    ctx.font = `${t.size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.fillText(t.text, t.x, t.y);
  });
  ctx.globalAlpha = 1.0;
}

/* 5. CI/CD Canvas: Pipeline Pulse Wires */
function initCicdCanvas(state) {
  state.data = [];
  const trackCount = 6;
  for (let i = 0; i < trackCount; i++) {
    state.data.push({
      y: (state.height / (trackCount + 1)) * (i + 1),
      pulses: [
        { progress: Math.random(), speed: 0.0015 + Math.random() * 0.002, color: '#a6e3a1' },
        { progress: Math.random() - 0.5, speed: 0.0015 + Math.random() * 0.002, color: '#89b4fa' }
      ]
    });
  }
}

function drawCicdCanvas(state) {
  const { ctx, width, height, mouse, data } = state;

  data.forEach((track) => {
    // Draw wire track
    ctx.beginPath();
    ctx.moveTo(0, track.y);
    ctx.lineTo(width, track.y);
    ctx.strokeStyle = 'rgba(108, 112, 134, 0.32)'; // Brighter tracks
    ctx.lineWidth = 1;
    ctx.stroke();

    // Update and draw pulse waves
    track.pulses.forEach((pulse) => {
      let speedMult = 1.0;
      if (mouse.active) {
        const dy = Math.abs(mouse.y - track.y);
        if (dy < 60) {
          speedMult = 3.2; // Speed up pulses nearby mouse
        }
      }
      pulse.progress += pulse.speed * speedMult;
      if (pulse.progress > 1) {
        pulse.progress = 0;
      }

      const px = width * pulse.progress;
      
      // Pulse glow
      ctx.beginPath();
      const grad = ctx.createRadialGradient(px, track.y, 0, px, track.y, 14);
      grad.addColorStop(0, pulse.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.85; // Highly visible glowing pulses
      ctx.arc(px, track.y, 14, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.globalAlpha = 1.0;
}

/* 6. Evaluation Canvas: Scatter Plot Metrics */
function initEvaluationCanvas(state) {
  state.data = [];
  const pointCount = 42; // Increased points count for a richer scatter metrics look
  for (let i = 0; i < pointCount; i++) {
    state.data.push({
      x: 100 + Math.random() * (state.width - 200),
      y: 80 + Math.random() * (state.height - 160),
      baseX: 0,
      baseY: 0,
      color: ['#a6e3a1', '#f38ba8'][Math.floor(Math.random() * 2)],
      r: 3.5 + Math.random() * 3,
      pulseTime: Math.random() * Math.PI * 2
    });
  }
}

function drawEvaluationCanvas(state) {
  const { ctx, width, height, mouse, data } = state;
  ctx.lineWidth = 0.8;
  
  // Draw grid axes
  ctx.strokeStyle = 'rgba(108, 112, 134, 0.22)'; // More visible grid lines
  ctx.beginPath();
  // Horizontal grid lines
  for (let y = 50; y < height; y += 80) {
    ctx.moveTo(50, y);
    ctx.lineTo(width - 50, y);
  }
  // Vertical grid lines
  for (let x = 50; x < width; x += 100) {
    ctx.moveTo(x, 50);
    ctx.lineTo(x, height - 50);
  }
  ctx.stroke();

  data.forEach((p) => {
    p.pulseTime += 0.02;
    const offset = Math.sin(p.pulseTime) * 3;
    const finalX = p.x;
    const finalY = p.y + offset;

    // Draw coordinate projectors on mouse hover
    if (mouse.active) {
      const dx = mouse.x - finalX;
      const dy = mouse.y - finalY;
      const dist = Math.hypot(dx, dy);

      if (dist < 180) {
        ctx.beginPath();
        ctx.setLineDash([4, 4]); // Dashed guide lines
        ctx.moveTo(finalX, finalY);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = (1 - dist / 180) * 0.75; // Much brighter guides
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }
    }

    // Draw metrics dot
    ctx.beginPath();
    ctx.arc(finalX, finalY, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.65 + Math.sin(p.pulseTime) * 0.25; // Brighter points
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1.0;
}
