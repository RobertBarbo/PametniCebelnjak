const elements = {
  currentPath: document.querySelector('#current-path'), capacity: document.querySelector('#capacity'), fileContainer: document.querySelector('#file-container'), fileStatus: document.querySelector('#file-status'), goUp: document.querySelector('#go-up'), refresh: document.querySelector('#refresh'), uploadForm: document.querySelector('#upload-form'), uploadFile: document.querySelector('#upload-file'), uploadStatus: document.querySelector('#upload-status'), overwriteDialog: document.querySelector('#overwrite-dialog'), overwriteMessage: document.querySelector('#overwrite-message'), passwordForm: document.querySelector('#password-form'), currentPassword: document.querySelector('#current-password'), newPassword: document.querySelector('#new-password'), repeatPassword: document.querySelector('#repeat-password'), passwordStatus: document.querySelector('#password-status'), deleteDialog: document.querySelector('#delete-dialog'), deleteTitle: document.querySelector('#delete-title'), deleteMessage: document.querySelector('#delete-message'), deleteConfirm: document.querySelector('#delete-confirm'),
};

const language = ['sl', 'hr', 'en'].includes(localStorage.getItem('pametni-cebelnjak-language'))
  ? localStorage.getItem('pametni-cebelnjak-language')
  : 'sl';
