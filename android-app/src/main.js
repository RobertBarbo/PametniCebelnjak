import { Capacitor, registerPlugin } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const LANGUAGE_STORAGE_KEY = 'pametni-cebelnjak-language';
const THEME_STORAGE_KEY = 'pametni-cebelnjak-theme';
const APP_RETURN_MESSAGE_TYPE = 'pametni-cebelnjak-return-to-app';
const LANGUAGE_OPTIONS = {
  sl: { flag: '🇸🇮', label: 'Slovenščina' },
  hr: { flag: '🇭🇷', label: 'Hrvatski' },
  en: { flag: '🇬🇧', label: 'English' },
};
const TRANSLATIONS = {
  hr: {
    'Pametni čebelnjak': 'Pametna košnica', 'Mobilna aplikacija': 'Mobilna aplikacija', 'Izberi jezik': 'Odaberi jezik', 'Tema': 'Tema', 'Izberi temo': 'Odaberi temu', 'Gozd': 'Šuma', 'Polnoč': 'Ponoć', 'Med': 'Med', 'Svetla tema': 'Svijetla tema',
    'DOBRODOŠLI': 'DOBRO DOŠLI', 'Tvoj panj.<br />Vedno blizu.': 'Tvoja košnica.<br />Uvijek blizu.', 'Spremljaj meritve v oblaku ali v nekaj korakih poveži novo napravo z domačim Wi‑Fi omrežjem.': 'Prati mjerenja u oblaku ili u nekoliko koraka poveži novi uređaj s kućnom Wi‑Fi mrežom.',
    'NADZOR': 'NADZOR', 'Odpri nadzorno ploščo': 'Otvori nadzornu ploču', 'Prijava, meritve, grafi, opozorila in oddaljene posodobitve.': 'Prijava, mjerenja, grafovi, upozorenja i udaljena ažuriranja.',
    'PRVA NASTAVITEV': 'PRVO POSTAVLJANJE', 'Poveži novo napravo': 'Poveži novi uređaj', 'Aplikacija poišče dostopno točko <strong>Cebelnjak-…</strong> in te vodi do povezave z domačim omrežjem.': 'Aplikacija pronalazi pristupnu točku <strong>Cebelnjak-…</strong> i vodi te do povezivanja s kućnom mrežom.', 'Začni nastavitev': 'Započni postavljanje',
    'Nazaj': 'Natrag', 'NASTAVITEV NAPRAVE': 'POSTAVLJANJE UREĐAJA', 'Povezava z Wi‑Fi': 'Povezivanje s Wi‑Fi mrežom', 'Vklopi napravo in počakaj, da se prikaže omrežje z imenom <strong>Cebelnjak-…</strong>.': 'Uključi uređaj i pričekaj da se pojavi mreža naziva <strong>Cebelnjak-…</strong>.',
    '1. KORAK': '1. KORAK', 'Poveži se z napravo': 'Poveži se s uređajem', 'Android bo prikazal sistemsko okno. Izberi omrežje, ki se začne z <strong>Cebelnjak-</strong>, in potrdi povezavo.': 'Android će prikazati sistemski prozor. Odaberi mrežu koja počinje s <strong>Cebelnjak-</strong> i potvrdi povezivanje.', '<strong>Namig:</strong> če omrežja ni na seznamu, napravo ponovno zaženi in poskusi znova.': '<strong>Savjet:</strong> ako mreže nema na popisu, ponovno pokreni uređaj i pokušaj ponovno.', '<strong>Pred povezovanjem:</strong> vklopi Wi‑Fi. Če uporabljaš VPN, ga začasno izklopi, ker lahko prepreči povezavo z lokalno napravo.': '<strong>Prije povezivanja:</strong> uključi Wi‑Fi. Ako koristiš VPN, privremeno ga isključi jer može spriječiti vezu s lokalnim uređajem.', 'Odpri nastavitve Wi‑Fi': 'Otvori postavke Wi‑Fi mreže', 'Poišči napravo': 'Pronađi uređaj',
    '2. KORAK': '2. KORAK', 'Izberi domače omrežje': 'Odaberi kućnu mrežu', 'Naprava povezana': 'Uređaj povezan', 'Omrežja poišče naprava sama. Wi‑Fi geslo se pošlje neposredno napravi in se ne shrani v aplikaciji.': 'Uređaj sam pronalazi mreže. Wi‑Fi lozinka šalje se izravno uređaju i ne sprema se u aplikaciji.', 'Wi‑Fi omrežje': 'Wi‑Fi mreža', 'Najprej poišči omrežja': 'Najprije potraži mreže', 'Ponovno poišči omrežja': 'Ponovno potraži mreže', 'Wi‑Fi geslo': 'Wi‑Fi lozinka', 'Vnesi geslo omrežja': 'Unesi lozinku mreže', 'Prikaži geslo': 'Prikaži lozinku', 'Skrij geslo': 'Sakrij lozinku', 'Shrani in poveži': 'Spremi i poveži',
    'POVEZAVA JE USPELA': 'POVEZIVANJE JE USPJELO', 'Naprava je pripravljena': 'Uređaj je spreman', 'Naprava je povezana z domačim omrežjem.': 'Uređaj je povezan s kućnom mrežom.', 'Omrežje': 'Mreža', 'Lokalni IP': 'Lokalni IP', 'ID naprave': 'ID uređaja', 'Aktivacijska koda': 'Aktivacijski kod', 'Nadaljuj v nadzorno ploščo': 'Nastavi na nadzornu ploču', 'Nazaj na začetek': 'Natrag na početak', 'Nadzorna plošča': 'Nadzorna ploča', 'Lokalni način – brez interneta': 'Lokalni način – bez interneta', 'Nazaj': 'Natrag', 'Odpiram nadzorno ploščo …': 'Otvaram nadzornu ploču …', 'Pametni čebelnjak – nadzorna plošča': 'Pametna košnica – nadzorna ploča', 'Meni': 'Izbornik', 'Jezik': 'Jezik', 'Različica aplikacije 0.1.0-rc.67': 'Verzija aplikacije 0.1.0-rc.67',
    'Google prijava ni vrnila veljavnega identifikacijskega žetona.': 'Google prijava nije vratila valjani identifikacijski token.', 'Nepodprta nativna prijavna operacija.': 'Nepodržana nativna operacija prijave.', 'Nativna prijava ni uspela.': 'Nativna prijava nije uspjela.', 'Iščem Wi-Fi omrežja': 'Tražim Wi‑Fi mreže', 'Povezovanje z napravo je na voljo v nameščeni Android aplikaciji.': 'Povezivanje s uređajem dostupno je u instaliranoj Android aplikaciji.', 'Čakam na izbiro …': 'Čekam odabir …', 'V Androidovem oknu izberi omrežje Cebelnjak-…': 'U Android prozoru odaberi mrežu Cebelnjak-…', 'Povezava z napravo je vzpostavljena. Iščem domača omrežja …': 'Veza s uređajem je uspostavljena. Tražim kućne mreže …', 'Povezave z napravo ni bilo mogoče vzpostaviti.': 'Nije bilo moguće uspostaviti vezu s uređajem.', 'Dostopna točka naprave ni bila izbrana ali ni dosegljiva.': 'Pristupna točka uređaja nije odabrana ili nije dostupna.', 'Aplikacija ni povezana z dostopno točko naprave.': 'Aplikacija nije povezana s pristupnom točkom uređaja.', 'Naprava se prek lokalne povezave ni odzvala.': 'Uređaj nije odgovorio putem lokalne veze.', 'Android ni mogel odpreti nastavitev Wi-Fi omrežja.': 'Android nije mogao otvoriti postavke Wi‑Fi mreže.', 'Lokalne nadzorne plošče ni bilo mogoče odpreti.': 'Lokalnu nadzornu ploču nije bilo moguće otvoriti.', 'Naprava se ni odzvala.': 'Uređaj nije odgovorio.', 'Izberi omrežje': 'Odaberi mrežu', 'zaščiteno': 'zaštićeno', 'Naprava išče razpoložljiva Wi‑Fi omrežja …': 'Uređaj traži dostupne Wi‑Fi mreže …', 'Seznama omrežij ni bilo mogoče prebrati.': 'Popis mreža nije bilo moguće učitati.', 'Izberi domače omrežje in vnesi geslo.': 'Odaberi kućnu mrežu i unesi lozinku.', 'Naprava ni našla nobenega omrežja. Poskusi znova.': 'Uređaj nije pronašao nijednu mrežu. Pokušaj ponovno.', 'Iskanje omrežij ni uspelo.': 'Pretraživanje mreža nije uspjelo.', 'Povezujem …': 'Povezujem …', 'Shrani in poveži': 'Spremi i poveži', 'Naprava se povezuje z omrežjem {ssid}. To lahko traja do 30 sekund …': 'Uređaj se povezuje s mrežom {ssid}. To može potrajati do 30 sekundi …', 'Naprava ni sprejela nastavitev.': 'Uređaj nije prihvatio postavke.', 'Povezovanje z domačim omrežjem ni uspelo.': 'Povezivanje s kućnom mrežom nije uspjelo.', 'Povezava z domačim omrežjem ni uspela. Preveri geslo.': 'Povezivanje s kućnom mrežom nije uspjelo. Provjeri lozinku.', 'Naprava v predvidenem času ni dobila povezave. Preveri omrežje in poskusi znova.': 'Uređaj nije dobio vezu u predviđenom vremenu. Provjeri mrežu i pokušaj ponovno.', 'Povezovanje ni uspelo.': 'Povezivanje nije uspjelo.', 'Naprava je povezana z omrežjem {ssid}. Nadaljuj v nadzorno ploščo in registriraj panj.': 'Uređaj je povezan s mrežom {ssid}. Nastavi na nadzornu ploču i registriraj košnicu.',
    'Odpri lokalno nadzorno ploščo': 'Otvori lokalnu nadzornu ploču',
  },
  en: {
    'Pametni čebelnjak': 'Smart Beehive', 'Mobilna aplikacija': 'Mobile app', 'Izberi jezik': 'Select language', 'Tema': 'Theme', 'Izberi temo': 'Select theme', 'Gozd': 'Forest', 'Polnoč': 'Midnight', 'Med': 'Honey', 'Svetla tema': 'Light theme',
    'DOBRODOŠLI': 'WELCOME', 'Tvoj panj.<br />Vedno blizu.': 'Your hive.<br />Always close.', 'Spremljaj meritve v oblaku ali v nekaj korakih poveži novo napravo z domačim Wi‑Fi omrežjem.': 'Monitor measurements in the cloud or connect a new device to your home Wi‑Fi in a few steps.',
    'NADZOR': 'DASHBOARD', 'Odpri nadzorno ploščo': 'Open dashboard', 'Prijava, meritve, grafi, opozorila in oddaljene posodobitve.': 'Sign in, measurements, charts, alerts, and remote updates.',
    'PRVA NASTAVITEV': 'FIRST SETUP', 'Poveži novo napravo': 'Connect a new device', 'Aplikacija poišče dostopno točko <strong>Cebelnjak-…</strong> in te vodi do povezave z domačim omrežjem.': 'The app finds the <strong>Cebelnjak-…</strong> access point and guides you through connecting to your home network.', 'Začni nastavitev': 'Start setup',
    'Nazaj': 'Back', 'NASTAVITEV NAPRAVE': 'DEVICE SETUP', 'Povezava z Wi‑Fi': 'Wi‑Fi connection', 'Vklopi napravo in počakaj, da se prikaže omrežje z imenom <strong>Cebelnjak-…</strong>.': 'Turn on the device and wait for the network named <strong>Cebelnjak-…</strong> to appear.',
    '1. KORAK': 'STEP 1', 'Poveži se z napravo': 'Connect to the device', 'Android bo prikazal sistemsko okno. Izberi omrežje, ki se začne z <strong>Cebelnjak-</strong>, in potrdi povezavo.': 'Android will show a system dialog. Select the network beginning with <strong>Cebelnjak-</strong> and confirm the connection.', '<strong>Namig:</strong> če omrežja ni na seznamu, napravo ponovno zaženi in poskusi znova.': '<strong>Tip:</strong> if the network is not listed, restart the device and try again.', '<strong>Pred povezovanjem:</strong> vklopi Wi‑Fi. Če uporabljaš VPN, ga začasno izklopi, ker lahko prepreči povezavo z lokalno napravo.': '<strong>Before connecting:</strong> turn on Wi‑Fi. If you use a VPN, temporarily turn it off because it can prevent a connection to the local device.', 'Odpri nastavitve Wi‑Fi': 'Open Wi‑Fi settings', 'Poišči napravo': 'Find device',
    '2. KORAK': 'STEP 2', 'Izberi domače omrežje': 'Select your home network', 'Naprava povezana': 'Device connected', 'Omrežja poišče naprava sama. Wi‑Fi geslo se pošlje neposredno napravi in se ne shrani v aplikaciji.': 'The device finds networks itself. The Wi‑Fi password is sent directly to the device and is not stored in the app.', 'Wi‑Fi omrežje': 'Wi‑Fi network', 'Najprej poišči omrežja': 'Search for networks first', 'Ponovno poišči omrežja': 'Search networks again', 'Wi‑Fi geslo': 'Wi‑Fi password', 'Vnesi geslo omrežja': 'Enter the network password', 'Prikaži geslo': 'Show password', 'Skrij geslo': 'Hide password', 'Shrani in poveži': 'Save and connect',
    'POVEZAVA JE USPELA': 'CONNECTION SUCCESSFUL', 'Naprava je pripravljena': 'Device is ready', 'Naprava je povezana z domačim omrežjem.': 'The device is connected to your home network.', 'Omrežje': 'Network', 'Lokalni IP': 'Local IP', 'ID naprave': 'Device ID', 'Aktivacijska koda': 'Activation code', 'Nadaljuj v nadzorno ploščo': 'Continue to dashboard', 'Nazaj na začetek': 'Back to start', 'Nadzorna plošča': 'Dashboard', 'Lokalni način – brez interneta': 'Local mode – no internet', 'Nazaj': 'Back', 'Odpiram nadzorno ploščo …': 'Opening dashboard …', 'Pametni čebelnjak – nadzorna plošča': 'Smart Beehive – dashboard', 'Meni': 'Menu', 'Jezik': 'Language', 'Različica aplikacije 0.1.0-rc.67': 'App version 0.1.0-rc.67',
    'Google prijava ni vrnila veljavnega identifikacijskega žetona.': 'Google sign-in did not return a valid ID token.', 'Nepodprta nativna prijavna operacija.': 'Unsupported native sign-in operation.', 'Nativna prijava ni uspela.': 'Native sign-in failed.', 'Iščem Wi-Fi omrežja': 'Searching Wi‑Fi networks', 'Povezovanje z napravo je na voljo v nameščeni Android aplikaciji.': 'Device connection is available in the installed Android app.', 'Čakam na izbiro …': 'Waiting for selection …', 'V Androidovem oknu izberi omrežje Cebelnjak-…': 'In the Android dialog, select the Cebelnjak-… network.', 'Povezava z napravo je vzpostavljena. Iščem domača omrežja …': 'Connected to the device. Searching home networks …', 'Povezave z napravo ni bilo mogoče vzpostaviti.': 'Could not connect to the device.', 'Dostopna točka naprave ni bila izbrana ali ni dosegljiva.': 'The device access point was not selected or is unavailable.', 'Aplikacija ni povezana z dostopno točko naprave.': 'The app is not connected to the device access point.', 'Naprava se prek lokalne povezave ni odzvala.': 'The device did not respond over the local connection.', 'Android ni mogel odpreti nastavitev Wi-Fi omrežja.': 'Android could not open Wi‑Fi settings.', 'Lokalne nadzorne plošče ni bilo mogoče odpreti.': 'The local dashboard could not be opened.', 'Naprava se ni odzvala.': 'The device did not respond.', 'Izberi omrežje': 'Select a network', 'zaščiteno': 'secured', 'Naprava išče razpoložljiva Wi‑Fi omrežja …': 'The device is searching for available Wi‑Fi networks …', 'Seznama omrežij ni bilo mogoče prebrati.': 'Could not read the network list.', 'Izberi domače omrežje in vnesi geslo.': 'Select your home network and enter the password.', 'Naprava ni našla nobenega omrežja. Poskusi znova.': 'The device found no networks. Try again.', 'Iskanje omrežij ni uspelo.': 'Network search failed.', 'Povezujem …': 'Connecting …', 'Naprava se povezuje z omrežjem {ssid}. To lahko traja do 30 sekund …': 'The device is connecting to {ssid}. This may take up to 30 seconds …', 'Naprava ni sprejela nastavitev.': 'The device did not accept the settings.', 'Povezovanje z domačim omrežjem ni uspelo.': 'Connection to the home network failed.', 'Povezava z domačim omrežjem ni uspela. Preveri geslo.': 'Connection to the home network failed. Check the password.', 'Naprava v predvidenem času ni dobila povezave. Preveri omrežje in poskusi znova.': 'The device did not connect in time. Check the network and try again.', 'Povezovanje ni uspelo.': 'Connection failed.', 'Naprava je povezana z omrežjem {ssid}. Nadaljuj v nadzorno ploščo in registriraj panj.': 'The device is connected to {ssid}. Continue to the dashboard and register the hive.',
    'Odpri lokalno nadzorno ploščo': 'Open local dashboard',
  },
};
let activeLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'sl';
if (!LANGUAGE_OPTIONS[activeLanguage]) activeLanguage = 'sl';

