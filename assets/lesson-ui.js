/* ============================================================
   Español con Diana — Lesson UI (V3)
   - Language toggle (EN | FR), persisted in localStorage
   - Sub-page block completion tracking
   - Topic rollup (completed / total)
   - Test-gated complete button (listens for test-checked event)
   - Dynamic iframe sizing (ResizeObserver + scrollHeight)
   - Translation tab switching (lang-aware default)
   - Sub-page prev/next nav
   - Mobile nav toggle
   ============================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     LANGUAGE TOGGLE
     Key: localStorage 'lang' → 'en' | 'fr'
     Event: window CustomEvent 'lang-changed' {detail:{lang}}
  ══════════════════════════════════════════════════════════ */

  function getLang() {
    return localStorage.getItem('lang') || 'en';
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'fr') return;
    localStorage.setItem('lang', lang);
    // Update all lang-toggle buttons on the page
    document.querySelectorAll('.lang-toggle__btn').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('lang-toggle__btn--active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    window.dispatchEvent(new CustomEvent('lang-changed', { detail: { lang: lang } }));
  }

  function initLangToggle() {
    var currentLang = getLang();

    document.querySelectorAll('.lang-toggle__btn').forEach(function (btn) {
      var btnLang = btn.getAttribute('data-lang');
      btn.classList.toggle('lang-toggle__btn--active', btnLang === currentLang);
      btn.setAttribute('aria-pressed', String(btnLang === currentLang));

      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang'));
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     SUB-PAGE COMPLETION TRACKING
     Key pattern: 'completed-<topicId>-<blockCode>'
     e.g. 'completed-01-greetings-introductions-A'
  ══════════════════════════════════════════════════════════ */

  function blockKey(topicId, blockCode) {
    return 'completed-' + topicId + '-' + blockCode;
  }

  function markBlockComplete(topicId, blockCode) {
    localStorage.setItem(blockKey(topicId, blockCode), 'true');
    try {
      window.dispatchEvent(new CustomEvent('diana:block-completed', {
        detail: { topicId: topicId, blockCode: blockCode }
      }));
    } catch (e) {}
  }

  function isBlockComplete(topicId, blockCode) {
    return localStorage.getItem(blockKey(topicId, blockCode)) === 'true';
  }

  /* ══════════════════════════════════════════════════════════
     TOPIC ROLLUP
  ══════════════════════════════════════════════════════════ */

  function getTopicProgress(topicId, totalBlocks) {
    var completed = 0;
    var BLOCK_CODES = 'ABCDEFGHIJKLM';
    for (var i = 0; i < totalBlocks; i++) {
      if (isBlockComplete(topicId, BLOCK_CODES[i])) completed++;
    }
    return { completed: completed, total: totalBlocks };
  }

  function isTopicComplete(topicId, totalBlocks) {
    var p = getTopicProgress(topicId, totalBlocks);
    return p.completed >= p.total;
  }

  /* ══════════════════════════════════════════════════════════
     TEST-GATED COMPLETE BUTTON
     Listens for 'test-checked' CustomEvent from test-engine.js.
     Button is disabled until allCorrect === true on that test.
     If block already complete, button starts enabled + done state.
  ══════════════════════════════════════════════════════════ */

  function initCompleteButton() {
    var btn = document.getElementById('complete-btn');
    var hint = document.getElementById('complete-hint');
    if (!btn) return;

    var topicId  = document.body.getAttribute('data-topic-id');
    var blockCode = document.body.getAttribute('data-block-code');

    // Legacy support: if no block-code attr, fall back to old topic-level key
    if (!topicId) return;

    var alreadyDone = blockCode
      ? isBlockComplete(topicId, blockCode)
      : localStorage.getItem('completed-' + topicId) === 'true';

    function setDone() {
      btn.textContent = '✓ Completada';
      btn.classList.add('complete-btn--done');
      btn.disabled = false; // clickable for feedback, actual action no-op
      if (hint) hint.style.display = 'none';
      if (blockCode) markBlockComplete(topicId, blockCode);
      else localStorage.setItem('completed-' + topicId, 'true');
      try {
        window.dispatchEvent(new CustomEvent('diana:completed', { detail: { topicId: topicId } }));
      } catch (e) {}
    }

    if (alreadyDone) {
      setDone();
    } else {
      // Start disabled — only enable after passing mini-test
      btn.disabled = true;
      btn.classList.add('complete-btn--locked');
      if (hint) hint.style.display = 'block';
    }

    // Listen for test-engine scoring events
    document.addEventListener('test-checked', function (e) {
      if (e.detail && e.detail.allCorrect) {
        btn.disabled = false;
        btn.classList.remove('complete-btn--locked');
        if (hint) hint.style.display = 'none';
      }
    });

    // Click handler — only fires when enabled
    btn.addEventListener('click', function () {
      if (!btn.classList.contains('complete-btn--done')) {
        setDone();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     DYNAMIC IFRAME SIZING
     Applies to every iframe.dynamic-iframe.
     Reads child scrollHeight, sets height. Falls back to 2400px
     if cross-origin blocks measurement.
  ══════════════════════════════════════════════════════════ */

  function sizeIframe(iframe) {
    try {
      var h = iframe.contentDocument
        ? iframe.contentDocument.body.scrollHeight
        : iframe.contentWindow.document.body.scrollHeight;
      if (h && h > 0) {
        iframe.style.height = h + 'px';
        return;
      }
    } catch (e) {
      // Cross-origin — fall back
    }
    iframe.style.height = '2400px';
  }

  function initDynamicIframes() {
    var iframes = document.querySelectorAll('iframe.dynamic-iframe');
    if (!iframes.length) return;

    iframes.forEach(function (iframe) {
      iframe.addEventListener('load', function () {
        sizeIframe(iframe);
      });
      // If already loaded (cached)
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        sizeIframe(iframe);
      }
    });

    // Re-run on window resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        iframes.forEach(sizeIframe);
      }, 150);
    });

    // ResizeObserver on each iframe's content if same-origin
    if (typeof ResizeObserver !== 'undefined') {
      iframes.forEach(function (iframe) {
        iframe.addEventListener('load', function () {
          try {
            var ro = new ResizeObserver(function () { sizeIframe(iframe); });
            ro.observe(iframe.contentDocument.body);
          } catch (e) {}
        });
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     TRANSLATION TAB SWITCHING (V3)
     Tabs: .lang-tab[data-lang="en|fr"]
     Frames: .translation-frame[data-lang]
     Default tab matches current lang setting.
     Also syncs when lang-changed fires.
  ══════════════════════════════════════════════════════════ */

  function initTranslationTabs() {
    var container = document.querySelector('.subpage-translation, .translation-tabs');
    if (!container) return;

    var tabs   = container.querySelectorAll('.lang-tab, [data-lang].translation-tab');
    var frames = container.querySelectorAll('.translation-frame[data-lang]');

    if (!tabs.length || !frames.length) return;

    function showLang(lang) {
      tabs.forEach(function (tab) {
        var active = tab.getAttribute('data-lang') === lang;
        tab.classList.toggle('lang-tab--active', active);
        tab.classList.toggle('translation-tab--active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      frames.forEach(function (frame) {
        var show = frame.getAttribute('data-lang') === lang;
        frame.style.display = show ? 'block' : 'none';
        if (show) frame.setAttribute('data-active', '');
        else frame.removeAttribute('data-active');
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        showLang(tab.getAttribute('data-lang'));
      });
    });

    // Default to current lang
    showLang(getLang());

    // Sync when global lang changes
    window.addEventListener('lang-changed', function (e) {
      showLang(e.detail && e.detail.lang ? e.detail.lang : getLang());
    });
  }

  /* ══════════════════════════════════════════════════════════
     SUB-PAGE NAV (Anterior / Siguiente)
     Buttons: [data-nav="prev"] and [data-nav="next"] with data-href.
     Falls back to <a> with .subpage-nav__btn.
  ══════════════════════════════════════════════════════════ */

  function initSubpageNav() {
    document.querySelectorAll('[data-nav]').forEach(function (btn) {
      var href = btn.getAttribute('data-href');
      if (!href) return;
      btn.addEventListener('click', function () {
        window.location.href = href;
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     LEGACY COMPLETION (old flat lesson pages — topic-level key)
     Kept for backward-compat until all old pages are removed.
  ══════════════════════════════════════════════════════════ */

  function initLegacyCompletion() {
    var btn = document.getElementById('complete-btn');
    if (!btn) return;
    // If initCompleteButton already handled it (has data-topic-id), skip
    if (document.body.getAttribute('data-topic-id')) return;

    var topicId = document.body.getAttribute('data-topic') || '';
    if (!topicId) return;
    var key = 'completed-' + topicId;

    function setCompleted() {
      btn.textContent = '¡Completada! ✓';
      btn.classList.add('complete-btn--done');
      btn.disabled = true;
      localStorage.setItem(key, 'true');
      try { window.dispatchEvent(new CustomEvent('diana:completed', { detail: { topicId: topicId } })); } catch (e) {}
    }

    if (localStorage.getItem(key) === 'true') setCompleted();
    btn.addEventListener('click', setCompleted);
  }

  /* ══════════════════════════════════════════════════════════
     MOBILE NAV TOGGLE
  ══════════════════════════════════════════════════════════ */

  function initMobileNav() {
    var toggle = document.querySelector('.site-nav__toggle');
    var links  = document.querySelector('.site-nav__links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      links.classList.toggle('site-nav__links--open', !expanded);
      links.classList.toggle('is-open', !expanded);
    });
  }

  /* ══════════════════════════════════════════════════════════
     INDEX PAGE — PROGRESS METERS
     Called on index.html where each card has data-topic-id
     and data-total-blocks.
  ══════════════════════════════════════════════════════════ */

  function initIndexProgress() {
    document.querySelectorAll('.lesson-card[data-topic-id]').forEach(function (card) {
      var topicId     = card.getAttribute('data-topic-id');
      var totalBlocks = parseInt(card.getAttribute('data-total-blocks') || '0', 10);
      if (!topicId || !totalBlocks) return;

      var progress = getTopicProgress(topicId, totalBlocks);

      // Progress meter
      var meter = card.querySelector('.progress-meter');
      if (meter) {
        var fill = meter.querySelector('.progress-meter__fill');
        // Support both <span class="progress-meter__label"> and nested <span class="progress-meter__label-text">
        var labelEl = meter.querySelector('.progress-meter__label-text') ||
                      meter.querySelector('.progress-meter__label');
        var pct = totalBlocks > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
        if (fill) {
          fill.style.width = pct + '%';
          if (pct >= 100) fill.classList.add('progress-meter__fill--complete');
          else fill.classList.remove('progress-meter__fill--complete');
        }
        if (labelEl) labelEl.textContent = progress.completed + '/' + progress.total + ' bloques';
      }

      // Completed badge
      if (isTopicComplete(topicId, totalBlocks)) {
        card.classList.add('lesson-card--completed');
        if (!card.querySelector('.lesson-card__badge')) {
          var badge = document.createElement('span');
          badge.className = 'lesson-card__badge';
          badge.setAttribute('aria-label', 'Completada');
          badge.textContent = '✓';
          card.appendChild(badge);
        }
      }
    });

    // React to block completions while page is open
    window.addEventListener('diana:block-completed', function () {
      initIndexProgress();
    });
  }

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */

  document.addEventListener('DOMContentLoaded', function () {
    initLangToggle();
    initCompleteButton();
    initLegacyCompletion();
    initTranslationTabs();
    initDynamicIframes();
    initSubpageNav();
    initMobileNav();
    initIndexProgress();
  });

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — used by Wave 2 sub-pages + hover-translate.js
  ══════════════════════════════════════════════════════════ */

  window.DianaLessonUI = {
    getLang:            getLang,
    setLang:            setLang,
    markBlockComplete:  markBlockComplete,
    isBlockComplete:    isBlockComplete,
    getTopicProgress:   getTopicProgress,
    isTopicComplete:    isTopicComplete,
  };

})();
