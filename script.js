const compactViewport = window.matchMedia('(max-width: 820px), (pointer: coarse)');
const isCompactViewport = () => compactViewport.matches;

const header = document.querySelector('.site-header');
const onScroll = () => header?.classList.toggle('elevated', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const menuToggle = document.querySelector('.mobile-menu-toggle');
if (menuToggle && header) {
  menuToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = header.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    
    event.preventDefault();
    
    if (header && header.classList.contains('menu-open')) {
      header.classList.remove('menu-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
    
    if (isCompactViewport()) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    scrollToPageTarget(target, 620);
  });
});

const mobileAdvisory = document.querySelector('#mobile-advisory');
const mobileAdvisoryClose = document.querySelector('[data-mobile-advisory-close]');

function storageGet(key) {
  try { return window.sessionStorage.getItem(key); } catch (_) { return null; }
}

function storageSet(key, value) {
  try { window.sessionStorage.setItem(key, value); } catch (_) {}
}

function showMobileAdvisory() {
  if (!mobileAdvisory || !isCompactViewport()) return;
  if (storageGet('chainvet-mobile-advisory-seen') === '1') return;
  mobileAdvisory.hidden = false;
  window.setTimeout(() => mobileAdvisoryClose?.focus({ preventScroll: true }), 80);
}

function dismissMobileAdvisory() {
  if (!mobileAdvisory) return;
  mobileAdvisory.hidden = true;
  storageSet('chainvet-mobile-advisory-seen', '1');
}

mobileAdvisoryClose?.addEventListener('click', dismissMobileAdvisory);
mobileAdvisory?.addEventListener('click', (event) => {
  if (event.target === mobileAdvisory) dismissMobileAdvisory();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileAdvisory && !mobileAdvisory.hidden) dismissMobileAdvisory();
});
window.addEventListener('load', showMobileAdvisory);


/* ── Section wheel paging ──────────────────────────────────────────── */
const pageSections = Array.from(document.querySelectorAll('.hero, main > .section, main > .final-cta'));
let sectionPagingLocked = false;
let wheelIntent = 0;
let wheelIntentTimer = 0;
let activeSectionScroll = 0;

function canScrollWithin(target, deltaY) {
  let node = target instanceof Element ? target : target?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const scrollable = /(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight + 2;
    if (scrollable) {
      const atTop = node.scrollTop <= 1;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
    }
    node = node.parentElement;
  }
  return false;
}

function activePageIndex() {
  if (!pageSections.length) return -1;
  const anchor = window.innerHeight * 0.42;
  let bestIndex = 0;
  let bestDistance = Infinity;
  pageSections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const centerDistance = Math.abs((rect.top + Math.min(rect.height, window.innerHeight) * 0.42) - anchor);
    if (centerDistance < bestDistance) {
      bestDistance = centerDistance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function sectionEase(t) {
  return 1 - Math.pow(1 - t, 3);
}

function sectionTop(target) {
  return Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY));
}

function scrollToPageTarget(target, duration = 680) {
  if (!target) return;
  window.cancelAnimationFrame(activeSectionScroll);

  const start = window.scrollY;
  const destination = sectionTop(target);
  const distance = destination - start;
  const startedAt = performance.now();

  document.documentElement.classList.add('section-paging');

  function step(now) {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / duration);
    const eased = sectionEase(progress);
    window.scrollTo(0, Math.round(start + distance * eased));

    if (progress < 1) {
      activeSectionScroll = window.requestAnimationFrame(step);
      return;
    }

    window.scrollTo(0, destination);
    if (target.classList.contains('zoom-section')) {
      target.style.setProperty('--zoom', '1');
      target.style.setProperty('--zoom-opacity', '1');
    }
    window.requestAnimationFrame(() => window.scrollTo(0, destination));
    window.setTimeout(() => {
      document.documentElement.classList.remove('section-paging');
    }, 80);
  }

  activeSectionScroll = window.requestAnimationFrame(step);
}