function t(source, values = {}) {
  const translated = TRANSLATIONS[activeLanguage]?.[source] || source;
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), translated);
}

function dashboardUrl() {
  const url = new URL('./dashboard/index.html?app=android', window.location.href);
  url.searchParams.set('language', activeLanguage);
  return url.href;
}

function localDashboardUrl(baseUrl) {
  const url = new URL(baseUrl);
  url.searchParams.set('mode', 'local');
  url.searchParams.set('language', activeLanguage);
  return url.href;
}

const CLOUD_URL = dashboardUrl();
const ProvisioningWifi = registerPlugin('ProvisioningWifi');
const NATIVE_AUTH_REQUEST_TYPE = 'pametni-cebelnjak-native-auth-request';
const NATIVE_AUTH_RESULT_TYPE = 'pametni-cebelnjak-native-auth-result';

const elements = {
  animatedSplash: document.querySelector('#animated-splash'),
  homeView: document.querySelector('#home-view'),
  provisioningView: document.querySelector('#provisioning-view'),
  dashboardView: document.querySelector('#dashboard-view'),
  dashboardFrame: document.querySelector('#dashboard-frame'),
  dashboardLoading: document.querySelector('#dashboard-loading'),
  appMenu: document.querySelector('.app-menu'),
  appThemeChoices: [...document.querySelectorAll('[data-app-theme-choice]')],
  openCloudButton: document.querySelector('#open-cloud-button'),
  finishCloudButton: document.querySelector('#finish-cloud-button'),
  connectStep: document.querySelector('#connect-step'),
  wifiStep: document.querySelector('#wifi-step'),
  successStep: document.querySelector('#success-step'),
  progressSteps: [...document.querySelectorAll('.progress-step')],
  status: document.querySelector('#status-message'),
  ssidSelect: document.querySelector('#ssid-select'),
  password: document.querySelector('#wifi-password'),
  configureButton: document.querySelector('#configure-button'),
  scanButton: document.querySelector('#scan-button'),
  connectButton: document.querySelector('#connect-device-button'),
  resultSsid: document.querySelector('#result-ssid'),
  resultIp: document.querySelector('#result-ip'),
  resultDeviceId: document.querySelector('#result-device-id'),
  resultActivationCode: document.querySelector('#result-activation-code'),
  successMessage: document.querySelector('#success-message'),
  languageFlags: [...document.querySelectorAll('[data-language-flag]')],
  languageButtons: [...document.querySelectorAll('[data-language]')],
  languageSwitcher: document.querySelector('.language-switcher'),
};