const translations = {
  hr: {
    'SD kartica · Pametni čebelnjak': 'SD kartica · Pametna košnica', 'SD kartica': 'SD kartica', 'Lokalni skrbniški dostop': 'Lokalni administratorski pristup',
    'Upravljanje datotek na SD kartici naprave. Ta stran ni del običajne nadzorne plošče in je dosegljiva samo neposredno prek lokalnega naslova.': 'Upravljanje datotekama na SD kartici uređaja. Ova stranica nije dio uobičajene nadzorne ploče i dostupna je samo izravno putem lokalne adrese.',
    'Brisanje ali prepis sistemskih datotek lahko prekine lokalne grafe oziroma sinhronizacijo zgodovine. Pred posegom v': 'Brisanje ili prepisivanje sistemskih datoteka može prekinuti lokalne grafove ili sinkronizaciju povijesti. Prije izmjene datoteke',
    'naredi prenos varnostne kopije.': 'preuzmite sigurnosnu kopiju.', 'Datoteke': 'Datoteke', 'Čakam na SD kartico …': 'Čekam SD karticu …', 'Mapa nazaj': 'Natrag u mapu', 'Osveži': 'Osvježi', 'Nalagam vsebino mape …': 'Učitavam sadržaj mape …',
    'Naloži datoteko': 'Prenesi datoteku', 'Datoteka se naloži v trenutno odprto mapo. Obstoječo datoteko je mogoče zamenjati šele po izrecni potrditvi.': 'Datoteka se prenosi u trenutačno otvorenu mapu. Postojeću datoteku moguće je zamijeniti tek nakon izričite potvrde.', 'Naloži na SD kartico': 'Prenesi na SD karticu',
    'Geslo dostopa': 'Lozinka za pristup', 'Uporabniško ime je': 'Korisničko ime je', '. Začetno geslo je aktivacijska koda naprave; po spremembi ostane geslo samo v NVS naprave.': '. Početna lozinka je aktivacijski kod uređaja; nakon promjene lozinka ostaje samo u NVS-u uređaja.', 'Trenutno geslo': 'Trenutačna lozinka', 'Novo geslo': 'Nova lozinka', 'Ponovi novo geslo': 'Ponovite novu lozinku', 'Shrani novo geslo': 'Spremi novu lozinku',
    'Trajno brisanje': 'Trajno brisanje', 'Izbriši datoteko': 'Izbriši datoteku', 'Prekliči': 'Odustani', 'Izbriši': 'Izbriši', 'Prepis datoteke': 'Prepisivanje datoteke', 'Datoteka že obstaja': 'Datoteka već postoji', 'Nova datoteka bo zamenjala trenutno različico. Pred potrditvijo prenesi varnostno kopijo, posebej pri': 'Nova datoteka zamijenit će trenutačnu verziju. Prije potvrde preuzmite sigurnosnu kopiju, posebno za', 'Zamenjaj datoteko': 'Zamijeni datoteku',
    'Mapa je prazna.': 'Mapa je prazna.', 'Ime': 'Naziv', 'Velikost': 'Veličina', 'Mapa': 'Mapa', 'Odpri': 'Otvori', 'Prenesi': 'Preuzmi', 'Prikazanih je prvih 128 vnosov v tej mapi.': 'Prikazano je prvih 128 stavki u ovoj mapi.', 'Vsebine mape ni bilo mogoče prikazati.': 'Sadržaj mape nije bilo moguće prikazati.', 'Izbriši prazno mapo': 'Izbriši praznu mapu', 'Brišem …': 'Brišem …', 'Datoteka oziroma prazna mapa je izbrisana.': 'Datoteka ili prazna mapa je izbrisana.', 'Datoteka je zamenjana.': 'Datoteka je zamijenjena.', 'Datoteka je naložena.': 'Datoteka je prenesena.', 'Novi gesli se ne ujemata.': 'Nove lozinke se ne podudaraju.', 'Shranjujem geslo …': 'Spremam lozinku …', 'Novo geslo je shranjeno. Ob naslednjem dostopu uporabi novo geslo.': 'Nova lozinka je spremljena. Pri sljedećem pristupu upotrijebite novu lozinku.',
    'Prijava za SD kartico ni uspela. Stran znova odpri in vpiši pravilne podatke.': 'Prijava za SD karticu nije uspjela. Ponovno otvorite stranicu i unesite ispravne podatke.', 'Zahteva ni uspela.': 'Zahtjev nije uspio.', 'Trajno izbrišem {type} »{name}«? Dejanje ni mogoče razveljaviti.': 'Trajno izbrisati {type} »{name}«? Radnju nije moguće poništiti.', 'mapo': 'mapu', 'datoteko': 'datoteku', 'Nalaganje {name} …': 'Prenos datoteke {name} …', 'Datoteka »{name}« že obstaja. Ali jo želiš trajno zamenjati z izbrano datoteko?': 'Datoteka »{name}« već postoji. Želite li je trajno zamijeniti odabranom datotekom?',
  },
  en: {
    'SD kartica · Pametni čebelnjak': 'SD card · Smart Beehive', 'SD kartica': 'SD card', 'Lokalni skrbniški dostop': 'Local administrator access',
    'Upravljanje datotek na SD kartici naprave. Ta stran ni del običajne nadzorne plošče in je dosegljiva samo neposredno prek lokalnega naslova.': 'Manage files on the device SD card. This page is not part of the regular dashboard and is available only directly through the local address.',
    'Brisanje ali prepis sistemskih datotek lahko prekine lokalne grafe oziroma sinhronizacijo zgodovine. Pred posegom v': 'Deleting or overwriting system files can interrupt local charts or history synchronization. Before modifying', 'naredi prenos varnostne kopije.': 'download a backup.',
    'Datoteke': 'Files', 'Čakam na SD kartico …': 'Waiting for SD card …', 'Mapa nazaj': 'Parent folder', 'Osveži': 'Refresh', 'Nalagam vsebino mape …': 'Loading folder contents …', 'Naloži datoteko': 'Upload file', 'Datoteka se naloži v trenutno odprto mapo. Obstoječo datoteko je mogoče zamenjati šele po izrecni potrditvi.': 'The file is uploaded to the currently open folder. An existing file can be replaced only after explicit confirmation.', 'Naloži na SD kartico': 'Upload to SD card',
    'Geslo dostopa': 'Access password', 'Uporabniško ime je': 'The username is', '. Začetno geslo je aktivacijska koda naprave; po spremembi ostane geslo samo v NVS naprave.': '. The initial password is the device activation code; after a change, the password remains only in the device NVS.', 'Trenutno geslo': 'Current password', 'Novo geslo': 'New password', 'Ponovi novo geslo': 'Repeat new password', 'Shrani novo geslo': 'Save new password',
    'Trajno brisanje': 'Permanent deletion', 'Izbriši datoteko': 'Delete file', 'Prekliči': 'Cancel', 'Izbriši': 'Delete', 'Prepis datoteke': 'File overwrite', 'Datoteka že obstaja': 'File already exists', 'Nova datoteka bo zamenjala trenutno različico. Pred potrditvijo prenesi varnostno kopijo, posebej pri': 'The new file will replace the current version. Download a backup before confirming, especially for', 'Zamenjaj datoteko': 'Replace file',
    'Mapa je prazna.': 'The folder is empty.', 'Ime': 'Name', 'Velikost': 'Size', 'Mapa': 'Folder', 'Odpri': 'Open', 'Prenesi': 'Download', 'Prikazanih je prvih 128 vnosov v tej mapi.': 'The first 128 entries in this folder are shown.', 'Vsebine mape ni bilo mogoče prikazati.': 'The folder contents could not be displayed.', 'Izbriši prazno mapo': 'Delete empty folder', 'Brišem …': 'Deleting …', 'Datoteka oziroma prazna mapa je izbrisana.': 'The file or empty folder was deleted.', 'Datoteka je zamenjana.': 'The file was replaced.', 'Datoteka je naložena.': 'The file was uploaded.', 'Novi gesli se ne ujemata.': 'The new passwords do not match.', 'Shranjujem geslo …': 'Saving password …', 'Novo geslo je shranjeno. Ob naslednjem dostopu uporabi novo geslo.': 'The new password was saved. Use it the next time you access this page.',
    'Prijava za SD kartico ni uspela. Stran znova odpri in vpiši pravilne podatke.': 'SD card sign-in failed. Reopen the page and enter the correct credentials.', 'Zahteva ni uspela.': 'The request failed.', 'Trajno izbrišem {type} »{name}«? Dejanje ni mogoče razveljaviti.': 'Permanently delete the {type} “{name}”? This action cannot be undone.', 'mapo': 'folder', 'datoteko': 'file', 'Nalaganje {name} …': 'Uploading {name} …', 'Datoteka »{name}« že obstaja. Ali jo želiš trajno zamenjati z izbrano datoteko?': 'The file “{name}” already exists. Do you want to permanently replace it with the selected file?',
  },
};
function t(text) { return translations[language]?.[text] || text; }
function formatText(text, values) { return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), t(text)); }
function translatePage() {
  document.documentElement.lang = language;
  document.title = t('SD kartica · Pametni čebelnjak');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!node.parentElement || ['SCRIPT', 'STYLE', 'CODE'].includes(node.parentElement.tagName) || !node.nodeValue.trim()) return;
    const leading = node.nodeValue.match(/^\s*/)?.[0] || '';
    const trailing = node.nodeValue.match(/\s*$/)?.[0] || '';
    node.nodeValue = `${leading}${t(node.nodeValue.trim())}${trailing}`;
  });
}