function pageToSection(index) {
  const target = pageSections[index];
  if (!target) return;
  sectionPagingLocked = true;
  scrollToPageTarget(target, 680);
  window.setTimeout(() => {
    sectionPagingLocked = false;
  }, 760);
}

window.addEventListener('wheel', (event) => {
  if (isCompactViewport()) return;
  if (!pageSections.length) return;
  if (event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
  if (canScrollWithin(event.target, event.deltaY)) return;

  const current = activePageIndex();
  const instantDirection = event.deltaY > 0 ? 1 : -1;
  const canPage = (instantDirection > 0 && current < pageSections.length - 1) || (instantDirection < 0 && current > 0);
  if (!canPage) return;

  event.preventDefault();
  wheelIntent += event.deltaY;
  window.clearTimeout(wheelIntentTimer);
  wheelIntentTimer = window.setTimeout(() => { wheelIntent = 0; }, 160);

  if (sectionPagingLocked || Math.abs(wheelIntent) < 48) return;

  const direction = wheelIntent > 0 ? 1 : -1;
  const next = Math.max(0, Math.min(pageSections.length - 1, current + direction));

  wheelIntent = 0;
  pageToSection(next);
}, { passive: false });

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
    if (heroVisible) {
      requestAnimationFrame(animate);
    } else {
      heroAnimating = false;
    }
  }
  
  let heroVisible = true;
  let heroAnimating = true;
  
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible && !heroAnimating) {
        heroAnimating = true;
        animate();
      }
    });
  }, { threshold: 0.05 });
  
  heroObserver.observe(heroSection);
  
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

const zoomSections = document.querySelectorAll('.section, .final-cta');
zoomSections.forEach((el) => el.classList.add('zoom-section'));

// Track which sections have had their .reveal children triggered
const revealedSections = new WeakSet();

function smoothstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

function revealCompactSections() {
  zoomSections.forEach((el) => {
    el.style.setProperty('--zoom', '1');
    el.style.setProperty('--zoom-opacity', '1');
    el.querySelectorAll('.reveal').forEach((child) => child.classList.add('visible'));
    if (el.classList.contains('reveal')) el.classList.add('visible');
  });
}

let compactSectionsRevealed = false;