let currentStep = 1;
let scanTimer = null;
let connectionTimer = null;
let splashDismissTimer = null;
let dashboardReady = false;
let dashboardMode = 'cloud';
let localDashboardBaseUrl = '';

function scheduleAnimatedSplashDismiss() {
  if (!elements.animatedSplash) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  splashDismissTimer = window.setTimeout(() => {
    elements.animatedSplash.classList.add('is-leaving');
    splashDismissTimer = window.setTimeout(() => elements.animatedSplash?.remove(), 320);
  }, reducedMotion ? 120 : 1750);
}

function applyAppTheme(theme, persist = true) {
  const selectedTheme = ['forest', 'midnight', 'honey', 'light'].includes(theme) ? theme : 'forest';
  document.documentElement.dataset.theme = selectedTheme;
  elements.appThemeChoices.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.appThemeChoice === selectedTheme));
  });
  if (persist) localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
}

function translateStaticContent() {
  document.documentElement.lang = activeLanguage;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((element) => {
    element.innerHTML = t(element.dataset.i18nHtml);
  });
  document.querySelectorAll('[aria-label], [placeholder], [title]').forEach((element) => {
    ['aria-label', 'placeholder', 'title'].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const source = element.dataset[`source${attribute[0].toUpperCase()}${attribute.slice(1).replace(/-([a-z])/g, (_, char) => char.toUpperCase())}`] || element.getAttribute(attribute);
      element.dataset[`source${attribute[0].toUpperCase()}${attribute.slice(1).replace(/-([a-z])/g, (_, char) => char.toUpperCase())}`] = source;
      element.setAttribute(attribute, t(source));
    });
  });
  document.title = t('Pametni čebelnjak');
  const option = LANGUAGE_OPTIONS[activeLanguage];
  elements.languageFlags.forEach((element) => { element.textContent = option.flag; });
  elements.languageButtons.forEach((button) => button.setAttribute('aria-current', String(button.dataset.language === activeLanguage)));
}

