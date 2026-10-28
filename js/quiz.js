/* JG Solutions – Quiz "Kostenlose Analyse" + Cal.com-Terminbuchung
   Übernommen aus der OKTOBER-Website. Wird von js/main.js erst beim ersten Klick auf
   [data-quiz-open] nachgeladen; die Kontaktseite bindet es direkt ein (Kalender). */
/* ==========================================================================
   Quiz-Funnel ("Kostenlose Analyse")
   Mehrstufiger Fragebogen als modaler Dialog. Wird auf jeder Seite über
   Buttons/Links mit dem Attribut [data-quiz-open] gestartet.

   Die Fragen liegen als Datenstruktur vor (BRANCHES / STEPS), neue Fragen
   oder Antwortoptionen lassen sich dort ergänzen, ohne die Logik anzufassen.
   Versand über Web3Forms, siehe submitLead().
   ========================================================================== */
(function (window, document) {
  'use strict';

  /* ---------------------------------------------------------------- Konfig */
  var CONFIG = {
    // Web3Forms Access Key. Solange leer, wird nichts gesendet und es werden
    // die direkten Kontaktwege angezeigt (keine Fake-Bestätigung).
    accessKey: 'fc39fdb7-9425-4eeb-ba92-553e3f42a625', // Web3Forms -> info@jg-solutions.eu
    endpoint: 'https://api.web3forms.com/submit',
    subject: 'Neue Anfrage über die kostenlose Analyse, jg-solutions.eu',
    email: 'info@jg-solutions.eu',
    phone: '+49 176 24004201'
  };

  // Cal.com Terminbuchung ("Kostenloses Erstgespräch"), genutzt in Schritt 5
  // des Fragebogens und auf der Kontaktseite ([data-cal-inline]).
  var CAL = {
    namespace: 'kostenloses-erstgesprach',
    link: 'jg-solutions/kostenloses-erstgesprach',
    origin: 'https://app.cal.com',
    script: 'https://app.cal.com/embed/embed.js',
    consentKey: 'jg-cal-consent'
  };

  // Pfad-Präfix zum Projektstamm (Unterseiten geben data-root="../" mit).
  var SCRIPT = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    return all[all.length - 1];
  })();
  var ROOT = (SCRIPT && SCRIPT.getAttribute('data-root')) || '';

  /* ------------------------------------------------------------ Fragedaten */

  // Schritt 2 hängt von der Auswahl aus Schritt 1 ab.
  var BRANCHES = {
    website: {
      title: 'Wie ist der aktuelle Stand deiner Website?',
      sub: 'So sehe ich direkt, wo wir ansetzen.',
      options: [
        { value: 'keine', label: 'Ich habe noch keine Website' },
        { value: 'wenig-anfragen', label: 'Sie bringt kaum Anfragen' },
        { value: 'ueberarbeiten', label: 'Sie soll überarbeitet werden' },
        { value: 'gruendung', label: 'Ich gründe gerade' }
      ]
    },
    shopify: {
      title: 'Wo stehst du mit deinem Shop?',
      sub: 'Damit ich den Aufwand realistisch einschätzen kann.',
      options: [
        { value: 'kein-shop', label: 'Ich habe noch keinen Shop' },
        { value: 'wenig-verkaeufe', label: 'Zu wenig Verkäufe' },
        { value: 'ueberarbeiten', label: 'Der Shop soll überarbeitet werden' },
        { value: 'wechsel', label: 'Ich möchte zu Shopify wechseln' }
      ]
    },
    ki: {
      title: 'Wo geht bei dir die meiste Zeit verloren?',
      sub: 'Automatisierung lohnt sich dort, wo sich Aufgaben wiederholen.',
      options: [
        { value: 'kundenanfragen', label: 'Kundenanfragen beantworten' },
        { value: 'termine', label: 'Termine koordinieren' },
        { value: 'buero', label: 'Büro- und Verwaltungsaufgaben' },
        { value: 'unklar', label: 'Weiß ich noch nicht genau' }
      ]
    },
    unsicher: {
      title: 'Was beschreibt deine Situation am besten?',
      sub: 'Kein Problem, wir sortieren das gemeinsam.',
      options: [
        { value: 'start', label: 'Ich starte gerade' },
        { value: 'sichtbarkeit', label: 'Ich möchte sichtbarer werden' },
        { value: 'ablaeufe', label: 'Ich möchte Abläufe vereinfachen' },
        { value: 'beratung', label: 'Ich möchte mich erst beraten lassen' }
      ]
    }
  };

  var STEPS = [
    {
      id: 'interesse',
      type: 'single',
      title: 'Wofür interessierst du dich?',
      sub: 'Wähle das aus, was am besten passt.',
      label: 'Interesse',
      options: [
        { value: 'website', label: 'Eine neue Website' },
        { value: 'shopify', label: 'Einen Shopify-Store' },
        { value: 'ki', label: 'KI-Automatisierung für meinen Alltag' },
        { value: 'unsicher', label: 'Bin mir noch nicht sicher' }
      ]
    },
    {
      id: 'situation',
      type: 'single',
      label: 'Aktuelle Situation',
      // Titel und Optionen kommen aus BRANCHES, abhängig von Schritt 1.
      branchOf: 'interesse',
      branches: BRANCHES
    },
    {
      id: 'wichtig',
      type: 'multi',
      title: 'Was ist dir besonders wichtig?',
      sub: 'Mehrfachauswahl möglich.',
      label: 'Wichtig',
      options: [
        { value: 'design', label: 'Hochwertiges Design' },
        { value: 'tempo', label: 'Schnelle Umsetzung' },
        { value: 'anfragen', label: 'Mehr Anfragen bzw. Verkäufe' },
        { value: 'betreuung', label: 'Persönliche Betreuung' }
      ]
    },
    {
      id: 'unternehmen',
      type: 'text',
      title: 'Beschreib kurz dein Unternehmen und deine Kunden.',
      sub: 'Ein paar Stichworte reichen völlig, dieses Feld ist optional.',
      label: 'Unternehmen',
      placeholder: 'z. B. Tattoo-Studio in Bergisch Gladbach, Kunden kommen überwiegend über Instagram …',
      optional: true
    },
    {
      id: 'kontakt',
      type: 'contact',
      title: 'Wie erreiche ich dich am besten?',
      sub: 'Ich melde mich innerhalb von 24 Stunden bei dir.',
      label: 'Kontakt'
    },
    {
      id: 'zusammenfassung',
      type: 'summary',
      title: 'Deine Angaben',
      sub: 'Bitte kurz prüfen. Du kannst jede Angabe noch ändern.',
      label: 'Zusammenfassung'
    }
  ];

  var TOTAL = STEPS.length;

  /* ------------------------------------------------------------- Zustand */
  var answers = {
    interesse: '',
    situation: '',
    wichtig: [],
    unternehmen: '',
    name: '',
    email: '',
    telefon: '',
    datenschutz: false,
    termin: ''
  };

  var index = 0;
  var dialog = null;
  var refs = {};
  var lastFocused = null;
  var sending = false;
  var completed = false;
  var openedAt = 0; // Mindestzeit: wer in wenigen Sekunden fertig ist, ist ein Bot

  /* ------------------------------------------------------------- Helfer */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'class') node.className = attrs[key];
        else if (key === 'text') node.textContent = attrs[key];
        else if (key === 'html') node.innerHTML = attrs[key];
        else if (attrs[key] !== null && attrs[key] !== undefined) node.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  var ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 6L2 7"/></svg>'
  };

  function icon(name, cls) {
    return el('span', { class: cls || '', html: ICONS[name], 'aria-hidden': 'true' });
  }

  /* Liefert die Definition des aktuellen Schritts inkl. aufgelöster Verzweigung. */
  function resolveStep(i) {
    var step = STEPS[i];
    if (!step.branchOf) return step;
    var branch = step.branches[answers[step.branchOf]] || step.branches.unsicher;
    return {
      id: step.id,
      type: step.type,
      label: step.label,
      title: branch.title,
      sub: branch.sub,
      options: branch.options
    };
  }

  function labelFor(stepId, value) {
    var step = STEPS.filter(function (s) { return s.id === stepId; })[0];
    if (!step) return value;
    var options = step.branchOf
      ? (step.branches[answers[step.branchOf]] || { options: [] }).options
      : step.options;
    var match = (options || []).filter(function (o) { return o.value === value; })[0];
    return match ? match.label : value;
  }

  /* ------------------------------------------------- Cal.com (Termin) */

  // Cal.com wird erst nach einem Klick auf "Kalender laden" nachgeladen
  // (DSGVO, wie bei der Karte). Die Entscheidung merkt sich der Browser.
  // Cal.com zeigt pro Namespace nur einen Inline-Kalender an, daher bekommt
  // jeder eingebettete Kalender (Kontaktseite, Quiz) einen eigenen Namespace.
  var calCount = 0;

  function calInstance(onBooked) {
    calCount++;
    var ns = CAL.namespace + (calCount > 1 ? '-' + calCount : '');

    // Offizieller Cal.com-Loader (aus dem Embed-Code), lädt embed.js einmalig.
    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, CAL.script, 'init');

    window.Cal('init', ns, { origin: CAL.origin });
    window.Cal.config = window.Cal.config || {};
    window.Cal.config.forwardQueryParams = true;

    var api = window.Cal.ns[ns];
    // Hell wie die Website (sonst folgt Cal dem Dark Mode des Systems), Markenfarbe Schwarz.
    api('ui', {
      hideEventTypeDetails: false,
      layout: 'month_view',
      theme: 'light',
      cssVarsPerTheme: { light: { 'cal-brand': '#171717' } }
    });
    if (onBooked) {
      api('on', {
        action: 'bookingSuccessfulV2',
        callback: function (event) { onBooked((event && event.detail && event.detail.data) || {}); }
      });
    }
    return api;
  }

  // Freigabe über den Cookie-Hinweis ("jg-consent", gilt für alles) oder einzeln per "Kalender laden".
  function calConsented() {
    try {
      return window.localStorage.getItem(CAL.consentKey) === '1' ||
        window.localStorage.getItem('jg-consent') === 'accepted';
    } catch (e) { return false; }
  }

  // Noch nicht geladene Kalender; js/main.js ruft __jgLoadCal nach "Akzeptieren" auf.
  var calPending = [];
  window.__jgLoadCal = function () {
    var list = calPending; calPending = [];
    list.forEach(function (load) { load(); });
  };

  /* Datum aus Cal.com lesbar formatieren, z. B. "Di., 21.10.2026, 10:00 Uhr". */
  function formatTermin(iso) {
    var date = iso ? new Date(iso) : null;
    if (!date || isNaN(date.getTime())) return 'Termin gebucht';
    return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ', ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
  }

  /**
   * Zeigt den Cal.com-Kalender in container an, vorher einen Klick-zum-Laden-Hinweis.
   * getPrefill liefert optional { name, email } zum Vorausfüllen der Buchung,
   * onBooked wird nach erfolgreicher Buchung mit den Buchungsdaten aufgerufen.
   */
  function mountCal(container, getPrefill, onBooked) {
    container.classList.add('cal-embed');

    var loaded = false;
    function load() {
      if (loaded || !container.isConnected) return;
      loaded = true;
      try { window.localStorage.setItem(CAL.consentKey, '1'); } catch (e) {}
      container.innerHTML = '';
      container.classList.add('is-loaded');
      var frame = el('div', { class: 'cal-frame' });
      container.appendChild(frame);

      var config = { layout: 'month_view', useSlotsViewOnSmallScreen: 'true', theme: 'light' };
      var prefill = getPrefill ? getPrefill() : {};
      Object.keys(prefill || {}).forEach(function (key) {
        if (prefill[key]) config[key] = prefill[key];
      });
      calInstance(onBooked)('inline', { elementOrSelector: frame, config: config, calLink: CAL.link });
    }

    if (calConsented()) { load(); return; }
    calPending.push(load);

    var btn = el('button', { type: 'button', class: 'btn btn-primary' }, [
      icon('calendar'), el('span', { text: 'Kalender laden' })
    ]);
    btn.addEventListener('click', load);

    container.innerHTML = '';
    container.appendChild(el('div', { class: 'cal-consent' }, [
      el('span', { class: 'cal-consent-ico', html: ICONS.calendar }),
      el('b', { text: 'Wunschtermin direkt im Kalender wählen' }),
      el('p', {}, [
        document.createTextNode('Der Kalender wird von Cal.com geladen. Dabei wird deine IP-Adresse an Cal.com übertragen. Mehr in der '),
        el('a', { href: ROOT + 'datenschutz', target: '_blank', rel: 'noopener', text: 'Datenschutzerklärung' }),
        document.createTextNode('.')
      ]),
      btn
    ]));
  }

  /* ------------------------------------------------------------- Aufbau */
  function build() {
    dialog = el('dialog', { class: 'quiz-dialog', 'aria-labelledby': 'quiz-title' });

    refs.progressLabel = el('span', { class: 'quiz-progress-label', 'aria-hidden': 'true' });
    refs.bar = el('span');

    var head = el('div', { class: 'quiz-head' }, [
      el('span', { class: 'quiz-brand' }, [
        el('img', { src: ROOT + 'assets/logo/logo-schwarz-114.webp', alt: '', width: '26', height: '18' }),
        el('span', { text: 'Kostenlose Analyse' })
      ]),
      refs.progressLabel,
      (function () {
        var btn = el('button', { type: 'button', class: 'quiz-close', 'aria-label': 'Fragebogen schließen', html: ICONS.close });
        btn.addEventListener('click', close);
        return btn;
      })()
    ]);

    refs.body = el('div', { class: 'quiz-body' });

    refs.back = el('button', { type: 'button', class: 'btn btn-ghost' }, [icon('back'), el('span', { text: 'Zurück' })]);
    refs.back.addEventListener('click', goBack);

    refs.hint = el('span', { class: 'quiz-hint' });

    refs.next = el('button', { type: 'button', class: 'btn btn-primary quiz-next' }, [
      el('span', { text: 'Weiter' }), icon('arrow')
    ]);
    refs.next.addEventListener('click', goNext);

    refs.foot = el('div', { class: 'quiz-foot' }, [refs.back, refs.hint, refs.next]);

    // Live-Region für Screenreader (Schrittwechsel und Fehler)
    refs.live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });

    dialog.appendChild(el('div', { class: 'quiz-shell' }, [
      head,
      el('div', { class: 'quiz-bar' }, [refs.bar]),
      refs.body,
      refs.foot,
      refs.live
    ]));

    document.body.appendChild(dialog);

    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      close();
    });
    // Klick auf den Hintergrund schließt den Dialog
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) close();
    });
  }

  /* ------------------------------------------------------------ Rendering */
  function render() {
    var step = resolveStep(index);

    refs.body.innerHTML = '';
    refs.foot.classList.remove('is-hidden');
    refs.hint.textContent = '';

    refs.progressLabel.textContent = 'Schritt ' + (index + 1) + ' von ' + TOTAL;
    refs.bar.style.width = ((index + 1) / TOTAL * 100) + '%';
    refs.back.classList.toggle('is-hidden', index === 0);
    // Für den Kalender in Schritt 5 braucht der Dialog mehr Breite.
    dialog.classList.toggle('quiz-dialog--wide', step.type === 'contact');

    refs.body.appendChild(el('h2', { id: 'quiz-title', class: 'quiz-step-title', text: step.title }));
    if (step.sub) refs.body.appendChild(el('p', { class: 'quiz-step-sub', text: step.sub }));

    if (step.type === 'single') renderSingle(step);
    else if (step.type === 'multi') renderMulti(step);
    else if (step.type === 'text') renderText(step);
    else if (step.type === 'contact') renderContact(step);
    else if (step.type === 'summary') renderSummary(step);

    refs.live.textContent = 'Schritt ' + (index + 1) + ' von ' + TOTAL + ': ' + step.title;

    var focusTarget = refs.body.querySelector('button, input, textarea');
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    refs.body.scrollTop = 0;
  }

  function optionButton(option, selected, multi) {
    var btn = el('button', {
      type: 'button',
      class: 'quiz-option' + (multi ? ' quiz-option--multi' : '') + (selected ? ' is-selected' : ''),
      'aria-pressed': multi ? String(selected) : null
    }, [
      el('span', { class: 'marker', html: ICONS.check }),
      el('span', { text: option.label })
    ]);
    return btn;
  }

  function renderSingle(step) {
    var list = el('div', { class: 'quiz-options' });
    step.options.forEach(function (option) {
      var btn = optionButton(option, answers[step.id] === option.value, false);
      btn.addEventListener('click', function () {
        var changed = answers[step.id] !== option.value;
        answers[step.id] = option.value;
        // Wechselt das Interesse, passt die Folgefrage nicht mehr.
        if (step.id === 'interesse' && changed) answers.situation = '';
        goNext();
      });
      list.appendChild(btn);
    });
    refs.body.appendChild(list);
    refs.next.classList.add('is-hidden');
    refs.hint.textContent = 'Eine Auswahl genügt.';
  }

  function renderMulti(step) {
    refs.next.classList.remove('is-hidden');
    setNextLabel('Weiter', 'arrow');

    var list = el('div', { class: 'quiz-options' });
    step.options.forEach(function (option) {
      var active = answers[step.id].indexOf(option.value) !== -1;
      var btn = optionButton(option, active, true);
      btn.addEventListener('click', function () {
        var pos = answers[step.id].indexOf(option.value);
        if (pos === -1) answers[step.id].push(option.value);
        else answers[step.id].splice(pos, 1);
        var on = pos === -1;
        btn.classList.toggle('is-selected', on);
        btn.setAttribute('aria-pressed', String(on));
      });
      list.appendChild(btn);
    });
    refs.body.appendChild(list);
    refs.hint.textContent = 'Mehrfachauswahl möglich.';
  }

  function renderText(step) {
    refs.next.classList.remove('is-hidden');
    setNextLabel('Weiter', 'arrow');

    var id = 'quiz-' + step.id;
    var textarea = el('textarea', {
      class: 'textarea', id: id, name: step.id, rows: '5',
      placeholder: step.placeholder || ''
    });
    textarea.value = answers[step.id];
    textarea.addEventListener('input', function () { answers[step.id] = textarea.value; });

    refs.body.appendChild(el('div', { class: 'field' }, [
      el('label', { for: id }, [
        el('span', { text: 'Kurze Beschreibung ' }),
        el('span', { class: 'hint', text: '(optional)' })
      ]),
      textarea
    ]));
    refs.hint.textContent = 'Optional, du kannst den Schritt überspringen.';
  }

  function field(opts) {
    var wrap = el('div', { class: 'field' });
    var input = el(opts.tag || 'input', {
      class: 'input', id: opts.id, name: opts.name, type: opts.type || 'text',
      placeholder: opts.placeholder || '', autocomplete: opts.autocomplete || 'off',
      inputmode: opts.inputmode || null,
      'aria-describedby': opts.id + '-error'
    });
    input.value = opts.value || '';

    var error = el('p', { class: 'error-msg', id: opts.id + '-error' });

    input.addEventListener('input', function () {
      opts.onInput(input.value);
      if (input.getAttribute('aria-invalid') === 'true') {
        input.removeAttribute('aria-invalid');
        error.classList.remove('is-visible');
      }
    });

    wrap.appendChild(el('label', { for: opts.id, text: opts.label }));
    wrap.appendChild(input);
    wrap.appendChild(error);

    return { wrap: wrap, input: input, error: error };
  }

  function renderContact(step) {
    refs.next.classList.remove('is-hidden');
    setNextLabel('Weiter', 'arrow');
    refs.hint.textContent = 'Deine Daten werden nur für diese Anfrage genutzt.';

    var form = el('div');
    refs.fields = {};

    refs.fields.name = field({
      id: 'quiz-name', name: 'name', label: 'Name *', autocomplete: 'name',
      placeholder: 'Vor- und Nachname', value: answers.name,
      onInput: function (v) { answers.name = v; }
    });
    refs.fields.email = field({
      id: 'quiz-email', name: 'email', label: 'E-Mail *', type: 'email', autocomplete: 'email',
      inputmode: 'email', placeholder: 'name@unternehmen.de', value: answers.email,
      onInput: function (v) { answers.email = v; }
    });
    refs.fields.telefon = field({
      id: 'quiz-telefon', name: 'telefon', label: 'Telefon *', type: 'tel', autocomplete: 'tel',
      inputmode: 'tel', placeholder: '+49 …', value: answers.telefon,
      onInput: function (v) { answers.telefon = v; }
    });

    form.appendChild(refs.fields.name.wrap);
    form.appendChild(refs.fields.email.wrap);
    form.appendChild(refs.fields.telefon.wrap);

    // Honeypot, für Menschen unsichtbar, Bots füllen es aus.
    refs.honeypot = el('input', {
      type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true'
    });
    form.appendChild(el('div', { class: 'hp-field' }, [
      el('label', { for: 'quiz-hp', text: 'Bitte nicht ausfüllen' }),
      refs.honeypot
    ]));
    refs.honeypot.id = 'quiz-hp';

    // Datenschutz-Zustimmung
    var consent = el('input', { type: 'checkbox', id: 'quiz-consent', name: 'datenschutz' });
    consent.checked = answers.datenschutz;

    var consentError = el('p', { class: 'error-msg', id: 'quiz-consent-error' });
    consent.setAttribute('aria-describedby', 'quiz-consent-error');
    consent.addEventListener('change', function () {
      answers.datenschutz = consent.checked;
      if (consent.checked) {
        consent.removeAttribute('aria-invalid');
        consentError.classList.remove('is-visible');
      }
    });

    var link = el('a', { href: ROOT + 'datenschutz', target: '_blank', rel: 'noopener', text: 'Datenschutzerklärung' });

    form.appendChild(el('div', { class: 'field' }, [
      el('label', { class: 'checkbox', for: 'quiz-consent' }, [
        consent,
        el('span', {}, [
          document.createTextNode('Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung meiner Anfrage zu. Weitere Informationen in der '),
          link,
          document.createTextNode('. *')
        ])
      ]),
      consentError
    ]));

    refs.fields.consent = { input: consent, error: consentError };
    refs.body.appendChild(form);
    refs.body.appendChild(el('p', { class: 'quiz-hint', text: '* Pflichtfeld' }));
    renderTermin();
  }

  /* Optionale Terminbuchung über Cal.com unter den Kontaktfeldern. */
  function renderTermin() {
    refs.terminNote = el('p', { class: 'quiz-termin-note' });
    updateTerminNote();

    var cal = el('div');
    refs.body.appendChild(el('div', { class: 'quiz-termin' }, [
      el('h3', { class: 'quiz-termin-title', text: 'Optional: Wunschtermin direkt buchen' }),
      el('p', { class: 'quiz-step-sub', text: 'Wähle einen freien Termin für dein kostenloses Erstgespräch. Deine Anfrage sendest du danach wie gewohnt ab.' }),
      refs.terminNote,
      cal
    ]));

    mountCal(cal, function () {
      return { name: answers.name.trim(), email: answers.email.trim() };
    }, function (data) {
      answers.termin = formatTermin(data.startTime);
      updateTerminNote();
      refs.live.textContent = 'Termin gebucht: ' + answers.termin;
    });
  }

  function updateTerminNote() {
    if (!refs.terminNote) return;
    refs.terminNote.textContent = answers.termin ? 'Gebuchter Termin: ' + answers.termin : '';
    refs.terminNote.classList.toggle('is-visible', !!answers.termin);
  }


  function summaryRow(label, value, targetIndex) {
    var editBtn = el('button', { type: 'button', class: 'quiz-edit', text: 'Ändern' });
    editBtn.setAttribute('aria-label', label + ' ändern');
    editBtn.addEventListener('click', function () { index = targetIndex; render(); });

    return el('div', { class: 'quiz-summary-row' }, [
      el('dt', { text: label }),
      el('dd', {}, [el('span', { text: value || '—' }), editBtn])
    ]);
  }

  function renderSummary() {
    refs.next.classList.remove('is-hidden');
    setNextLabel('Anfrage absenden', 'send');
    refs.hint.textContent = '';

    var wichtig = answers.wichtig.map(function (v) { return labelFor('wichtig', v); }).join(', ');

    var list = el('dl', { class: 'quiz-summary' }, [
      summaryRow('Interesse', labelFor('interesse', answers.interesse), 0),
      summaryRow('Aktuelle Situation', labelFor('situation', answers.situation), 1),
      summaryRow('Besonders wichtig', wichtig, 2),
      summaryRow('Unternehmen', answers.unternehmen, 3),
      summaryRow('Name', answers.name, 4),
      summaryRow('E-Mail', answers.email, 4),
      summaryRow('Telefon', answers.telefon, 4),
      summaryRow('Termin', answers.termin || 'Kein Termin gebucht', 4)
    ]);

    refs.body.appendChild(list);
  }

  function setNextLabel(text, iconName) {
    refs.next.innerHTML = '';
    refs.next.appendChild(el('span', { text: text }));
    refs.next.appendChild(icon(iconName));
  }

  /* ---------------------------------------------------------- Validierung */
  function showError(target, message) {
    target.input.setAttribute('aria-invalid', 'true');
    target.error.textContent = message;
    target.error.classList.add('is-visible');
  }

  function validateContact() {
    var ok = true;
    var first = null;

    if (answers.name.trim().length < 2) {
      showError(refs.fields.name, 'Bitte gib deinen Namen an.');
      first = first || refs.fields.name.input;
      ok = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(answers.email.trim())) {
      showError(refs.fields.email, 'Bitte gib eine gültige E-Mail-Adresse an.');
      first = first || refs.fields.email.input;
      ok = false;
    }
    if (answers.telefon.replace(/[^0-9]/g, '').length < 6) {
      showError(refs.fields.telefon, 'Bitte gib eine Telefonnummer an, unter der du erreichbar bist.');
      first = first || refs.fields.telefon.input;
      ok = false;
    }
    if (!answers.datenschutz) {
      showError(refs.fields.consent, 'Bitte stimme der Verarbeitung deiner Angaben zu.');
      first = first || refs.fields.consent.input;
      ok = false;
    }

    if (!ok) {
      refs.live.textContent = 'Bitte prüfe die markierten Felder.';
      if (first) first.focus({ preventScroll: false });
    }
    return ok;
  }

  /* -------------------------------------------------------------- Navigation */
  function goNext() {
    var step = resolveStep(index);

    if (step.type === 'single' && !answers[step.id]) return;
    if (step.type === 'contact' && !validateContact()) return;
    if (step.type === 'summary') { send(); return; }

    if (index < TOTAL - 1) {
      index++;
      render();
    }
  }

  function goBack() {
    if (index === 0) return;
    index--;
    render();
  }

  /* ------------------------------------------------------------- Versand */

  /**
   * Einziger Punkt für den späteren API-Anschluss.
   *
   * Aktivierung von Web3Forms:
   *   1. Access Key auf https://web3forms.com anfordern
   *   2. Oben in CONFIG.accessKey eintragen
   * Danach wird die Anfrage automatisch an CONFIG.endpoint gesendet und der
   * Nutzer bekommt eine Bestätigung. Solange kein Key hinterlegt ist, wird
   * bewusst nichts gesendet und keine Erfolgsmeldung angezeigt.
   *
   * @returns {Promise<{status: 'sent'|'not_configured'|'error', message?: string}>}
   */
  function submitLead(payload) {
    if (!CONFIG.accessKey) {
      return Promise.resolve({ status: 'not_configured' });
    }

    return window.fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.assign({
        access_key: CONFIG.accessKey,
        subject: CONFIG.subject,
        from_name: 'JG Solutions Website'
      }, payload))
    })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        return data && data.success
          ? { status: 'sent' }
          : { status: 'error', message: (data && data.message) || '' };
      })
      .catch(function () { return { status: 'error' }; });
  }

  /* Stellt die Antworten als flaches Objekt für den Versand zusammen. */
  function buildPayload() {
    return {
      name: answers.name.trim(),
      email: answers.email.trim(),
      telefon: answers.telefon.trim(),
      interesse: labelFor('interesse', answers.interesse),
      situation: labelFor('situation', answers.situation),
      wichtig: answers.wichtig.map(function (v) { return labelFor('wichtig', v); }).join(', '),
      unternehmen: answers.unternehmen.trim(),
      termin: answers.termin || 'kein Termin gebucht',
      datenschutz: answers.datenschutz ? 'zugestimmt' : 'nicht zugestimmt',
      botcheck: refs.honeypot ? refs.honeypot.value : ''
    };
  }

  function mailtoFallback(payload) {
    var body = [
      'Interesse: ' + payload.interesse,
      'Aktuelle Situation: ' + payload.situation,
      'Besonders wichtig: ' + (payload.wichtig || '—'),
      'Unternehmen: ' + (payload.unternehmen || '—'),
      '',
      'Name: ' + payload.name,
      'E-Mail: ' + payload.email,
      'Telefon: ' + payload.telefon,
      'Termin: ' + payload.termin
    ].join('\n');

    return 'mailto:' + CONFIG.email +
      '?subject=' + encodeURIComponent('Anfrage über die kostenlose Analyse') +
      '&body=' + encodeURIComponent(body);
  }

  function send() {
    if (sending) return;

    // Honeypot gefüllt oder viel zu schnell -> stiller Abbruch (Bot).
    if ((refs.honeypot && refs.honeypot.value) || Date.now() - openedAt < 4000) { close(); return; }

    var payload = buildPayload();
    sending = true;
    refs.next.disabled = true;
    setNextLabel('Wird gesendet …', 'send');

    submitLead(payload).then(function (result) {
      sending = false;
      refs.next.disabled = false;
      showResult(result, payload);
    });
  }

  function showResult(result, payload) {
    refs.body.innerHTML = '';
    refs.foot.classList.add('is-hidden');
    refs.bar.style.width = '100%';
    refs.progressLabel.textContent = '';

    if (result.status === 'sent') {
      refs.body.appendChild(el('div', { class: 'quiz-done' }, [
        el('div', { class: 'icon-wrap', html: ICONS.check }),
        el('h2', { id: 'quiz-title', class: 'quiz-step-title', text: 'Vielen Dank für deine Anfrage.' }),
        el('p', { text: 'Ich habe deine Angaben erhalten und melde mich innerhalb von 24 Stunden bei dir.' })
      ]));
      refs.live.textContent = 'Deine Anfrage wurde gesendet.';
      completed = true;
      return;
    }

    // Kein Versand möglich: ehrlich benennen und direkte Kontaktwege anbieten.
    var isError = result.status === 'error';
    var box = el('div', { class: 'quiz-status ' + (isError ? 'quiz-status--error' : 'quiz-status--info') }, [
      el('h3', { text: isError ? 'Das Senden hat leider nicht geklappt.' : 'Der automatische Versand ist noch nicht aktiv.' }),
      el('p', {
        text: isError
          ? 'Bitte versuch es später erneut oder schick mir deine Angaben direkt, am schnellsten per E-Mail oder telefonisch.'
          : 'Deine Angaben wurden deshalb nicht übermittelt. Du kannst sie mit einem Klick als E-Mail übernehmen oder mich direkt anrufen.'
      }),
      el('div', { class: 'btn-row' }, [
        el('a', { class: 'btn btn-primary', href: mailtoFallback(payload) }, [
          icon('mail'), el('span', { text: 'Angaben per E-Mail senden' })
        ]),
        el('a', { class: 'btn btn-outline', href: 'tel:' + CONFIG.phone.replace(/\s/g, ''), text: CONFIG.phone })
      ])
    ]);

    refs.body.appendChild(el('h2', { id: 'quiz-title', class: 'quiz-step-title', text: 'Fast geschafft.' }));
    refs.body.appendChild(box);
    refs.live.textContent = isError
      ? 'Die Anfrage konnte nicht gesendet werden.'
      : 'Der automatische Versand ist noch nicht aktiv.';
  }

  /* ------------------------------------------------------- Öffnen/Schließen */
  function open() {
    if (!dialog) build();
    // Nach einer erfolgreich gesendeten Anfrage startet der Funnel neu.
    if (completed) { reset(); completed = false; }
    lastFocused = document.activeElement;
    openedAt = Date.now();

    // Erst öffnen, dann rendern: showModal() setzt sonst den Fokus auf das
    // erste Element im Dialog (Schließen-Button) statt auf die erste Antwort.
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');

    render();
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');

    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function reset() {
    answers = {
      interesse: '', situation: '', wichtig: [], unternehmen: '',
      name: '', email: '', telefon: '', datenschutz: false, termin: ''
    };
    index = 0;
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-quiz-open]');
    if (!trigger) return;
    event.preventDefault();

    // Vorauswahl möglich: <button data-quiz-open="shopify">
    var preset = trigger.getAttribute('data-quiz-open');
    if (preset && BRANCHES[preset]) {
      reset();
      answers.interesse = preset;
      index = 1;
      open();
      return;
    }
    open();
  });

  // Direktlink auf den Fragebogen: seite.html#demo
  if (window.location.hash === '#demo') {
    window.addEventListener('load', open);
  }

  // Kalender auf normalen Seiten, z. B. kontakt.html: <div data-cal-inline></div>
  Array.prototype.forEach.call(document.querySelectorAll('[data-cal-inline]'), function (node) {
    mountCal(node);
  });

  window.JGQuiz = { open: open, close: close, reset: reset, submitLead: submitLead };
})(window, document);
