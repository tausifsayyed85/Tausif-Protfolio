/**
 * Tausif Sayyed - Data Science & ML Engineering Portfolio
 * Scrollytelling Architecture Synced to 240 Video Frames
 */

(function () {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 240;
  const LERP_FACTOR = 0.09;
  const INITIAL_READY_THRESHOLD = 12;
  const CONCURRENT_DOWNLOAD_LIMIT = 10;

  // --- DOM Elements ---
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const loaderOverlay = document.getElementById('loader');
  const loaderPct = document.getElementById('loader-pct');
  const loaderBarFill = document.getElementById('loader-bar-fill');
  const frameCounter = document.getElementById('frame-counter');
  const frameHudFill = document.getElementById('frame-hud-fill');
  const liveClock = document.getElementById('live-clock');
  const siteHeader = document.querySelector('.site-header');
  const dockStatusText = document.getElementById('dock-status-text');
  const dockScrollBtn = document.getElementById('dock-scroll-btn');

  // Widget Elements
  const widgetIndex = document.getElementById('widget-index');
  const widgetTitle = document.getElementById('widget-title');
  const widgetSliderBar = document.getElementById('widget-slider-bar');
  const widgetPrevBtn = document.getElementById('widget-prev');
  const widgetNextBtn = document.getElementById('widget-next');

  // Menu Modal Elements
  const menuBtn = document.getElementById('menu-btn');
  const menuModal = document.getElementById('menu-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalBackdrop = document.getElementById('modal-backdrop');

  // Scrollytelling Sections
  const storySections = document.querySelectorAll('.story-section');
  const navLinks = document.querySelectorAll('.center-nav .nav-link');

  // --- Animation & Rendering State ---
  const images = new Array(TOTAL_FRAMES + 1);
  const loadedFlags = new Uint8Array(TOTAL_FRAMES + 1);
  let loadedCount = 0;
  let currentFrame = 1;
  let targetFrame = 1;
  let lastDrawnFrame = -1;
  let isExperienceActive = false;

  // --- 1. Frame URL Builder ---
  function getFrameUrl(index) {
    const padded = index.toString().padStart(6, '0');
    return `video_frames_24fps/frame_${padded}.png`;
  }

  // --- 2. Canvas Sizing & Retina Scaling ---
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    const targetW = Math.round(displayWidth * dpr);
    const targetH = Math.round(displayHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      lastDrawnFrame = -1;
    }
  }

  // --- 3. Nearest Loaded Image Fallback ---
  function getNearestLoadedImage(targetIdx) {
    if (loadedFlags[targetIdx] && images[targetIdx]) {
      return images[targetIdx];
    }
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const lower = targetIdx - offset;
      if (lower >= 1 && loadedFlags[lower] && images[lower]) {
        return images[lower];
      }
      const upper = targetIdx + offset;
      if (upper <= TOTAL_FRAMES && loadedFlags[upper] && images[upper]) {
        return images[upper];
      }
    }
    return null;
  }

  // --- 4. Aspect-Ratio Preserving 'Cover' Draw Math ---
  function renderFrameToCanvas(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, offsetX, offsetY, scaledWidth, scaledHeight);
  }

  // --- 5. Frame Draw Handler ---
  function drawCurrentFrame(index) {
    const safeIndex = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(index)));
    if (safeIndex === lastDrawnFrame) return;

    const imgToDraw = getNearestLoadedImage(safeIndex);
    if (imgToDraw) {
      renderFrameToCanvas(imgToDraw);
      lastDrawnFrame = safeIndex;
    }
  }

  // --- 6. Section & HUD Tracking ---
  const sectionLabels = {
    home: 'AI Full Stack Developer',
    about: 'Profile & Full Stack Mindset',
    projects: 'Websites & AI Full Stack Systems',
    experience: 'Work Experience & Engineering Track Record',
    skills: 'Full Stack Skills Matrix & Contact'
  };

  function updateActiveSection(scrollY) {
    let currentSectionId = 'home';
    const scrollMiddle = scrollY + window.innerHeight * 0.4;

    storySections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollMiddle >= top && scrollMiddle < top + height) {
        currentSectionId = section.getAttribute('id');
      }
    });

    // Update Nav Link highlighting
    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
        if (!link.querySelector('.active-dot')) {
          const dot = document.createElement('span');
          dot.className = 'active-dot';
          link.appendChild(dot);
        }
      } else {
        link.classList.remove('active');
        const dot = link.querySelector('.active-dot');
        if (dot) dot.remove();
      }
    });

    // Update Bottom Dock Status
    if (dockStatusText && sectionLabels[currentSectionId]) {
      dockStatusText.textContent = sectionLabels[currentSectionId];
    }
  }

  // --- 7. Scroll Progress Handler ---
  function updateScrollProgress() {
    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

    targetFrame = 1 + progress * (TOTAL_FRAMES - 1);

    // Frame Counter & Progress Bar
    if (frameCounter) {
      frameCounter.textContent = `FRAME ${Math.round(targetFrame).toString().padStart(3, '0')} / ${TOTAL_FRAMES}`;
    }
    if (frameHudFill) {
      frameHudFill.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    // Header Background on Scroll
    if (siteHeader) {
      if (scrollY > 50) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    }

    // Active Section Tracking
    updateActiveSection(scrollY);
  }

  // --- 8. Continuous Physics Lerp Loop ---
  function animationLoop() {
    const delta = targetFrame - currentFrame;
    if (Math.abs(delta) > 0.0005) {
      currentFrame += delta * LERP_FACTOR;
      drawCurrentFrame(currentFrame);
    } else if (lastDrawnFrame !== Math.round(targetFrame)) {
      currentFrame = targetFrame;
      drawCurrentFrame(currentFrame);
    }

    requestAnimationFrame(animationLoop);
  }

  // --- 9. Reveal Experience ---
  function checkReadyToStart() {
    if (isExperienceActive) return;

    if (loadedFlags[1] || loadedCount >= INITIAL_READY_THRESHOLD) {
      isExperienceActive = true;
      drawCurrentFrame(1);
      setTimeout(() => {
        loaderOverlay.classList.add('is-loaded');
      }, 150);
    }
  }

  // --- 10. Frame Preloader ---
  async function loadSingleFrame(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = getFrameUrl(index);

      const onComplete = async () => {
        if ('decode' in img) {
          try {
            await img.decode();
          } catch (e) {}
        }
        images[index] = img;
        loadedFlags[index] = 1;
        loadedCount++;

        const percent = Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100));
        if (loaderPct) loaderPct.textContent = `${percent}%`;
        if (loaderBarFill) loaderBarFill.style.width = `${percent}%`;

        checkReadyToStart();
        resolve();
      };

      img.onload = onComplete;
      img.onerror = () => resolve();
    });
  }

  async function preloadAllFrames() {
    await loadSingleFrame(1);

    const queue = [];
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      queue.push(i);
    }

    let activeWorkers = 0;
    function processNext() {
      if (queue.length === 0) return;

      while (activeWorkers < CONCURRENT_DOWNLOAD_LIMIT && queue.length > 0) {
        const nextIdx = queue.shift();
        activeWorkers++;
        loadSingleFrame(nextIdx).finally(() => {
          activeWorkers--;
          processNext();
        });
      }
    }

    processNext();
  }

  // --- 11. Live Clock ---
  function updateLiveTime() {
    if (!liveClock) return;
    const now = new Date();
    
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;

    const day = now.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    liveClock.textContent = `${hours}:${minutes}${ampm} · ${day} ${month}, ${year}`;
  }

  // --- 12. Project Widget Carousel ---
  const widgetSlides = [
    { index: '01', title: 'AI Full Stack Apps.', progress: 35 },
    { index: '02', title: 'Client Web Portals.', progress: 65 },
    { index: '03', title: 'Full Stack SaaS Apps.', progress: 85 },
    { index: '04', title: 'Predictive Analytics UI.', progress: 100 }
  ];
  let currentSlide = 0;

  function setWidgetSlide(idx) {
    currentSlide = (idx + widgetSlides.length) % widgetSlides.length;
    const slide = widgetSlides[currentSlide];

    if (widgetIndex) widgetIndex.textContent = slide.index;
    if (widgetTitle) widgetTitle.textContent = slide.title;
    if (widgetSliderBar) widgetSliderBar.style.width = `${slide.progress}%`;
  }

  // --- 13. UI Events & Smooth Navigation ---
  function setupUIEvents() {
    updateLiveTime();
    setInterval(updateLiveTime, 30000);

    if (widgetPrevBtn) {
      widgetPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setWidgetSlide(currentSlide - 1);
      });
    }

    if (widgetNextBtn) {
      widgetNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setWidgetSlide(currentSlide + 1);
      });
    }

    // Modal Drawer
    if (menuBtn && menuModal) {
      menuBtn.addEventListener('click', () => {
        menuModal.classList.add('is-open');
        menuModal.setAttribute('aria-hidden', 'false');
      });
    }

    const closeModal = () => {
      if (menuModal) {
        menuModal.classList.remove('is-open');
        menuModal.setAttribute('aria-hidden', 'true');
      }
    };

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    document.querySelectorAll('.modal-link').forEach((link) => {
      link.addEventListener('click', closeModal);
    });

    // Dock Scroll Button: scrolls down smoothly to the next section
    if (dockScrollBtn) {
      dockScrollBtn.addEventListener('click', () => {
        const scrollY = window.scrollY || window.pageYOffset;
        let nextTarget = null;

        for (const section of storySections) {
          if (section.offsetTop > scrollY + 50) {
            nextTarget = section;
            break;
          }
        }

        if (nextTarget) {
          nextTarget.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    // Formspree Contact Form AJAX Handler
    const contactForm = document.getElementById('contact-form');
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const formStatusMsg = document.getElementById('form-status-msg');

    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const originalBtnHtml = formSubmitBtn.innerHTML;

        formSubmitBtn.disabled = true;
        formSubmitBtn.innerHTML = '<span>Sending Message...</span>';
        if (formStatusMsg) {
          formStatusMsg.textContent = '';
          formStatusMsg.className = 'form-status-msg';
        }

        try {
          const response = await fetch(contactForm.action, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            contactForm.reset();
            if (formStatusMsg) {
              formStatusMsg.textContent = '✓ Message sent! Tausif will get back to you shortly.';
              formStatusMsg.className = 'form-status-msg success';
            }
            formSubmitBtn.innerHTML = '<span>Sent Successfully!</span>';
            setTimeout(() => {
              formSubmitBtn.disabled = false;
              formSubmitBtn.innerHTML = originalBtnHtml;
            }, 4000);
          } else {
            throw new Error('Form submission error');
          }
        } catch (err) {
          if (formStatusMsg) {
            formStatusMsg.textContent = '✕ Error sending. Please email tausifsayyed85@gmail.com directly.';
            formStatusMsg.className = 'form-status-msg error';
          }
          formSubmitBtn.disabled = false;
          formSubmitBtn.innerHTML = originalBtnHtml;
        }
      });
    }

    // Close on Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuModal && menuModal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  // --- 14. Initialization ---
  function init() {
    resizeCanvas();
    window.addEventListener('resize', () => {
      resizeCanvas();
      drawCurrentFrame(currentFrame);
    }, { passive: true });

    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    updateScrollProgress();
    setupUIEvents();

    requestAnimationFrame(animationLoop);
    preloadAllFrames();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