function setLanguage(language) {
  activeLanguage = LANGUAGE_OPTIONS[language] ? language : 'sl';
  localStorage.setItem(LANGUAGE_STORAGE_KEY, activeLanguage);
  translateStaticContent();
  elements.languageSwitcher.open = false;
  if (elements.dashboardFrame.getAttribute('src')) {
    elements.dashboardFrame.src = dashboardMode === 'local'
      ? localDashboardUrl(localDashboardBaseUrl)
      : dashboardUrl();
  }
}

function showView(view) {
  elements.homeView.classList.toggle('is-active', view === 'home');
  elements.provisioningView.classList.toggle('is-active', view === 'provisioning');
  elements.dashboardView.classList.toggle('is-active', view === 'dashboard');
  document.body.classList.toggle('is-dashboard-open', view === 'dashboard');
  window.scrollTo({ top: 0, behavior: view === 'dashboard' ? 'auto' : 'smooth' });
}

function showStep(step) {
  currentStep = step;
  elements.connectStep.classList.toggle('is-active', step === 1);
  elements.wifiStep.classList.toggle('is-active', step === 2);
  elements.successStep.classList.toggle('is-active', step === 3);
  elements.progressSteps.forEach((element, index) => {
    const stepNumber = index + 1;
    element.classList.toggle('is-current', stepNumber === step);
    element.classList.toggle('is-complete', stepNumber < step);
  });
  clearStatus();
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.add('is-visible');
  elements.status.classList.toggle('is-error', isError);
}