function updateZoom() {
  if (isCompactViewport()) {
    if (!compactSectionsRevealed) {
      revealCompactSections();
      compactSectionsRevealed = true;
    }
    window.setTimeout(updateZoom, 300);
    return;
  }

  compactSectionsRevealed = false;
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
const vscodeDetail = document.querySelector('#vscode-finding-detail');
const vscodeDetailSeverity = document.querySelector('#vscode-detail-severity');
const vscodeDetailKind = document.querySelector('#vscode-detail-kind');
const vscodeDetailName = document.querySelector('#vscode-detail-name');
const vscodeDetailLocation = document.querySelector('#vscode-detail-location');
const vscodeDetailSummary = document.querySelector('#vscode-detail-summary');
const vscodeDetailFunction = document.querySelector('#vscode-detail-function');
const vscodeDetailEvidence = document.querySelector('#vscode-detail-evidence');
const vscodeDetailSnippet = document.querySelector('#vscode-detail-snippet');

const vscodeFindingDetails = {
  '12': {
    severity: 'high',
    badge: 'H',
    name: 'Reentrancy In Withdraw',
    location: 'Reentrancy.sol:12',
    fn: 'withdraw()',
    evidence: 'external call before balance reset',
    summary: 'The withdrawal path sends Ether to msg.sender before clearing balances[msg.sender], so a fallback callback can re-enter while the original balance is still available.',
    snippet: 'msg.sender.call.value(balances[msg.sender])();\nbalances[msg.sender] = 0;'
  },
  '20': {
    severity: 'medium',
    badge: 'M',
    name: 'Unchecked Low Level Call',
    location: 'Reentrancy.sol:20',
    fn: 'trigger(address)',
    evidence: 'return value is ignored',
    summary: 'The low-level target.call result is not checked. Failed calls can be silently ignored, which may leave calling code assuming an action succeeded.',
    snippet: 'target.call(bytes4(keccak256("withdraw()")));\n// return value is not inspected'
  },
  '7': {
    severity: 'low',
    badge: 'L',
    name: 'Timestamp Dependency',
    location: 'Reentrancy.sol:7',
    fn: 'deposit()',
    evidence: 'block.timestamp influences contract state',
    summary: 'The function records block.timestamp in contract state. Validators have limited influence over timestamps, so this should not drive sensitive logic.',
    snippet: 'lastBlock = block.timestamp;\n// avoid timestamp-sensitive authorization or payouts'
  }
};

function updateVscodeDetail(lineNumber) {
  const detail = vscodeFindingDetails[String(lineNumber)] || vscodeFindingDetails['12'];
  if (!detail) return;
  if (vscodeDetail) vscodeDetail.dataset.severity = detail.severity;
  if (vscodeDetailSeverity) vscodeDetailSeverity.textContent = detail.badge;
  if (vscodeDetailKind) vscodeDetailKind.textContent = detail.severity.charAt(0).toUpperCase() + detail.severity.slice(1) + ' severity · Finding';
  if (vscodeDetailName) vscodeDetailName.textContent = detail.name;
  if (vscodeDetailLocation) vscodeDetailLocation.textContent = detail.location;
  if (vscodeDetailSummary) vscodeDetailSummary.textContent = detail.summary;
  if (vscodeDetailFunction) vscodeDetailFunction.textContent = detail.fn;
  if (vscodeDetailEvidence) vscodeDetailEvidence.textContent = detail.evidence;
  if (vscodeDetailSnippet) vscodeDetailSnippet.textContent = detail.snippet;
}
updateVscodeDetail('12');

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
    updateVscodeDetail(item.dataset.line);
    vscodeDetail?.classList.remove('pulse');
    void vscodeDetail?.offsetWidth;
    vscodeDetail?.classList.add('pulse');
    if (vscodeStatus) vscodeStatus.textContent = 'Finding selected';
    if (vscodeOutput) {
      vscodeOutput.textContent = '▶ Chainvet: Show Finding Detail\n  kind       ' + label + '\n  severity   ' + sev + '\n  location   ' + desc + '\n  line       ' + item.dataset.line + '\n  detail     opened in Chainvet editor tab';
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
  { id: 'canvas-interfaces', init: initInterfacesCanvas, draw: drawInterfacesCanvas },
  { id: 'canvas-cicd', init: initCicdCanvas, draw: drawCicdCanvas },
  { id: 'canvas-comparison', init: initComparisonCanvas, draw: drawComparisonCanvas }
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

/* 3. Workspaces Canvas: Unified Interface Elements */
function initInterfacesCanvas(state) {
  state.data = [];
  const count = 28;
  for (let i = 0; i < count; i++) {
    state.data.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 4 + Math.random() * 8,
      pulse: Math.random() * Math.PI * 2,
      color: ['#cba6f7', '#89b4fa', '#94e2d5'][Math.floor(Math.random() * 3)]
    });
  }
}

