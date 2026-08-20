import { Capacitor, registerPlugin } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const CLOUD_URL = new URL('./dashboard/index.html?app=android', window.location.href).href;
const ProvisioningWifi = registerPlugin('ProvisioningWifi');
const NATIVE_AUTH_REQUEST_TYPE = 'pametni-cebelnjak-native-auth-request';
const NATIVE_AUTH_RESULT_TYPE = 'pametni-cebelnjak-native-auth-result';

const elements = {
  homeView: document.querySelector('#home-view'),
  provisioningView: document.querySelector('#provisioning-view'),
  dashboardView: document.querySelector('#dashboard-view'),
  dashboardFrame: document.querySelector('#dashboard-frame'),
  dashboardLoading: document.querySelector('#dashboard-loading'),
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
  successMessage: document.querySelector('#success-message'),
};

let currentStep = 1;
let scanTimer = null;
let connectionTimer = null;
let dashboardReady = false;

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

function openCloud(event) {
  event?.preventDefault();
  showView('dashboard');
  elements.dashboardLoading.hidden = dashboardReady;
  preloadDashboard();
}

function preloadDashboard() {
  if (elements.dashboardFrame.getAttribute('src')) {
    return;
  }

  elements.dashboardFrame.src = elements.dashboardFrame.dataset.src || CLOUD_URL;
}

async function executeNativeAuthentication(action) {
  if (action === 'google-sign-in') {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const payload = {
      idToken: result?.credential?.idToken || '',
      accessToken: result?.credential?.accessToken || '',
    };
    if (!payload.idToken) {
      throw new Error('Google prijava ni vrnila veljavnega identifikacijskega žetona.');
    }
    return payload;
  }

  if (action === 'sign-out') {
    await FirebaseAuthentication.signOut();
    return {};
  }

  throw new Error('Nepodprta nativna prijavna operacija.');
}

window.PametniCebelnjakNativeAuth = Object.freeze({
  request: executeNativeAuthentication,
});

async function handleNativeAuthenticationRequest(event) {
  if (event.source !== elements.dashboardFrame.contentWindow) {
    return;
  }

  const request = event.data;
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
        message: error?.message || 'Nativna prijava ni uspela.',
      },
    }, '*');
  }
}

function setScanBusy(busy) {
  elements.scanButton.disabled = busy;
  elements.scanButton.classList.toggle('is-loading', busy);
  elements.scanButton.setAttribute('aria-label', busy ? 'Iščem Wi-Fi omrežja' : 'Ponovno poišči omrežja');
}

async function connectToDevice() {
  if (!Capacitor.isNativePlatform()) {
    setStatus('Povezovanje z napravo je na voljo v nameščeni Android aplikaciji.', true);
    return;
  }

  setBusy(elements.connectButton, true, 'Čakam na izbiro …', 'Poišči napravo');
  setStatus('V Androidovem oknu izberi omrežje Cebelnjak-…');
  try {
    await ProvisioningWifi.connect();
    setStatus('Povezava z napravo je vzpostavljena. Iščem domača omrežja …');
    showStep(2);
    await loadDeviceStatus();
    await scanNetworks();
  } catch (error) {
    setStatus(error?.message || 'Povezave z napravo ni bilo mogoče vzpostaviti.', true);
  } finally {
    setBusy(elements.connectButton, false, 'Čakam na izbiro …', 'Poišči napravo');
  }
}

async function loadDeviceStatus() {
  const response = await ProvisioningWifi.getStatus();
  if (response.statusCode !== 200) throw new Error('Naprava se ni odzvala.');
  return JSON.parse(response.body);
}

function renderNetworks(networks) {
  const sortedNetworks = [...networks].sort((left, right) => right.rssi - left.rssi);
  elements.ssidSelect.innerHTML = '<option value="">Izberi omrežje</option>';
  sortedNetworks.forEach((network) => {
    const option = document.createElement('option');
    option.value = network.ssid;
    option.textContent = `${network.ssid} · ${network.rssi} dBm${network.secured ? ' · zaščiteno' : ''}`;
    option.dataset.secured = String(network.secured);
    elements.ssidSelect.append(option);
  });
  elements.ssidSelect.disabled = false;
  updateConfigureButton();
}