function clearStatus() {
  elements.status.textContent = '';
  elements.status.classList.remove('is-visible', 'is-error');
}

function setBusy(button, busy, busyLabel, normalLabel) {
  button.disabled = busy;
  button.textContent = busy ? busyLabel : normalLabel;
}

function translatedError(error, fallback) {
  return t(error?.message || fallback);
}

function setDashboardMode(mode) {
  dashboardMode = mode;
  const local = mode === 'local';
  document.body.classList.toggle('is-local-dashboard-open', local);
}

async function openCloud(event) {
  event?.preventDefault();
  if (dashboardMode === 'local' && Capacitor.isNativePlatform()) {
    await ProvisioningWifi.closeLocalDashboard();
  }
  setDashboardMode('cloud');
  dashboardReady = false;
  showView('dashboard');
  elements.dashboardLoading.hidden = false;
  elements.dashboardFrame.src = dashboardUrl();
}

function preloadDashboard() {
  if (elements.dashboardFrame.getAttribute('src')) {
    return;
  }

  setDashboardMode('cloud');
  elements.dashboardFrame.src = dashboardUrl() || elements.dashboardFrame.dataset.src || CLOUD_URL;
}

async function openLocalDashboard() {
  if (!Capacitor.isNativePlatform()) {
    setStatus(t('Povezovanje z napravo je na voljo v nameščeni Android aplikaciji.'), true);
    return;
  }

  try {
    const result = await ProvisioningWifi.openLocalDashboard();
    localDashboardBaseUrl = result.url;
    dashboardReady = false;
    setDashboardMode('local');
    showView('dashboard');
    elements.dashboardLoading.hidden = false;
    elements.dashboardFrame.src = localDashboardUrl(localDashboardBaseUrl);
  } catch (error) {
    setStatus(translatedError(error, 'Lokalne nadzorne plošče ni bilo mogoče odpreti.'), true);
  }
}

