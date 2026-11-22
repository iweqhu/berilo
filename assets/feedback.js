(() => {
  const endpoint = 'https://berilo-feedback.iweqhu.workers.dev/feedback';
  const get = id => document.getElementById(id);
  const launcher = get('feedback-launcher');
  const dialog = get('feedback-dialog');
  const close = get('feedback-close');
  const form = get('feedback-form');
  const radios = [...form.querySelectorAll('input[name="section"]')];
  const entries = get('feedback-entries');
  const search = get('feedback-search');
  const entry = get('feedback-entry');
  const entryLabel = get('feedback-entry-label');
  const matches = get('feedback-matches');
  const message = get('feedback-message');
  const send = form.querySelector('button[type="submit"]');
  const error = get('feedback-error');
  const receipt = get('feedback-receipt');
  const receiptText = get('feedback-receipt-text');
  const newReport = get('feedback-new');
  const catalog = {
    dela: [{ id: 0, title: 'Splošno o delih' }, ...window.GRADIVO.works],
    teme: [{ id: 0, title: 'Splošno o tretjem vprašanju' }, ...window.GRADIVO.topics],
  };
  const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('sl');
  let draftKey;
  let draftId;

  function renderEntries(preferred = entry.value) {
    const section = form.elements.section.value;
    entries.hidden = !section;
    entry.disabled = !section;
    if (!section) return;

    entryLabel.textContent = section === 'dela' ? 'Delo' : 'Tema';
    const query = normalize(search.value.trim());
    const results = catalog[section].filter(item => normalize(item.title).includes(query));
    const selectLabel = results.length ? 'Izberi naslov …' : 'Ni zadetkov';
    entry.replaceChildren(new Option(selectLabel, ''), ...results.map(item => new Option(item.title, item.id)));
    entry.size = query && results.length ? Math.min(4, results.length + 1) : 1;
    entry.value = results.some(item => String(item.id) === preferred) ? preferred : '';
    matches.textContent = query ? `Zadetki: ${results.length}` : '';
  }

  function prefill() {
    const [, mode, id] = location.hash.match(/^#(delo|tema)\/(\d+)$/) || [];
    const section = mode === 'delo' || location.hash.startsWith('#dela') ? 'dela'
      : mode === 'tema' || location.hash.startsWith('#teme') ? 'teme' : '';
    radios.forEach(radio => { radio.checked = radio.value === section; });
    search.value = '';
    renderEntries(id ?? '');
  }

  function showError(text) {
    error.textContent = text;
    error.hidden = !text;
  }

  launcher.addEventListener('click', () => {
    if (!message.value.trim() && receipt.hidden) prefill();
    dialog.showModal();
    const target = receipt.hidden
      ? (entry.value ? entry : entries.hidden ? radios[0] : search)
      : receiptText;
    target.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => launcher.focus());
  radios.forEach(radio => radio.addEventListener('change', () => {
    search.value = '';
    renderEntries('');
  }));
  search.addEventListener('input', () => renderEntries());
  message.addEventListener('input', () => message.setCustomValidity(''));
  newReport.addEventListener('click', () => {
    receipt.hidden = true;
    form.hidden = false;
    prefill();
    (entry.value ? message : entries.hidden ? radios[0] : search).focus();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (send.disabled) return;
    const note = message.value.trim();
    if (note.length < 5) {
      message.setCustomValidity('Pripomba naj ima vsaj 5 znakov.');
      message.reportValidity();
      return;
    }
    const section = form.elements.section.value;
    const entryId = Number(entry.value);
    const title = entry.selectedOptions[0].text;
    const key = JSON.stringify([section, entryId, note]);
    if (key !== draftKey) {
      draftId = crypto.randomUUID();
      draftKey = key;
    }
    showError('');
    send.disabled = true;
    send.textContent = 'Pošiljanje …';
    form.setAttribute('aria-busy', 'true');
    const controls = [...form.querySelectorAll('input, select, textarea')];
    controls.forEach(control => { control.disabled = true; });
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draftId, section, entryId, message: note }),
        signal: AbortSignal.timeout(12000),
      });
      if (response.status === 429) {
        showError('Poskusil si večkrat zapored. Počakaj minuto in poskusi znova.');
        return;
      }
      if (!response.ok || !(await response.json()).ok) throw new Error();
      draftKey = undefined;
      message.value = '';
      form.hidden = true;
      receipt.hidden = false;
      receiptText.textContent = `Hvala! Pripombo za »${title}« smo prejeli.`;
      if (dialog.open) receiptText.focus();
    } catch {
      showError('Pripombe ni bilo mogoče poslati. Besedilo je še tu. Poskusi znova.');
    } finally {
      controls.forEach(control => { control.disabled = false; });
      send.disabled = false;
      send.textContent = 'Pošlji pripombo';
      form.removeAttribute('aria-busy');
    }
  });
})();