function drawInterfacesCanvas(state) {
  const { ctx, width, height, mouse, data } = state;
  ctx.lineWidth = 1;
  
  data.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.pulse += 0.02;
    
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
    
    let alpha = 0.08 + Math.sin(p.pulse) * 0.04;
    
    if (mouse.active) {
      const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (dist < 150) {
        alpha = Math.max(alpha, (1 - dist / 150) * 0.35);
      }
    }
    
    ctx.beginPath();
    ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.stroke();
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



/* 7. Comparison Canvas: Scanner Sweep Grid */
function initComparisonCanvas(state) {
  state.data = {
    dots: [],
    sweepX: 0,
    sweepSpeed: 1.2
  };
  const spacing = 45;
  const cols = Math.ceil(state.width / spacing) + 1;
  const rows = Math.ceil(state.height / spacing) + 1;
  
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      state.data.dots.push({
        x: c * spacing,
        y: r * spacing,
        r: 1 + Math.random() * 1.5,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }
}

function drawComparisonCanvas(state) {
  const { ctx, width, height, mouse, data } = state;
  if (!data) return;
  
  // Update scanner line sweep
  data.sweepX += data.sweepSpeed;
  if (data.sweepX > width) {
    data.sweepX = 0;
  }
  
  // Draw dots
  data.dots.forEach((dot) => {
    dot.pulse += 0.015;
    const distToSweep = Math.abs(dot.x - data.sweepX);
    let intensity = 0;
    if (distToSweep < 100) {
      intensity = (1 - distToSweep / 100);
    }
    
    // Mouse hover influence
    if (mouse.active) {
      const mouseDist = Math.hypot(dot.x - mouse.x, dot.y - mouse.y);
      if (mouseDist < 120) {
        intensity = Math.max(intensity, (1 - mouseDist / 120) * 0.85);
      }
    }
    
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r + intensity * 2, 0, Math.PI * 2);
    
    if (intensity > 0.05) {
      ctx.fillStyle = dot.x < width / 2 ? '#f38ba8' : '#a6e3a1'; // Red on left (traditional), Green on right (chainvet)
      ctx.globalAlpha = 0.12 + intensity * 0.45;
    } else {
      ctx.fillStyle = '#6c7086'; // Subtle color for idle dots
      ctx.globalAlpha = 0.08 + Math.sin(dot.pulse) * 0.04;
    }
    ctx.fill();
  });
  
  // Draw the actual vertical scanning line
  ctx.beginPath();
  const grad = ctx.createLinearGradient(data.sweepX - 20, 0, data.sweepX + 20, 0);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.5, 'rgba(203, 166, 247, 0.22)'); // Mauve scanner line
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(data.sweepX - 20, 0, 40, height);
  
  ctx.globalAlpha = 1.0;
}

/* ── Interface Tabs Slider ───────────────────────────────────────── */
const interfaceTabs = document.querySelectorAll('.interface-tab');
const interfaceSlides = document.querySelectorAll('.interface-slide');

interfaceTabs.forEach((tab) => {
  tab.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle tab active class
    interfaceTabs.forEach((t) => t.classList.toggle('active', t === tab));
    interfaceTabs.forEach((t) => t.setAttribute('aria-selected', t === tab ? 'true' : 'false'));
    
    // Toggle slides
    const targetTab = tab.dataset.tab;
    interfaceSlides.forEach((slide) => {
      if (slide.id === `slide-${targetTab}`) {
        slide.style.display = 'grid';
        // Add active class for transitions
        setTimeout(() => slide.classList.add('active'), 20);
      } else {
        slide.classList.remove('active');
        slide.style.display = 'none';
      }
    });
  });
});

/* ── Comparison Tabs Slider ───────────────────────────────────────── */
const comparisonTabs = document.querySelectorAll('.comparison-tab');
const comparisonSlides = document.querySelectorAll('.comparison-slide');

comparisonTabs.forEach((tab) => {
  tab.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle tab active class
    comparisonTabs.forEach((t) => t.classList.toggle('active', t === tab));
    comparisonTabs.forEach((t) => t.setAttribute('aria-selected', t === tab ? 'true' : 'false'));
    
    // Toggle slides
    const targetTab = tab.dataset.tab;
    comparisonSlides.forEach((slide) => {
      if (slide.id === `comp-slide-${targetTab}`) {
        slide.style.display = 'grid';
        // Add active class for transitions
        setTimeout(() => slide.classList.add('active'), 20);
      } else {
        slide.classList.remove('active');
        slide.style.display = 'none';
      }
    });
  });
});