async function returnToAppHome() {
  if (Capacitor.isNativePlatform()) {
    if (dashboardMode === 'local') {
      try {
        await ProvisioningWifi.closeLocalDashboard();
      } catch {
        // Lokalna povezava je lahko že prekinjena.
      }
    }
  }
  localDashboardBaseUrl = '';
  dashboardReady = false;
  elements.dashboardFrame.removeAttribute('src');
  setDashboardMode('cloud');
  showView('home');
}

async function openWifiSettings() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await ProvisioningWifi.openWifiSettings();
  } catch (error) {
    setStatus(translatedError(error, 'Android ni mogel odpreti nastavitev Wi-Fi omrežja.'), true);
  }
}

async function executeNativeAuthentication(action) {
  if (action === 'google-sign-in') {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const payload = {
      idToken: result?.credential?.idToken || '',
      accessToken: result?.credential?.accessToken || '',
    };
    if (!payload.idToken) {
      throw new Error(t('Google prijava ni vrnila veljavnega identifikacijskega žetona.'));
    }
    return payload;
  }

  if (action === 'sign-out') {
    await FirebaseAuthentication.signOut();
    return {};
  }

  throw new Error(t('Nepodprta nativna prijavna operacija.'));
}

window.PametniCebelnjakNativeAuth = Object.freeze({
  request: executeNativeAuthentication,
});

