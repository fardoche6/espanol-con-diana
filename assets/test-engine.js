/**
 * Español con Diana — Test Engine (Comic Edition) V3
 * Vanilla JS, zero dependencies.
 *
 * API:
 *   renderTest(containerEl, testData)
 *
 * Auto-init:
 *   On DOMContentLoaded, scans for <div class="test" data-test-id="X">
 *   and binds tests from the inline <script id="lesson-tests"> JSON.
 *
 * Supported question types:
 *   multiple_choice, gap_fill, translation_en_to_es, translation_es_to_en
 *
 * V3 additions:
 *   After every question check, dispatches CustomEvent 'test-checked' on the
 *   .test-section element with detail: {testId, correct, total, allCorrect}.
 *   lesson-ui.js listens for this to enable the complete button.
 */

(function () {
  'use strict';

  // ── Brand tokens ─────────────────────────────────────────
  var C = {
    paper:      '#FAF6EE',
    paperDark:  '#EDE8DC',
    ink:        '#1F1A14',
    ochre:      '#C99A3D',
    terracotta: '#C4593A',
    sage:       '#6B8E6B',
    night:      '#2A2540',
    muted:      '#7B736B',
  };

  // ── Inject global comic styles (once) ────────────────────
  var STYLE_ID = 'test-engine-comic-styles';
  if (!document.getElementById(STYLE_ID)) {
    var styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = [
      /* Google Fonts — Caveat */
      '@import url("https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap");',

      /* ── Comic section wrapper ── */
      '.test-section {',
      '  margin: 32px 0;',
      '  font-family: "Inter", sans-serif;',
      '}',

      /* ── Header banner ── */
      '.test-section__header {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 10px;',
      '  margin-bottom: 28px;',
      '}',
      '.test-section__label {',
      '  font-family: "Caveat", cursive;',
      '  font-size: 22px;',
      '  font-weight: 700;',
      '  color: ' + C.ink + ';',
      '  background: ' + C.ochre + ';',
      '  border: 2.5px solid ' + C.ink + ';',
      '  border-radius: 4px;',
      '  padding: 4px 14px 4px 12px;',
      '  box-shadow: 3px 3px 0 ' + C.ink + ';',
      '  display: inline-block;',
      '  letter-spacing: 0.01em;',
      '}',

      /* ── Question body ── */
      '.test-section__body {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 28px;',
      '}',

      /* ── Individual question panel (comic panel) ── */
      '.test-question {',
      '  background: ' + C.paper + ';',
      '  border: 2.5px solid ' + C.ink + ';',
      '  border-radius: 3px;',
      '  box-shadow: 5px 5px 0 ' + C.ink + ', 8px 8px 18px rgba(31,26,20,0.13);',
      '  padding: 22px 22px 20px;',
      '  position: relative;',
      '  overflow: visible;',
      '  /* Slight alternating tilt applied via JS */;',
      '}',

      /* Paper texture overlay on each panel */
      '.test-question::before {',
      '  content: "";',
      '  position: absolute;',
      '  inset: 0;',
      '  background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.88\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E");',
      '  pointer-events: none;',
      '  z-index: 0;',
      '  border-radius: 1px;',
      '}',
      '.test-question > * { position: relative; z-index: 1; }',

      /* ── Panel number badge (top-left corner) ── */
      '.test-q-num {',
      '  position: absolute;',
      '  top: -11px;',
      '  left: 12px;',
      '  font-family: "Caveat", cursive;',
      '  font-size: 12px;',
      '  font-weight: 700;',
      '  color: ' + C.paper + ';',
      '  background: ' + C.ink + ';',
      '  border-radius: 2px;',
      '  padding: 0 6px;',
      '  line-height: 20px;',
      '  z-index: 10;',
      '}',

      /* ── Speech bubble for question prompt ── */
      '.test-question__prompt-bubble {',
      '  position: relative;',
      '  background: ' + C.night + ';',
      '  border: 2px solid ' + C.ink + ';',
      '  border-radius: 18px 18px 18px 4px;',
      '  padding: 12px 18px 10px;',
      '  margin-bottom: 18px;',
      '  display: inline-block;',
      '  max-width: 100%;',
      '  box-shadow: 2px 2px 0 ' + C.ink + ';',
      '}',
      '.test-question__prompt-bubble::after {',
      '  content: "";',
      '  position: absolute;',
      '  bottom: -11px;',
      '  left: 20px;',
      '  width: 0; height: 0;',
      '  border-left: 10px solid transparent;',
      '  border-right: 6px solid transparent;',
      '  border-top: 11px solid ' + C.ink + ';',
      '}',
      '.test-question__prompt-bubble::before {',
      '  content: "";',
      '  position: absolute;',
      '  bottom: -9px;',
      '  left: 21px;',
      '  width: 0; height: 0;',
      '  border-left: 9px solid transparent;',
      '  border-right: 5px solid transparent;',
      '  border-top: 10px solid ' + C.night + ';',
      '  z-index: 1;',
      '}',
      '.test-question__prompt {',
      '  font-family: "Caveat", cursive;',
      '  font-size: 19px;',
      '  font-weight: 600;',
      '  color: ' + C.paper + ';',
      '  margin: 0;',
      '  line-height: 1.35;',
      '  letter-spacing: 0.01em;',
      '}',

      /* ── Multiple choice option bubbles ── */
      '.test-options {',
      '  display: flex;',
      '  flex-wrap: wrap;',
      '  gap: 10px;',
      '  margin: 18px 0 16px;',
      '}',
      '.test-option {',
      '  position: relative;',
      '  cursor: pointer;',
      '}',
      '.test-option input[type="radio"] {',
      '  position: absolute;',
      '  opacity: 0;',
      '  pointer-events: none;',
      '}',
      '.test-option label {',
      '  display: inline-block;',
      '  font-family: "Caveat", cursive;',
      '  font-size: 17px;',
      '  font-weight: 600;',
      '  color: ' + C.ink + ';',
      '  background: ' + C.paperDark + ';',
      '  border: 2px solid ' + C.ink + ';',
      '  border-radius: 22px;',
      '  padding: 6px 18px 5px;',
      '  cursor: pointer;',
      '  box-shadow: 2px 2px 0 ' + C.ink + ';',
      '  transition: transform 0.1s, box-shadow 0.1s, background 0.1s;',
      '  user-select: none;',
      '  line-height: 1.3;',
      '}',
      '.test-option label:hover {',
      '  background: #f0e9d9;',
      '  transform: translate(-1px, -1px);',
      '  box-shadow: 3px 3px 0 ' + C.ink + ';',
      '}',
      '.test-option input[type="radio"]:checked + label {',
      '  background: ' + C.ochre + ';',
      '  box-shadow: 3px 3px 0 ' + C.ink + ';',
      '  transform: translate(-1px, -1px);',
      '}',
      '.test-option.is-correct label {',
      '  background: ' + C.sage + ' !important;',
      '  color: ' + C.paper + ';',
      '  border-color: ' + C.ink + ';',
      '  box-shadow: 3px 3px 0 ' + C.ink + ';',
      '}',
      '.test-option.is-wrong label {',
      '  background: ' + C.terracotta + ' !important;',
      '  color: ' + C.paper + ';',
      '  border-color: ' + C.ink + ';',
      '  opacity: 0.9;',
      '}',
      '.test-option.is-disabled label {',
      '  cursor: not-allowed;',
      '  opacity: 0.55;',
      '}',

      /* ── Gap fill / translation input ── */
      '.test-input-wrap {',
      '  margin: 18px 0 16px;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 12px;',
      '  flex-wrap: wrap;',
      '}',
      '.test-input-chalk {',
      '  position: relative;',
      '  flex: 1;',
      '  min-width: 180px;',
      '}',
      '.test-input {',
      '  width: 100%;',
      '  font-family: "Caveat", cursive;',
      '  font-size: 20px;',
      '  font-weight: 600;',
      '  color: ' + C.ink + ';',
      '  background: transparent;',
      '  border: none;',
      '  border-bottom: 2.5px solid ' + C.ink + ';',
      '  outline: none;',
      '  padding: 4px 2px 6px;',
      '  letter-spacing: 0.02em;',
      '  transition: border-color 0.15s;',
      '}',
      '.test-input:focus {',
      '  border-bottom-color: ' + C.terracotta + ';',
      '}',
      '.test-input::placeholder {',
      '  color: ' + C.muted + ';',
      '  font-style: italic;',
      '  opacity: 0.7;',
      '}',
      '.test-input.is-correct {',
      '  border-bottom-color: ' + C.sage + ';',
      '  color: ' + C.sage + ';',
      '}',
      '.test-input.is-wrong {',
      '  border-bottom-color: ' + C.terracotta + ';',
      '  color: ' + C.terracotta + ';',
      '}',

      /* ── Check button (ink stamp) ── */
      '.test-check {',
      '  font-family: "Caveat", cursive;',
      '  font-size: 17px;',
      '  font-weight: 700;',
      '  color: ' + C.paper + ';',
      '  background: ' + C.ink + ';',
      '  border: 2px solid ' + C.ink + ';',
      '  border-radius: 4px;',
      '  padding: 7px 18px 5px;',
      '  cursor: pointer;',
      '  box-shadow: 3px 3px 0 ' + C.muted + ';',
      '  white-space: nowrap;',
      '  transition: transform 0.1s, box-shadow 0.1s;',
      '  letter-spacing: 0.03em;',
      '}',
      '.test-check:hover {',
      '  transform: translate(-1px, -1px);',
      '  box-shadow: 4px 4px 0 ' + C.muted + ';',
      '}',
      '.test-check:active {',
      '  transform: translate(1px, 1px);',
      '  box-shadow: 1px 1px 0 ' + C.muted + ';',
      '}',
      '.test-check:disabled {',
      '  opacity: 0.4;',
      '  cursor: not-allowed;',
      '  transform: none;',
      '  box-shadow: 2px 2px 0 ' + C.muted + ';',
      '}',

      /* ── Feedback burst ── */
      '.test-feedback {',
      '  display: none;',
      '  margin-top: 16px;',
      '  align-items: flex-start;',
      '  gap: 10px;',
      '}',
      '.test-feedback.is-visible { display: flex; }',
      '.test-feedback__burst {',
      '  flex-shrink: 0;',
      '  width: 52px;',
      '  height: 52px;',
      '}',
      '.test-feedback__body {',
      '  flex: 1;',
      '}',
      '.test-feedback__word {',
      '  font-family: "Caveat", cursive;',
      '  font-size: 22px;',
      '  font-weight: 700;',
      '  line-height: 1;',
      '  margin-bottom: 4px;',
      '}',
      '.test-feedback.is-correct .test-feedback__word { color: ' + C.sage + '; }',
      '.test-feedback.is-wrong .test-feedback__word { color: ' + C.terracotta + '; }',
      '.test-feedback__text {',
      '  font-family: "Caveat", cursive;',
      '  font-size: 15px;',
      '  color: ' + C.muted + ';',
      '  line-height: 1.35;',
      '  background: ' + C.paperDark + ';',
      '  border: 1.5px solid ' + C.ink + ';',
      '  border-radius: 12px 12px 12px 4px;',
      '  padding: 6px 12px;',
      '  display: inline-block;',
      '  box-shadow: 2px 2px 0 rgba(31,26,20,0.12);',
      '}',

      /* ── Score banner ── */
      '.test-score-bar {',
      '  display: none;',
      '  margin-top: 32px;',
      '  align-items: center;',
      '  gap: 16px;',
      '  flex-wrap: wrap;',
      '}',
      '.test-score-bar.is-visible { display: flex; }',
      '.test-score-ribbon {',
      '  position: relative;',
      '  flex: 1;',
      '  min-width: 180px;',
      '}',
      '.test-score-bar__result {',
      '  font-family: "Caveat", cursive;',
      '  font-size: 30px;',
      '  font-weight: 700;',
      '  color: ' + C.paper + ';',
      '  background: ' + C.night + ';',
      '  border: 2.5px solid ' + C.ink + ';',
      '  border-radius: 4px;',
      '  padding: 5px 18px 3px;',
      '  box-shadow: 4px 4px 0 ' + C.ink + ';',
      '  display: inline-block;',
      '  position: relative;',
      '}',
      '.test-score-bar__result::before, .test-score-bar__result::after {',
      '  content: "";',
      '  position: absolute;',
      '  top: 50%;',
      '  transform: translateY(-50%);',
      '  width: 0; height: 0;',
      '}',
      '.test-score-bar__result::before {',
      '  left: -16px;',
      '  border-top: 18px solid transparent;',
      '  border-bottom: 18px solid transparent;',
      '  border-right: 16px solid ' + C.ink + ';',
      '}',
      '.test-score-bar__result::after {',
      '  right: -16px;',
      '  border-top: 18px solid transparent;',
      '  border-bottom: 18px solid transparent;',
      '  border-left: 16px solid ' + C.ink + ';',
      '}',
      '.test-score-bar__result.is-passing { background: ' + C.sage + '; }',
      '.test-score-bar__result.is-failing { background: ' + C.terracotta + '; }',

      /* ── Retry stamp button ── */
      '.test-reset {',
      '  font-family: "Caveat", cursive;',
      '  font-size: 16px;',
      '  font-weight: 700;',
      '  color: ' + C.ink + ';',
      '  background: ' + C.paperDark + ';',
      '  border: 2px solid ' + C.ink + ';',
      '  border-radius: 50%;',
      '  width: 72px;',
      '  height: 72px;',
      '  cursor: pointer;',
      '  box-shadow: 3px 3px 0 ' + C.ink + ';',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: center;',
      '  line-height: 1.1;',
      '  letter-spacing: 0.02em;',
      '  transform: rotate(-8deg);',
      '  transition: transform 0.15s, box-shadow 0.15s;',
      '  flex-shrink: 0;',
      '}',
      '.test-reset:hover {',
      '  transform: rotate(-12deg) translate(-2px, -2px);',
      '  box-shadow: 5px 5px 0 ' + C.ink + ';',
      '}',
      '.test-reset:active {',
      '  transform: rotate(-6deg) translate(1px, 1px);',
      '  box-shadow: 1px 1px 0 ' + C.ink + ';',
      '}',

      /* ── Mobile tweaks ── */
      '@media (max-width: 600px) {',
      '  .test-options { flex-direction: column; }',
      '  .test-option label { display: block; }',
      '  .test-input-wrap { flex-direction: column; align-items: flex-start; }',
      '  .test-check { align-self: flex-start; }',
      '}',
    ].join('\n');
    document.head.appendChild(styleEl);
  }

  // ── Inline SVG definitions ────────────────────────────────

  /** Shared SVG filter defs block (ink wobble) injected once */
  var DEFS_ID = 'test-engine-svg-defs';
  function ensureSvgDefs() {
    if (document.getElementById(DEFS_ID)) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = DEFS_ID;
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = [
      '<defs>',
      '  <filter id="tek-ink" x="-8%" y="-8%" width="116%" height="116%">',
      '    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="7" result="noise"/>',
      '    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G"/>',
      '  </filter>',
      '</defs>',
    ].join('');
    document.body.insertBefore(svg, document.body.firstChild);
  }

  /** Starburst SVG for correct (sage) */
  function burstSvgCorrect() {
    return [
      '<svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" class="test-feedback__burst" aria-hidden="true">',
      '  <polygon points="26,2 29,19 38,7 36,23 49,14 43,28 52,28 44,38 52,47 40,44 43,52 33,46 31,52 26,44 21,52 19,46 9,52 12,44 0,47 8,38 0,28 9,28 3,14 16,23 14,7 23,19"',
      '    fill="' + C.sage + '" stroke="' + C.ink + '" stroke-width="1.2" stroke-linejoin="round"',
      '    filter="url(#tek-ink)"/>',
      '  <text x="26" y="30" font-family="Caveat,cursive" font-size="18" font-weight="700" fill="' + C.paper + '" text-anchor="middle" dominant-baseline="middle">✓</text>',
      '</svg>',
    ].join('');
  }

  /** Starburst SVG for wrong (terracotta) */
  function burstSvgWrong() {
    return [
      '<svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" class="test-feedback__burst" aria-hidden="true">',
      '  <polygon points="26,2 29,19 38,7 36,23 49,14 43,28 52,28 44,38 52,47 40,44 43,52 33,46 31,52 26,44 21,52 19,46 9,52 12,44 0,47 8,38 0,28 9,28 3,14 16,23 14,7 23,19"',
      '    fill="' + C.terracotta + '" stroke="' + C.ink + '" stroke-width="1.2" stroke-linejoin="round"',
      '    filter="url(#tek-ink)"/>',
      '  <text x="26" y="30" font-family="Caveat,cursive" font-size="15" font-weight="700" fill="' + C.paper + '" text-anchor="middle" dominant-baseline="middle">✗</text>',
      '</svg>',
    ].join('');
  }

  // ── Utilities ────────────────────────────────────────────

  function normalize(str) {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function checkTextAnswer(studentRaw, answerField) {
    var student = normalize(studentRaw);
    if (!student) return false;
    var parts = answerField.split(/\s*[\/|]\s*/);
    return parts.some(function (part) {
      var accepted = normalize(part);
      if (student === accepted) return true;
      if (accepted.includes('[') && student.length >= 2) return true;
      return false;
    });
  }

  // Tilt values for alternating comic panels
  var PANEL_TILTS = [
    'rotate(-1.6deg) translateY(2px)',
    'rotate(1.2deg) translateY(-2px)',
    'rotate(-0.9deg) translateY(3px)',
    'rotate(1.5deg) translateY(-1px)',
    'rotate(-0.7deg) translateY(2px)',
  ];

  // ── Score event dispatch (V3) ─────────────────────────────

  /**
   * Dispatch 'test-checked' on the .test-section ancestor and on document.
   * detail: { testId, correct, total, allCorrect }
   */
  function dispatchTestChecked(section, testId) {
    var allQ    = section.querySelectorAll('.test-question');
    var correct = section.querySelectorAll('.test-question[data-correct="true"]');
    var total   = allQ.length;
    var nCorrect = correct.length;
    // allCorrect only when every question is answered AND all correct
    var answered = section.querySelectorAll('.test-question[data-answered="true"]');
    var allCorrect = (answered.length === total) && (nCorrect === total);

    var detail = { testId: testId || '', correct: nCorrect, total: total, allCorrect: allCorrect };

    try {
      section.dispatchEvent(new CustomEvent('test-checked', { detail: detail, bubbles: true }));
      document.dispatchEvent(new CustomEvent('test-checked', { detail: detail }));
    } catch (e) {}
  }

  // ── Render single question ───────────────────────────────

  function renderQuestion(q, idx, section, testId) {
    var wrap = document.createElement('div');
    wrap.className = 'test-question';
    wrap.dataset.answered = 'false';
    wrap.style.transform = PANEL_TILTS[idx % PANEL_TILTS.length];

    // Panel number badge
    var numBadge = document.createElement('span');
    numBadge.className = 'test-q-num';
    numBadge.textContent = '#' + (idx + 1);
    wrap.appendChild(numBadge);

    // Speech bubble prompt
    var bubbleWrap = document.createElement('div');
    bubbleWrap.className = 'test-question__prompt-bubble';
    var prompt = document.createElement('p');
    prompt.className = 'test-question__prompt';
    prompt.textContent = q.prompt;
    bubbleWrap.appendChild(prompt);
    wrap.appendChild(bubbleWrap);

    var checkFn;

    if (q.type === 'multiple_choice') {
      var optList = document.createElement('div');
      optList.className = 'test-options';

      var radioGroupName = 'q-' + idx + '-' + Math.random().toString(36).slice(2, 7);
      var radios = [];

      q.options.forEach(function (opt, i) {
        var optEl = document.createElement('div');
        optEl.className = 'test-option';

        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = radioGroupName;
        radio.value = String(i);
        radio.id = radioGroupName + '-' + i;

        var label = document.createElement('label');
        label.htmlFor = radio.id;
        label.textContent = opt;

        optEl.appendChild(radio);
        optEl.appendChild(label);
        optList.appendChild(optEl);
        radios.push({ radio: radio, optEl: optEl });
      });

      wrap.appendChild(optList);

      var checkBtn = document.createElement('button');
      checkBtn.className = 'test-check';
      checkBtn.textContent = '¡Comprobar!';
      wrap.appendChild(checkBtn);

      checkFn = function () {
        var selected = radios.find(function (r) { return r.radio.checked; });
        if (!selected) return false;

        var selectedIdx = parseInt(selected.radio.value, 10);
        var isCorrect = selectedIdx === q.answer_index;

        radios.forEach(function (r) {
          r.radio.disabled = true;
          r.optEl.classList.add('is-disabled');
        });
        checkBtn.disabled = true;

        radios.forEach(function (r, i) {
          if (i === q.answer_index) r.optEl.classList.add('is-correct');
          if (r.radio.checked && !isCorrect) r.optEl.classList.add('is-wrong');
        });

        showFeedback(wrap, isCorrect, q.explanation);
        wrap.dataset.answered = 'true';
        wrap.dataset.correct = String(isCorrect);
        return true;
      };

      checkBtn.addEventListener('click', function () {
        if (checkFn()) {
          notifyScoreUpdate(wrap, section, testId);
        }
      });

    } else {
      // gap_fill / translation_en_to_es / translation_es_to_en
      var inputWrap = document.createElement('div');
      inputWrap.className = 'test-input-wrap';

      var chalkSlot = document.createElement('div');
      chalkSlot.className = 'test-input-chalk';

      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'test-input';
      input.placeholder = q.type === 'gap_fill' ? 'Escribe tu respuesta…' : 'Type your answer…';
      input.autocomplete = 'off';
      input.autocorrect = 'off';
      input.autocapitalize = 'none';
      input.spellcheck = false;

      chalkSlot.appendChild(input);
      inputWrap.appendChild(chalkSlot);

      var checkBtn2 = document.createElement('button');
      checkBtn2.className = 'test-check';
      checkBtn2.textContent = '¡Comprobar!';
      inputWrap.appendChild(checkBtn2);

      wrap.appendChild(inputWrap);

      checkFn = function () {
        var val = input.value.trim();
        if (!val) return false;

        var isCorrect = checkTextAnswer(val, q.answer);
        input.disabled = true;
        checkBtn2.disabled = true;
        input.classList.add(isCorrect ? 'is-correct' : 'is-wrong');

        showFeedback(wrap, isCorrect, q.explanation, isCorrect ? null : q.answer);
        wrap.dataset.answered = 'true';
        wrap.dataset.correct = String(isCorrect);
        return true;
      };

      checkBtn2.addEventListener('click', function () {
        if (checkFn()) {
          notifyScoreUpdate(wrap, section, testId);
        }
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          if (checkFn()) {
            notifyScoreUpdate(wrap, section, testId);
          }
        }
      });
    }

    return wrap;
  }

  // ── Comic feedback bubble ────────────────────────────────

  function showFeedback(wrap, isCorrect, explanation, correctAnswer) {
    var fb = document.createElement('div');
    fb.className = 'test-feedback is-visible ' + (isCorrect ? 'is-correct' : 'is-wrong');

    var burstWrap = document.createElement('div');
    burstWrap.innerHTML = isCorrect ? burstSvgCorrect() : burstSvgWrong();
    fb.appendChild(burstWrap);

    var body = document.createElement('div');
    body.className = 'test-feedback__body';

    var word = document.createElement('div');
    word.className = 'test-feedback__word';
    word.textContent = isCorrect ? '¡BOOM! ✓' : '¡Oops!';
    body.appendChild(word);

    var txt = explanation || '';
    if (!isCorrect && correctAnswer) {
      txt = '→ ' + correctAnswer + (txt ? ' — ' + txt : '');
    }
    if (txt) {
      var textEl = document.createElement('div');
      textEl.className = 'test-feedback__text';
      textEl.textContent = txt;
      body.appendChild(textEl);
    }

    fb.appendChild(body);
    wrap.appendChild(fb);
  }

  // ── Score tracking + V3 event dispatch ───────────────────

  function notifyScoreUpdate(questionWrap, section, testId) {
    if (!section) section = questionWrap.closest('.test-section');
    if (!section) return;

    var allQ     = section.querySelectorAll('.test-question');
    var answered = section.querySelectorAll('.test-question[data-answered="true"]');
    var correct  = section.querySelectorAll('.test-question[data-correct="true"]');

    var scoreBar    = section.querySelector('.test-score-bar');
    var scoreResult = section.querySelector('.test-score-bar__result');

    if (scoreBar && scoreResult && answered.length === allQ.length) {
      var n     = correct.length;
      var total = allQ.length;
      var isPassing = n >= Math.ceil(total * 0.7);

      scoreResult.textContent = n + ' / ' + total + ' correctas!';
      scoreResult.className = 'test-score-bar__result ' + (isPassing ? 'is-passing' : 'is-failing');
      scoreBar.classList.add('is-visible');
    }

    // V3: always dispatch score event after each answer
    dispatchTestChecked(section, testId);
  }

  // ── Main render function ─────────────────────────────────

  /**
   * renderTest(containerEl, testData)
   *
   * testData shape — block_tests entry:
   *   { block_code, block_name, questions: [...] }
   *
   * OR final_test:
   *   { questions: [...] }
   */
  function renderTest(containerEl, testData) {
    if (!containerEl || !testData) return;
    var questions = testData.questions;
    if (!questions || !questions.length) return;

    ensureSvgDefs();

    containerEl.innerHTML = '';

    var testId = testData.block_code
      ? 'block-' + testData.block_code.toLowerCase()
      : 'final';

    var section = document.createElement('div');
    section.className = 'test-section';
    section.setAttribute('data-test-id', testId);

    // Header label
    var header = document.createElement('div');
    header.className = 'test-section__header';

    var labelText = testData.block_name
      ? '☆ Mini-test — Bloque ' + testData.block_code + ': ' + testData.block_name
      : '★ Examen Final';

    var label = document.createElement('span');
    label.className = 'test-section__label';
    label.textContent = labelText;

    header.appendChild(label);
    section.appendChild(header);

    // Body — all question panels
    var body = document.createElement('div');
    body.className = 'test-section__body';

    questions.forEach(function (q, i) {
      body.appendChild(renderQuestion(q, i, section, testId));
    });

    section.appendChild(body);

    // Score ribbon + retry stamp
    var scoreBar = document.createElement('div');
    scoreBar.className = 'test-score-bar';

    var ribbonWrap = document.createElement('div');
    ribbonWrap.className = 'test-score-ribbon';

    var scoreResult = document.createElement('span');
    scoreResult.className = 'test-score-bar__result';
    ribbonWrap.appendChild(scoreResult);
    scoreBar.appendChild(ribbonWrap);

    var resetBtn = document.createElement('button');
    resetBtn.className = 'test-reset';
    resetBtn.innerHTML = '<span style="font-size:12px;letter-spacing:0.04em;">RETRY</span><span style="font-size:19px;">↺</span>';
    scoreBar.appendChild(resetBtn);

    section.appendChild(scoreBar);

    resetBtn.addEventListener('click', function () {
      renderTest(containerEl, testData);
    });

    containerEl.appendChild(section);
  }

  // ── Auto-init ────────────────────────────────────────────

  var _initDone = false;

  function _autoInit() {
    if (_initDone) return;
    _initDone = true;

    var dataScript = document.getElementById('lesson-tests');
    if (!dataScript) return;

    var lessonData;
    try {
      lessonData = JSON.parse(dataScript.textContent);
    } catch (e) {
      console.error('[TestEngine] Failed to parse lesson-tests JSON:', e);
      return;
    }

    var testMap = {};

    if (lessonData.block_tests) {
      lessonData.block_tests.forEach(function (bt) {
        testMap['block-' + bt.block_code.toLowerCase()] = bt;
      });
    }

    if (lessonData.final_test) {
      testMap['final'] = lessonData.final_test;
    }

    document.querySelectorAll('.test[data-test-id]').forEach(function (el) {
      var id = el.dataset.testId;
      var data = testMap[id];
      if (data) {
        renderTest(el, data);
      } else {
        console.warn('[TestEngine] No test data found for id:', id, '— known ids:', Object.keys(testMap));
      }
    });

    // Mobile nav toggle (legacy pages)
    var navToggle = document.querySelector('.site-nav__toggle');
    var navLinks  = document.querySelector('.site-nav__links');
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', function () {
        navLinks.classList.toggle('is-open');
      });
    }

    // TOC active link on scroll (old lesson pages)
    var tocLinks = document.querySelectorAll('.lesson-toc a');
    if (tocLinks.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            tocLinks.forEach(function (link) {
              link.classList.remove('active');
              if (link.getAttribute('href') === '#' + id) link.classList.add('active');
            });
          }
        });
      }, { rootMargin: '-20% 0px -70% 0px' });

      document.querySelectorAll('.lesson-block[id]').forEach(function (s) {
        observer.observe(s);
      });
    }
  }

  // Run immediately if DOM is already ready (script at bottom of body),
  // otherwise wait for DOMContentLoaded.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _autoInit);
  } else {
    _autoInit();
  }

  // Expose globally
  window.renderTest = renderTest;

})();
