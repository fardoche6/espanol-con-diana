/* ============================================================
   Español con Diana — Hover Translation Engine
   Wraps Spanish phrases in lesson body text with tooltip spans.
   Called after marked.js renders content.
   V3: Single-language tooltip (EN xor FR), listens for lang-changed event.
   ============================================================ */

(function () {
  'use strict';

  var SKIP_TAGS = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'IFRAME', 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']);

  function getTranslations() {
    var el = document.getElementById('lesson-translations');
    if (!el) return [];
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      console.warn('[Diana] hover-translate: failed to parse lesson-translations', e);
      return [];
    }
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Walk text nodes under a root element; skip disqualified containers
  function walkTextNodes(root, callback) {
    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          var p = node.parentElement;
          while (p && p !== root) {
            if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
            if (p.classList && (p.classList.contains('test') || p.classList.contains('es-hover'))) return NodeFilter.FILTER_REJECT;
            p = p.parentElement;
          }
          return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) nodes.push(node);
    // Process in reverse so replacements don't invalidate the walker
    nodes.reverse().forEach(callback);
  }

  function buildWrappedFragment(text, translations) {
    // Returns a DocumentFragment with all phrase matches wrapped, or null if no matches
    // Uses iterative replacement: process longest-first (guaranteed by JSON sort order)

    var segments = [{ type: 'text', val: text }];
    var anyMatch = false;

    for (var i = 0; i < translations.length; i++) {
      var t = translations[i];
      if (!t.es) continue;
      var phrase = t.es;

      var newSegments = [];
      var matched = false;

      for (var j = 0; j < segments.length; j++) {
        var seg = segments[j];
        if (seg.type !== 'text' || seg.val.indexOf(phrase) === -1) {
          newSegments.push(seg);
          continue;
        }
        // Split this text segment on the phrase
        var parts = seg.val.split(phrase);
        for (var p = 0; p < parts.length; p++) {
          if (parts[p]) newSegments.push({ type: 'text', val: parts[p] });
          if (p < parts.length - 1) {
            newSegments.push({ type: 'match', val: phrase, en: t.en || '', fr: t.fr || '' });
            matched = true;
          }
        }
      }

      if (matched) {
        segments = newSegments;
        anyMatch = true;
      }
    }

    if (!anyMatch) return null;

    var frag = document.createDocumentFragment();
    segments.forEach(function (seg) {
      if (seg.type === 'text') {
        frag.appendChild(document.createTextNode(seg.val));
      } else {
        var span = document.createElement('span');
        span.className = 'es-hover';
        span.setAttribute('data-en', seg.en);
        span.setAttribute('data-fr', seg.fr);
        span.textContent = seg.val;
        frag.appendChild(span);
      }
    });

    return frag;
  }

  function wrapLessonBodies(translations) {
    var bodies = document.querySelectorAll('.lesson-body, .subpage-content');
    bodies.forEach(function (body) {
      walkTextNodes(body, function (textNode) {
        var frag = buildWrappedFragment(textNode.textContent, translations);
        if (frag && textNode.parentNode) {
          textNode.parentNode.replaceChild(frag, textNode);
        }
      });
    });
  }

  // Tooltip element (shared, repositioned on hover)
  var tooltip = null;

  function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.id = 'es-hover-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tooltip);
  }

  function positionTooltip(anchor) {
    var rect = anchor.getBoundingClientRect();
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var scrollX = window.pageXOffset || document.documentElement.scrollLeft;

    var top = rect.bottom + scrollY + 6;
    var left = rect.left + scrollX;

    var tipW = 200;
    var maxLeft = window.innerWidth - tipW - 12;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }

  // Build tooltip content for current lang setting
  function buildTooltipContent(span) {
    var lang = (window.DianaLessonUI && window.DianaLessonUI.getLang)
      ? window.DianaLessonUI.getLang()
      : (localStorage.getItem('lang') || 'en');
    var en = span.getAttribute('data-en');
    var fr = span.getAttribute('data-fr');

    if (lang === 'fr') {
      return '<span class="es-tt-fr">FR: ' + escapeHtml(fr) + '</span>';
    }
    return '<span class="es-tt-en">EN: ' + escapeHtml(en) + '</span>';
  }

  function bindTooltipEvents() {
    document.addEventListener('mouseover', function (e) {
      var span = e.target.closest ? e.target.closest('.es-hover') : null;
      if (!span) return;
      tooltip.innerHTML = buildTooltipContent(span);
      tooltip.classList.add('es-hover-tooltip--visible');
      tooltip.setAttribute('aria-hidden', 'false');
      positionTooltip(span);
    });

    document.addEventListener('mouseout', function (e) {
      var span = e.target.closest ? e.target.closest('.es-hover') : null;
      if (!span) return;
      tooltip.classList.remove('es-hover-tooltip--visible');
      tooltip.setAttribute('aria-hidden', 'true');
    });

    document.addEventListener('scroll', function () {
      tooltip.classList.remove('es-hover-tooltip--visible');
    }, { passive: true });

    // Re-render open tooltip when language switches
    window.addEventListener('lang-changed', function () {
      // If tooltip is currently visible, just hide it — it will rebuild on next hover
      tooltip.classList.remove('es-hover-tooltip--visible');
      tooltip.setAttribute('aria-hidden', 'true');
    });
  }

  // Public init — call after marked.js renders content
  window.DianaHoverTranslate = {
    init: function () {
      var translations = getTranslations();
      if (!translations.length) return;
      createTooltip();
      wrapLessonBodies(translations);
      bindTooltipEvents();
    }
  };

})();