async function handleNativeAuthenticationRequest(event) {
  if (event.source !== elements.dashboardFrame.contentWindow) {
    return;
  }

  const request = event.data;
  if (request?.type === APP_RETURN_MESSAGE_TYPE) {
    await returnToAppHome();
    return;
  }
  if (!request || request.type !== NATIVE_AUTH_REQUEST_TYPE || !request.requestId) {
    return;
  }

  try {
    const payload = await executeNativeAuthentication(request.action);
    event.source.postMessage({
      type: NATIVE_AUTH_RESULT_TYPE,
      requestId: request.requestId,
      ok: true,
      payload,
    }, '*');
  } catch (error) {
    event.source.postMessage({
      type: NATIVE_AUTH_RESULT_TYPE,
      requestId: request.requestId,
      ok: false,
      error: {
        code: error?.code || 'native-auth-failed',
        message: error?.message || t('Nativna prijava ni uspela.'),
      },
    }, '*');
  }
}

function setScanBusy(busy) {
  elements.scanButton.disabled = busy;
  elements.scanButton.classList.toggle('is-loading', busy);
  elements.scanButton.setAttribute('aria-label', busy ? t('Iščem Wi-Fi omrežja') : t('Ponovno poišči omrežja'));
}

async function connectToDevice() {
  if (!Capacitor.isNativePlatform()) {
    setStatus(t('Povezovanje z napravo je na voljo v nameščeni Android aplikaciji.'), true);
    return;
  }

  setBusy(elements.connectButton, true, t('Čakam na izbiro …'), t('Poišči napravo'));
  setStatus(t('V Androidovem oknu izberi omrežje Cebelnjak-…'));
  try {
    await ProvisioningWifi.connect();
    setStatus(t('Povezava z napravo je vzpostavljena. Iščem domača omrežja …'));
    showStep(2);
    await loadDeviceStatus();
    await scanNetworks();
  } catch (error) {
    setStatus(translatedError(error, 'Povezave z napravo ni bilo mogoče vzpostaviti.'), true);
  } finally {
    setBusy(elements.connectButton, false, t('Čakam na izbiro …'), t('Poišči napravo'));
  }
}

async function loadDeviceStatus() {
  const response = await ProvisioningWifi.getStatus();
  if (response.statusCode !== 200) throw new Error(t('Naprava se ni odzvala.'));
  return JSON.parse(response.body);
}

function renderNetworks(networks) {
  const sortedNetworks = [...networks].sort((left, right) => right.rssi - left.rssi);
  elements.ssidSelect.innerHTML = `<option value="">${t('Izberi omrežje')}</option>`;
  sortedNetworks.forEach((network) => {
    const option = document.createElement('option');
    option.value = network.ssid;
    option.textContent = `${network.ssid} · ${network.rssi} dBm${network.secured ? ` · ${t('zaščiteno')}` : ''}`;
    option.dataset.secured = String(network.secured);
    elements.ssidSelect.append(option);
  });
  elements.ssidSelect.disabled = false;
  updateConfigureButton();
}

async function scanNetworks() {
  clearTimeout(scanTimer);
  setScanBusy(true);
  setStatus(t('Naprava išče razpoložljiva Wi‑Fi omrežja …'));
  try {
    const response = await ProvisioningWifi.scanNetworks();
    const payload = JSON.parse(response.body);
    if (response.statusCode === 202 || payload.state === 'scanning') {
      scanTimer = window.setTimeout(scanNetworks, 1400);
      return;
    }
    if (response.statusCode !== 200 || !Array.isArray(payload.networks)) {
      throw new Error(t('Seznama omrežij ni bilo mogoče prebrati.'));
    }
    renderNetworks(payload.networks);
    setStatus(payload.networks.length ? t('Izberi domače omrežje in vnesi geslo.') : t('Naprava ni našla nobenega omrežja. Poskusi znova.'));
  } catch (error) {
    setStatus(translatedError(error, 'Iskanje omrežij ni uspelo.'), true);
  } finally {
    setScanBusy(false);
  }
}

function updateConfigureButton() {
  const selectedOption = elements.ssidSelect.selectedOptions[0];
  if (!selectedOption?.value) {
    elements.configureButton.disabled = true;
    return;
  }
  const secured = selectedOption.dataset.secured === 'true';
  elements.configureButton.disabled = secured && elements.password.value.length < 8;
}

async function configureWifi() {
  const ssid = elements.ssidSelect.value;
  const password = elements.password.value;
  if (!ssid) return;

  setBusy(elements.configureButton, true, t('Povezujem …'), t('Shrani in poveži'));
  setStatus(t('Naprava se povezuje z omrežjem {ssid}. To lahko traja do 30 sekund …', { ssid }));
  try {
    const response = await ProvisioningWifi.configure({ ssid, password });
    if (response.statusCode !== 202) {
      const payload = JSON.parse(response.body || '{}');
      throw new Error(payload.error || t('Naprava ni sprejela nastavitev.'));
    }
    pollConnectionResult(ssid, Date.now() + 35_000);
  } catch (error) {
    setBusy(elements.configureButton, false, t('Povezujem …'), t('Shrani in poveži'));
    setStatus(translatedError(error, 'Povezovanje z domačim omrežjem ni uspelo.'), true);
  }
}