let currentPath = '/';
let pendingDeletePath = '';

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB']; let value = bytes; let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}
function parentPath(path) { if (path === '/') return '/'; const parts = path.split('/').filter(Boolean); parts.pop(); return parts.length ? `/${parts.join('/')}` : '/'; }
function setStatus(element, text = '', type = '') { element.textContent = t(text); element.className = `status${type ? ` ${type}` : ''}`; }
async function request(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  if (response.status === 401) throw new Error(t('Prijava za SD kartico ni uspela. Stran znova odpri in vpiši pravilne podatke.'));
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : { error: await response.text() };
  if (!response.ok) { const error = new Error(payload.error || t('Zahteva ni uspela.')); error.status = response.status; throw error; }
  return payload;
}
function showEntries(entries) {
  if (!entries.length) { elements.fileContainer.innerHTML = `<p class="empty">${t('Mapa je prazna.')}</p>`; return; }
  const table = document.createElement('table'); table.className = 'file-list';
  table.innerHTML = `<thead><tr><th>${t('Ime')}</th><th>${t('Velikost')}</th><th></th><th></th></tr></thead>`;
  const body = document.createElement('tbody');
  entries.sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name, 'sl'));
  entries.forEach((entry) => {
    const row = document.createElement('tr'); const name = document.createElement('a'); name.className = 'file-name'; name.href = entry.directory ? '#' : `/sd_card/download?path=${encodeURIComponent(entry.path)}`;
    name.innerHTML = `<span class="file-icon" aria-hidden="true">${entry.directory ? '▰' : '▱'}</span>`; name.append(document.createTextNode(entry.name));
    if (entry.directory) name.addEventListener('click', (event) => { event.preventDefault(); currentPath = entry.path; loadDirectory(); });
    const size = document.createElement('td'); size.dataset.label = t('Velikost'); size.textContent = entry.directory ? t('Mapa') : formatBytes(Number(entry.size));
    const download = document.createElement('a'); download.className = 'button'; download.textContent = t(entry.directory ? 'Odpri' : 'Prenesi'); download.href = entry.directory ? '#' : `/sd_card/download?path=${encodeURIComponent(entry.path)}`;
    if (entry.directory) download.addEventListener('click', (event) => { event.preventDefault(); currentPath = entry.path; loadDirectory(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = t('Izbriši'); remove.addEventListener('click', () => openDeleteDialog(entry));
    const actions = document.createElement('td'); const actionWrap = document.createElement('div'); actionWrap.className = 'file-actions'; actionWrap.append(download, remove); actions.append(actionWrap);
    const nameCell = document.createElement('td'); nameCell.append(name); row.append(nameCell, size, document.createElement('td'), actions); body.append(row);
  });
  table.append(body); elements.fileContainer.replaceChildren(table);
}
async function loadDirectory() {
  elements.refresh.disabled = true; elements.goUp.disabled = currentPath === '/'; setStatus(elements.fileStatus, 'Nalagam vsebino mape …');
  try { const result = await request(`/sd_card/api/list?path=${encodeURIComponent(currentPath)}`); currentPath = result.path; elements.currentPath.textContent = currentPath; elements.capacity.textContent = `${formatBytes(Number(result.used_bytes))} od ${formatBytes(Number(result.total_bytes))}`; showEntries(result.entries || []); setStatus(elements.fileStatus, result.truncated ? 'Prikazanih je prvih 128 vnosov v tej mapi.' : ''); }
  catch (error) { elements.fileContainer.innerHTML = `<p class="empty">${t('Vsebine mape ni bilo mogoče prikazati.')}</p>`; setStatus(elements.fileStatus, error.message, 'error'); }
  finally { elements.refresh.disabled = false; elements.goUp.disabled = currentPath === '/'; }
}
function openDeleteDialog(entry) { pendingDeletePath = entry.path; elements.deleteTitle.textContent = t(entry.directory ? 'Izbriši prazno mapo' : 'Izbriši datoteko'); elements.deleteMessage.textContent = formatText('Trajno izbrišem {type} »{name}«? Dejanje ni mogoče razveljaviti.', { type: t(entry.directory ? 'mapo' : 'datoteko'), name: entry.name }); elements.deleteDialog.showModal(); }
elements.deleteDialog.addEventListener('close', async () => { if (elements.deleteDialog.returnValue !== 'confirm' || !pendingDeletePath) return; const path = pendingDeletePath; pendingDeletePath = ''; setStatus(elements.fileStatus, 'Brišem …'); try { await request('/sd_card/api/file', { method: 'DELETE', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ path }) }); setStatus(elements.fileStatus, 'Datoteka oziroma prazna mapa je izbrisana.', 'success'); await loadDirectory(); } catch (error) { setStatus(elements.fileStatus, error.message, 'error'); } });
elements.goUp.addEventListener('click', () => { currentPath = parentPath(currentPath); loadDirectory(); }); elements.refresh.addEventListener('click', loadDirectory);
async function uploadSelectedFile(overwrite = false) {
  const file = elements.uploadFile.files[0];
  if (!file) return;
  const data = new FormData();
  data.append('file', file);
  const button = elements.uploadForm.querySelector('button');
  button.disabled = true;
  setStatus(elements.uploadStatus, formatText('Nalaganje {name} …', { name: file.name }));
  try {
    const query = `path=${encodeURIComponent(currentPath)}${overwrite ? '&overwrite=1' : ''}`;
    await request(`/sd_card/api/upload?${query}`, { method: 'POST', body: data });
    elements.uploadForm.reset();
    setStatus(elements.uploadStatus, overwrite ? 'Datoteka je zamenjana.' : 'Datoteka je naložena.', 'success');
    await loadDirectory();
  } catch (error) {
    if (!overwrite && error.status === 409 && error.message === 'Datoteka s tem imenom že obstaja') {
      elements.overwriteMessage.textContent = formatText('Datoteka »{name}« že obstaja. Ali jo želiš trajno zamenjati z izbrano datoteko?', { name: file.name });
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
translatePage();
loadDirectory();