async function scanNetworks() {
  clearTimeout(scanTimer);
  setScanBusy(true);
  setStatus('Naprava išče razpoložljiva Wi‑Fi omrežja …');
  try {
    const response = await ProvisioningWifi.scanNetworks();
    const payload = JSON.parse(response.body);
    if (response.statusCode === 202 || payload.state === 'scanning') {
      scanTimer = window.setTimeout(scanNetworks, 1400);
      return;
    }
    if (response.statusCode !== 200 || !Array.isArray(payload.networks)) {
      throw new Error('Seznama omrežij ni bilo mogoče prebrati.');
    }
    renderNetworks(payload.networks);
    setStatus(payload.networks.length ? 'Izberi domače omrežje in vnesi geslo.' : 'Naprava ni našla nobenega omrežja. Poskusi znova.');
  } catch (error) {
    setStatus(error?.message || 'Iskanje omrežij ni uspelo.', true);
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

  setBusy(elements.configureButton, true, 'Povezujem …', 'Shrani in poveži');
  setStatus(`Naprava se povezuje z omrežjem ${ssid}. To lahko traja do 30 sekund …`);
  try {
    const response = await ProvisioningWifi.configure({ ssid, password });
    if (response.statusCode !== 202) {
      const payload = JSON.parse(response.body || '{}');
      throw new Error(payload.error || 'Naprava ni sprejela nastavitev.');
    }
    pollConnectionResult(ssid, Date.now() + 35_000);
  } catch (error) {
    setBusy(elements.configureButton, false, 'Povezujem …', 'Shrani in poveži');
    setStatus(error?.message || 'Povezovanje z domačim omrežjem ni uspelo.', true);
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
      throw new Error(network.connection_message || 'Povezava z domačim omrežjem ni uspela. Preveri geslo.');
    }

    if (Date.now() >= deadline) {
      throw new Error('Naprava v predvidenem času ni dobila povezave. Preveri omrežje in poskusi znova.');
    }
    connectionTimer = window.setTimeout(() => pollConnectionResult(expectedSsid, deadline), 1200);
  } catch (error) {
    if (Date.now() < deadline && /odzvala|network|Failed to fetch/i.test(error?.message || '')) {
      connectionTimer = window.setTimeout(() => pollConnectionResult(expectedSsid, deadline), 1200);
      return;
    }
    setBusy(elements.configureButton, false, 'Povezujem …', 'Shrani in poveži');
    setStatus(error?.message || 'Povezovanje ni uspelo.', true);
  }
}

async function showSuccess(status) {
  const network = status.network || {};
  elements.resultSsid.textContent = network.station_ssid || '—';
  elements.resultIp.textContent = network.station_ip || '—';
  elements.resultDeviceId.textContent = status.device?.device_id || '—';
  elements.successMessage.textContent = `Naprava je povezana z omrežjem ${network.station_ssid}. Nadaljuj v nadzorno ploščo in registriraj panj.`;
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
  elements.ssidSelect.innerHTML = '<option value="">Najprej poišči omrežja</option>';
  elements.ssidSelect.disabled = true;
  elements.password.value = '';
  showStep(1);
  showView('home');
}

elements.openCloudButton.addEventListener('click', openCloud);
elements.finishCloudButton.addEventListener('click', openCloud);
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
elements.scanButton.addEventListener('click', scanNetworks);
elements.ssidSelect.addEventListener('change', updateConfigureButton);
elements.password.addEventListener('input', updateConfigureButton);
elements.configureButton.addEventListener('click', configureWifi);
document.querySelector('#toggle-password-button').addEventListener('click', (event) => {
  const showPassword = elements.password.type === 'password';
  elements.password.type = showPassword ? 'text' : 'password';
  event.currentTarget.setAttribute('aria-label', showPassword ? 'Skrij geslo' : 'Prikaži geslo');
  event.currentTarget.setAttribute('aria-pressed', String(showPassword));
});

window.addEventListener('beforeunload', () => {
  clearTimeout(scanTimer);
  clearTimeout(connectionTimer);
});

preloadDashboard();