async function pollConnectionResult(expectedSsid, deadline) {
  clearTimeout(connectionTimer);
  try {
    const status = await loadDeviceStatus();
    const network = status.network || {};
    if (network.station_connected && network.station_ssid === expectedSsid && network.station_ip) {
      showSuccess(status);
      return;
    }

    if (network.connection_state === 'failed') {
      throw new Error(network.connection_message || t('Povezava z domačim omrežjem ni uspela. Preveri geslo.'));
    }

    if (Date.now() >= deadline) {
      throw new Error(t('Naprava v predvidenem času ni dobila povezave. Preveri omrežje in poskusi znova.'));
    }
    connectionTimer = window.setTimeout(() => pollConnectionResult(expectedSsid, deadline), 1200);
  } catch (error) {
    if (Date.now() < deadline && /odzvala|network|Failed to fetch/i.test(error?.message || '')) {
      connectionTimer = window.setTimeout(() => pollConnectionResult(expectedSsid, deadline), 1200);
      return;
    }
    setBusy(elements.configureButton, false, t('Povezujem …'), t('Shrani in poveži'));
    setStatus(translatedError(error, 'Povezovanje ni uspelo.'), true);
  }
}

async function showSuccess(status) {
  const network = status.network || {};
  elements.resultSsid.textContent = network.station_ssid || '—';
  elements.resultIp.textContent = network.station_ip || '—';
  elements.resultDeviceId.textContent = status.device?.device_id || '—';
  elements.resultActivationCode.textContent = network.activation_code || '—';
  elements.successMessage.textContent = t('Naprava je povezana z omrežjem {ssid}. Nadaljuj v nadzorno ploščo in registriraj panj.', { ssid: network.station_ssid });
  elements.password.value = '';
  await ProvisioningWifi.disconnect();
  showStep(3);
}

async function resetProvisioning() {
  clearTimeout(scanTimer);
  clearTimeout(connectionTimer);
  if (Capacitor.isNativePlatform()) {
    try {
      await ProvisioningWifi.disconnect();
    } catch {
      // Povezava je lahko že zaprta po uspešnem provisioningu.
    }
  }
  elements.ssidSelect.innerHTML = `<option value="">${t('Najprej poišči omrežja')}</option>`;
  elements.ssidSelect.disabled = true;
  elements.password.value = '';
  showStep(1);
  showView('home');
}

elements.openCloudButton.addEventListener('click', openCloud);
elements.finishCloudButton.addEventListener('click', openCloud);
elements.appThemeChoices.forEach((button) => button.addEventListener('click', () => {
  applyAppTheme(button.dataset.appThemeChoice);
  elements.appMenu.open = false;
}));
elements.languageButtons.forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.language)));
elements.dashboardFrame.addEventListener('load', () => {
  dashboardReady = true;
  elements.dashboardLoading.hidden = true;
});
window.addEventListener('message', handleNativeAuthenticationRequest);
document.querySelector('#start-provisioning-button').addEventListener('click', () => {
  showView('provisioning');
  showStep(1);
});
document.querySelector('#back-button').addEventListener('click', resetProvisioning);
document.querySelector('#finish-home-button').addEventListener('click', resetProvisioning);
elements.connectButton.addEventListener('click', connectToDevice);
document.querySelector('#open-wifi-settings-button').addEventListener('click', openWifiSettings);
document.querySelector('#open-local-dashboard-button').addEventListener('click', openLocalDashboard);
elements.scanButton.addEventListener('click', scanNetworks);
elements.ssidSelect.addEventListener('change', updateConfigureButton);
elements.password.addEventListener('input', updateConfigureButton);
elements.configureButton.addEventListener('click', configureWifi);
document.querySelector('#toggle-password-button').addEventListener('click', (event) => {
  const showPassword = elements.password.type === 'password';
  elements.password.type = showPassword ? 'text' : 'password';
  event.currentTarget.setAttribute('aria-label', showPassword ? t('Skrij geslo') : t('Prikaži geslo'));
  event.currentTarget.setAttribute('aria-pressed', String(showPassword));
});

window.addEventListener('beforeunload', () => {
  clearTimeout(scanTimer);
  clearTimeout(connectionTimer);
  clearTimeout(splashDismissTimer);
});

scheduleAnimatedSplashDismiss();
translateStaticContent();
applyAppTheme(localStorage.getItem(THEME_STORAGE_KEY), false);
preloadDashboard();
