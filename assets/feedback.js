(() => {
  const endpoint = 'https://berilo-feedback.iweqhu.workers.dev/feedback';
  const get = id => document.getElementById(id);
  const launcher = get('feedback-launcher');
  const dialog = get('feedback-dialog');
  const close = get('feedback-close');
  const form = get('feedback-form');
  const hasTopics = window.GRADIVO.topics.length > 0;
  get('feedback-sections').hidden = !hasTopics;
  const radios = [...form.querySelectorAll('input[name="section"]')];
  const entries = get('feedback-entries');
  const entry = get('feedback-entry');
  const entryLabel = get('feedback-entry-label');
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
  let draftKey;
  let draftId;

  function renderEntries(preferred = '') {
    const section = form.elements.section.value;
    entries.hidden = !section;
    entry.disabled = !section;
    if (!section) return;

    entryLabel.textContent = section === 'dela' ? 'Delo' : 'Tema';
    const items = catalog[section];
    entry.replaceChildren(new Option('Izberi naslov …', ''), ...items.map(item => new Option(item.title, item.id)));
    entry.value = items.some(item => String(item.id) === preferred) ? preferred : '';
  }

  function prefill() {
    const [, mode, id] = location.hash.match(/^#(delo|tema)\/(\d+)$/) || [];
    const section = !hasTopics || mode === 'delo' || location.hash.startsWith('#dela') ? 'dela'
      : mode === 'tema' || location.hash.startsWith('#teme') ? 'teme' : '';
    radios.forEach(radio => { radio.checked = radio.value === section; });
    renderEntries(id ?? '');
  }

  function showError(text) {
    error.textContent = text;
    error.hidden = !text;
  }

  launcher.addEventListener('click', () => {
    if (!message.value.trim() && receipt.hidden) prefill();
    dialog.showModal();
    const target = receipt.hidden ? (entries.hidden ? radios[0] : entry) : receiptText;
    target.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => launcher.focus());
  radios.forEach(radio => radio.addEventListener('change', () => renderEntries()));
  message.addEventListener('input', () => message.setCustomValidity(''));
  newReport.addEventListener('click', () => {
    receipt.hidden = true;
    form.hidden = false;
    prefill();
    (entry.value ? message : entries.hidden ? radios[0] : entry).focus();
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
    send.setAttribute('aria-label', 'Pošiljanje …');
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
      send.setAttribute('aria-label', 'Pošlji pripombo');
      form.removeAttribute('aria-busy');
    }
  });
})();
