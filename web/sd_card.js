const elements = {
  currentPath: document.querySelector('#current-path'), capacity: document.querySelector('#capacity'), fileContainer: document.querySelector('#file-container'), fileStatus: document.querySelector('#file-status'), goUp: document.querySelector('#go-up'), refresh: document.querySelector('#refresh'), uploadForm: document.querySelector('#upload-form'), uploadFile: document.querySelector('#upload-file'), uploadStatus: document.querySelector('#upload-status'), overwriteDialog: document.querySelector('#overwrite-dialog'), overwriteMessage: document.querySelector('#overwrite-message'), passwordForm: document.querySelector('#password-form'), currentPassword: document.querySelector('#current-password'), newPassword: document.querySelector('#new-password'), repeatPassword: document.querySelector('#repeat-password'), passwordStatus: document.querySelector('#password-status'), deleteDialog: document.querySelector('#delete-dialog'), deleteTitle: document.querySelector('#delete-title'), deleteMessage: document.querySelector('#delete-message'), deleteConfirm: document.querySelector('#delete-confirm'),
};

let currentPath = '/';
let pendingDeletePath = '';

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB']; let value = bytes; let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}
function parentPath(path) { if (path === '/') return '/'; const parts = path.split('/').filter(Boolean); parts.pop(); return parts.length ? `/${parts.join('/')}` : '/'; }
function setStatus(element, text = '', type = '') { element.textContent = text; element.className = `status${type ? ` ${type}` : ''}`; }
async function request(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  if (response.status === 401) throw new Error('Prijava za SD kartico ni uspela. Stran znova odpri in vpiši pravilne podatke.');
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : { error: await response.text() };
  if (!response.ok) { const error = new Error(payload.error || 'Zahteva ni uspela.'); error.status = response.status; throw error; }
  return payload;
}
function showEntries(entries) {
  if (!entries.length) { elements.fileContainer.innerHTML = '<p class="empty">Mapa je prazna.</p>'; return; }
  const table = document.createElement('table'); table.className = 'file-list';
  table.innerHTML = '<thead><tr><th>Ime</th><th>Velikost</th><th></th><th></th></tr></thead>';
  const body = document.createElement('tbody');
  entries.sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name, 'sl'));
  entries.forEach((entry) => {
    const row = document.createElement('tr'); const name = document.createElement('a'); name.className = 'file-name'; name.href = entry.directory ? '#' : `/sd_card/download?path=${encodeURIComponent(entry.path)}`;
    name.innerHTML = `<span class="file-icon" aria-hidden="true">${entry.directory ? '▰' : '▱'}</span>`; name.append(document.createTextNode(entry.name));
    if (entry.directory) name.addEventListener('click', (event) => { event.preventDefault(); currentPath = entry.path; loadDirectory(); });
    const size = document.createElement('td'); size.textContent = entry.directory ? 'Mapa' : formatBytes(Number(entry.size));
    const download = document.createElement('a'); download.className = 'button'; download.textContent = entry.directory ? 'Odpri' : 'Prenesi'; download.href = entry.directory ? '#' : `/sd_card/download?path=${encodeURIComponent(entry.path)}`;
    if (entry.directory) download.addEventListener('click', (event) => { event.preventDefault(); currentPath = entry.path; loadDirectory(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = 'Izbriši'; remove.addEventListener('click', () => openDeleteDialog(entry));
    const actions = document.createElement('td'); const actionWrap = document.createElement('div'); actionWrap.className = 'file-actions'; actionWrap.append(download, remove); actions.append(actionWrap);
    const nameCell = document.createElement('td'); nameCell.append(name); row.append(nameCell, size, document.createElement('td'), actions); body.append(row);
  });
  table.append(body); elements.fileContainer.replaceChildren(table);
}
async function loadDirectory() {
  elements.refresh.disabled = true; elements.goUp.disabled = currentPath === '/'; setStatus(elements.fileStatus, 'Nalagam vsebino mape …');
  try { const result = await request(`/sd_card/api/list?path=${encodeURIComponent(currentPath)}`); currentPath = result.path; elements.currentPath.textContent = currentPath; elements.capacity.textContent = `${formatBytes(Number(result.used_bytes))} od ${formatBytes(Number(result.total_bytes))}`; showEntries(result.entries || []); setStatus(elements.fileStatus, result.truncated ? 'Prikazanih je prvih 128 vnosov v tej mapi.' : ''); }
  catch (error) { elements.fileContainer.innerHTML = '<p class="empty">Vsebine mape ni bilo mogoče prikazati.</p>'; setStatus(elements.fileStatus, error.message, 'error'); }
  finally { elements.refresh.disabled = false; elements.goUp.disabled = currentPath === '/'; }
}
function openDeleteDialog(entry) { pendingDeletePath = entry.path; elements.deleteTitle.textContent = entry.directory ? 'Izbriši prazno mapo' : 'Izbriši datoteko'; elements.deleteMessage.textContent = `Trajno izbrišem ${entry.directory ? 'mapo' : 'datoteko'} »${entry.name}«? Dejanje ni mogoče razveljaviti.`; elements.deleteDialog.showModal(); }
elements.deleteDialog.addEventListener('close', async () => { if (elements.deleteDialog.returnValue !== 'confirm' || !pendingDeletePath) return; const path = pendingDeletePath; pendingDeletePath = ''; setStatus(elements.fileStatus, 'Brišem …'); try { await request('/sd_card/api/file', { method: 'DELETE', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ path }) }); setStatus(elements.fileStatus, 'Datoteka oziroma prazna mapa je izbrisana.', 'success'); await loadDirectory(); } catch (error) { setStatus(elements.fileStatus, error.message, 'error'); } });
elements.goUp.addEventListener('click', () => { currentPath = parentPath(currentPath); loadDirectory(); }); elements.refresh.addEventListener('click', loadDirectory);
async function uploadSelectedFile(overwrite = false) {
  const file = elements.uploadFile.files[0];
  if (!file) return;
  const data = new FormData();
  data.append('file', file);
  const button = elements.uploadForm.querySelector('button');
  button.disabled = true;
  setStatus(elements.uploadStatus, `Nalaganje ${file.name} …`);
  try {
    const query = `path=${encodeURIComponent(currentPath)}${overwrite ? '&overwrite=1' : ''}`;
    await request(`/sd_card/api/upload?${query}`, { method: 'POST', body: data });
    elements.uploadForm.reset();
    setStatus(elements.uploadStatus, overwrite ? 'Datoteka je zamenjana.' : 'Datoteka je naložena.', 'success');
    await loadDirectory();
  } catch (error) {
    if (!overwrite && error.status === 409 && error.message === 'Datoteka s tem imenom že obstaja') {
      elements.overwriteMessage.textContent = `Datoteka »${file.name}« že obstaja. Ali jo želiš trajno zamenjati z izbrano datoteko?`;
      elements.overwriteDialog.showModal();
      return;
    }
    setStatus(elements.uploadStatus, error.message, 'error');
  } finally {
    button.disabled = false;
  }
}
elements.uploadForm.addEventListener('submit', (event) => { event.preventDefault(); uploadSelectedFile(); });
elements.overwriteDialog.addEventListener('close', () => { if (elements.overwriteDialog.returnValue === 'confirm') uploadSelectedFile(true); });
elements.passwordForm.addEventListener('submit', async (event) => { event.preventDefault(); if (elements.newPassword.value !== elements.repeatPassword.value) { setStatus(elements.passwordStatus, 'Novi gesli se ne ujemata.', 'error'); return; } const button = elements.passwordForm.querySelector('button'); button.disabled = true; setStatus(elements.passwordStatus, 'Shranjujem geslo …'); try { await request('/sd_card/api/password', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ current_password: elements.currentPassword.value, new_password: elements.newPassword.value }) }); elements.passwordForm.reset(); setStatus(elements.passwordStatus, 'Novo geslo je shranjeno. Ob naslednjem dostopu uporabi novo geslo.', 'success'); } catch (error) { setStatus(elements.passwordStatus, error.message, 'error'); } finally { button.disabled = false; } });
loadDirectory();
