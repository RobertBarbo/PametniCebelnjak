const DEVICE_ONLINE_TIMEOUT_SECONDS = 90;
const LOAD_CELL_TARE_TIMEOUT_SECONDS = 90;
const BME680_CALIBRATION_TIMEOUT_SECONDS = 90;
const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/RobertBarbo/PametniCebelnjak/releases/latest";
const CLOUD_DASHBOARD_URL = "https://pametnicebelnjak.web.app/";
const OTA_IGNORE_STORAGE_KEY = "pametni-cebelnjak-ignored-ota-version";
const CLOUD_DEVICE_QUERY_PARAMETER = "device";
const CLOUD_DEVICE_STORAGE_KEY = "pametni-cebelnjak-cloud-device-id";
// Cloud seja po 30 minutah brez aktivnosti ustavi RTDB poslušalce, vendar uporabnika še ne odjavi.
const CLOUD_INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
// Po opozorilu ima uporabnik še pet minut za izrecno nadaljevanje seje.
const CLOUD_LOGOUT_WARNING_MS = 5 * 60 * 1000;
const CLOUD_INACTIVITY_STORAGE_KEY = "pametni-cebelnjak-cloud-last-activity";
const CLOUD_INACTIVITY_CHANNEL_NAME = "pametni-cebelnjak-cloud-session";
const THEME_STORAGE_KEY = "pametni-cebelnjak-theme";
const LANGUAGE_STORAGE_KEY = "pametni-cebelnjak-language";
const DEFAULT_VIEW = "overview";
const SUPER_ADMIN_UID = "Uv2bGWlFt8h9YTsAFoxsNlNsRK72";
const SHARE_INVITATION_VALIDITY_MS = 24 * 60 * 60 * 1000;
const SHARE_INVITATION_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CHART_AXIS_HOUR_SECONDS = 60 * 60;
const CHART_AXIS_DAY_SECONDS = 24 * CHART_AXIS_HOUR_SECONDS;
const CHART_AXIS_MONTH_SECONDS = 31 * CHART_AXIS_DAY_SECONDS;
const CHART_AXIS_THREE_MONTHS_SECONDS = 92 * CHART_AXIS_DAY_SECONDS;
const CHART_AXIS_SIX_MONTHS_SECONDS = 183 * CHART_AXIS_DAY_SECONDS;
const OVERVIEW_ANALYTICS_WINDOW_SECONDS = CHART_AXIS_DAY_SECONDS;
const OVERVIEW_SPARKLINE_BUCKET_SECONDS = CHART_AXIS_HOUR_SECONDS;
const NATIVE_AUTH_REQUEST_TYPE = "pametni-cebelnjak-native-auth-request";
const NATIVE_AUTH_RESULT_TYPE = "pametni-cebelnjak-native-auth-result";
const NATIVE_AUTH_REQUEST_TIMEOUT_MS = 90_000;
const ANDROID_DASHBOARD_FRAME_NAME = "pametni-cebelnjak-dashboard";
const APP_RETURN_MESSAGE_TYPE = "pametni-cebelnjak-return-to-app";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPENSTREETMAP_REVERSE_GEOCODING_URL = "https://nominatim.openstreetmap.org/reverse";
const WEATHER_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
// Živa relativna obdobja pomaknejo konec grafa brez osveževanja celotne strani.
const LIVE_HISTORY_REFRESH_INTERVAL_MS = 60 * 1000;
// RAW meritve so običajno nespremenljive; petminutni rep vseeno varno pokrije
// zakasnjen zapis oziroma ponoven priklop brskalnika brez poslušanja celih 24 ur.
const LIVE_HISTORY_RAW_TAIL_OVERLAP_SECONDS = 5 * 60;
const LIVE_HISTORY_PRESETS = new Set(["today", "week", "month", "year", "hour", "hours12", "hours24", "days7", "days30"]);
// Nočno okno traja dve uri. Dvanajst enakomerno razporejenih vzorcev z največ
// polurnimi vrzelmi dovolj zanesljivo izloči nepopolne noči tudi pri redkejšem SD zapisu.
const MIN_NIGHT_REFERENCE_WEIGHT_SAMPLES = 12;
const MAX_NIGHT_REFERENCE_WEIGHT_GAP_SECONDS = 30 * 60;
// Največja povprečna dnevna sprememba mase, ki jo uporabniški vmesnik označi kot stabilno.
const WEIGHT_CHANGE_STABLE_THRESHOLD_KG = 0.20;
// Namenski koraki preprečijo podvojene oznake, ko uPlot vmesno vrednost zaokroži na prikazne decimalke.
const WEIGHT_AXIS_INCREMENTS = Object.freeze([0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50]);
const CHART_AXIS_FORMATTERS = new Map();
const isEmbeddedDashboard = window.parent !== window;
const dashboardQueryParameters = new URLSearchParams(window.location.search);
const isAndroidLocalDashboard = dashboardQueryParameters.get("mode") === "local";
const isAndroidAppDashboard =
  !isAndroidLocalDashboard
  && (
    dashboardQueryParameters.get("app") === "android"
    || window.name === ANDROID_DASHBOARD_FRAME_NAME
    || isEmbeddedDashboard
  );
const UI_TEXT = {
  sl: { resetZoom: "Ponastavi zoom" },
  hr: { resetZoom: "Poništi zumiranje" },
  en: { resetZoom: "Reset zoom" },
};
const LANGUAGE_OPTIONS = {
  sl: { flag: "🇸🇮", label: "Slovenščina" },
  hr: { flag: "🇭🇷", label: "Hrvatski" },
  en: { flag: "🇬🇧", label: "English" },
};
const THEME_OPTIONS = Object.freeze({
  forest: { label: "Gozd" },
  midnight: { label: "Polnoč" },
  honey: { label: "Med" },
  light: { label: "Svetla tema" },
});
const TRANSLATIONS = {
  hr: {
    "SD kartica": "SD kartica",
    "Še uporabljate Pametni čebelnjak?": "Još koristite Pametnu košnicu?",
    "Zaradi neaktivnosti boste čez {time} samodejno odjavljeni.": "Zbog neaktivnosti bit ćete automatski odjavljeni za {time}.",
    "Ostani prijavljen": "Ostani prijavljen",
    "Pametni čebelnjak": "Pametna košnica", "Nadzorna plošča": "Nadzorna ploča", "Pregled": "Pregled",
    "Grafi": "Grafovi", "Naprava": "Uređaj", "Posodobitve": "Ažuriranja", "Svetla tema": "Svijetla tema",
    "Temna tema": "Tamna tema", "Izberi temo": "Odaberi temu", "Gozd": "Šuma", "Polnoč": "Ponoć", "Med": "Med", "Odjava": "Odjava", "Prijava": "Prijava", "Panj · živ pogled": "Košnica · pregled uživo",
    "Dobrodošel v pametnem panju": "Dobro došli u pametnu košnicu", "Trenutne meritve in hiter pregled zadnjega stanja panja.": "Trenutna mjerenja i brzi pregled zadnjeg stanja košnice.",
    "Odpri grafe": "Otvori grafove", "Opozorila naprave": "Upozorenja uređaja", "Potrebno je preveriti komponento": "Potrebno je provjeriti komponentu",
    "Zadnja meritev": "Zadnje mjerenje", "Meritve": "Mjerenja", "Čakam na podatke …": "Čekam podatke …",
    "Temperatura": "Temperatura", "Relativna vlaga": "Relativna vlažnost", "min": "min.", "max": "maks.", "min {min} · max {max}": "min. {min} · maks. {max}", "Trend temperature v zadnjih 24 urah": "Trend temperature u posljednja 24 h", "Trend relativne vlage v zadnjih 24 urah": "Trend relativne vlažnosti u posljednja 24 h", "Trend mase panja v zadnjih 24 urah": "Trend mase košnice u posljednja 24 h",
    "Sprememba mase": "Promjena mase", "24 h": "24 h", "7 dni": "7 dana", "Zadnjih 24 h": "Posljednja 24 sata", "Prirast mase": "Porast mase", "Prirast": "Porast", "Padec": "Pad", "Stabilno": "Stabilno", "Izguba mase": "Gubitak mase", "v primerjavi s prejšnjo nočjo": "u usporedbi s prethodnom noći", "v primerjavi z nočjo pred 7 dnevi": "u usporedbi s noći prije 7 dana", "Primerjava temelji na nočni masi panja": "Usporedba se temelji na noćnoj masi košnice", "Ni dovolj podatkov": "Nema dovoljno podataka", "Trend spremembe mase za zadnjih 7 dni": "Trend promjene mase za posljednjih 7 dana", "Ni dovolj podatkov za zadnjih 7 dni": "Nema dovoljno podataka za posljednjih 7 dana",
    "Podrobnosti naprave": "Pojedinosti uređaja", "Različica": "Verzija", "Preveri posodobitve": "Provjeri ažuriranja",
    "Meritve in shranjevanje": "Mjerenja i pohrana", "Nastavitve vremena": "Postavke vremena", "Stanje sistema": "Stanje sustava",
    "Začetek – konec": "Početak – kraj", "Izberi časovno obdobje grafov.": "Odaberite vremensko razdoblje grafova.",
    "Klima v panju": "Klima u košnici", "Temperatura in vlaga": "Temperatura i vlažnost", "Masa panja": "Masa košnice",
    "Danes": "Danas", "Včeraj": "Jučer", "Ta teden": "Ovaj tjedan", "Ta mesec": "Ovaj mjesec", "To leto": "Ova godina",
    "Zadnja ura": "Posljednji sat", "Zadnjih 12 ur": "Posljednjih 12 sati", "Zadnjih 24 ur": "Posljednja 24 sata",
    "Zadnjih 7 dni": "Posljednjih 7 dana", "Zadnjih 30 dni": "Posljednjih 30 dana", "Uporabi": "Primijeni", "Prekliči": "Odustani",
    "Nalagam grafe in zgodovino meritev …": "Učitavam grafove i povijest mjerenja …", "Ni na voljo": "Nije dostupno",
    "Za izbrano obdobje še ni meritev.": "Za odabrano razdoblje još nema mjerenja.",
    "Prikazanih je {count} povprečnih točk. Za približanje povlecite po izbranem grafu.": "Prikazano je {count} prosječnih točaka. Za povećanje povucite po odabranom grafu.",
    "Temperatura (°C)": "Temperatura (°C)", "Vlaga (%)": "Vlažnost (%)", "Masa (kg)": "Masa (kg)",
    "Lokacija še ni nastavljena.": "Lokacija još nije postavljena.", "izbrani lokaciji": "odabranom mjestu", "Vreme v kraju {place}": "Vrijeme u mjestu {place}",
    "Jasno": "Vedro", "Delno oblačno": "Djelomično oblačno", "Oblačno": "Oblačno", "Megla": "Magla", "Pršenje": "Rominjanje", "Dež": "Kiša", "Sneg": "Snijeg", "Nevihta": "Oluja", "Spremenljivo": "Promjenjivo",
    "Za prikaz vremena najprej uporabi trenutno lokacijo ali poišči kraj.": "Za prikaz vremena najprije upotrijebi trenutačnu lokaciju ili potraži mjesto.",
    "Nastavitev velja samo za tvoj pregled deljenega panja.": "Postavka vrijedi samo za tvoj pregled dijeljene košnice.", "Lastnik za ta panj še ni nastavil kraja za vreme.": "Vlasnik još nije postavio mjesto za vrijeme ove košnice.",
    "Vremenskih podatkov za ta kraj ni mogoče pridobiti.": "Vremenske podatke za ovo mjesto nije moguće dohvatiti.", "Čakam na podatke …": "Čekam podatke …",
    "Vsi panji": "Sve košnice", "Moji panji": "Moje košnice", "Skrbniški pregled": "Administratorski pregled",
    "Skrbniški račun ima ogled vseh registriranih panjev.": "Administratorski račun ima pregled svih registriranih košnica.",
    "Izberi panj, katerega podatke želiš pregledovati.": "Odaberite košnicu čije podatke želite pregledavati.",
    "Registriraj svoj panj ali sprejmi povabilo za dostop do deljenega panja.": "Registrirajte svoju košnicu ili prihvatite poziv za pristup dijeljenoj košnici.",
    "Deljeni panj imaš na voljo samo za ogled meritev in grafov.": "Dijeljena košnica dostupna je samo za pregled mjerenja i grafova.",
    "Omrežje, identiteta, delovanje in stanje SD kartice.": "Mreža, identitet, rad i stanje SD kartice.",
    "Odstrani deljeni panj": "Ukloni dijeljenu košnicu", "Odjavi izbrani panj": "Odjavi odabranu košnicu",
    "Deljeni panj · samo ogled. Dostop lahko kadarkoli odstraniš iz svojega računa.": "Dijeljena košnica · samo pregled. Pristup možete ukloniti iz svojeg računa u bilo kojem trenutku.",
    "Naprava še ni prejela OTA ukaza.": "Uređaj još nije primio OTA naredbu.", "Noben panj ni registriran": "Nijedna košnica nije registrirana",
    "Deljeni z mano": "Podijeljeno sa mnom", " · samo ogled": " · samo pregled", "V Firebase še ni zaznan noben panj.": "U Firebaseu još nije otkrivena nijedna košnica.",
    "Izberi panj {deviceId}": "Odaberite košnicu {deviceId}", "Lastnik še ni zabeležen.": "Vlasnik još nije zabilježen.",
    "Online": "Online", "Offline": "Izvan mreže", "Zadnji odziv: {time}": "Posljednji odgovor: {time}",
    "Naprava še ni poslala stanja.": "Uređaj još nije poslao stanje.", "Odjavi lastnika": "Odjavi vlasnika", "Izbriši napravo": "Izbriši uređaj",
    "Posodobljeno: {time}": "Ažurirano: {time}", "Posodobljeno": "Ažurirano", "{value} % padavin": "{value} % oborina", "Padavine —": "Oborine —",
    "Pridobivam vreme …": "Dohvaćam vrijeme …", "Vremenski podatki trenutno niso dosegljivi.": "Vremenski podaci trenutačno nisu dostupni.",
    "Preveri dovoljene meje nastavitev.": "Provjerite dopuštene granice postavki.", "Zapis zgodovine na SD ne more biti pogostejši od meritev.": "Zapis povijesti na SD ne može biti češći od mjerenja.",
    "Shranjujem nastavitve …": "Spremam postavke …", "Nastavitve so shranjene. Naprava jih prevzame v največ 30 sekundah.": "Postavke su spremljene. Uređaj će ih preuzeti u roku od 30 sekundi.",
    "Nastavitev meritev ni bilo mogoče shraniti.": "Postavke mjerenja nije bilo moguće spremiti.", "Nastavitve vremena ni bilo mogoče shraniti.": "Postavke vremena nije bilo moguće spremiti.",
    "Shranjujem nastavitev …": "Spremam postavku …", "Vreme je prikazano na tvojem pregledu.": "Vrijeme je prikazano u vašem pregledu.", "Vreme je skrito na tvojem pregledu.": "Vrijeme je skriveno u vašem pregledu.",
    "Brskalnik ne podpira določanja lokacije.": "Preglednik ne podržava određivanje lokacije.", "Brskalnik čaka na dovoljenje za lokacijo …": "Preglednik čeka dopuštenje za lokaciju …",
    "Vnesi kraj, ki ga želiš poiskati.": "Unesite mjesto koje želite pronaći.", "Iščem kraj …": "Tražim mjesto …", "Izberi kraj za lokacijo panja.": "Odaberite mjesto za lokaciju košnice.",
    "Za vneseni kraj ni rezultatov.": "Nema rezultata za uneseno mjesto.", "Iskanje kraja trenutno ni dosegljivo.": "Pretraživanje mjesta trenutačno nije dostupno.",
    "Lokalna povezava": "Lokalna veza", "Prijava je potrebna": "Potrebna je prijava", "Izberi panj": "Odaberite košnicu", "Naprava online": "Uređaj je online", "Naprava offline": "Uređaj je izvan mreže", "Čakam na odziv naprave …": "Čekam odgovor uređaja …",
    "Čakam na preverjanje": "Čekam provjeru", "Deluje normalno": "Radi normalno", "Potrebno preverjanje": "Potrebna je provjera", "Napaka komponente": "Pogreška komponente",
    "Komponenta trenutno ni dosegljiva; preverjanje se ponavlja.": "Komponenta trenutačno nije dostupna; provjera se ponavlja.", "Komponenta še ni preverjena.": "Komponenta još nije provjerena.", "Deluje normalno.": "Radi normalno.",
    "Preveri povezavo ali napajanje.": "Provjerite vezu ili napajanje.", "RTC ura nima veljavnega časa.": "RTC sat nema valjano vrijeme.", "Dosegljiv prek lokalnega IP-ja.": "Dostupan putem lokalne IP adrese.", "Čakam na prvi odziv naprave.": "Čekam prvi odgovor uređaja.",
    "Vir časa: DS3231 RTC": "Izvor vremena: DS3231 RTC", "Vir časa: internetna NTP ura": "Izvor vremena: internetski NTP sat", "Vir časa: ročna lokalna nastavitev": "Izvor vremena: ručna lokalna postavka", "Vir časa: ročna cloud nastavitev": "Izvor vremena: ručna cloud postavka", "Veljaven čas še ni na voljo": "Valjano vrijeme još nije dostupno",
    "DS3231 ni zaznan. Ročna ali NTP ura se ob izpadu napajanja ne bo ohranila.": "DS3231 nije otkriven. Ručno ili NTP vrijeme neće se sačuvati nakon nestanka napajanja.",
    "DS3231 je zaznan, vendar nima veljavnega časa. Preveri baterijo in nastavi uro.": "DS3231 je otkriven, ali nema valjano vrijeme. Provjerite bateriju i postavite sat.",
    "DS3231 je zaznan in vsebuje veljaven čas.": "DS3231 je otkriven i sadrži valjano vrijeme.", "Čakam na internetno časovno sinhronizacijo …": "Čekam internetsku sinkronizaciju vremena …",
    "DS3231 ni pripravljen; nastavljanje in sinhronizacija časa trenutno nista mogoča.": "DS3231 nije spreman; postavljanje i sinkronizacija vremena trenutačno nisu mogući.",
    "Panj je offline; nastavljanje datuma in ure trenutno ni možno.": "Košnica je izvan mreže; postavljanje datuma i vremena trenutačno nije moguće.", "Naprava je online; datum in uro lahko nastaviš ali sinhroniziraš z internetom.": "Uređaj je online; datum i vrijeme možete postaviti ili sinkronizirati s internetom.",
    "Zaznana": "Otkrivena", "Ni zaznana": "Nije otkrivena", "Po petih poskusih ni bila zaznana.": "Nije otkrivena nakon pet pokušaja.",
    "Odpri meni": "Otvori izbornik", "Glavna navigacija": "Glavna navigacija", "Nazaj": "Natrag", "Opozorilo komponent": "Upozorenje komponenti", "Vzpostavljam povezavo …": "Uspostavljam vezu …", "Preklopi barvno temo": "Promijeni temu boja", "Izberi jezik": "Odaberite jezik",
    "Vreme": "Vrijeme", "Vreme v kraju": "Vrijeme u mjestu", "Vlaga": "Vlažnost", "Tlak": "Tlak", "Veter": "Vjetar", "Nastavljam obdobje …": "Postavljam razdoblje …", "Čakam na zgodovino meritev …": "Čekam povijest mjerenja …",
    "Pametni kontroler": "Pametni kontroler", "Moj račun": "Moj račun", "Izbrani panj": "Odabrana košnica", "Vsi registrirani panji": "Sve registrirane košnice", "Dodaj panj": "Dodaj košnicu", "Registriraj panj": "Registriraj košnicu", "Vnesi ID naprave in aktivacijsko kodo.": "Unesite ID uređaja i aktivacijski kod.",
    "Ime panja": "Naziv košnice", "ID naprave": "ID uređaja", "Aktivacijska koda": "Aktivacijski kod", "Deli panj": "Podijeli košnicu", "Dostop samo za ogled": "Pristup samo za pregled", "E-poštni naslov prejemnika": "Adresa e-pošte primatelja", "Ustvari povabilo": "Izradi poziv", "Koda povabila": "Kod poziva", "Kopiraj kodo": "Kopiraj kod", "Uporabniki z ogledom": "Korisnici s pristupom za pregled", "Panj še ni deljen.": "Košnica još nije podijeljena.",
    "Deljeno z mano": "Podijeljeno sa mnom", "Sprejmi povabilo": "Prihvati poziv", "Dodaj deljeni panj": "Dodaj dijeljenu košnicu", "Vreme na pregledu": "Vrijeme u pregledu", "Prikaži vreme": "Prikaži vrijeme", "Na pregledu prikaži trenutno vreme in napoved.": "U pregledu prikaži trenutačno vrijeme i prognozu.", "Dolžina napovedi": "Duljina prognoze", "3 dni": "3 dana", "5 dni": "5 dana", "Lokacija panja": "Lokacija košnice", "Uporabi mojo lokacijo": "Upotrijebi moju lokaciju", "Poišči kraj": "Pronađi mjesto", "Poišči": "Traži", "Vreme deljenega panja": "Vrijeme dijeljene košnice",
    "Nastavitve meritev": "Postavke mjerenja", "Prikaz mase": "Prikaz mase", "1 decimalka": "1 decimala", "2 decimalki": "2 decimale", "Interval meritev": "Interval mjerenja", "Zapis zgodovine na SD": "Zapis povijesti na SD", "Shrani nastavitve": "Spremi postavke",
    "Nastavitev omrežja": "Postavljanje mreže", "Poveži panj z Wi‑Fi": "Poveži košnicu s Wi‑Fi mrežom", "Povezan si neposredno na dostopno točko naprave.": "Povezani ste izravno s pristupnom točkom uređaja.", "Povezano Wi‑Fi omrežje": "Povezana Wi‑Fi mreža", "Ime Wi‑Fi omrežja": "Naziv Wi‑Fi mreže", "Poišči omrežja": "Pronađi mreže", "Shrani in poveži": "Spremi i poveži", "Izbriši shranjeni Wi‑Fi": "Izbriši spremljeni Wi‑Fi", "Povezava je uspela": "Povezivanje je uspjelo", "Naprava je povezana": "Uređaj je povezan", "Spletna nadzorna plošča": "Web nadzorna ploča", "Novi lokalni naslov": "Nova lokalna adresa", "Odpri nadzorno ploščo": "Otvori nadzornu ploču", "Odpri lokalno": "Otvori lokalno", "Kopiraj lokalni naslov": "Kopiraj lokalnu adresu",
    "Wi‑Fi omrežje": "Wi‑Fi mreža", "IP naslov": "IP adresa", "Wi‑Fi signal": "Wi‑Fi signal", "Uptime": "Vrijeme rada", "Stanje naprave": "Stanje uređaja", "Različica naprave": "Verzija uređaja", "Čakam na stanje …": "Čekam stanje …", "Stanje komponent": "Stanje komponenti", "Senzorji in shranjevanje": "Senzori i pohrana", "Merilne celice": "Mjerne ćelije", "RTC ura": "RTC sat", "Dnevnik meritev": "Dnevnik mjerenja",
    "Tehtnica": "Vaga", "Tariranje tehtnice": "Tariranje vage", "Tariraj tehtnico": "Tariraj vagu", "Čakam na stanje tehtnice …": "Čekam stanje vage …", "Senzor BME680": "Senzor BME680", "Kalibracija temperature in vlage": "Kalibracija temperature i vlažnosti", "Odmik temperature (°C)": "Pomak temperature (°C)", "Odmik vlage (%)": "Pomak vlažnosti (%)", "Shrani kalibracijo": "Spremi kalibraciju", "Čakam na stanje BME680 …": "Čekam stanje BME680 …", "Čas sistema": "Vrijeme sustava", "Datum in ura": "Datum i vrijeme", "Ročna nastavitev": "Ručna postavka", "Nastavi datum in uro": "Postavi datum i vrijeme", "Sinhroniziraj z internetom": "Sinkroniziraj s internetom",
    "Sinhronizacija": "Sinkronizacija", "Sinhronizacija zgodovine": "Sinkronizacija povijesti", "Ponovno sinhroniziraj zgodovino": "Ponovno sinkroniziraj povijest", "Meritve na SD kartici": "Mjerenja na SD kartici", "Odpri dnevnik meritev": "Otvori dnevnik mjerenja", "Prenesi meritve": "Preuzmi mjerenja", "Izbriši meritve s SD kartice": "Izbriši mjerenja sa SD kartice", "Brisanje merilne zgodovine": "Brisanje povijesti mjerenja", "Trajno izbriši meritve": "Trajno izbriši mjerenja", "Izbriši merilno zgodovino": "Izbriši povijest mjerenja", "Ponastavitev omrežja": "Ponovno postavljanje mreže", "Izbriši Wi-Fi poverilnice": "Izbriši Wi‑Fi vjerodajnice",
    "Posodobitev naprave": "Ažuriranje uređaja", "Razpoložljiva OTA posodobitev": "Dostupno OTA ažuriranje", "Trenutna različica naprave:": "Trenutačna verzija uređaja:", "Preverjam razpoložljive različice …": "Provjeravam dostupne verzije …", "Prezri": "Zanemari", "Posodobi napravo": "Ažuriraj uređaj", "Brez interneta": "Bez interneta", "Orodje za posodobitev": "Alat za ažuriranje", "Odpri orodje za posodobitev": "Otvori alat za ažuriranje",
    "Izberi": "Odaberi", "Cloud dostop": "Cloud pristup", "Prijava uporabnika": "Prijava korisnika", "E-poštni naslov": "Adresa e-pošte", "Geslo": "Lozinka", "Prijava z e-pošto": "Prijava e-poštom", "Ustvari nov račun": "Izradi novi račun", "Nadaljuj z Googlom": "Nastavi s Googleom", "Zapri": "Zatvori", "Nadaljuj": "Nastavi", "Potrditev dejanja": "Potvrda radnje", "Ali želiš nadaljevati?": "Želite li nastaviti?",
    "Nevarno dejanje": "Opasna radnja", "Za potrditev vpiši {text}.": "Za potvrdu upišite {text}.", "Trajni izbris meritev": "Trajno brisanje mjerenja", "Trajno izbriši": "Trajno izbriši", "Izbriši Wi‑Fi": "Izbriši Wi‑Fi",
    "Za popoln izbris mora biti naprava online.": "Za potpuno brisanje uređaj mora biti online.", "Ukaz za popoln izbris pošiljam napravi …": "Šaljem uređaju naredbu za potpuno brisanje …", "Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.": "Naredba je poslana. Uređaj će je provjeriti u roku od 30 sekundi.", "Pošiljanje ukaza za brisanje ni uspelo.": "Slanje naredbe za brisanje nije uspjelo.",
    "Ukaz za izbris Wi-Fi poverilnic pošiljam napravi …": "Šaljem uređaju naredbu za brisanje Wi‑Fi vjerodajnica …", "Pošiljanje ukaza za izbris Wi-Fi poverilnic ni uspelo.": "Slanje naredbe za brisanje Wi‑Fi vjerodajnica nije uspjelo.",
    "Vpiši ime Wi‑Fi omrežja.": "Unesite naziv Wi‑Fi mreže.", "Preverjam povezavo z Wi‑Fi omrežjem …": "Provjeravam vezu s Wi‑Fi mrežom …", "Naprava preverja povezavo. Nastavitve shrani šele po uspehu …": "Uređaj provjerava vezu. Postavke će spremiti tek nakon uspjeha …", "Skrij Wi‑Fi geslo": "Sakrij Wi‑Fi lozinku", "Prikaži Wi‑Fi geslo": "Prikaži Wi‑Fi lozinku", "Novi lokalni naslov je kopiran.": "Nova lokalna adresa je kopirana.", "Kopiranje ni uspelo. Naslov označi in kopiraj ročno.": "Kopiranje nije uspjelo. Označite adresu i kopirajte je ručno.", "Ni najdenih Wi‑Fi omrežij.": "Nije pronađena nijedna Wi‑Fi mreža.", " · zaščiteno": " · zaštićeno", " · odprto": " · otvoreno", "Iščem omrežja …": "Tražim mreže …",
    "Ponovno sinhroniziraj zgodovino": "Ponovno sinkroniziraj povijest", "Začni sinhronizacijo": "Pokreni sinkronizaciju", "Pripravljam primerjavo SD zgodovine in Firebase …": "Pripremam usporedbu SD povijesti i Firebasea …", "Primerjava dnevne zgodovine se je začela.": "Usporedba dnevne povijesti je započela.",
    "HX711 ni pripravljen; tariranje trenutno ni možno.": "HX711 nije spreman; tariranje trenutačno nije moguće.", "Tariraj": "Tariraj", "Tariranje pošiljam napravi …": "Šaljem tariranje uređaju …", "Ukaz za tariranje pošiljam napravi …": "Šaljem naredbu za tariranje uređaju …",
    "Prijavljam …": "Prijavljujem …", "Ustvarjam račun …": "Izrađujem račun …", "Odpiram Google prijavo …": "Otvaram Google prijavu …", "Odjava ni uspela": "Odjava nije uspjela",
    "Preveri obliko ID-ja in osemmestne aktivacijske kode.": "Provjerite oblik ID-a i osmeroznamenkastog aktivacijskog koda.", "Preverjam aktivacijsko kodo …": "Provjeravam aktivacijski kod …", "Panj je uspešno registriran na tvoj račun.": "Košnica je uspješno registrirana na vaš račun.", "Registracija ni uspela. Preveri ID, kodo in ali je naprava že povezana v Firebase.": "Registracija nije uspjela. Provjerite ID, kod i je li uređaj već povezan s Firebaseom.",
    "Izberi svoj panj, ki ga želiš deliti.": "Odaberite svoju košnicu koju želite podijeliti.", "Povabila ne moreš poslati svojemu računu.": "Poziv ne možete poslati vlastitom računu.", "Vnesi veljaven e-poštni naslov prejemnika.": "Unesite valjanu adresu e-pošte primatelja.", "Ustvarjam varno povabilo …": "Izrađujem siguran poziv …", "Povabilo je pripravljeno. Prejemniku pošlji prikazano kodo.": "Poziv je spreman. Pošaljite primatelju prikazani kod.", "Povabila ni bilo mogoče ustvariti. Preveri povezavo in Firebase pravila.": "Poziv nije bilo moguće izraditi. Provjerite vezu i Firebase pravila.", "Koda povabila je kopirana.": "Kod poziva je kopiran.", "Kopiranje ni uspelo. Kodo označi in kopiraj ročno.": "Kopiranje nije uspjelo. Označite kod i kopirajte ga ručno.", "Preverjam povabilo …": "Provjeravam poziv …", "Povabilo ni veljavno, je poteklo ali je namenjeno drugemu e-poštnemu naslovu.": "Poziv nije valjan, istekao je ili je namijenjen drugoj adresi e-pošte.",
    "Panj še ni deljen z nobenim uporabnikom.": "Košnica još nije podijeljena ni s jednim korisnikom.", "Uporabnik brez e-poštnega naslova": "Korisnik bez adrese e-pošte", "Samo ogled": "Samo pregled", "Prekliči dostop": "Opozovi pristup", "Preklicujem deljeni dostop …": "Opozivam dijeljeni pristup …", "Dostop uporabnika je preklican.": "Pristup korisnika je opozvan.", "Dostopa ni bilo mogoče preklicati.": "Pristup nije bilo moguće opozvati.",
    "Skupaj 0 %": "Ukupno 0 %", "Posodobitev poteka": "Ažuriranje je u tijeku", "Zadnja cloud OTA posodobitev ni zabeležena.": "Posljednje cloud OTA ažuriranje nije zabilježeno.", "Posodobitev prezrta": "Ažuriranje je zanemareno", "Na voljo je nova različica": "Dostupna je nova verzija", "Nova različica naprave je pripravljena na GitHub Releases.": "Nova verzija uređaja spremna je na GitHub Releases.", "Prezrto v tem brskalniku.": "Zanemareno u ovom pregledniku.", "OTA izdaja ni javno dosegljiva": "OTA izdanje nije javno dostupno", "Preveri GitHub Release in javni dostop do repozitorija.": "Provjerite GitHub Release i javni pristup repozitoriju.", "Naprava je posodobljena": "Uređaj je ažuriran", "Ni navoljo novejše različice.": "Nema dostupne novije verzije.", "Preverjanje OTA ni uspelo": "Provjera OTA ažuriranja nije uspjela", "GitHub Release trenutno ni dosegljiv.": "GitHub Release trenutačno nije dostupan.", "OTA ukaz pošiljam napravi …": "Šaljem OTA naredbu uređaju …", "Pošiljanje OTA ukaza ni uspelo.": "Slanje OTA naredbe nije uspjelo.",
    "Ročna posodobitev naprave": "Ručno ažuriranje uređaja", "Brez interneta namesti programsko opremo ali lokalni spletni vmesnik.": "Bez interneta instalirajte programski softver ili lokalno web sučelje.", "Varna namestitev nove različice na izbrano napravo.": "Sigurna instalacija nove verzije na odabrani uređaj.", "Pripravljam lokalno zgodovino s SD kartice …": "Pripremam lokalnu povijest sa SD kartice …", "Priprava lokalne zgodovine je trajala predolgo.": "Priprema lokalne povijesti trajala je predugo.", "Lokalne zgodovine ni bilo mogoče prebrati; povezava z napravo ostaja aktivna.": "Lokalnu povijest nije bilo moguće pročitati; veza s uređajem ostaje aktivna.",
    "Izberi panj za ogled meritev in upravljanje. Prikazani so stanje, zadnji odziv in e-poštni naslov lastnika.": "Odaberite košnicu za pregled mjerenja i upravljanje. Prikazani su stanje, posljednji odgovor i adresa e-pošte vlasnika.",
    "Povabilo velja 24 ur in samo za navedeni e-poštni naslov. Povabljeni uporabnik lahko vidi meritve in grafe, naprave pa ne more upravljati.": "Poziv vrijedi 24 sata i samo za navedenu adresu e-pošte. Pozvani korisnik može vidjeti mjerenja i grafove, ali ne može upravljati uređajem.",
    "Vnesi kodo, ki ti jo je poslal lastnik panja. Povabilo mora biti namenjeno e-poštnemu naslovu tega računa.": "Unesite kod koji vam je poslao vlasnik košnice. Poziv mora biti namijenjen adresi e-pošte ovog računa.",
    "Vremenski podatki se pridobivajo iz storitve Open-Meteo glede na shranjeno lokacijo in se osvežujejo vsakih 15 minut.": "Vremenski podaci dohvaćaju se iz usluge Open-Meteo prema spremljenoj lokaciji i osvježavaju svakih 15 minuta.", "Na svojem pregledu prikaži trenutno vreme in napoved.": "U svom pregledu prikaži trenutačno vrijeme i prognozu.", "To nastavitev vidiš samo ti. Ne spreminja kraja ali nastavitev lastnika.": "Ovu postavku vidite samo vi. Ne mijenja mjesto ni postavke vlasnika.",
    "Nastavitve veljajo samo za izbrani panj. Naprava jih shrani tudi lokalno, zato ostanejo aktivne ob začasnem izpadu interneta.": "Postavke vrijede samo za odabranu košnicu. Uređaj ih sprema i lokalno pa ostaju aktivne tijekom privremenog prekida interneta.", "Podatki se vedno shranjujejo na dve decimalki.": "Podaci se uvijek spremaju na dvije decimale.", "Od 5 do 120 sekund. Trenutna meritev se posodobi po vsakem ciklu.": "Od 5 do 120 sekundi. Trenutačno mjerenje ažurira se nakon svakog ciklusa.", "Od 1 do 30 minut. Ti zapisi se prenesejo tudi v Firebase zgodovino.": "Od 1 do 30 minuta. Ti se zapisi prenose i u Firebase povijest.",
    "Wi‑Fi geslo": "Wi‑Fi lozinka", "Telefon ali računalnik poveži z novim Wi‑Fi omrežjem.": "Povežite telefon ili računalo s novom Wi‑Fi mrežom.", "Priporočeno za pregled meritev in upravljanje panja.": "Preporučeno za pregled mjerenja i upravljanje košnicom.", "Stalni naslov:": "Stalna adresa:", "Uporabi jo skupaj z ID-jem naprave pri registraciji v cloud.": "Upotrijebite ga zajedno s ID-om uređaja pri registraciji u cloud.",
    "S ploščadi odstrani vse. Trenutno prazno stanje bo nastavljeno na 0,00 kg.": "Uklonite sve s platforme. Trenutačno prazno stanje postavit će se na 0,00 kg.", "Odstrani panj in vse uteži s ploščadi. Naprava bo prazno stanje shranila kot 0,00 kg.": "Uklonite košnicu i sve utege s platforme. Uređaj će prazno stanje spremiti kao 0,00 kg.", "Vpiši razliko med referenčnim merilnikom in BME680. Odmika se uporabita pri vseh novih meritvah.": "Unesite razliku između referentnog mjerača i BME680. Pomaci se primjenjuju na sva nova mjerenja.",
    "Dnevnik lahko odpreš v brskalniku, preneseš kot CSV ali trajno izbrišeš samo s SD kartice. Brisanje ne vpliva na zgodovino v Firebase.": "Dnevnik možete otvoriti u pregledniku, preuzeti kao CSV ili trajno izbrisati samo sa SD kartice. Brisanje ne utječe na povijest u Firebaseu.", "Ukaz trajno izbriše dnevnik meritev s SD kartice in celotno zgodovino v Firebase. Dejanja ni mogoče razveljaviti.": "Naredba trajno briše dnevnik mjerenja sa SD kartice i cijelu povijest u Firebaseu. Radnju nije moguće poništiti.", "Ukaz trajno izbriše shranjeno domače Wi-Fi omrežje. Naprava prekine cloud povezavo in odpre lokalni nastavitveni dostop za novo povezavo.": "Naredba trajno briše spremljenu kućnu Wi‑Fi mrežu. Uređaj prekida cloud vezu i otvara lokalni pristup postavkama za novu vezu.",
    "GitHub Release bo prikazan, ko je na voljo.": "GitHub Release prikazat će se kada bude dostupan.", "Naprave med posodobitvijo ne izklapljaj": "Ne isključujte uređaj tijekom ažuriranja", "Nadaljuj na posodobitev": "Nastavi na ažuriranje", "Pred lokalno posodobitvijo": "Prije lokalnog ažuriranja", "Prijavi se za ogled svojih registriranih panjev.": "Prijavite se za pregled svojih registriranih košnica.",
    "Čakam na stanje SD kartice …": "Čekam stanje SD kartice …", "Čakam na stanje ure …": "Čekam stanje sata …", "DS3231 še ni preverjen.": "DS3231 još nije provjeren.", "Izberi online panj za ponastavitev omrežja.": "Odaberite online košnicu za ponovno postavljanje mreže.", "Čas od": "Vrijeme od", "Čas do": "Vrijeme do", "Pon": "Pon", "Tor": "Uto", "Sre": "Sri", "Čet": "Čet", "Pet": "Pet", "Sob": "Sub", "Ned": "Ned",
    "SD kartica ni dosegljiva.": "SD kartica nije dostupna.", "Počakaj, da se sinhronizacija zgodovine zaključi.": "Pričekajte da se sinkronizacija povijesti završi.", "Brisanje dnevnika je uvrščeno v čakalno vrsto …": "Brisanje dnevnika stavljeno je u red čekanja …", "Brišem meritve s SD kartice …": "Brišem mjerenja sa SD kartice …", "Meritve so izbrisane s SD kartice. Zgodovina v Firebase je ostala nespremenjena.": "Mjerenja su izbrisana sa SD kartice. Povijest u Firebaseu ostala je nepromijenjena.", "Brisanje meritev s SD kartice ni uspelo.": "Brisanje mjerenja sa SD kartice nije uspjelo.", "Dnevnik meritev je pripravljen.": "Dnevnik mjerenja je spreman.",
    "Izberi panj za upravljanje zgodovine.": "Odaberite košnicu za upravljanje poviješću.", "Panj je offline; brisanje merilne zgodovine trenutno ni možno.": "Košnica je izvan mreže; brisanje povijesti mjerenja trenutačno nije moguće.", "SD kartica ni pripravljena; popoln izbris SD in cloud zgodovine ni dovoljen.": "SD kartica nije spremna; potpuno brisanje SD i cloud povijesti nije dopušteno.", "Naprava je online in pripravljena na brisanje merilne zgodovine.": "Uređaj je online i spreman za brisanje povijesti mjerenja.",
    "Izberi panj za ponastavitev omrežja.": "Odaberite košnicu za ponovno postavljanje mreže.", "Brisanje Wi-Fi poverilnic ni uspelo; naprava ostaja povezana.": "Brisanje Wi‑Fi vjerodajnica nije uspjelo; uređaj ostaje povezan.", "Naprava ponastavlja shranjeno Wi-Fi omrežje …": "Uređaj ponovno postavlja spremljenu Wi‑Fi mrežu …", "Panj je offline; ponastavitev omrežja trenutno ni mogoča.": "Košnica je izvan mreže; ponovno postavljanje mreže trenutačno nije moguće.", "Naprava je online in pripravljena na ponastavitev omrežja.": "Uređaj je online i spreman za ponovno postavljanje mreže.",
    "Cloud ni dosegljiv; meritve varno čakajo na SD kartici.": "Cloud nije dostupan; mjerenja sigurno čekaju na SD kartici.", "Pripravljam dnevni indeks SD zgodovine …": "Pripremam dnevni indeks SD povijesti …", "Primerjava SD zgodovine s Firebase ni uspela. Preveri SD kartico in povezavo ter poskusi znova.": "Usporedba SD povijesti s Firebaseom nije uspjela. Provjerite SD karticu i vezu pa pokušajte ponovno.", "SD kartica in Firebase sta sinhronizirana.": "SD kartica i Firebase su sinkronizirani.", "Zgodovina čaka na prvi prenos v Firebase.": "Povijest čeka prvi prijenos u Firebase.", "SD kartica ni pripravljena; sinhronizacije ni mogoče začeti.": "SD kartica nije spremna; sinkronizaciju nije moguće pokrenuti.", "SD kartica ni pripravljena; meritev ni mogoče izbrisati.": "SD kartica nije spremna; mjerenja nije moguće izbrisati.", "Zahtevo za brisanje pošiljam napravi …": "Šaljem zahtjev za brisanje uređaju …",
    "Odregistriram panj …": "Odjavljujem košnicu …", "Panj je odregistriran in vsi deljeni dostopi so preklicani. Merilni podatki ostanejo shranjeni.": "Košnica je odjavljena i svi dijeljeni pristupi su opozvani. Podaci mjerenja ostaju spremljeni.", "Odregistracija ni uspela. Panj ostaja povezan s tvojim računom.": "Odjava nije uspjela. Košnica ostaje povezana s vašim računom.", "Odstranjujem deljeni panj …": "Uklanjam dijeljenu košnicu …", "Deljeni panj je odstranjen iz tvojega računa.": "Dijeljena košnica uklonjena je s vašeg računa.", "Deljenega panja ni bilo mogoče odstraniti. Dostop ostaja aktiven.": "Dijeljenu košnicu nije bilo moguće ukloniti. Pristup ostaje aktivan.",
    "Panj nima registriranega lastnika.": "Košnica nema registriranog vlasnika.", "Odjavljam lastnika …": "Odjavljujem vlasnika …", "Lastnik in vsi deljeni dostopi so odjavljeni. Merilni podatki ostanejo shranjeni.": "Vlasnik i svi dijeljeni pristupi su odjavljeni. Podaci mjerenja ostaju spremljeni.", "Odjava lastnika ni uspela. Panj ostaja povezan z računom.": "Odjava vlasnika nije uspjela. Košnica ostaje povezana s računom.", "Brišem napravo in njene Firebase zapise …": "Brišem uređaj i njegove Firebase zapise …", "Naprava in vsi njeni Firebase zapisi so izbrisani.": "Uređaj i svi njegovi Firebase zapisi su izbrisani.", "Izbris naprave ni uspel. Firebase zapisi ostanejo nespremenjeni.": "Brisanje uređaja nije uspjelo. Firebase zapisi ostaju nepromijenjeni.",
    "Napaka pri branju podatkov": "Pogreška pri čitanju podataka", "Izberite končni datum": "Odaberite završni datum", "Končni datum mora biti po začetnem datumu.": "Završni datum mora biti nakon početnog datuma.",
    "Odpri nastavitve": "Otvori postavke", "Naprava je dosegljiva na novem omrežju. Za nadaljnjo uporabo priporočamo spletno nadzorno ploščo; lokalni dostop ostaja na voljo prek stalnega naslova.": "Uređaj je dostupan na novoj mreži. Za daljnju uporabu preporučujemo web nadzornu ploču; lokalni pristup ostaje dostupan putem stalne adrese.", "Za lokalni dostop poveži telefon ali računalnik z istim Wi‑Fi omrežjem. Če lokalni naslov ni dosegljiv, IP preveri med povezanimi napravami v usmerjevalniku.": "Za lokalni pristup povežite telefon ili računalo s istom Wi‑Fi mrežom. Ako lokalna adresa nije dostupna, provjerite IP među povezanim uređajima u usmjerivaču.",
    "Povezava z Wi‑Fi je uspela. Čakam na potrditev omrežnega naslova.": "Wi‑Fi povezivanje je uspjelo. Čekam potvrdu mrežne adrese.", "Naprava je povezana v domače Wi‑Fi omrežje.": "Uređaj je povezan s kućnom Wi‑Fi mrežom.", "Povezava z napravo je bila prekinjena. To je po brisanju omrežja pričakovano; nadaljuj prek prikazane dostopne točke.": "Veza s uređajem je prekinuta. To je očekivano nakon brisanja mreže; nastavite putem prikazane pristupne točke.",
    "Izberi veljaven datum med letoma 2023 in 2099.": "Odaberite valjan datum između 2023. i 2099.", "Zahtevam sinhronizacijo z internetno uro …": "Zahtijevam sinkronizaciju s internetskim satom …", "Skupaj {value} %": "Ukupno {value} %",
    "DS3231 je pripravljen. Zadnja nastavitev: {time}.": "DS3231 je spreman. Posljednja postavka: {time}.", "Naprava preverja izbrano Wi‑Fi omrežje. Ostani povezan na dostopni točki{ap}.": "Uređaj provjerava odabranu Wi‑Fi mrežu. Ostanite povezani s pristupnom točkom{ap}.", "Povezava z Wi‑Fi ni uspela. AP{ap} ostaja na voljo za ponoven poskus.": "Wi‑Fi povezivanje nije uspjelo. AP{ap} ostaje dostupan za novi pokušaj.", "Povezan si neposredno na dostopno točko naprave{ap}. Vpiši domače Wi‑Fi omrežje za dostop do clouda.": "Povezani ste izravno s pristupnom točkom uređaja{ap}. Unesite kućnu Wi‑Fi mrežu za pristup cloudu.",
    "Primerjam dnevni indeks SD kartice s Firebase{days} …": "Uspoređujem dnevni indeks SD kartice s Firebaseom{days} …", "Pošiljam zgodovino v Firebase …{detail}": "Šaljem povijest u Firebase …{detail}", "SD kartica ni pripravljena; cloud zgodovine brez brisanja SD dnevnika ni dovoljeno izbrisati.": "SD kartica nije spremna; cloud povijest nije dopušteno izbrisati bez brisanja SD dnevnika.", "Izbrano omrežje: {ssid}": "Odabrana mreža: {ssid}", "Najdenih omrežij: {count}": "Pronađenih mreža: {count}",
    "Zadnja uspešna OTA posodobitev: {time}.": "Posljednje uspješno OTA ažuriranje: {time}.", "Različica v{version} je že nameščena.": "Verzija v{version} već je instalirana.", "Za {email}; velja do {time}.": "Za {email}; vrijedi do {time}.", "Preveri osemmestno kodo povabila in e-poštni naslov računa.": "Provjerite osmeroznamenkasti kod poziva i adresu e-pošte računa.", "Deljeni panj »{name}« je dodan v izbirnik.": "Dijeljena košnica »{name}« dodana je u izbornik.",
    "S ploščadi odstrani vse in nato tariraj tehtnico.": "Uklonite sve s platforme, a zatim tarirajte vagu.", "Ukaz za tariranje čaka na izvedbo.": "Naredba za tariranje čeka izvršenje.", "Nastavljam prazno ploščad na 0,00 kg …": "Postavljam praznu platformu na 0,00 kg …", "Tariranje je uspešno; nova ničla je shranjena.": "Tariranje je uspjelo; nova nula je spremljena.", "Tariranje ni uspelo. Preveri povezavo HX711.": "Tariranje nije uspjelo. Provjerite vezu HX711.", "Prejšnje tariranje se ni zaključilo. Odstrani uteži in poskusi znova.": "Prethodno tariranje nije završeno. Uklonite utege i pokušajte ponovno.", "Panj je offline; tariranje trenutno ni možno.": "Košnica je izvan mreže; tariranje trenutačno nije moguće.", "Izberi online panj za tariranje.": "Odaberite online košnicu za tariranje.",
    "Čakam na stanje kalibracije BME680 …": "Čekam stanje kalibracije BME680 …", "Ukaz za kalibracijo čaka na izvedbo.": "Naredba za kalibraciju čeka izvršenje.", "Shranjujem kalibracijo BME680 …": "Spremam kalibraciju BME680 …", "Kalibracija BME680 je shranjena in uporabljena pri novih meritvah.": "Kalibracija BME680 spremljena je i primjenjuje se na nova mjerenja.", "Kalibracije BME680 ni bilo mogoče shraniti.": "Kalibraciju BME680 nije bilo moguće spremiti.", "Panj je offline; kalibracije trenutno ni mogoče nastaviti.": "Košnica je izvan mreže; kalibraciju trenutačno nije moguće postaviti.", "Izberi online panj za kalibracijo.": "Odaberite online košnicu za kalibraciju.", "BME680 ni pripravljen; odmikov trenutno ni mogoče nastaviti.": "BME680 nije spreman; pomake trenutačno nije moguće postaviti.",
    "E-poštni naslov ali geslo ni pravilno.": "Adresa e-pošte ili lozinka nisu ispravni.", "Za ta e-poštni naslov račun že obstaja.": "Račun za ovu adresu e-pošte već postoji.", "Geslo mora imeti najmanj šest znakov.": "Lozinka mora imati najmanje šest znakova.", "Google prijava je bila zaprta.": "Google prijava je zatvorena.", "Ta način prijave še ni omogočen v Firebase Authentication.": "Ovaj način prijave još nije omogućen u Firebase Authenticationu.", "Postopka ni bilo mogoče dokončati. Poskusi znova.": "Postupak nije bilo moguće dovršiti. Pokušajte ponovno.", "Vnesi e-poštni naslov in geslo.": "Unesite adresu e-pošte i lozinku.", "Google račun": "Google račun",
    "Lokacija {name} je shranjena za ta panj.": "Lokacija {name} spremljena je za ovu košnicu.", "Dovoljenje za lokacijo je zavrnjeno. Kraj lahko poiščeš ročno.": "Dopuštenje za lokaciju je odbijeno. Mjesto možete potražiti ručno.", "Lokacije ni bilo mogoče pridobiti. Poskusi znova ali poišči kraj ročno.": "Lokaciju nije bilo moguće dohvatiti. Pokušajte ponovno ili ručno potražite mjesto.", "Prikaz vremena je vključen.": "Prikaz vremena je uključen.", "Prikaz vremena je izključen.": "Prikaz vremena je isključen.", "Dolžina napovedi je shranjena.": "Duljina prognoze je spremljena.",
    "Graf temperature in relativne vlage": "Graf temperature i relativne vlažnosti", "Graf mase panja": "Graf mase košnice", "Hitre izbire obdobja": "Brzi odabir razdoblja", "Koledar za izbiro obdobja": "Kalendar za odabir razdoblja", "Napredek OTA posodobitve": "Napredak OTA ažuriranja", "Naslednji mesec": "Sljedeći mjesec", "Prejšnji mesec": "Prethodni mjesec", "Odpri pregled": "Otvori pregled", "Moj panj": "Moja košnica", "npr. Ljubljana": "npr. Zagreb",
    "{label}: prikaži ali skrij serijo": "{label}: prikaži ili sakrij niz",
    "Panj": "Košnica", "ID naprave:": "ID uređaja:", "Aktivacijska koda:": "Aktivacijski kod:", "ali": "ili", "Pozor:": "Pažnja:", "Pomembno:": "Važno:", "programsko opremo": "programski softver", "lokalni spletni vmesnik": "lokalno web sučelje", "Na ločeni strani izberi": "Na zasebnoj stranici odaberite", "Odprlo se bo orodje za posodobitev. Izberi samo zaupanja vredno datoteko": "Otvorit će se alat za ažuriranje. Odaberite samo pouzdanu datoteku", "za": "za", "za to napravo.": "za ovaj uređaj.", ". Po uspešni posodobitvi se naprava znova zažene.": ". Nakon uspješnog ažuriranja uređaj će se ponovno pokrenuti.", "med posodobitvijo naprave ne izklapljaj in ne prekinjaj povezave Wi-Fi.": "tijekom ažuriranja ne isključujte uređaj i ne prekidajte Wi‑Fi vezu.", "med prenosom ne odklapljaj napajanja, ne zapiraj brskalnika in ne prekinjaj Wi-Fi povezave. Po uspešni posodobitvi se naprava samodejno znova zažene.": "tijekom prijenosa ne isključujte napajanje, ne zatvarajte preglednik i ne prekidajte Wi‑Fi vezu. Nakon uspješnog ažuriranja uređaj će se automatski ponovno pokrenuti.", "Uporabi samo datoteke iz zaupanja vredne izdaje za to napravo. Programsko opremo in lokalni spletni vmesnik namesti ločeno.": "Upotrijebite samo datoteke iz pouzdanog izdanja za ovaj uređaj. Programski softver i lokalno web sučelje instalirajte zasebno.",
    "Temperaturni odmik mora biti med -10,0 in +10,0 °C.": "Pomak temperature mora biti između -10,0 i +10,0 °C.", "Odmik vlage mora biti med -30,0 in +30,0 %.": "Pomak vlažnosti mora biti između -30,0 i +30,0 %.", "Kalibracijo pošiljam napravi …": "Šaljem kalibraciju uređaju …", "Ukaz za kalibracijo pošiljam napravi …": "Šaljem naredbu za kalibraciju uređaju …", "Ročno nastavitev pošiljam napravi …": "Šaljem ručnu postavku uređaju …", "Ročno nastavitev pošiljam izbranemu panju …": "Šaljem ručnu postavku odabranoj košnici …", "Nastavitev je sprejeta. Naprava bo posodobila sistemsko uro in DS3231.": "Postavka je prihvaćena. Uređaj će ažurirati sistemski sat i DS3231.", "Ukaz je poslan. Naprava ga prevzame v največ 15 sekundah.": "Naredba je poslana. Uređaj će je preuzeti u roku od 15 sekundi.", "NTP sinhronizacija je uvrščena.": "NTP sinkronizacija je stavljena u red čekanja.",
    "Naprava bo trajno izbrisala shranjeno domače Wi-Fi omrežje, prekinila cloud povezavo in odprla lokalni nastavitveni dostop. Nato se poveži z njenim provisioning Wi-Fi omrežjem in odpri 192.168.4.1.": "Uređaj će trajno izbrisati spremljenu kućnu Wi‑Fi mrežu, prekinuti cloud vezu i otvoriti lokalni pristup postavkama. Zatim se povežite s njegovom provisioning Wi‑Fi mrežom i otvorite 192.168.4.1.", "Trajno izbrišem vse meritve iz SD kartice in Firebase? Tega ni mogoče razveljaviti.": "Trajno izbrisati sva mjerenja sa SD kartice i Firebasea? To nije moguće poništiti.", "Naprava bo nato odprla svojo dostopno točko.": "Uređaj će zatim otvoriti svoju pristupnu točku.", "Primerjam dnevne indekse SD kartice in Firebase ter prenesem samo manjkajoče ali neskladne dneve.": "Usporedit ću dnevne indekse SD kartice i Firebasea te prenijeti samo dane koji nedostaju ili se ne podudaraju.", "Trajno izbrišem vse meritve samo s SD kartice? Zgodovina v Firebase bo ostala nespremenjena.": "Trajno izbrisati sva mjerenja samo sa SD kartice? Povijest u Firebaseu ostat će nepromijenjena.",
    "Namesti posodobitev": "Instaliraj ažuriranje", "Začni posodobitev": "Pokreni ažuriranje", "Napravo posodobim na verzijo {version}? Med prenosom naprave ne izklapljaj in ne prekinjaj povezave Wi-Fi.": "Ažurirati uređaj na verziju {version}? Tijekom prijenosa ne isključujte uređaj i ne prekidajte Wi‑Fi vezu.", "Prekliči deljeni dostop": "Opozovi dijeljeni pristup", "Prekličem dostop samo za ogled uporabniku {user}?": "Opozvati pristup samo za pregled korisniku {user}?", "Odregistriraj panj": "Odjavi košnicu", "Odregistriraj": "Odjavi", "Odstrani": "Ukloni", "Trajno izbriši napravo": "Trajno izbriši uređaj",
    "Ali želiš panj »{name}« odregistrirati? Meritve in zgodovina ostanejo v bazi, vsi deljeni dostopi pa bodo preklicani. Za ponoven dostop bo panj treba registrirati z aktivacijsko kodo.": "Želite li odjaviti košnicu »{name}«? Mjerenja i povijest ostaju u bazi, a svi dijeljeni pristupi bit će opozvani. Za ponovni pristup košnicu će trebati registrirati aktivacijskim kodom.", "Ali želiš deljeni panj »{name}« odstraniti iz svojega računa? Lastnik panja, meritve in zgodovina ostanejo nespremenjeni. Za ponoven dostop boš potreboval novo povabilo lastnika.": "Želite li ukloniti dijeljenu košnicu »{name}« sa svojeg računa? Vlasnik, mjerenja i povijest ostaju nepromijenjeni. Za ponovni pristup trebat će vam novi poziv vlasnika.",
    "Ali želiš panj {deviceId} odjaviti od {owner}? Meritve, SD sinhronizacija in aktivacijska koda ostanejo shranjeni, vsi deljeni dostopi pa bodo preklicani. Panj bo nato mogoče registrirati na drug račun.": "Želite li odjaviti košnicu {deviceId} od {owner}? Mjerenja, SD sinkronizacija i aktivacijski kod ostaju spremljeni, a svi dijeljeni pristupi bit će opozvani. Košnicu će zatim biti moguće registrirati na drugi račun.", "Ali želiš napravo {deviceId} trajno izbrisati iz Firebase? Izbrisani bodo lastništvo, meritve, agregati, stanje naprave, ukazi, aktivacijska koda, zahtevki in deljeni dostopi. Tega ni mogoče razveljaviti. Če je naprava še povezana, lahko z istim firmwareom začne znova pošiljati nove podatke.": "Želite li trajno izbrisati uređaj {deviceId} iz Firebasea? Izbrisat će se vlasništvo, mjerenja, agregati, stanje uređaja, naredbe, aktivacijski kod, zahtjevi i dijeljeni pristupi. To nije moguće poništiti. Ako je uređaj još povezan, isti firmware može ponovno početi slati nove podatke.",
    "uporabnika {email}": "korisnika {email}", "trenutnega uporabnika": "trenutačnog korisnika",
    "Dostopna točka bo na voljo še približno {seconds} s. Za nadaljnjo uporabo priporočamo spletno nadzorno ploščo; lokalni IP lahko preveriš v usmerjevalniku.": "Pristupna točka bit će dostupna još približno {seconds} s. Za daljnju uporabu preporučujemo web-nadzornu ploču; lokalnu IP adresu možeš provjeriti u usmjerivaču.",
    "Dostopna točka se je zaprla. Poveži se z domačim Wi‑Fi omrežjem in nadaljuj v spletni nadzorni plošči; lokalni IP lahko preveriš v usmerjevalniku.": "Pristupna točka se zatvorila. Poveži se s kućnom Wi‑Fi mrežom i nastavi na web-nadzornoj ploči; lokalnu IP adresu možeš provjeriti u usmjerivaču.",
    "Naprava prehaja v omrežje {ssid}. Ko bo povezava vzpostavljena, za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.": "Uređaj prelazi na mrežu {ssid}. Nakon uspostave veze za pregled mjerenja i upravljanje košnicom preporučujemo web-nadzornu ploču.",
    "Shranjeno omrežje bo izbrisano. Naprava bo odprla dostopno točko {ssid}.": "Spremljena mreža bit će izbrisana. Uređaj će otvoriti pristupnu točku {ssid}.",
    "V nastavitvah Wi‑Fi telefona ali računalnika izberi {ssid}, nato odpri {url} in ponovno vnesi poverilnice.": "U Wi‑Fi postavkama telefona ili računala odaberi {ssid}, zatim otvori {url} i ponovno unesi pristupne podatke.",
    "Naprava je povezana z internetom prek omrežja {ssid}. Za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.": "Uređaj je povezan s internetom putem mreže {ssid}. Za pregled mjerenja i upravljanje košnicom preporučujemo web-nadzornu ploču.",
    "SD kartica trenutno ni dosegljiva; lokalno stanje naprave ostaja na voljo.": "SD kartica trenutačno nije dostupna; lokalno stanje uređaja i dalje je dostupno.", "Lokalna zgodovina trenutno ni dosegljiva.": "Lokalna povijest trenutačno nije dostupna.",
    "Naprava je povezana v Wi‑Fi omrežje {ssid}. Nastavitve lahko po potrebi spremeniš ali izbrišeš.": "Uređaj je povezan s Wi‑Fi mrežom {ssid}. Postavke možeš po potrebi promijeniti ili izbrisati.",
    "Pregledujem in obnavljam dneve: {completed}/{total}. Manjkajočih ali neskladnih dni: {missing}.{progress}": "Pregledavam i obnavljam dane: {completed}/{total}. Nedostajućih ili neusklađenih dana: {missing}.{progress}",
    "Prenesenih meritev: {uploaded}/{total}.": "Prenesenih mjerenja: {uploaded}/{total}.", "Zadnji potrjen zapis: {time}.": "Posljednji potvrđeni zapis: {time}.",
    "Zadnji ukaz za brisanje je bil uspešno zaključen: {time}.": "Posljednja naredba za brisanje uspješno je završena: {time}.",
    "Wi-Fi poverilnice so izbrisane ({time}). Poveži se s provisioning Wi-Fi omrežjem naprave in odpri 192.168.4.1.": "Wi-Fi pristupni podaci izbrisani su ({time}). Poveži se s mrežom za postavljanje uređaja i otvori 192.168.4.1.",
    "Naprava je povezana z internetom. Za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.": "Uređaj je povezan s internetom. Za pregled mjerenja i upravljanje košnicom preporučujemo web-nadzornu ploču.",
    "Dopolnjujem dnevni indeks Firebase brez ponovnega prenosa meritev …": "Dopunjavam dnevni indeks Firebase bez ponovnog prijenosa mjerenja …", "Čakam na potrditev prvega zapisa.": "Čekam potvrdu prvog zapisa.",
    "Wi-Fi poverilnice so izbrisane. Poveži se s provisioning Wi-Fi omrežjem naprave in odpri 192.168.4.1.": "Wi-Fi pristupni podaci su izbrisani. Poveži se s mrežom za postavljanje uređaja i otvori 192.168.4.1.",
    "Skupni napredek OTA: {value} %": "Ukupni OTA napredak: {value} %", "neznanem času": "nepoznato vrijeme",
    "Prenašanje lokalne strani": "Preuzimanje lokalne stranice", "Nameščanje lokalne strani": "Instaliranje lokalne stranice", "Prenašanje programske opreme": "Preuzimanje firmvera", "Posodobitev je uspešna": "Ažuriranje je uspješno",
    "E-poštnega naslova lastnika ni bilo mogoče posodobiti.": "Nije bilo moguće ažurirati e-adresu vlasnika.", "Javnega prikaza vremena ni bilo mogoče posodobiti.": "Nije bilo moguće ažurirati javni prikaz vremena.", "Kraja za deljeni prikaz vremena ni bilo mogoče določiti.": "Nije bilo moguće odrediti mjesto za dijeljeni prikaz vremena.", "Vremenskih podatkov ni bilo mogoče pridobiti.": "Nije bilo moguće dohvatiti vremenske podatke.",
    "Nastavitev vremena ni bilo mogoče shraniti.": "Nije bilo moguće spremiti postavke vremena.", "Nastavitve vremena za deljeni panj ni bilo mogoče shraniti.": "Nije bilo moguće spremiti postavke vremena za dijeljenu košnicu.", "Kraja za shranjeno lokacijo ni bilo mogoče določiti.": "Nije bilo moguće odrediti mjesto spremljene lokacije.", "Kraja za lokacijo brskalnika ni bilo mogoče določiti.": "Nije bilo moguće odrediti mjesto lokacije preglednika.", "Lokacije brskalnika ni bilo mogoče pridobiti.": "Nije bilo moguće dohvatiti lokaciju preglednika.", "Kraja ni bilo mogoče poiskati.": "Nije bilo moguće pronaći mjesto.",
    "Menjava omrežja": "Promjena mreže", "Naprava se povezuje z novim Wi‑Fi omrežjem": "Uređaj se povezuje s novom Wi‑Fi mrežom", "Tudi telefon ali računalnik poveži z novim omrežjem. Za lokalni dostop počakaj nekaj sekund in odpri stalni naslov; če .local ne deluje, novi IP preveri v usmerjevalniku.": "Poveži i telefon ili računalo s novom mrežom. Za lokalni pristup pričekaj nekoliko sekundi i otvori stalnu adresu; ako .local ne radi, provjeri novu IP adresu u usmjerivaču.", "Tudi telefon ali računalnik poveži z novim omrežjem. Za lokalni dostop novi IP preveri med povezanimi napravami v usmerjevalniku.": "Poveži i telefon ili računalo s novom mrežom. Za lokalni pristup provjeri novu IP adresu među povezanim uređajima u usmjerivaču.",
    "dostopna točka naprave": "pristupna točka uređaja", "Ponovno poveži napravo": "Ponovno poveži uređaj", "Naslov nastavitev na dostopni točki": "Adresa postavki na pristupnoj točki", "SD kartica javlja napako; sinhronizacija s Firebase trenutno ni mogoča.": "SD kartica javlja pogrešku; sinkronizacija s Firebaseom trenutačno nije moguća.", "SD kartica ni dosegljiva; sinhronizacija s Firebase trenutno ni mogoča.": "SD kartica nije dostupna; sinkronizacija s Firebaseom trenutačno nije moguća.",
    "Ukaz za brisanje čaka, da ga naprava prevzame.": "Naredba za brisanje čeka da je uređaj preuzme.", "Naprava briše SD dnevnik in cloud zgodovino …": "Uređaj briše SD dnevnik i cloud-povijest …", "Zadnji ukaz za brisanje je bil uspešno zaključen.": "Posljednja naredba za brisanje uspješno je završena.", "IZBRIŠI": "IZBRIŠI", "Izbriši Wi-Fi": "Izbriši Wi-Fi", "Naslova ni bilo mogoče kopirati": "Nije bilo moguće kopirati adresu", "Skeniranje Wi‑Fi omrežij ni uspelo": "Skeniranje Wi‑Fi mreža nije uspjelo", "Skeniranje Wi‑Fi omrežij je poteklo": "Skeniranje Wi‑Fi mreža isteklo je",
    "Odstrani panj in vse uteži s ploščadi. Trenutno stanje bo nastavljeno na 0,00 kg.": "Ukloni košnicu i sve utege s platforme. Trenutačno stanje bit će postavljeno na 0,00 kg.", "Tariranja ni bilo mogoče začeti": "Tariranje nije bilo moguće pokrenuti", "Kalibracije BME680 ni bilo mogoče začeti": "Kalibraciju BME680 nije bilo moguće pokrenuti", "Nastavitev časa ni uspela": "Postavljanje vremena nije uspjelo", "Za nastavitev časa mora biti izbrana naprava online": "Za postavljanje vremena odabrani uređaj mora biti online", "Zahtevana različica ni novejša.": "Zatražena verzija nije novija.", "uPlot se ni pravilno naložil.": "uPlot se nije pravilno učitao.", "Google prijava ni vrnila veljavnega identifikacijskega žetona.": "Google prijava nije vratila valjani identifikacijski token.", "Nativne Google seje ni bilo mogoče počistiti.": "Nije bilo moguće očistiti izvornu Google sesiju.",
    "Lokacija panja ({latitude}, {longitude})": "Lokacija košnice ({latitude}, {longitude})",
    "Lokacija brskalnika ({latitude}, {longitude})": "Lokacija preglednika ({latitude}, {longitude})",
    "Firmware je že nameščen.": "Firmware je već instaliran.",
    "Zadnji preneseni zapis: {time}.": "Posljednji preneseni zapis: {time}.",
    "Trenutna odmika: temperatura {temperature}, vlaga {humidity}.": "Trenutačni pomaci: temperatura {temperature}, vlažnost {humidity}.",
    "{days} dni {hours} h {minutes} min": "{days} dana {hours} h {minutes} min",
  },
  en: {
    "SD kartica": "SD card",
    "Še uporabljate Pametni čebelnjak?": "Are you still using Smart Beehive?",
    "Zaradi neaktivnosti boste čez {time} samodejno odjavljeni.": "You will be signed out automatically in {time} due to inactivity.",
    "Ostani prijavljen": "Stay signed in",
    "Pametni čebelnjak": "Smart Beehive", "Nadzorna plošča": "Dashboard", "Pregled": "Overview",
    "Grafi": "Charts", "Naprava": "Device", "Posodobitve": "Updates", "Svetla tema": "Light theme",
    "Temna tema": "Dark theme", "Izberi temo": "Choose theme", "Gozd": "Forest", "Polnoč": "Midnight", "Med": "Honey", "Odjava": "Sign out", "Prijava": "Sign in", "Panj · živ pogled": "Hive · live view",
    "Dobrodošel v pametnem panju": "Welcome to the smart hive", "Trenutne meritve in hiter pregled zadnjega stanja panja.": "Current measurements and a quick overview of the latest hive state.",
    "Odpri grafe": "Open charts", "Opozorila naprave": "Device alerts", "Potrebno je preveriti komponento": "A component needs attention",
    "Zadnja meritev": "Latest measurement", "Meritve": "Measurements", "Čakam na podatke …": "Waiting for data …",
    "Temperatura": "Temperature", "Relativna vlaga": "Relative humidity", "min": "min", "max": "max", "min {min} · max {max}": "min {min} · max {max}", "Trend temperature v zadnjih 24 urah": "Temperature trend over the last 24 h", "Trend relativne vlage v zadnjih 24 urah": "Relative humidity trend over the last 24 h", "Trend mase panja v zadnjih 24 urah": "Hive mass trend over the last 24 h",
    "Sprememba mase": "Mass change", "24 h": "24 h", "7 dni": "7 days", "Zadnjih 24 h": "Last 24 h", "Prirast mase": "Mass gain", "Prirast": "Gain", "Padec": "Loss", "Stabilno": "Stable", "Izguba mase": "Mass loss", "v primerjavi s prejšnjo nočjo": "compared with the previous night", "v primerjavi z nočjo pred 7 dnevi": "compared with the night 7 days ago", "Primerjava temelji na nočni masi panja": "Comparison is based on the hive's night-time mass", "Ni dovolj podatkov": "Not enough data", "Trend spremembe mase za zadnjih 7 dni": "Mass-change trend for the last 7 days", "Ni dovolj podatkov za zadnjih 7 dni": "Not enough data for the last 7 days",
    "Podrobnosti naprave": "Device details", "Različica": "Version", "Preveri posodobitve": "Check for updates",
    "Meritve in shranjevanje": "Measurements and storage", "Nastavitve vremena": "Weather settings", "Stanje sistema": "System status",
    "Začetek – konec": "Start – end", "Izberi časovno obdobje grafov.": "Choose the chart time period.",
    "Klima v panju": "Hive climate", "Temperatura in vlaga": "Temperature and humidity", "Masa panja": "Hive mass",
    "Danes": "Today", "Včeraj": "Yesterday", "Ta teden": "This week", "Ta mesec": "This month", "To leto": "This year",
    "Zadnja ura": "Last hour", "Zadnjih 12 ur": "Last 12 hours", "Zadnjih 24 ur": "Last 24 hours",
    "Zadnjih 7 dni": "Last 7 days", "Zadnjih 30 dni": "Last 30 days", "Uporabi": "Apply", "Prekliči": "Cancel",
    "Nalagam grafe in zgodovino meritev …": "Loading charts and measurement history …", "Ni na voljo": "Not available",
    "Za izbrano obdobje še ni meritev.": "There are no measurements for the selected period yet.",
    "Prikazanih je {count} povprečnih točk. Za približanje povlecite po izbranem grafu.": "{count} averaged points are displayed. Drag on the selected chart to zoom in.",
    "Temperatura (°C)": "Temperature (°C)", "Vlaga (%)": "Humidity (%)", "Masa (kg)": "Mass (kg)",
    "Lokacija še ni nastavljena.": "Location has not been set yet.", "izbrani lokaciji": "the selected location", "Vreme v kraju {place}": "Weather in {place}",
    "Jasno": "Clear", "Delno oblačno": "Partly cloudy", "Oblačno": "Cloudy", "Megla": "Fog", "Pršenje": "Drizzle", "Dež": "Rain", "Sneg": "Snow", "Nevihta": "Thunderstorm", "Spremenljivo": "Variable",
    "Za prikaz vremena najprej uporabi trenutno lokacijo ali poišči kraj.": "To display weather, first use your current location or search for a place.",
    "Nastavitev velja samo za tvoj pregled deljenega panja.": "This setting applies only to your view of the shared hive.", "Lastnik za ta panj še ni nastavil kraja za vreme.": "The owner has not set a weather location for this hive yet.",
    "Vremenskih podatkov za ta kraj ni mogoče pridobiti.": "Weather data for this location cannot be retrieved.", "Čakam na podatke …": "Waiting for data …",
    "Vsi panji": "All hives", "Moji panji": "My hives", "Skrbniški pregled": "Administrator overview",
    "Skrbniški račun ima ogled vseh registriranih panjev.": "The administrator account can view all registered hives.",
    "Izberi panj, katerega podatke želiš pregledovati.": "Select the hive whose data you want to view.",
    "Registriraj svoj panj ali sprejmi povabilo za dostop do deljenega panja.": "Register your hive or accept an invitation to access a shared hive.",
    "Deljeni panj imaš na voljo samo za ogled meritev in grafov.": "The shared hive is available for viewing measurements and charts only.",
    "Omrežje, identiteta, delovanje in stanje SD kartice.": "Network, identity, operation, and SD card status.",
    "Odstrani deljeni panj": "Remove shared hive", "Odjavi izbrani panj": "Unclaim selected hive",
    "Deljeni panj · samo ogled. Dostop lahko kadarkoli odstraniš iz svojega računa.": "Shared hive · view only. You can remove access from your account at any time.",
    "Naprava še ni prejela OTA ukaza.": "The device has not received an OTA command yet.", "Noben panj ni registriran": "No hive is registered",
    "Deljeni z mano": "Shared with me", " · samo ogled": " · view only", "V Firebase še ni zaznan noben panj.": "No hive has been detected in Firebase yet.",
    "Izberi panj {deviceId}": "Select hive {deviceId}", "Lastnik še ni zabeležen.": "The owner has not been recorded yet.",
    "Online": "Online", "Offline": "Offline", "Zadnji odziv: {time}": "Last response: {time}",
    "Naprava še ni poslala stanja.": "The device has not reported its status yet.", "Odjavi lastnika": "Unclaim owner", "Izbriši napravo": "Delete device",
    "Posodobljeno: {time}": "Updated: {time}", "Posodobljeno": "Updated", "{value} % padavin": "{value}% precipitation", "Padavine —": "Precipitation —",
    "Pridobivam vreme …": "Fetching weather …", "Vremenski podatki trenutno niso dosegljivi.": "Weather data is currently unavailable.",
    "Preveri dovoljene meje nastavitev.": "Check the allowed setting limits.", "Zapis zgodovine na SD ne more biti pogostejši od meritev.": "SD history cannot be recorded more frequently than measurements.",
    "Shranjujem nastavitve …": "Saving settings …", "Nastavitve so shranjene. Naprava jih prevzame v največ 30 sekundah.": "Settings saved. The device will apply them within 30 seconds.",
    "Nastavitev meritev ni bilo mogoče shraniti.": "Measurement settings could not be saved.", "Nastavitve vremena ni bilo mogoče shraniti.": "Weather settings could not be saved.",
    "Shranjujem nastavitev …": "Saving setting …", "Vreme je prikazano na tvojem pregledu.": "Weather is shown on your overview.", "Vreme je skrito na tvojem pregledu.": "Weather is hidden from your overview.",
    "Brskalnik ne podpira določanja lokacije.": "The browser does not support location detection.", "Brskalnik čaka na dovoljenje za lokacijo …": "The browser is waiting for location permission …",
    "Vnesi kraj, ki ga želiš poiskati.": "Enter the place you want to find.", "Iščem kraj …": "Searching for a place …", "Izberi kraj za lokacijo panja.": "Select a place for the hive location.",
    "Za vneseni kraj ni rezultatov.": "No results were found for the entered place.", "Iskanje kraja trenutno ni dosegljivo.": "Place search is currently unavailable.",
    "Lokalna povezava": "Local connection", "Prijava je potrebna": "Sign-in required", "Izberi panj": "Select a hive", "Naprava online": "Device online", "Naprava offline": "Device offline", "Čakam na odziv naprave …": "Waiting for device response …",
    "Čakam na preverjanje": "Waiting for check", "Deluje normalno": "Operating normally", "Potrebno preverjanje": "Check required", "Napaka komponente": "Component error",
    "Komponenta trenutno ni dosegljiva; preverjanje se ponavlja.": "The component is currently unavailable; the check is being repeated.", "Komponenta še ni preverjena.": "The component has not been checked yet.", "Deluje normalno.": "Operating normally.",
    "Preveri povezavo ali napajanje.": "Check the connection or power supply.", "RTC ura nima veljavnega časa.": "The RTC clock does not have a valid time.", "Dosegljiv prek lokalnega IP-ja.": "Reachable via the local IP address.", "Čakam na prvi odziv naprave.": "Waiting for the first device response.",
    "Vir časa: DS3231 RTC": "Time source: DS3231 RTC", "Vir časa: internetna NTP ura": "Time source: internet NTP clock", "Vir časa: ročna lokalna nastavitev": "Time source: manual local setting", "Vir časa: ročna cloud nastavitev": "Time source: manual cloud setting", "Veljaven čas še ni na voljo": "Valid time is not available yet",
    "DS3231 ni zaznan. Ročna ali NTP ura se ob izpadu napajanja ne bo ohranila.": "DS3231 was not detected. Manual or NTP time will not be retained after a power loss.",
    "DS3231 je zaznan, vendar nima veljavnega časa. Preveri baterijo in nastavi uro.": "DS3231 was detected but does not have a valid time. Check the battery and set the clock.",
    "DS3231 je zaznan in vsebuje veljaven čas.": "DS3231 was detected and contains a valid time.", "Čakam na internetno časovno sinhronizacijo …": "Waiting for internet time synchronization …",
    "DS3231 ni pripravljen; nastavljanje in sinhronizacija časa trenutno nista mogoča.": "DS3231 is not ready; setting and synchronizing time are currently unavailable.",
    "Panj je offline; nastavljanje datuma in ure trenutno ni možno.": "The hive is offline; setting the date and time is currently unavailable.", "Naprava je online; datum in uro lahko nastaviš ali sinhroniziraš z internetom.": "The device is online; you can set the date and time or synchronize it with the internet.",
    "Zaznana": "Detected", "Ni zaznana": "Not detected", "Po petih poskusih ni bila zaznana.": "It was not detected after five attempts.",
    "Odpri meni": "Open menu", "Glavna navigacija": "Main navigation", "Nazaj": "Back", "Opozorilo komponent": "Component warning", "Vzpostavljam povezavo …": "Establishing connection …", "Preklopi barvno temo": "Switch color theme", "Izberi jezik": "Select language",
    "Vreme": "Weather", "Vreme v kraju": "Weather in", "Vlaga": "Humidity", "Tlak": "Pressure", "Veter": "Wind", "Nastavljam obdobje …": "Setting period …", "Čakam na zgodovino meritev …": "Waiting for measurement history …",
    "Pametni kontroler": "Smart controller", "Moj račun": "My account", "Izbrani panj": "Selected hive", "Vsi registrirani panji": "All registered hives", "Dodaj panj": "Add hive", "Registriraj panj": "Register hive", "Vnesi ID naprave in aktivacijsko kodo.": "Enter the device ID and activation code.",
    "Ime panja": "Hive name", "ID naprave": "Device ID", "Aktivacijska koda": "Activation code", "Deli panj": "Share hive", "Dostop samo za ogled": "View-only access", "E-poštni naslov prejemnika": "Recipient email address", "Ustvari povabilo": "Create invitation", "Koda povabila": "Invitation code", "Kopiraj kodo": "Copy code", "Uporabniki z ogledom": "View-only users", "Panj še ni deljen.": "The hive has not been shared yet.",
    "Deljeno z mano": "Shared with me", "Sprejmi povabilo": "Accept invitation", "Dodaj deljeni panj": "Add shared hive", "Vreme na pregledu": "Weather on overview", "Prikaži vreme": "Show weather", "Na pregledu prikaži trenutno vreme in napoved.": "Show current weather and forecast on the overview.", "Dolžina napovedi": "Forecast length", "3 dni": "3 days", "5 dni": "5 days", "Lokacija panja": "Hive location", "Uporabi mojo lokacijo": "Use my location", "Poišči kraj": "Search for a place", "Poišči": "Search", "Vreme deljenega panja": "Shared hive weather",
    "Nastavitve meritev": "Measurement settings", "Prikaz mase": "Mass display", "1 decimalka": "1 decimal", "2 decimalki": "2 decimals", "Interval meritev": "Measurement interval", "Zapis zgodovine na SD": "SD history recording", "Shrani nastavitve": "Save settings",
    "Nastavitev omrežja": "Network setup", "Poveži panj z Wi‑Fi": "Connect hive to Wi‑Fi", "Povezan si neposredno na dostopno točko naprave.": "You are connected directly to the device access point.", "Povezano Wi‑Fi omrežje": "Connected Wi‑Fi network", "Ime Wi‑Fi omrežja": "Wi‑Fi network name", "Poišči omrežja": "Find networks", "Shrani in poveži": "Save and connect", "Izbriši shranjeni Wi‑Fi": "Delete saved Wi‑Fi", "Povezava je uspela": "Connection successful", "Naprava je povezana": "Device connected", "Spletna nadzorna plošča": "Web dashboard", "Novi lokalni naslov": "New local address", "Odpri nadzorno ploščo": "Open dashboard", "Odpri lokalno": "Open locally", "Kopiraj lokalni naslov": "Copy local address",
    "Wi‑Fi omrežje": "Wi‑Fi network", "IP naslov": "IP address", "Wi‑Fi signal": "Wi‑Fi signal", "Uptime": "Uptime", "Stanje naprave": "Device status", "Različica naprave": "Device version", "Čakam na stanje …": "Waiting for status …", "Stanje komponent": "Component status", "Senzorji in shranjevanje": "Sensors and storage", "Merilne celice": "Load cells", "RTC ura": "RTC clock", "Dnevnik meritev": "Measurement log",
    "Tehtnica": "Scale", "Tariranje tehtnice": "Scale tare", "Tariraj tehtnico": "Tare scale", "Čakam na stanje tehtnice …": "Waiting for scale status …", "Senzor BME680": "BME680 sensor", "Kalibracija temperature in vlage": "Temperature and humidity calibration", "Odmik temperature (°C)": "Temperature offset (°C)", "Odmik vlage (%)": "Humidity offset (%)", "Shrani kalibracijo": "Save calibration", "Čakam na stanje BME680 …": "Waiting for BME680 status …", "Čas sistema": "System time", "Datum in ura": "Date and time", "Ročna nastavitev": "Manual setting", "Nastavi datum in uro": "Set date and time", "Sinhroniziraj z internetom": "Synchronize with internet",
    "Sinhronizacija": "Synchronization", "Sinhronizacija zgodovine": "History synchronization", "Ponovno sinhroniziraj zgodovino": "Resynchronize history", "Meritve na SD kartici": "Measurements on SD card", "Odpri dnevnik meritev": "Open measurement log", "Prenesi meritve": "Download measurements", "Izbriši meritve s SD kartice": "Delete measurements from SD card", "Brisanje merilne zgodovine": "Measurement history deletion", "Trajno izbriši meritve": "Permanently delete measurements", "Izbriši merilno zgodovino": "Delete measurement history", "Ponastavitev omrežja": "Network reset", "Izbriši Wi-Fi poverilnice": "Delete Wi‑Fi credentials",
    "Posodobitev naprave": "Device update", "Razpoložljiva OTA posodobitev": "Available OTA update", "Trenutna različica naprave:": "Current device version:", "Preverjam razpoložljive različice …": "Checking available versions …", "Prezri": "Ignore", "Posodobi napravo": "Update device", "Brez interneta": "Offline", "Orodje za posodobitev": "Update tool", "Odpri orodje za posodobitev": "Open update tool",
    "Izberi": "Select", "Cloud dostop": "Cloud access", "Prijava uporabnika": "User sign-in", "E-poštni naslov": "Email address", "Geslo": "Password", "Prijava z e-pošto": "Sign in with email", "Ustvari nov račun": "Create new account", "Nadaljuj z Googlom": "Continue with Google", "Zapri": "Close", "Nadaljuj": "Continue", "Potrditev dejanja": "Confirm action", "Ali želiš nadaljevati?": "Do you want to continue?",
    "Nevarno dejanje": "Dangerous action", "Za potrditev vpiši {text}.": "Type {text} to confirm.", "Trajni izbris meritev": "Permanent measurement deletion", "Trajno izbriši": "Permanently delete", "Izbriši Wi‑Fi": "Delete Wi‑Fi",
    "Za popoln izbris mora biti naprava online.": "The device must be online for a complete deletion.", "Ukaz za popoln izbris pošiljam napravi …": "Sending the complete deletion command to the device …", "Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.": "Command sent. The device will check it within 30 seconds.", "Pošiljanje ukaza za brisanje ni uspelo.": "The deletion command could not be sent.",
    "Ukaz za izbris Wi-Fi poverilnic pošiljam napravi …": "Sending the Wi‑Fi credential deletion command to the device …", "Pošiljanje ukaza za izbris Wi-Fi poverilnic ni uspelo.": "The Wi‑Fi credential deletion command could not be sent.",
    "Vpiši ime Wi‑Fi omrežja.": "Enter the Wi‑Fi network name.", "Preverjam povezavo z Wi‑Fi omrežjem …": "Checking the Wi‑Fi network connection …", "Naprava preverja povezavo. Nastavitve shrani šele po uspehu …": "The device is checking the connection. It will save settings only after success …", "Skrij Wi‑Fi geslo": "Hide Wi‑Fi password", "Prikaži Wi‑Fi geslo": "Show Wi‑Fi password", "Novi lokalni naslov je kopiran.": "The new local address was copied.", "Kopiranje ni uspelo. Naslov označi in kopiraj ročno.": "Copying failed. Select the address and copy it manually.", "Ni najdenih Wi‑Fi omrežij.": "No Wi‑Fi networks were found.", " · zaščiteno": " · secured", " · odprto": " · open", "Iščem omrežja …": "Searching for networks …",
    "Ponovno sinhroniziraj zgodovino": "Resynchronize history", "Začni sinhronizacijo": "Start synchronization", "Pripravljam primerjavo SD zgodovine in Firebase …": "Preparing a comparison of SD history and Firebase …", "Primerjava dnevne zgodovine se je začela.": "Daily history comparison has started.",
    "HX711 ni pripravljen; tariranje trenutno ni možno.": "HX711 is not ready; taring is currently unavailable.", "Tariraj": "Tare", "Tariranje pošiljam napravi …": "Sending tare request to the device …", "Ukaz za tariranje pošiljam napravi …": "Sending tare command to the device …",
    "Prijavljam …": "Signing in …", "Ustvarjam račun …": "Creating account …", "Odpiram Google prijavo …": "Opening Google sign-in …", "Odjava ni uspela": "Sign-out failed",
    "Preveri obliko ID-ja in osemmestne aktivacijske kode.": "Check the device ID format and eight-character activation code.", "Preverjam aktivacijsko kodo …": "Checking activation code …", "Panj je uspešno registriran na tvoj račun.": "The hive was successfully registered to your account.", "Registracija ni uspela. Preveri ID, kodo in ali je naprava že povezana v Firebase.": "Registration failed. Check the ID, code, and whether the device is already connected to Firebase.",
    "Izberi svoj panj, ki ga želiš deliti.": "Select the hive you want to share.", "Povabila ne moreš poslati svojemu računu.": "You cannot send an invitation to your own account.", "Vnesi veljaven e-poštni naslov prejemnika.": "Enter a valid recipient email address.", "Ustvarjam varno povabilo …": "Creating a secure invitation …", "Povabilo je pripravljeno. Prejemniku pošlji prikazano kodo.": "The invitation is ready. Send the displayed code to the recipient.", "Povabila ni bilo mogoče ustvariti. Preveri povezavo in Firebase pravila.": "The invitation could not be created. Check the connection and Firebase rules.", "Koda povabila je kopirana.": "The invitation code was copied.", "Kopiranje ni uspelo. Kodo označi in kopiraj ročno.": "Copying failed. Select the code and copy it manually.", "Preverjam povabilo …": "Checking invitation …", "Povabilo ni veljavno, je poteklo ali je namenjeno drugemu e-poštnemu naslovu.": "The invitation is invalid, expired, or intended for another email address.",
    "Panj še ni deljen z nobenim uporabnikom.": "The hive has not been shared with any user yet.", "Uporabnik brez e-poštnega naslova": "User without an email address", "Samo ogled": "View only", "Prekliči dostop": "Revoke access", "Preklicujem deljeni dostop …": "Revoking shared access …", "Dostop uporabnika je preklican.": "The user's access was revoked.", "Dostopa ni bilo mogoče preklicati.": "Access could not be revoked.",
    "Skupaj 0 %": "Total 0%", "Posodobitev poteka": "Update in progress", "Zadnja cloud OTA posodobitev ni zabeležena.": "The last cloud OTA update was not recorded.", "Posodobitev prezrta": "Update ignored", "Na voljo je nova različica": "A new version is available", "Nova različica naprave je pripravljena na GitHub Releases.": "A new device version is available on GitHub Releases.", "Prezrto v tem brskalniku.": "Ignored in this browser.", "OTA izdaja ni javno dosegljiva": "The OTA release is not publicly accessible", "Preveri GitHub Release in javni dostop do repozitorija.": "Check the GitHub Release and public repository access.", "Naprava je posodobljena": "Device is up to date", "Ni navoljo novejše različice.": "No newer version is available.", "Preverjanje OTA ni uspelo": "OTA check failed", "GitHub Release trenutno ni dosegljiv.": "GitHub Release is currently unavailable.", "OTA ukaz pošiljam napravi …": "Sending OTA command to the device …", "Pošiljanje OTA ukaza ni uspelo.": "The OTA command could not be sent.",
    "Ročna posodobitev naprave": "Manual device update", "Brez interneta namesti programsko opremo ali lokalni spletni vmesnik.": "Install firmware or the local web interface without internet access.", "Varna namestitev nove različice na izbrano napravo.": "Safely install a new version on the selected device.", "Pripravljam lokalno zgodovino s SD kartice …": "Preparing local history from the SD card …", "Priprava lokalne zgodovine je trajala predolgo.": "Preparing local history took too long.", "Lokalne zgodovine ni bilo mogoče prebrati; povezava z napravo ostaja aktivna.": "Local history could not be read; the device connection remains active.",
    "Izberi panj za ogled meritev in upravljanje. Prikazani so stanje, zadnji odziv in e-poštni naslov lastnika.": "Select a hive to view measurements and manage it. Its status, last response, and owner email address are shown.",
    "Povabilo velja 24 ur in samo za navedeni e-poštni naslov. Povabljeni uporabnik lahko vidi meritve in grafe, naprave pa ne more upravljati.": "The invitation is valid for 24 hours and only for the specified email address. The invited user can view measurements and charts but cannot manage the device.",
    "Vnesi kodo, ki ti jo je poslal lastnik panja. Povabilo mora biti namenjeno e-poštnemu naslovu tega računa.": "Enter the code sent by the hive owner. The invitation must be intended for this account's email address.",
    "Vremenski podatki se pridobivajo iz storitve Open-Meteo glede na shranjeno lokacijo in se osvežujejo vsakih 15 minut.": "Weather data is retrieved from Open-Meteo for the saved location and refreshed every 15 minutes.", "Na svojem pregledu prikaži trenutno vreme in napoved.": "Show current weather and forecast on your overview.", "To nastavitev vidiš samo ti. Ne spreminja kraja ali nastavitev lastnika.": "Only you can see this setting. It does not change the owner's location or settings.",
    "Nastavitve veljajo samo za izbrani panj. Naprava jih shrani tudi lokalno, zato ostanejo aktivne ob začasnem izpadu interneta.": "Settings apply only to the selected hive. The device also stores them locally, so they remain active during a temporary internet outage.", "Podatki se vedno shranjujejo na dve decimalki.": "Data is always stored to two decimal places.", "Od 5 do 120 sekund. Trenutna meritev se posodobi po vsakem ciklu.": "From 5 to 120 seconds. The current measurement is updated after every cycle.", "Od 1 do 30 minut. Ti zapisi se prenesejo tudi v Firebase zgodovino.": "From 1 to 30 minutes. These records are also transferred to Firebase history.",
    "Wi‑Fi geslo": "Wi‑Fi password", "Telefon ali računalnik poveži z novim Wi‑Fi omrežjem.": "Connect your phone or computer to the new Wi‑Fi network.", "Priporočeno za pregled meritev in upravljanje panja.": "Recommended for viewing measurements and managing the hive.", "Stalni naslov:": "Permanent address:", "Uporabi jo skupaj z ID-jem naprave pri registraciji v cloud.": "Use it together with the device ID when registering in the cloud.",
    "S ploščadi odstrani vse. Trenutno prazno stanje bo nastavljeno na 0,00 kg.": "Remove everything from the platform. The current empty state will be set to 0.00 kg.", "Odstrani panj in vse uteži s ploščadi. Naprava bo prazno stanje shranila kot 0,00 kg.": "Remove the hive and all weights from the platform. The device will save the empty state as 0.00 kg.", "Vpiši razliko med referenčnim merilnikom in BME680. Odmika se uporabita pri vseh novih meritvah.": "Enter the difference between the reference meter and BME680. The offsets are applied to all new measurements.",
    "Dnevnik lahko odpreš v brskalniku, preneseš kot CSV ali trajno izbrišeš samo s SD kartice. Brisanje ne vpliva na zgodovino v Firebase.": "You can open the log in a browser, download it as CSV, or permanently delete it only from the SD card. Deletion does not affect Firebase history.", "Ukaz trajno izbriše dnevnik meritev s SD kartice in celotno zgodovino v Firebase. Dejanja ni mogoče razveljaviti.": "The command permanently deletes the measurement log from the SD card and all history in Firebase. This action cannot be undone.", "Ukaz trajno izbriše shranjeno domače Wi-Fi omrežje. Naprava prekine cloud povezavo in odpre lokalni nastavitveni dostop za novo povezavo.": "The command permanently deletes the saved home Wi‑Fi network. The device disconnects from the cloud and opens local setup access for a new connection.",
    "GitHub Release bo prikazan, ko je na voljo.": "The GitHub Release will be displayed when available.", "Naprave med posodobitvijo ne izklapljaj": "Do not turn off the device during the update", "Nadaljuj na posodobitev": "Continue to update", "Pred lokalno posodobitvijo": "Before a local update", "Prijavi se za ogled svojih registriranih panjev.": "Sign in to view your registered hives.",
    "Čakam na stanje SD kartice …": "Waiting for SD card status …", "Čakam na stanje ure …": "Waiting for clock status …", "DS3231 še ni preverjen.": "DS3231 has not been checked yet.", "Izberi online panj za ponastavitev omrežja.": "Select an online hive to reset its network.", "Čas od": "Time from", "Čas do": "Time to", "Pon": "Mon", "Tor": "Tue", "Sre": "Wed", "Čet": "Thu", "Pet": "Fri", "Sob": "Sat", "Ned": "Sun",
    "SD kartica ni dosegljiva.": "The SD card is unavailable.", "Počakaj, da se sinhronizacija zgodovine zaključi.": "Wait for history synchronization to finish.", "Brisanje dnevnika je uvrščeno v čakalno vrsto …": "Log deletion has been queued …", "Brišem meritve s SD kartice …": "Deleting measurements from the SD card …", "Meritve so izbrisane s SD kartice. Zgodovina v Firebase je ostala nespremenjena.": "Measurements were deleted from the SD card. Firebase history remains unchanged.", "Brisanje meritev s SD kartice ni uspelo.": "Measurements could not be deleted from the SD card.", "Dnevnik meritev je pripravljen.": "The measurement log is ready.",
    "Izberi panj za upravljanje zgodovine.": "Select a hive to manage its history.", "Panj je offline; brisanje merilne zgodovine trenutno ni možno.": "The hive is offline; deleting measurement history is currently unavailable.", "SD kartica ni pripravljena; popoln izbris SD in cloud zgodovine ni dovoljen.": "The SD card is not ready; complete deletion of SD and cloud history is not allowed.", "Naprava je online in pripravljena na brisanje merilne zgodovine.": "The device is online and ready to delete measurement history.",
    "Izberi panj za ponastavitev omrežja.": "Select a hive to reset its network.", "Brisanje Wi-Fi poverilnic ni uspelo; naprava ostaja povezana.": "Wi‑Fi credential deletion failed; the device remains connected.", "Naprava ponastavlja shranjeno Wi-Fi omrežje …": "The device is resetting the saved Wi‑Fi network …", "Panj je offline; ponastavitev omrežja trenutno ni mogoča.": "The hive is offline; network reset is currently unavailable.", "Naprava je online in pripravljena na ponastavitev omrežja.": "The device is online and ready for a network reset.",
    "Cloud ni dosegljiv; meritve varno čakajo na SD kartici.": "The cloud is unavailable; measurements are safely waiting on the SD card.", "Pripravljam dnevni indeks SD zgodovine …": "Preparing the daily SD history index …", "Primerjava SD zgodovine s Firebase ni uspela. Preveri SD kartico in povezavo ter poskusi znova.": "Comparing SD history with Firebase failed. Check the SD card and connection, then try again.", "SD kartica in Firebase sta sinhronizirana.": "The SD card and Firebase are synchronized.", "Zgodovina čaka na prvi prenos v Firebase.": "History is waiting for its first transfer to Firebase.", "SD kartica ni pripravljena; sinhronizacije ni mogoče začeti.": "The SD card is not ready; synchronization cannot be started.", "SD kartica ni pripravljena; meritev ni mogoče izbrisati.": "The SD card is not ready; measurements cannot be deleted.", "Zahtevo za brisanje pošiljam napravi …": "Sending the deletion request to the device …",
    "Odregistriram panj …": "Unclaiming hive …", "Panj je odregistriran in vsi deljeni dostopi so preklicani. Merilni podatki ostanejo shranjeni.": "The hive was unclaimed and all shared access was revoked. Measurement data remains stored.", "Odregistracija ni uspela. Panj ostaja povezan s tvojim računom.": "Unclaiming failed. The hive remains linked to your account.", "Odstranjujem deljeni panj …": "Removing shared hive …", "Deljeni panj je odstranjen iz tvojega računa.": "The shared hive was removed from your account.", "Deljenega panja ni bilo mogoče odstraniti. Dostop ostaja aktiven.": "The shared hive could not be removed. Access remains active.",
    "Panj nima registriranega lastnika.": "The hive has no registered owner.", "Odjavljam lastnika …": "Unclaiming owner …", "Lastnik in vsi deljeni dostopi so odjavljeni. Merilni podatki ostanejo shranjeni.": "The owner and all shared access were removed. Measurement data remains stored.", "Odjava lastnika ni uspela. Panj ostaja povezan z računom.": "Unclaiming the owner failed. The hive remains linked to the account.", "Brišem napravo in njene Firebase zapise …": "Deleting the device and its Firebase records …", "Naprava in vsi njeni Firebase zapisi so izbrisani.": "The device and all its Firebase records were deleted.", "Izbris naprave ni uspel. Firebase zapisi ostanejo nespremenjeni.": "Device deletion failed. Firebase records remain unchanged.",
    "Napaka pri branju podatkov": "Data read error", "Izberite končni datum": "Select an end date", "Končni datum mora biti po začetnem datumu.": "The end date must be after the start date.",
    "Odpri nastavitve": "Open settings", "Naprava je dosegljiva na novem omrežju. Za nadaljnjo uporabo priporočamo spletno nadzorno ploščo; lokalni dostop ostaja na voljo prek stalnega naslova.": "The device is reachable on the new network. We recommend the web dashboard for continued use; local access remains available through the permanent address.", "Za lokalni dostop poveži telefon ali računalnik z istim Wi‑Fi omrežjem. Če lokalni naslov ni dosegljiv, IP preveri med povezanimi napravami v usmerjevalniku.": "For local access, connect your phone or computer to the same Wi‑Fi network. If the local address is unavailable, check the router's connected devices for the IP address.",
    "Povezava z Wi‑Fi je uspela. Čakam na potrditev omrežnega naslova.": "The Wi‑Fi connection succeeded. Waiting for network address confirmation.", "Naprava je povezana v domače Wi‑Fi omrežje.": "The device is connected to the home Wi‑Fi network.", "Povezava z napravo je bila prekinjena. To je po brisanju omrežja pričakovano; nadaljuj prek prikazane dostopne točke.": "The device connection was interrupted. This is expected after deleting the network; continue through the displayed access point.",
    "Izberi veljaven datum med letoma 2023 in 2099.": "Select a valid date between 2023 and 2099.", "Zahtevam sinhronizacijo z internetno uro …": "Requesting synchronization with internet time …", "Skupaj {value} %": "Total {value}%",
    "DS3231 je pripravljen. Zadnja nastavitev: {time}.": "DS3231 is ready. Last setting: {time}.", "Naprava preverja izbrano Wi‑Fi omrežje. Ostani povezan na dostopni točki{ap}.": "The device is checking the selected Wi‑Fi network. Stay connected to the access point{ap}.", "Povezava z Wi‑Fi ni uspela. AP{ap} ostaja na voljo za ponoven poskus.": "The Wi‑Fi connection failed. AP{ap} remains available for another attempt.", "Povezan si neposredno na dostopno točko naprave{ap}. Vpiši domače Wi‑Fi omrežje za dostop do clouda.": "You are connected directly to the device access point{ap}. Enter the home Wi‑Fi network for cloud access.",
    "Primerjam dnevni indeks SD kartice s Firebase{days} …": "Comparing the SD card's daily index with Firebase{days} …", "Pošiljam zgodovino v Firebase …{detail}": "Sending history to Firebase …{detail}", "SD kartica ni pripravljena; cloud zgodovine brez brisanja SD dnevnika ni dovoljeno izbrisati.": "The SD card is not ready; cloud history cannot be deleted without deleting the SD log.", "Izbrano omrežje: {ssid}": "Selected network: {ssid}", "Najdenih omrežij: {count}": "Networks found: {count}",
    "Zadnja uspešna OTA posodobitev: {time}.": "Last successful OTA update: {time}.", "Različica v{version} je že nameščena.": "Version v{version} is already installed.", "Za {email}; velja do {time}.": "For {email}; valid until {time}.", "Preveri osemmestno kodo povabila in e-poštni naslov računa.": "Check the eight-character invitation code and the account email address.", "Deljeni panj »{name}« je dodan v izbirnik.": "Shared hive “{name}” was added to the selector.",
    "S ploščadi odstrani vse in nato tariraj tehtnico.": "Remove everything from the platform, then tare the scale.", "Ukaz za tariranje čaka na izvedbo.": "The tare command is waiting to run.", "Nastavljam prazno ploščad na 0,00 kg …": "Setting the empty platform to 0.00 kg …", "Tariranje je uspešno; nova ničla je shranjena.": "Taring succeeded; the new zero point was saved.", "Tariranje ni uspelo. Preveri povezavo HX711.": "Taring failed. Check the HX711 connection.", "Prejšnje tariranje se ni zaključilo. Odstrani uteži in poskusi znova.": "The previous tare did not finish. Remove the weights and try again.", "Panj je offline; tariranje trenutno ni možno.": "The hive is offline; taring is currently unavailable.", "Izberi online panj za tariranje.": "Select an online hive to tare.",
    "Čakam na stanje kalibracije BME680 …": "Waiting for BME680 calibration status …", "Ukaz za kalibracijo čaka na izvedbo.": "The calibration command is waiting to run.", "Shranjujem kalibracijo BME680 …": "Saving BME680 calibration …", "Kalibracija BME680 je shranjena in uporabljena pri novih meritvah.": "BME680 calibration was saved and is applied to new measurements.", "Kalibracije BME680 ni bilo mogoče shraniti.": "BME680 calibration could not be saved.", "Panj je offline; kalibracije trenutno ni mogoče nastaviti.": "The hive is offline; calibration cannot currently be set.", "Izberi online panj za kalibracijo.": "Select an online hive to calibrate.", "BME680 ni pripravljen; odmikov trenutno ni mogoče nastaviti.": "BME680 is not ready; offsets cannot currently be set.",
    "E-poštni naslov ali geslo ni pravilno.": "The email address or password is incorrect.", "Za ta e-poštni naslov račun že obstaja.": "An account already exists for this email address.", "Geslo mora imeti najmanj šest znakov.": "The password must contain at least six characters.", "Google prijava je bila zaprta.": "Google sign-in was closed.", "Ta način prijave še ni omogočen v Firebase Authentication.": "This sign-in method is not enabled in Firebase Authentication yet.", "Postopka ni bilo mogoče dokončati. Poskusi znova.": "The operation could not be completed. Try again.", "Vnesi e-poštni naslov in geslo.": "Enter your email address and password.", "Google račun": "Google account",
    "Lokacija {name} je shranjena za ta panj.": "Location {name} was saved for this hive.", "Dovoljenje za lokacijo je zavrnjeno. Kraj lahko poiščeš ročno.": "Location permission was denied. You can search for a place manually.", "Lokacije ni bilo mogoče pridobiti. Poskusi znova ali poišči kraj ročno.": "The location could not be retrieved. Try again or search for a place manually.", "Prikaz vremena je vključen.": "Weather display is enabled.", "Prikaz vremena je izključen.": "Weather display is disabled.", "Dolžina napovedi je shranjena.": "Forecast length was saved.",
    "Graf temperature in relativne vlage": "Temperature and relative humidity chart", "Graf mase panja": "Hive mass chart", "Hitre izbire obdobja": "Quick period selections", "Koledar za izbiro obdobja": "Period selection calendar", "Napredek OTA posodobitve": "OTA update progress", "Naslednji mesec": "Next month", "Prejšnji mesec": "Previous month", "Odpri pregled": "Open overview", "Moj panj": "My hive", "npr. Ljubljana": "e.g. London",
    "{label}: prikaži ali skrij serijo": "{label}: show or hide series",
    "Panj": "Hive", "ID naprave:": "Device ID:", "Aktivacijska koda:": "Activation code:", "ali": "or", "Pozor:": "Warning:", "Pomembno:": "Important:", "programsko opremo": "firmware", "lokalni spletni vmesnik": "local web interface", "Na ločeni strani izberi": "On the separate page, select", "Odprlo se bo orodje za posodobitev. Izberi samo zaupanja vredno datoteko": "The update tool will open. Select only a trusted file", "za": "for", "za to napravo.": "for this device.", ". Po uspešni posodobitvi se naprava znova zažene.": ". The device restarts after a successful update.", "med posodobitvijo naprave ne izklapljaj in ne prekinjaj povezave Wi-Fi.": "do not turn off the device or interrupt the Wi‑Fi connection during the update.", "med prenosom ne odklapljaj napajanja, ne zapiraj brskalnika in ne prekinjaj Wi-Fi povezave. Po uspešni posodobitvi se naprava samodejno znova zažene.": "do not disconnect power, close the browser, or interrupt the Wi‑Fi connection during transfer. The device restarts automatically after a successful update.", "Uporabi samo datoteke iz zaupanja vredne izdaje za to napravo. Programsko opremo in lokalni spletni vmesnik namesti ločeno.": "Use only files from a trusted release for this device. Install the firmware and local web interface separately.",
    "Temperaturni odmik mora biti med -10,0 in +10,0 °C.": "The temperature offset must be between -10.0 and +10.0 °C.", "Odmik vlage mora biti med -30,0 in +30,0 %.": "The humidity offset must be between -30.0 and +30.0%.", "Kalibracijo pošiljam napravi …": "Sending calibration to the device …", "Ukaz za kalibracijo pošiljam napravi …": "Sending the calibration command to the device …", "Ročno nastavitev pošiljam napravi …": "Sending the manual setting to the device …", "Ročno nastavitev pošiljam izbranemu panju …": "Sending the manual setting to the selected hive …", "Nastavitev je sprejeta. Naprava bo posodobila sistemsko uro in DS3231.": "The setting was accepted. The device will update the system clock and DS3231.", "Ukaz je poslan. Naprava ga prevzame v največ 15 sekundah.": "Command sent. The device will retrieve it within 15 seconds.", "NTP sinhronizacija je uvrščena.": "NTP synchronization has been queued.",
    "Naprava bo trajno izbrisala shranjeno domače Wi-Fi omrežje, prekinila cloud povezavo in odprla lokalni nastavitveni dostop. Nato se poveži z njenim provisioning Wi-Fi omrežjem in odpri 192.168.4.1.": "The device will permanently delete the saved home Wi‑Fi network, disconnect from the cloud, and open local setup access. Then connect to its provisioning Wi‑Fi network and open 192.168.4.1.", "Trajno izbrišem vse meritve iz SD kartice in Firebase? Tega ni mogoče razveljaviti.": "Permanently delete all measurements from the SD card and Firebase? This cannot be undone.", "Naprava bo nato odprla svojo dostopno točko.": "The device will then open its access point.", "Primerjam dnevne indekse SD kartice in Firebase ter prenesem samo manjkajoče ali neskladne dneve.": "Compare the daily SD card and Firebase indexes and transfer only missing or mismatched days.", "Trajno izbrišem vse meritve samo s SD kartice? Zgodovina v Firebase bo ostala nespremenjena.": "Permanently delete all measurements only from the SD card? Firebase history will remain unchanged.",
    "Namesti posodobitev": "Install update", "Začni posodobitev": "Start update", "Napravo posodobim na verzijo {version}? Med prenosom naprave ne izklapljaj in ne prekinjaj povezave Wi-Fi.": "Update the device to version {version}? Do not turn off the device or interrupt the Wi‑Fi connection during the transfer.", "Prekliči deljeni dostop": "Revoke shared access", "Prekličem dostop samo za ogled uporabniku {user}?": "Revoke view-only access for user {user}?", "Odregistriraj panj": "Unclaim hive", "Odregistriraj": "Unclaim", "Odstrani": "Remove", "Trajno izbriši napravo": "Permanently delete device",
    "Ali želiš panj »{name}« odregistrirati? Meritve in zgodovina ostanejo v bazi, vsi deljeni dostopi pa bodo preklicani. Za ponoven dostop bo panj treba registrirati z aktivacijsko kodo.": "Do you want to unclaim hive “{name}”? Measurements and history remain in the database, but all shared access will be revoked. The hive will need to be registered with its activation code to regain access.", "Ali želiš deljeni panj »{name}« odstraniti iz svojega računa? Lastnik panja, meritve in zgodovina ostanejo nespremenjeni. Za ponoven dostop boš potreboval novo povabilo lastnika.": "Do you want to remove shared hive “{name}” from your account? The hive owner, measurements, and history remain unchanged. You will need a new invitation from the owner to regain access.",
    "Ali želiš panj {deviceId} odjaviti od {owner}? Meritve, SD sinhronizacija in aktivacijska koda ostanejo shranjeni, vsi deljeni dostopi pa bodo preklicani. Panj bo nato mogoče registrirati na drug račun.": "Do you want to unclaim hive {deviceId} from {owner}? Measurements, SD synchronization, and the activation code remain stored, but all shared access will be revoked. The hive can then be registered to another account.", "Ali želiš napravo {deviceId} trajno izbrisati iz Firebase? Izbrisani bodo lastništvo, meritve, agregati, stanje naprave, ukazi, aktivacijska koda, zahtevki in deljeni dostopi. Tega ni mogoče razveljaviti. Če je naprava še povezana, lahko z istim firmwareom začne znova pošiljati nove podatke.": "Do you want to permanently delete device {deviceId} from Firebase? Ownership, measurements, aggregates, device status, commands, activation code, claims, and shared access will be deleted. This cannot be undone. If the device is still connected, it may begin sending new data again with the same firmware.",
    "uporabnika {email}": "user {email}", "trenutnega uporabnika": "the current user",
    "Dostopna točka bo na voljo še približno {seconds} s. Za nadaljnjo uporabo priporočamo spletno nadzorno ploščo; lokalni IP lahko preveriš v usmerjevalniku.": "The access point will remain available for approximately {seconds} s. For continued use, we recommend the cloud dashboard; you can find the local IP address in your router.",
    "Dostopna točka se je zaprla. Poveži se z domačim Wi‑Fi omrežjem in nadaljuj v spletni nadzorni plošči; lokalni IP lahko preveriš v usmerjevalniku.": "The access point has closed. Connect to your home Wi‑Fi network and continue in the cloud dashboard; you can find the local IP address in your router.",
    "Naprava prehaja v omrežje {ssid}. Ko bo povezava vzpostavljena, za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.": "The device is switching to the {ssid} network. Once connected, we recommend the cloud dashboard for viewing measurements and managing the hive.",
    "Shranjeno omrežje bo izbrisano. Naprava bo odprla dostopno točko {ssid}.": "The saved network will be deleted. The device will open the {ssid} access point.",
    "V nastavitvah Wi‑Fi telefona ali računalnika izberi {ssid}, nato odpri {url} in ponovno vnesi poverilnice.": "In your phone or computer Wi‑Fi settings, select {ssid}, then open {url} and enter the credentials again.",
    "Naprava je povezana z internetom prek omrežja {ssid}. Za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.": "The device is connected to the internet through {ssid}. We recommend the cloud dashboard for viewing measurements and managing the hive.",
    "SD kartica trenutno ni dosegljiva; lokalno stanje naprave ostaja na voljo.": "The SD card is currently unavailable; the local device status remains available.", "Lokalna zgodovina trenutno ni dosegljiva.": "Local history is currently unavailable.",
    "Naprava je povezana v Wi‑Fi omrežje {ssid}. Nastavitve lahko po potrebi spremeniš ali izbrišeš.": "The device is connected to the {ssid} Wi‑Fi network. You can change or delete the settings as needed.",
    "Pregledujem in obnavljam dneve: {completed}/{total}. Manjkajočih ali neskladnih dni: {missing}.{progress}": "Reviewing and restoring days: {completed}/{total}. Missing or inconsistent days: {missing}.{progress}",
    "Prenesenih meritev: {uploaded}/{total}.": "Measurements transferred: {uploaded}/{total}.", "Zadnji potrjen zapis: {time}.": "Last confirmed record: {time}.",
    "Zadnji ukaz za brisanje je bil uspešno zaključen: {time}.": "The last delete command completed successfully: {time}.",
    "Wi-Fi poverilnice so izbrisane ({time}). Poveži se s provisioning Wi-Fi omrežjem naprave in odpri 192.168.4.1.": "Wi-Fi credentials were deleted ({time}). Connect to the device provisioning Wi-Fi network and open 192.168.4.1.",
    "Naprava je povezana z internetom. Za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.": "The device is connected to the internet. We recommend the cloud dashboard for viewing measurements and managing the hive.",
    "Dopolnjujem dnevni indeks Firebase brez ponovnega prenosa meritev …": "Updating the daily Firebase index without retransmitting measurements …", "Čakam na potrditev prvega zapisa.": "Waiting for confirmation of the first record.",
    "Wi-Fi poverilnice so izbrisane. Poveži se s provisioning Wi-Fi omrežjem naprave in odpri 192.168.4.1.": "Wi-Fi credentials were deleted. Connect to the device provisioning Wi-Fi network and open 192.168.4.1.",
    "Skupni napredek OTA: {value} %": "Overall OTA progress: {value} %", "neznanem času": "an unknown time",
    "Prenašanje lokalne strani": "Downloading local site", "Nameščanje lokalne strani": "Installing local site", "Prenašanje programske opreme": "Downloading firmware", "Posodobitev je uspešna": "Update successful",
    "E-poštnega naslova lastnika ni bilo mogoče posodobiti.": "The owner's email address could not be updated.", "Javnega prikaza vremena ni bilo mogoče posodobiti.": "The public weather display could not be updated.", "Kraja za deljeni prikaz vremena ni bilo mogoče določiti.": "The location for the shared weather display could not be determined.", "Vremenskih podatkov ni bilo mogoče pridobiti.": "Weather data could not be retrieved.",
    "Nastavitev vremena ni bilo mogoče shraniti.": "Weather settings could not be saved.", "Nastavitve vremena za deljeni panj ni bilo mogoče shraniti.": "Weather settings for the shared hive could not be saved.", "Kraja za shranjeno lokacijo ni bilo mogoče določiti.": "The place for the saved location could not be determined.", "Kraja za lokacijo brskalnika ni bilo mogoče določiti.": "The place for the browser location could not be determined.", "Lokacije brskalnika ni bilo mogoče pridobiti.": "The browser location could not be retrieved.", "Kraja ni bilo mogoče poiskati.": "The place could not be found.",
    "Menjava omrežja": "Changing network", "Naprava se povezuje z novim Wi‑Fi omrežjem": "The device is connecting to a new Wi‑Fi network", "Tudi telefon ali računalnik poveži z novim omrežjem. Za lokalni dostop počakaj nekaj sekund in odpri stalni naslov; če .local ne deluje, novi IP preveri v usmerjevalniku.": "Connect your phone or computer to the new network as well. For local access, wait a few seconds and open the permanent address; if .local does not work, check the new IP address in your router.", "Tudi telefon ali računalnik poveži z novim omrežjem. Za lokalni dostop novi IP preveri med povezanimi napravami v usmerjevalniku.": "Connect your phone or computer to the new network as well. For local access, find the new IP address among connected devices in your router.",
    "dostopna točka naprave": "device access point", "Ponovno poveži napravo": "Reconnect the device", "Naslov nastavitev na dostopni točki": "Setup address on the access point", "SD kartica javlja napako; sinhronizacija s Firebase trenutno ni mogoča.": "The SD card reports an error; synchronization with Firebase is currently unavailable.", "SD kartica ni dosegljiva; sinhronizacija s Firebase trenutno ni mogoča.": "The SD card is unavailable; synchronization with Firebase is currently unavailable.",
    "Ukaz za brisanje čaka, da ga naprava prevzame.": "The delete command is waiting for the device.", "Naprava briše SD dnevnik in cloud zgodovino …": "The device is deleting the SD log and cloud history …", "Zadnji ukaz za brisanje je bil uspešno zaključen.": "The last delete command completed successfully.", "IZBRIŠI": "DELETE", "Izbriši Wi-Fi": "Delete Wi-Fi", "Naslova ni bilo mogoče kopirati": "The address could not be copied", "Skeniranje Wi‑Fi omrežij ni uspelo": "Wi‑Fi network scan failed", "Skeniranje Wi‑Fi omrežij je poteklo": "Wi‑Fi network scan timed out",
    "Odstrani panj in vse uteži s ploščadi. Trenutno stanje bo nastavljeno na 0,00 kg.": "Remove the hive and all weights from the platform. The current state will be set to 0.00 kg.", "Tariranja ni bilo mogoče začeti": "Taring could not be started", "Kalibracije BME680 ni bilo mogoče začeti": "BME680 calibration could not be started", "Nastavitev časa ni uspela": "Time setting failed", "Za nastavitev časa mora biti izbrana naprava online": "The selected device must be online to set the time", "Zahtevana različica ni novejša.": "The requested version is not newer.", "uPlot se ni pravilno naložil.": "uPlot did not load correctly.", "Google prijava ni vrnila veljavnega identifikacijskega žetona.": "Google sign-in did not return a valid ID token.", "Nativne Google seje ni bilo mogoče počistiti.": "The native Google session could not be cleared.",
    "Lokacija panja ({latitude}, {longitude})": "Hive location ({latitude}, {longitude})",
    "Lokacija brskalnika ({latitude}, {longitude})": "Browser location ({latitude}, {longitude})",
    "Firmware je že nameščen.": "Firmware is already installed.",
    "Zadnji preneseni zapis: {time}.": "Last transferred record: {time}.",
    "Trenutna odmika: temperatura {temperature}, vlaga {humidity}.": "Current offsets: temperature {temperature}, humidity {humidity}.",
    "{days} dni {hours} h {minutes} min": "{days} days {hours} h {minutes} min",
  },
};
const staticTextSources = new Map();
const staticAttributeSources = new WeakMap();
const chartSeriesVisibility = {
  climate: { 1: true, 2: true },
  weight: { 1: true },
};

const elements = {
  appFavicon: document.querySelector("#app-favicon"),
  brandIcon: document.querySelector("#brand-icon"),
  localBrandIcon: document.querySelector("#brand-icon-local"),
  menuToggle: document.querySelector("#menu-toggle"),
  topNavigation: document.querySelector("#top-navigation"),
  appReturnLink: document.querySelector("#app-return-link"),
  themeSwitchers: [...document.querySelectorAll(".theme-switcher")],
  themeChoices: [...document.querySelectorAll("[data-theme-choice]")],
  themeLabels: [...document.querySelectorAll("#theme-label, [data-theme-label]")],
  languageFlags: [...document.querySelectorAll("[data-language-flag]")],
  languageLabels: [...document.querySelectorAll("[data-language-label]")],
  languageSwitchers: [...document.querySelectorAll(".language-switcher")],
  languageButtons: [...document.querySelectorAll("[data-language]")],
  overviewNavigationItem: document.querySelector("#overview-nav-item"),
  historyNavigationItem: document.querySelector("#history-nav-item"),
  updatesNavigationItem: document.querySelector("#updates-nav-item"),
  navigationButtons: [...document.querySelectorAll("[data-view-target]")],
  viewPanels: [...document.querySelectorAll("[data-view-panel]")],
  connectionStatus: document.querySelector("#connection-status"),
  connectionText: document.querySelector("#connection-text"),
  hardwareAlertStatus: document.querySelector("#hardware-alert-status"),
  hardwareAlertText: document.querySelector("#hardware-alert-text"),
  componentAlertPanel: document.querySelector("#component-alert-panel"),
  componentAlertList: document.querySelector("#component-alert-list"),
  authTrigger: document.querySelector("#auth-trigger"),
  authDialog: document.querySelector("#auth-dialog"),
  authForm: document.querySelector("#auth-form"),
  authEmail: document.querySelector("#auth-email"),
  authPassword: document.querySelector("#auth-password"),
  authRegister: document.querySelector("#auth-register"),
  authGoogle: document.querySelector("#auth-google"),
  authClose: document.querySelector("#auth-close"),
  authStatus: document.querySelector("#auth-status"),
  accountSection: document.querySelector("#account-section"),
  accountHeading: document.querySelector("#account-heading"),
  accountEmail: document.querySelector("#account-email"),
  accountAvatar: document.querySelector("#account-avatar"),
  accountAvatarImage: document.querySelector("#account-avatar-image"),
  accountAvatarInitials: document.querySelector("#account-avatar-initials"),
  authTriggerAvatar: document.querySelector("#auth-trigger-avatar"),
  authTriggerLabel: document.querySelector("#auth-trigger-label"),
  authSignout: document.querySelector("#auth-signout"),
  accountManagement: document.querySelector("#account-management"),
  weatherSettingsPanel: document.querySelector("#weather-settings-panel"),
  weatherSettingsForm: document.querySelector("#weather-settings-form"),
  weatherEnabled: document.querySelector("#weather-enabled"),
  weatherSettingsFields: document.querySelector("#weather-settings-fields"),
  weatherForecastDays: document.querySelector("#weather-forecast-days"),
  weatherSavedLocation: document.querySelector("#weather-saved-location"),
  weatherUseLocation: document.querySelector("#weather-use-location"),
  weatherLocationQuery: document.querySelector("#weather-location-query"),
  weatherSearchLocation: document.querySelector("#weather-search-location"),
  weatherLocationResults: document.querySelector("#weather-location-results"),
  weatherSettingsStatus: document.querySelector("#weather-settings-status"),
  sharedWeatherSettingsPanel: document.querySelector("#shared-weather-settings-panel"),
  sharedWeatherEnabled: document.querySelector("#shared-weather-enabled"),
  sharedWeatherSettingsStatus: document.querySelector("#shared-weather-settings-status"),
  measurementSettingsPanel: document.querySelector("#measurement-settings-panel"),
  measurementSettingsForm: document.querySelector("#measurement-settings-form"),
  weightDisplayDecimals: document.querySelector("#weight-display-decimals"),
  measurementIntervalSeconds: document.querySelector("#measurement-interval-seconds"),
  sdArchiveIntervalMinutes: document.querySelector("#sd-archive-interval-minutes"),
  measurementSettingsStatus: document.querySelector("#measurement-settings-status"),
  accountFormStack: document.querySelector("#account-form-stack"),
  deviceSelectionCard: document.querySelector("#device-selection-card"),
  devicePageSubtitle: document.querySelector("#device-page-subtitle"),
  deviceDetailsPanel: document.querySelector("#device-details-panel"),
  cloudDeviceSelect: document.querySelector("#cloud-device-select"),
  adminDeviceOverview: document.querySelector("#admin-device-overview"),
  adminDeviceList: document.querySelector("#admin-device-list"),
  deviceListEyebrow: document.querySelector("#device-list-eyebrow"),
  selectedDeviceDescription: document.querySelector("#selected-device-description"),
  unclaimDevice: document.querySelector("#unclaim-device"),
  unclaimDeviceStatus: document.querySelector("#unclaim-device-status"),
  deleteDeviceHistory: document.querySelector("#delete-device-history"),
  historyManagementStatus: document.querySelector("#history-management-status"),
  networkResetControl: document.querySelector("#network-reset-control"),
  clearCloudWifiCredentials: document.querySelector("#clear-cloud-wifi-credentials"),
  cloudWifiResetStatus: document.querySelector("#cloud-wifi-reset-status"),
  claimDeviceForm: document.querySelector("#claim-device-form"),
  claimDeviceName: document.querySelector("#claim-device-name"),
  claimDeviceId: document.querySelector("#claim-device-id"),
  claimActivationCode: document.querySelector("#claim-activation-code"),
  claimDeviceStatus: document.querySelector("#claim-device-status"),
  shareDevicePanel: document.querySelector("#share-device-panel"),
  shareDeviceForm: document.querySelector("#share-device-form"),
  shareRecipientEmail: document.querySelector("#share-recipient-email"),
  createShareInvitation: document.querySelector("#create-share-invitation"),
  shareInvitationResult: document.querySelector("#share-invitation-result"),
  shareInvitationCode: document.querySelector("#share-invitation-code"),
  shareInvitationDetail: document.querySelector("#share-invitation-detail"),
  copyShareInvitation: document.querySelector("#copy-share-invitation"),
  sharedViewerList: document.querySelector("#shared-viewer-list"),
  shareDeviceStatus: document.querySelector("#share-device-status"),
  acceptShareForm: document.querySelector("#accept-share-form"),
  acceptShareCode: document.querySelector("#accept-share-code"),
  acceptShareStatus: document.querySelector("#accept-share-status"),
  temperature: document.querySelector("#temperature-value"),
  humidity: document.querySelector("#humidity-value"),
  weight: document.querySelector("#weight-value"),
  temperatureRange: document.querySelector("#temperature-range"),
  humidityRange: document.querySelector("#humidity-range"),
  weightRange: document.querySelector("#weight-range"),
  temperatureSparkline: document.querySelector("#temperature-sparkline"),
  humiditySparkline: document.querySelector("#humidity-sparkline"),
  weightSparkline: document.querySelector("#weight-sparkline"),
  temperatureSparklineFrame: document.querySelector("#temperature-sparkline-frame"),
  humiditySparklineFrame: document.querySelector("#humidity-sparkline-frame"),
  weightSparklineFrame: document.querySelector("#weight-sparkline-frame"),
  latestTime: document.querySelector("#last-measurement-time"),
  weightChangeDay: document.querySelector("#weight-change-day"),
  weightChangeDayTrend: document.querySelector("#weight-change-day-trend"),
  weightChangeDayTrendLabel: document.querySelector("#weight-change-day-trend-label"),
  weightChangeDayDetail: document.querySelector("#weight-change-day-detail"),
  weightChangeWeekChart: document.querySelector("#weight-change-week-chart"),
  weatherOverview: document.querySelector("#weather-overview"),
  weatherOverviewHeading: document.querySelector("#weather-overview-heading"),
  weatherLocationName: document.querySelector("#weather-location-name"),
  weatherUpdated: document.querySelector("#weather-updated"),
  weatherCurrentIcon: document.querySelector("#weather-current-icon"),
  weatherCurrentCondition: document.querySelector("#weather-current-condition"),
  weatherCurrentTemperature: document.querySelector("#weather-current-temperature"),
  weatherCurrentHumidity: document.querySelector("#weather-current-humidity"),
  weatherCurrentPressure: document.querySelector("#weather-current-pressure"),
  weatherCurrentWind: document.querySelector("#weather-current-wind"),
  weatherForecast: document.querySelector("#weather-forecast"),
  historySummary: document.querySelector("#history-summary"),
  ipAddress: document.querySelector("#ip-address"),
  cloudWifiSsidCard: document.querySelector("#cloud-wifi-ssid-card"),
  cloudWifiSsid: document.querySelector("#cloud-wifi-ssid"),
  wifiSignal: document.querySelector("#wifi-signal"),
  uptime: document.querySelector("#uptime"),
  deviceId: document.querySelector("#device-id"),
  deviceStateCard: document.querySelector("#device-state-card"),
  deviceStatusDot: document.querySelector("#device-status-dot"),
  deviceOnlineStatus: document.querySelector("#device-online-status"),
  deviceLastSeen: document.querySelector("#device-last-seen"),
  firmwareVersion: document.querySelector("#firmware-version"),
  sdStatus: document.querySelector("#sd-status"),
  sdStatusDetail: document.querySelector("#sd-status-detail"),
  sdCard: document.querySelector(".sd-card"),
  componentBme680: document.querySelector("#component-bme680"),
  componentHx711: document.querySelector("#component-hx711"),
  componentDs3231: document.querySelector("#component-ds3231"),
  componentSdCard: document.querySelector("#component-sd-card"),
  localLoadCellTare: document.querySelector("#local-load-cell-tare"),
  localLoadCellTareStatus: document.querySelector("#local-load-cell-tare-status"),
  cloudLoadCellTare: document.querySelector("#cloud-load-cell-tare"),
  cloudLoadCellTareStatus: document.querySelector("#cloud-load-cell-tare-status"),
  localBme680CalibrationForm: document.querySelector("#local-bme680-calibration-form"),
  localTemperatureOffset: document.querySelector("#local-temperature-offset"),
  localHumidityOffset: document.querySelector("#local-humidity-offset"),
  localSaveBme680Calibration: document.querySelector("#local-save-bme680-calibration"),
  localBme680CalibrationStatus: document.querySelector("#local-bme680-calibration-status"),
  cloudBme680CalibrationForm: document.querySelector("#cloud-bme680-calibration-form"),
  cloudTemperatureOffset: document.querySelector("#cloud-temperature-offset"),
  cloudHumidityOffset: document.querySelector("#cloud-humidity-offset"),
  cloudSaveBme680Calibration: document.querySelector("#cloud-save-bme680-calibration"),
  cloudBme680CalibrationStatus: document.querySelector("#cloud-bme680-calibration-status"),
  rangeTrigger: document.querySelector("#date-range-trigger"),
  rangeValue: document.querySelector("#date-range-value"),
  rangeDialog: document.querySelector("#date-range-dialog"),
  rangeDialogValue: document.querySelector("#date-range-dialog-value"),
  calendarMonthLabel: document.querySelector("#calendar-month-label"),
  calendarDays: document.querySelector("#calendar-days"),
  startTime: document.querySelector("#range-start-time"),
  endTime: document.querySelector("#range-end-time"),
  updatesHeading: document.querySelector("#updates-heading"),
  updatesSubtitle: document.querySelector("#updates-subtitle"),
  otaSection: document.querySelector("#ota-section"),
  otaCard: document.querySelector("#ota-card"),
  otaLabel: document.querySelector("#ota-label"),
  otaCurrentVersion: document.querySelector("#ota-current-version"),
  otaVersion: document.querySelector("#ota-version"),
  otaDetail: document.querySelector("#ota-detail"),
  otaDeviceStatus: document.querySelector("#ota-device-status"),
  otaProgress: document.querySelector("#ota-progress"),
  otaProgressTrack: document.querySelector("#ota-progress-track"),
  otaProgressBar: document.querySelector("#ota-progress-bar"),
  otaProgressText: document.querySelector("#ota-progress-text"),
  otaActions: document.querySelector("#ota-actions"),
  otaInstall: document.querySelector("#ota-install"),
  otaIgnore: document.querySelector("#ota-ignore"),
  otaSafetyNotice: document.querySelector("#ota-safety-notice"),
  localManualUpdateSection: document.querySelector("#local-manual-update-section"),
  localCurrentVersion: document.querySelector("#local-current-version"),
  localElegantOtaLink: document.querySelector("#local-elegantota-link"),
  localOtaWarningDialog: document.querySelector("#local-ota-warning-dialog"),
  localOtaWarningCancel: document.querySelector("#local-ota-warning-cancel"),
  localOtaWarningProceed: document.querySelector("#local-ota-warning-proceed"),
  inactivityWarningDialog: document.querySelector("#inactivity-warning-dialog"),
  inactivityWarningDescription: document.querySelector("#inactivity-warning-description"),
  inactivityWarningStaySignedIn: document.querySelector("#inactivity-warning-stay-signed-in"),
  provisioningSection: document.querySelector("#provisioning-section"),
  provisioningDescription: document.querySelector("#provisioning-description"),
  wifiForm: document.querySelector("#wifi-form"),
  wifiSsid: document.querySelector("#wifi-ssid"),
  wifiPassword: document.querySelector("#wifi-password"),
  wifiPasswordToggle: document.querySelector("#wifi-password-toggle"),
  wifiFormStatus: document.querySelector("#wifi-form-status"),
  wifiScan: document.querySelector("#wifi-scan"),
  wifiScanStatus: document.querySelector("#wifi-scan-status"),
  wifiNetworks: document.querySelector("#wifi-networks"),
  wifiForget: document.querySelector("#wifi-forget"),
  localDeviceId: document.querySelector("#local-device-id"),
  activationCode: document.querySelector("#activation-code"),
  connectedWifiSsid: document.querySelector("#connected-wifi-ssid"),
  wifiConnectionResult: document.querySelector("#wifi-connection-result"),
  wifiConnectionResultEyebrow: document.querySelector("#wifi-connection-result-eyebrow"),
  wifiConnectionResultHeading: document.querySelector("#wifi-connection-result-heading"),
  wifiConnectionResultMessage: document.querySelector("#wifi-connection-result-message"),
  wifiCloudCard: document.querySelector("#wifi-cloud-card"),
  wifiCloudAddress: document.querySelector("#wifi-cloud-address"),
  wifiAddressCard: document.querySelector("#wifi-address-card"),
  wifiAddressLabel: document.querySelector("#wifi-address-label"),
  wifiNewIpAddress: document.querySelector("#wifi-new-ip-address"),
  wifiLocalHostnameRow: document.querySelector("#wifi-local-hostname-row"),
  wifiNewLocalHostname: document.querySelector("#wifi-new-local-hostname"),
  wifiTransitionNotice: document.querySelector("#wifi-transition-notice"),
  wifiCopyAddress: document.querySelector("#wifi-copy-address"),
  wifiOpenAddress: document.querySelector("#wifi-open-address"),
  wifiOpenCloud: document.querySelector("#wifi-open-cloud"),
  wifiCopyStatus: document.querySelector("#wifi-copy-status"),
  localActivationCard: document.querySelector("#local-activation-card"),
  localActivationCode: document.querySelector("#local-activation-code"),
  cloudSyncStatus: document.querySelector("#cloud-sync-status"),
  cloudResync: document.querySelector("#cloud-resync"),
  cloudSyncControls: document.querySelector("#cloud-sync-controls"),
  openMeasurementLog: document.querySelector("#open-measurement-log"),
  downloadMeasurementLog: document.querySelector("#download-measurement-log"),
  deleteLocalMeasurementLog: document.querySelector("#delete-local-measurement-log"),
  localMeasurementLogStatus: document.querySelector("#local-measurement-log-status"),
  deviceCurrentTime: document.querySelector("#device-current-time"),
  deviceTimeSource: document.querySelector("#device-time-source"),
  rtcStatus: document.querySelector("#rtc-status"),
  deviceTimeForm: document.querySelector("#device-time-form"),
  deviceDateTime: document.querySelector("#device-date-time"),
  setDeviceTime: document.querySelector("#set-device-time"),
  syncDeviceTime: document.querySelector("#sync-device-time"),
  deviceTimeStatus: document.querySelector("#device-time-status"),
  confirmationDialog: document.querySelector("#confirmation-dialog"),
  confirmationDialogForm: document.querySelector("#confirmation-dialog-form"),
  confirmationDialogEyebrow: document.querySelector("#confirmation-dialog-eyebrow"),
  confirmationDialogTitle: document.querySelector("#confirmation-dialog-title"),
  confirmationDialogMessage: document.querySelector("#confirmation-dialog-message"),
  confirmationDialogInputLabel: document.querySelector("#confirmation-dialog-input-label"),
  confirmationDialogInputHint: document.querySelector("#confirmation-dialog-input-hint"),
  confirmationDialogInput: document.querySelector("#confirmation-dialog-input"),
  confirmationDialogCancel: document.querySelector("#confirmation-dialog-cancel"),
  confirmationDialogConfirm: document.querySelector("#confirmation-dialog-confirm"),
};

let climateChart;
let weightChart;
let climateChartHasUserZoom = false;
let weightChartHasUserZoom = false;
let lastZoomedChartType;
let scheduledCloudZoomAggregation = 0;
let stopHistoryListeners = [];
let cloudHistoryReadingsByKey = new Map();
let cloudHistoryRequestGeneration = 0;
const cloudHistorySessionCache = new Map();
let scheduledCloudHistoryRender = 0;
let refreshHistory;
let latestDeviceStatus;
let isLocalDashboard = false;
let appliedRange;
let draftRange;
let activeRelativeHistoryPreset;
let draftRelativeHistoryPreset;
let calendarMonth;
let selectingRangeEnd = false;
let firebaseDatabase;
let latestFirmwareVersion = "";
let availableOtaRelease;
let otaCommandPending = false;
let latestOtaState = "";
let latestOtaStatus;
let uPlotLoading;
let chartResizeObserver;
let scheduledChartResize = 0;
let latestHistoryReadings = [];
let latestHistoryAlreadyAggregated = false;
let cloudDevicePath = "";
let firebaseAuth;
let firebaseAuthModule;
let firebaseDatabaseUrl = "";
let currentCloudUser;
let stopCloudDeviceListListener;
let stopCloudSharedDeviceListListener;
let stopAdminDeviceSummaryListeners = [];
let adminDeviceDirectoryRequestGeneration = 0;
let ownedCloudDevicesLoaded = false;
let sharedCloudDevicesLoaded = false;
let stopCloudDeviceListeners = [];
let cloudDevices = {};
let ownedCloudDevices = {};
let sharedCloudDevices = {};
let activeShareInvitationCode = "";
const ownerEmailSyncedDeviceIds = new Set();
let authControlsInitialized = false;
let latestHistoryManagementStatus;
let latestNetworkResetStatus;
let latestLoadCellTareStatus;
let latestBme680CalibrationStatus;
let latestTimeStatus;
let latestNetworkStatus;
let latestSDCardStatus;
let dashboardDataSourceReady = false;
let historyViewLoading;
let localHistoryRequestGeneration = 0;
let bme680CalibrationPendingUntil = 0;
let bme680CalibrationRequestedAt = 0;
let wifiTransitionDeadline = 0;
let wifiTransitionAddress = "";
let wifiTransitionMode = "idle";
let wifiTransitionProbeGeneration = 0;
let latestWeatherSettings;
let latestMeasurementSettings;
let latestMeasurement;
let latestOverviewAnalytics;
let overviewAnalyticsRequestGeneration = 0;
let localHistoryRequestQueue = Promise.resolve();
const localOverviewHistorySessionCache = {
  readingsByTimestamp: new Map(),
  coveredRanges: [],
};
const nightReferenceSessionCache = new Map();
let weightChangeRequestGeneration = 0;
let weightChangeRefreshTimer;
let latestWeightChangeReferences = [];
let latestWeightChangeNightDates = [];
let weatherFetchController;
let weatherRequestKey = "";
let weatherLastFetchedAt = 0;
let weatherLocationSearchResults = [];
let weatherLocationLookupKey = "";
let weatherPublicPublishKey = "";
let weatherSharedLocationLookupKey = "";
let latestSharedWeatherPublicSettings;
let sharedWeatherEnabled = false;
let latestSharedViewerAccess;
let confirmationDialogResolver;
let confirmationDialogRequiredText = "";
let cloudRealtimePaused = false;
let cloudInactivityWarningActive = false;
let cloudInactivityLastActivityAt = 0;
let cloudInactivityCheckTimer;
let cloudLogoutCountdownTimer;
let cloudInactivityChannel;
let cloudInactivityTrackingInitialized = false;

const OTA_STATE_LABELS = {
  preparing: "Priprava posodobitve",
  installing: "Namestitev posodobitve",
  downloading_filesystem: "Prenašanje lokalne strani",
  installing_filesystem: "Nameščanje lokalne strani",
  downloading: "Prenašanje programske opreme",
  verifying: "Preverjanje programske opreme",
  restarting: "Ponovni zagon naprave",
  installed: "Posodobitev je uspešna",
  ignored: "Posodobitev je prezrta",
  error: "Napaka OTA",
};

const OTA_ACTIVE_STATES = new Set([
  "preparing",
  "downloading_filesystem",
  "installing_filesystem",
  "downloading",
  "verifying",
  "restarting",
]);

const OTA_TERMINAL_STATES = new Set(["installed", "ignored", "error"]);

function getCssColor(variableName) {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

function getChartTheme() {
  return {
    text: getCssColor("--text"),
    textSoft: getCssColor("--text-soft"),
    border: getCssColor("--border"),
    surface: getCssColor("--surface-solid"),
    grid: getCssColor("--chart-grid"),
    temperature: getCssColor("--temperature"),
    humidity: getCssColor("--humidity"),
    weight: getCssColor("--weight"),
  };
}

function updateChartTheme() {
  if (!climateChart && !weightChart) return;
  const climateZoom = climateChartHasUserZoom ? getChartXRange(climateChart) : undefined;
  const weightZoom = weightChartHasUserZoom ? getChartXRange(weightChart) : undefined;
  destroyCharts();
  createCharts({ climateZoom, weightZoom });
}

function normalizeTheme(theme) {
  if (THEME_OPTIONS[theme]) return theme;
  return "forest";
}

function applyTheme(theme, persist = true) {
  const selectedTheme = normalizeTheme(theme);
  document.documentElement.dataset.theme = selectedTheme;
  const themeLabel = translateText(THEME_OPTIONS[selectedTheme].label);
  elements.themeLabels.forEach((element) => { element.textContent = themeLabel; });
  elements.themeChoices.forEach((choice) => {
    choice.setAttribute("aria-pressed", String(choice.dataset.themeChoice === selectedTheme));
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", getCssColor("--bg"));
  if (persist) localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  updateChartTheme();
}

function initializeTheme() {
  applyTheme(document.documentElement.dataset.theme, false);
  elements.themeChoices.forEach((choice) => choice.addEventListener("click", () => {
    applyTheme(choice.dataset.themeChoice);
    elements.themeSwitchers.forEach((switcher) => { switcher.open = false; });
  }));
}

function applyLanguage(language, persist = true) {
  const selectedLanguage = LANGUAGE_OPTIONS[language] ? language : "sl";
  const option = LANGUAGE_OPTIONS[selectedLanguage];
  document.documentElement.lang = selectedLanguage;
  translateStaticContent(selectedLanguage);
  elements.languageFlags.forEach((element) => { element.textContent = option.flag; });
  elements.languageLabels.forEach((element) => { element.textContent = option.label; });
  elements.languageButtons.forEach((button) => {
    button.setAttribute("aria-current", String(button.dataset.language === selectedLanguage));
  });
  elements.languageSwitchers.forEach((switcher) => { switcher.open = false; });
  if (persist) localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
  applyTheme(document.documentElement.dataset.theme, false);
  if (dashboardDataSourceReady) refreshTranslatedDashboard();
}

function refreshTranslatedDashboard() {
  document.querySelectorAll("[data-i18n-source]").forEach((element) => {
    let values = {};
    try {
      values = JSON.parse(element.dataset.i18nValues || "{}");
    } catch {
      values = {};
    }
    element.textContent = formatTranslatedText(element.dataset.i18nSource, values);
  });
  renderHeaderDeviceState();
  if (!isLocalDashboard) {
    configureCloudAccountView();
    configureSelectedCloudDeviceAccess(cloudDevicePath.replace("devices/", ""));
    renderCloudDeviceSelector();
    const selectedDeviceId = cloudDevicePath.replace("devices/", "");
    if (getCloudDeviceAccessRole(selectedDeviceId) === "owner" && latestSharedViewerAccess !== undefined) {
      renderSharedViewerList(selectedDeviceId, latestSharedViewerAccess);
    }
  }
  if (latestMeasurement) renderLatestMeasurement(latestMeasurement);
  renderOverviewAnalytics();
  renderWeightChangeOverview(latestWeightChangeReferences, latestWeightChangeNightDates);
  if (latestDeviceStatus) renderDeviceStatus(latestDeviceStatus);
  if (latestSDCardStatus) renderSDStatus(latestSDCardStatus);
  if (latestTimeStatus) renderTimeStatus(latestTimeStatus);
  renderWeatherSettings(latestWeatherSettings);
  updateWeatherOverviewTitle();
  if (latestHistoryReadings.length) renderHistory(latestHistoryReadings, latestHistoryAlreadyAggregated);
  else if (appliedRange) renderHistory([], latestHistoryAlreadyAggregated);
}

function translateText(text, language = getDashboardLanguage()) {
  return TRANSLATIONS[language]?.[text] ?? text;
}

function formatTranslatedText(text, values = {}) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), translateText(text));
}

function setTranslatedElementText(element, text, values = {}) {
  element.dataset.i18nSource = text;
  element.dataset.i18nValues = JSON.stringify(values);
  element.textContent = formatTranslatedText(text, values);
}

function translateStaticContent(language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE"].includes(parent.tagName) || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const source = staticTextSources.get(node) ?? node.nodeValue;
    staticTextSources.set(node, source);
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    node.nodeValue = `${leading}${translateText(source.trim(), language)}${trailing}`;
  });
  document.querySelectorAll("[aria-label], [title], [placeholder]").forEach((element) => {
    const sources = staticAttributeSources.get(element) ?? {};
    ["aria-label", "title", "placeholder"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const source = sources[attribute] ?? element.getAttribute(attribute);
      sources[attribute] = source;
      element.setAttribute(attribute, translateText(source, language));
    });
    staticAttributeSources.set(element, sources);
  });
  document.title = translateText("Pametni čebelnjak", language);
}

function initializeLanguage() {
  const requestedLanguage = new URLSearchParams(window.location.search).get("language");
  applyLanguage(LANGUAGE_OPTIONS[requestedLanguage] ? requestedLanguage : document.documentElement.lang, Boolean(LANGUAGE_OPTIONS[requestedLanguage]));
  elements.languageButtons.forEach((button) => button.addEventListener("click", () => {
    applyLanguage(button.dataset.language);
  }));
}

function applyBrandAssets(useLocalAssets) {
  const source = useLocalAssets ? "assets/favicon2.svg" : "assets/favicon.png";
  elements.appFavicon.href = source;
  elements.appFavicon.type = useLocalAssets ? "image/svg+xml" : "image/png";
  elements.brandIcon.hidden = useLocalAssets;
  elements.localBrandIcon.hidden = !useLocalAssets;
  if (!useLocalAssets) elements.brandIcon.src = source;
}

function showView(viewName, updateLocation = true) {
  const emptyCloudAccount = isCloudAccountWithoutDevices();
  const allowedViewName = emptyCloudAccount || (viewName === "updates" && isSharedCloudDeviceSelected()) ? "device" : viewName;
  const targetPanel = elements.viewPanels.find((panel) => panel.dataset.viewPanel === allowedViewName);
  const selectedView = targetPanel ? allowedViewName : DEFAULT_VIEW;

  elements.viewPanels.forEach((panel) => {
    const isActive = panel.dataset.viewPanel === selectedView;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
  elements.navigationButtons.forEach((button) => {
    const isActive = button.dataset.viewTarget === selectedView && button.classList.contains("nav-link");
    button.classList.toggle("active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  elements.topNavigation.classList.remove("open");
  elements.menuToggle.setAttribute("aria-expanded", "false");
  if (updateLocation) history.replaceState(null, "", `#${selectedView}`);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (selectedView === "history") {
    ensureHistoryViewReady().catch(showDataError);
  }
  if (selectedView === "overview") {
    void refreshWeatherForecast();
    void refreshWeightChangeOverview();
    void refreshOverviewAnalytics();
  }
}

function isHistoryViewActive() {
  return elements.viewPanels.some((panel) => panel.dataset.viewPanel === "history" && !panel.hidden);
}

function isOverviewViewActive() {
  return elements.viewPanels.some((panel) => panel.dataset.viewPanel === "overview" && !panel.hidden);
}

async function ensureHistoryViewReady() {
  if (!dashboardDataSourceReady || !refreshHistory) return;

  updateLiveHistoryRange();

  if (!historyViewLoading) {
    elements.historySummary.textContent = translateText("Nalagam grafe in zgodovino meritev …");
    historyViewLoading = loadUPlot()
      .then(async () => {
        createCharts();
        await refreshHistory();
      })
      .finally(() => {
        historyViewLoading = undefined;
      });
  }

  await historyViewLoading;
  requestAnimationFrame(() => {
    resizeCharts();
  });
}

function refreshVisibleHistory() {
  if (!isLocalDashboard && cloudRealtimePaused) return;
  if (isHistoryViewActive()) ensureHistoryViewReady().catch(showDataError);
}

function hasLiveHistoryRange() {
  return LIVE_HISTORY_PRESETS.has(activeRelativeHistoryPreset);
}

function updateLiveHistoryRange() {
  if (!hasLiveHistoryRange() || elements.rangeDialog.open || climateChartHasUserZoom || weightChartHasUserZoom) return false;
  const nextRange = getPresetRange(activeRelativeHistoryPreset);
  if (!nextRange) return false;

  appliedRange = nextRange;
  elements.rangeValue.textContent = formatRange(appliedRange);
  return true;
}

function refreshLiveHistoryRange() {
  if (!isLocalDashboard && cloudRealtimePaused) return;
  if (!isHistoryViewActive() || historyViewLoading) return;
  const previousCloudSource = !isLocalDashboard && appliedRange
    ? getCloudHistorySource(
      Math.floor(appliedRange.from.getTime() / 1000),
      Math.floor(appliedRange.to.getTime() / 1000),
    )
    : undefined;
  if (!updateLiveHistoryRange()) return;
  if (isLocalDashboard) {
    void ensureHistoryViewReady().catch(showDataError);
    return;
  }
  const nextCloudSource = getCloudHistorySource(
    Math.floor(appliedRange.from.getTime() / 1000),
    Math.floor(appliedRange.to.getTime() / 1000),
  );
  if (
    previousCloudSource?.path !== nextCloudSource.path
    || previousCloudSource?.periodSeconds !== nextCloudSource.periodSeconds
  ) {
    // Vir se je dejansko zamenjal (RAW ↔ hourly ↔ daily), zato enkrat varno zamenjaj listenerje.
    void refreshHistory().catch(showDataError);
    return;
  }
  // Sam prikazni koš se lahko spremeni; listener in Firebase poizvedba pri istem viru ostaneta nedotaknjena.
  renderCloudHistoryFromCache();
}

function initializeNavigation() {
  elements.navigationButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewTarget));
  });
  elements.menuToggle.addEventListener("click", () => {
    const isOpen = elements.topNavigation.classList.toggle("open");
    elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
  if (isEmbeddedDashboard || isAndroidLocalDashboard) {
    elements.appReturnLink.hidden = false;
    elements.appReturnLink.addEventListener("click", () => {
      window.parent.postMessage({ type: APP_RETURN_MESSAGE_TYPE }, "*");
    });
  }
  window.addEventListener("hashchange", () => showView(window.location.hash.slice(1), false));
  showView(window.location.hash.slice(1) || DEFAULT_VIEW, false);
}

function isValidDeviceId(deviceId) {
  return /^CB-[A-F0-9]{12}$/.test(String(deviceId));
}

function isValidActivationCode(activationCode) {
  return /^[A-HJ-NP-Z2-9]{8}$/.test(String(activationCode));
}

function isValidShareInvitationCode(invitationCode) {
  return /^[A-HJ-NP-Z2-9]{8}$/.test(String(invitationCode));
}

function isCloudAdministrator() {
  return currentCloudUser?.uid === SUPER_ADMIN_UID;
}

function isCloudAccountWithoutDevices() {
  return !isLocalDashboard
    && Boolean(currentCloudUser)
    && !isCloudAdministrator()
    && ownedCloudDevicesLoaded
    && sharedCloudDevicesLoaded
    && Object.keys(cloudDevices).length === 0;
}

function getCloudDeviceAccessRole(deviceId = cloudDevicePath.replace("devices/", "")) {
  if (!deviceId) return "";
  if (isCloudAdministrator()) return "administrator";
  return cloudDevices[deviceId]?.access_role ?? "";
}

function isSharedCloudDeviceSelected() {
  return !isLocalDashboard && getCloudDeviceAccessRole() === "viewer";
}

function canManageCloudDevice(deviceId = cloudDevicePath.replace("devices/", "")) {
  const role = getCloudDeviceAccessRole(deviceId);
  return role === "owner" || role === "administrator";
}

function configureCloudAccountView() {
  const isAdministrator = isCloudAdministrator();
  const isEmptyAccount = isCloudAccountWithoutDevices();
  elements.accountHeading.textContent = translateText(isAdministrator ? "Vsi panji" : "Moji panji");
  elements.deviceListEyebrow.textContent = translateText(isAdministrator ? "Skrbniški pregled" : "Moji panji");
  elements.selectedDeviceDescription.textContent = isAdministrator
    ? translateText("Skrbniški račun ima ogled vseh registriranih panjev.")
    : translateText("Izberi panj, katerega podatke želiš pregledovati.");
  elements.claimDeviceForm.hidden = isAdministrator;
  elements.accountFormStack.hidden = isAdministrator;
  elements.adminDeviceOverview.hidden = !isAdministrator;
  elements.deviceSelectionCard.hidden = isAdministrator || isEmptyAccount;
  elements.accountManagement.classList.toggle("admin-mode", isAdministrator);
  elements.accountManagement.classList.toggle("empty-device-state", isEmptyAccount);
  elements.unclaimDevice.hidden = isAdministrator;
}

function configureSelectedCloudDeviceAccess(deviceId) {
  if (isLocalDashboard) return;

  if (isCloudAccountWithoutDevices()) {
    elements.devicePageSubtitle.textContent = translateText("Registriraj svoj panj ali sprejmi povabilo za dostop do deljenega panja.");
    elements.deviceDetailsPanel.hidden = true;
    elements.overviewNavigationItem.hidden = true;
    elements.historyNavigationItem.hidden = true;
    elements.updatesNavigationItem.hidden = true;
    elements.unclaimDevice.hidden = true;
    elements.shareDevicePanel.hidden = true;
    elements.networkResetControl.hidden = true;
    elements.measurementSettingsPanel.hidden = true;
    setCloudDeviceManagementVisibility(false);
    renderWeatherSettings(null);
    resetWeatherOverview();
    showView("device");
    return;
  }

  const role = getCloudDeviceAccessRole(deviceId);
  const isSharedViewer = role === "viewer";
  const isOwner = role === "owner";
  const canManage = role === "owner" || role === "administrator";
  elements.devicePageSubtitle.textContent = isSharedViewer
    ? translateText("Deljeni panj imaš na voljo samo za ogled meritev in grafov.")
    : translateText("Omrežje, identiteta, delovanje in stanje SD kartice.");
  elements.deviceDetailsPanel.hidden = isSharedViewer;
  elements.overviewNavigationItem.hidden = false;
  elements.historyNavigationItem.hidden = false;
  elements.updatesNavigationItem.hidden = isSharedViewer;
  elements.unclaimDevice.hidden = isCloudAdministrator() || (!isOwner && !isSharedViewer);
  elements.unclaimDevice.disabled = !deviceId || (!isOwner && !isSharedViewer);
  elements.unclaimDevice.textContent = translateText(isSharedViewer ? "Odstrani deljeni panj" : "Odjavi izbrani panj");
  elements.shareDevicePanel.hidden = !isOwner;
  elements.selectedDeviceDescription.textContent = isSharedViewer
    ? translateText("Deljeni panj · samo ogled. Dostop lahko kadarkoli odstraniš iz svojega računa.")
    : translateText("Izberi panj, katerega podatke želiš pregledovati.");
  setCloudDeviceManagementVisibility(Boolean(deviceId && currentCloudUser && canManage));
  elements.networkResetControl.hidden = !(deviceId && currentCloudUser && isCloudAdministrator());
  elements.measurementSettingsPanel.hidden = !(deviceId && currentCloudUser && isCloudAdministrator());
  updateWeatherOverviewVisibility();

  if (isSharedViewer && elements.viewPanels.some((panel) => panel.dataset.viewPanel === "updates" && !panel.hidden)) {
    showView("device");
  }
}

function setCloudDeviceManagementVisibility(isVisible) {
  document.querySelectorAll("[data-cloud-device-management]").forEach((element) => {
    element.hidden = !isVisible;
  });
}

function clearCloudDeviceListeners() {
  weatherFetchController?.abort();
  weatherFetchController = undefined;
  weatherRequestKey = "";
  weatherLastFetchedAt = 0;
  weatherPublicPublishKey = "";
  weatherSharedLocationLookupKey = "";
  latestSharedWeatherPublicSettings = undefined;
  sharedWeatherEnabled = false;
  latestMeasurementSettings = undefined;
  stopCloudDeviceListeners.forEach((unsubscribe) => unsubscribe());
  stopCloudDeviceListeners = [];
  clearCloudHistoryListeners();
}

function stopCloudDirectoryListeners() {
  stopCloudDeviceListListener?.();
  stopCloudSharedDeviceListListener?.();
  stopCloudDeviceListListener = undefined;
  stopCloudSharedDeviceListListener = undefined;
  clearAdminDeviceSummaryListeners();
}

function startCloudUserDirectoryListeners(user = currentCloudUser) {
  if (cloudRealtimePaused || !user || !firebaseDatabase || isCloudAdministrator()) return;
  stopCloudDeviceListListener?.();
  stopCloudSharedDeviceListListener?.();
  const { database, onValue, ref } = firebaseDatabase;
  stopCloudDeviceListListener = onValue(ref(database, `users/${user.uid}/devices`), (snapshot) => {
    ownedCloudDevices = snapshot.val() ?? {};
    ownedCloudDevicesLoaded = true;
    rebuildCloudDevices();
  }, showDataError);
  stopCloudSharedDeviceListListener = onValue(ref(database, `users/${user.uid}/shared_devices`), (snapshot) => {
    sharedCloudDevices = snapshot.val() ?? {};
    sharedCloudDevicesLoaded = true;
    rebuildCloudDevices();
  }, showDataError);
}

function resetCloudDashboard() {
  setCloudDeviceManagementVisibility(false);
  elements.cloudSyncControls.hidden = true;
  latestDeviceStatus = undefined;
  latestSDCardStatus = undefined;
  latestHistoryManagementStatus = undefined;
  latestNetworkResetStatus = undefined;
  latestOtaStatus = undefined;
  renderLatestMeasurement(null);
  resetWeightChangeOverview();
  renderDeviceStatus(null);
  renderSDStatus(null);
  renderFirmwareVersion(null);
  renderLoadCellTareStatus(null);
  renderBme680CalibrationStatus(null);
  renderTimeStatus(null);
  renderWeatherSettings(null);
  renderMeasurementSettings(null);
  elements.sharedWeatherSettingsPanel.hidden = true;
  resetWeatherOverview();
  elements.otaDeviceStatus.textContent = translateText("Naprava še ni prejela OTA ukaza.");
  resetOtaProgress();
  elements.otaActions.hidden = true;
  renderHistory([]);
  renderHistoryManagementStatus(null);
  renderCloudWifiResetStatus(null);
}

function rebuildCloudDevices() {
  if (isCloudAdministrator()) return;

  const ownedDevices = Object.fromEntries(Object.entries(ownedCloudDevices).map(([deviceId, registration]) => [
    deviceId,
    { ...registration, access_role: "owner" },
  ]));
  const sharedDevices = Object.fromEntries(Object.entries(sharedCloudDevices)
    .filter(([deviceId]) => !ownedDevices[deviceId])
    .map(([deviceId, registration]) => [deviceId, { ...registration, access_role: "viewer" }]));
  cloudDevices = { ...sharedDevices, ...ownedDevices };
  synchronizeCurrentUserOwnerEmails();
  if (!Object.keys(cloudDevices).length && (!ownedCloudDevicesLoaded || !sharedCloudDevicesLoaded)) return;
  configureCloudAccountView();
  renderCloudDeviceSelector();
}

function clearAdminDeviceSummaryListeners() {
  stopAdminDeviceSummaryListeners.forEach((unsubscribe) => unsubscribe());
  stopAdminDeviceSummaryListeners = [];
  adminDeviceDirectoryRequestGeneration += 1;
}

function updateAdminDeviceSummary(deviceId, property, value) {
  const device = cloudDevices[deviceId];
  if (!device) return;
  if (property === "status") {
    device.status = { ...(device.status ?? {}), device: value ?? null };
  } else {
    device[property] = value ?? "";
  }
  renderCloudDeviceSelector();
}

function subscribeAdminDeviceSummary(deviceId) {
  if (cloudRealtimePaused || !firebaseDatabase || !cloudDevices[deviceId]) return;
  const { database, onValue, ref } = firebaseDatabase;
  const subscribe = (path, property) => {
    stopAdminDeviceSummaryListeners.push(onValue(
      ref(database, `devices/${deviceId}/${path}`),
      (snapshot) => updateAdminDeviceSummary(deviceId, property, snapshot.val()),
      showDataError,
    ));
  };
  subscribe("owner_uid", "owner_uid");
  subscribe("owner_email", "owner_email");
  subscribe("status/device", "status");
}

function applyAdminDeviceDirectory(deviceIds) {
  if (cloudRealtimePaused) return;
  clearAdminDeviceSummaryListeners();
  cloudDevices = Object.fromEntries(deviceIds.map((deviceId) => [deviceId, { access_role: "administrator" }]));
  deviceIds.forEach(subscribeAdminDeviceSummary);
  renderCloudDeviceSelector();
}

async function refreshAdminDeviceDirectory() {
  if (cloudRealtimePaused || !isCloudAdministrator() || !firebaseDatabaseUrl || !currentCloudUser) return;
  const requestGeneration = ++adminDeviceDirectoryRequestGeneration;
  try {
    const token = await currentCloudUser.getIdToken();
    if (requestGeneration !== adminDeviceDirectoryRequestGeneration || !isCloudAdministrator()) return;
    const directoryUrl = new URL(`${firebaseDatabaseUrl.replace(/\/+$/, "")}/devices.json`);
    // RTDB REST sprejme Firebase ID token v parametru auth; shallow vrne samo ključe naprav.
    directoryUrl.searchParams.set("shallow", "true");
    directoryUrl.searchParams.set("auth", token);
    const response = await fetch(directoryUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`RTDB shallow device directory failed: ${response.status}`);
    const shallowDirectory = await response.json();
    if (requestGeneration !== adminDeviceDirectoryRequestGeneration || !isCloudAdministrator()) return;
    const deviceIds = Object.keys(shallowDirectory ?? {}).filter(isValidDeviceId).sort();
    applyAdminDeviceDirectory(deviceIds);
  } catch (error) {
    if (requestGeneration === adminDeviceDirectoryRequestGeneration) showDataError(error);
  }
}

function renderCloudDeviceSelector() {
  const deviceIds = Object.keys(cloudDevices);
  const requestedDeviceId = new URLSearchParams(window.location.search).get(CLOUD_DEVICE_QUERY_PARAMETER);
  const storedDeviceId = localStorage.getItem(CLOUD_DEVICE_STORAGE_KEY);
  const preferredDeviceId = [requestedDeviceId, storedDeviceId, cloudDevicePath.replace("devices/", "")]
    .find((deviceId) => deviceIds.includes(deviceId));

  elements.cloudDeviceSelect.replaceChildren();
  if (!deviceIds.length) {
    elements.cloudDeviceSelect.append(new Option(translateText("Noben panj ni registriran"), ""));
    elements.cloudDeviceSelect.disabled = true;
    selectCloudDevice("");
    renderAdminDeviceOverview([]);
    return;
  }

  if (isCloudAdministrator()) {
    deviceIds.sort().forEach((deviceId) => elements.cloudDeviceSelect.append(new Option(deviceId, deviceId)));
  } else {
    const appendDeviceGroup = (label, role) => {
      const matchingDeviceIds = deviceIds.filter((deviceId) => cloudDevices[deviceId]?.access_role === role).sort();
      if (!matchingDeviceIds.length) return;
      const group = document.createElement("optgroup");
      group.label = label;
      matchingDeviceIds.forEach((deviceId) => {
        const device = cloudDevices[deviceId] ?? {};
        const suffix = role === "viewer" ? translateText(" · samo ogled") : "";
        group.append(new Option(`${device.display_name || deviceId}${suffix}`, deviceId));
      });
      elements.cloudDeviceSelect.append(group);
    };
    appendDeviceGroup(translateText("Moji panji"), "owner");
    appendDeviceGroup(translateText("Deljeni z mano"), "viewer");
  }
  elements.cloudDeviceSelect.disabled = false;
  const nextDeviceId = preferredDeviceId || deviceIds[0];
  elements.cloudDeviceSelect.value = nextDeviceId;
  renderAdminDeviceOverview(deviceIds);
  if (cloudDevicePath === `devices/${nextDeviceId}`) return;
  selectCloudDevice(nextDeviceId);
}

function renderAdminDeviceOverview(deviceIds = Object.keys(cloudDevices)) {
  if (!isCloudAdministrator()) return;

  elements.adminDeviceList.replaceChildren();
  if (!deviceIds.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted";
    emptyState.textContent = translateText("V Firebase še ni zaznan noben panj.");
    elements.adminDeviceList.append(emptyState);
    return;
  }

  deviceIds.sort().forEach((deviceId) => {
    const device = cloudDevices[deviceId] ?? {};
    const status = device.status?.device;
    const isOnline = isDeviceOnline(status);
    const card = document.createElement("article");
    card.className = `admin-device-option${cloudDevicePath === `devices/${deviceId}` ? " selected" : ""}`;
    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "admin-device-select";
    selectButton.setAttribute("aria-pressed", String(cloudDevicePath === `devices/${deviceId}`));
    selectButton.setAttribute("aria-label", formatTranslatedText("Izberi panj {deviceId}", { deviceId }));
    selectButton.addEventListener("click", () => selectCloudDevice(deviceId));

    const identity = document.createElement("span");
    identity.className = "admin-device-identity";
    const name = document.createElement("strong");
    name.textContent = deviceId;
    const owner = document.createElement("small");
    owner.className = "admin-device-owner";
    owner.textContent = device.owner_email || translateText("Lastnik še ni zabeležen.");
    identity.append(name, owner);
    const state = document.createElement("span");
    state.className = `admin-device-option-state ${isOnline ? "online" : "offline"}`;
    const dot = document.createElement("span");
    dot.className = "device-status-dot";
    dot.setAttribute("aria-hidden", "true");
    const stateText = document.createElement("span");
    stateText.textContent = translateText(isOnline ? "Online" : "Offline");
    state.append(dot, stateText);

    const detail = document.createElement("small");
    const lastSeenTimestamp = Number(status?.last_seen_timestamp);
    detail.textContent = Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0
      ? formatTranslatedText("Zadnji odziv: {time}", { time: formatDashboardDateTime(new Date(lastSeenTimestamp * 1000)) })
      : translateText("Naprava še ni poslala stanja.");
    selectButton.append(identity, state, detail);
    card.append(selectButton);

    const actions = document.createElement("div");
    actions.className = "admin-device-actions";
    const actionButtons = document.createElement("div");
    actionButtons.className = "admin-device-action-buttons";
    const actionStatus = document.createElement("small");
    actionStatus.className = "admin-device-action-status";
    actionStatus.setAttribute("aria-live", "polite");

    if (device.owner_uid) {
      const unclaimButton = document.createElement("button");
      unclaimButton.type = "button";
      unclaimButton.className = "secondary-button danger-button admin-unclaim-button";
      unclaimButton.textContent = translateText("Odjavi lastnika");
      unclaimButton.addEventListener("click", () => unclaimDeviceAsAdministrator(deviceId, unclaimButton, actionStatus));
      actionButtons.append(unclaimButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "secondary-button danger-button admin-delete-button";
    deleteButton.textContent = translateText("Izbriši napravo");
    deleteButton.addEventListener("click", () =>
      deleteDeviceAsAdministrator(deviceId, actionButtons, actionStatus),
    );
    actionButtons.append(deleteButton);
    actions.append(actionButtons, actionStatus);
    card.append(actions);

    elements.adminDeviceList.append(card);
  });
}

async function ensureCloudDeviceOwnerEmail(deviceId) {
  if (!deviceId || !firebaseDatabase || !currentCloudUser?.email || getCloudDeviceAccessRole(deviceId) !== "owner" || ownerEmailSyncedDeviceIds.has(deviceId)) return;

  const { database, ref, set } = firebaseDatabase;
  try {
    await set(ref(database, `devices/${deviceId}/owner_email`), currentCloudUser.email);
    ownerEmailSyncedDeviceIds.add(deviceId);
  } catch (error) {
    console.warn("E-poštnega naslova lastnika ni bilo mogoče posodobiti.", error);
  }
}

function synchronizeCurrentUserOwnerEmails() {
  if (isCloudAdministrator()) return;
  Object.keys(ownedCloudDevices).forEach((deviceId) => void ensureCloudDeviceOwnerEmail(deviceId));
}

function selectCloudDevice(deviceId) {
  if (cloudRealtimePaused) return;
  clearCloudDeviceListeners();
  bme680CalibrationPendingUntil = 0;
  bme680CalibrationRequestedAt = 0;
  elements.cloudBme680CalibrationForm.dataset.dirty = "false";
  cloudDevicePath = deviceId ? `devices/${deviceId}` : "";
  resetWeightChangeOverview();
  resetOverviewAnalytics();
  elements.cloudDeviceSelect.value = deviceId;
  renderAdminDeviceOverview();
  configureSelectedCloudDeviceAccess(deviceId);
  void ensureCloudDeviceOwnerEmail(deviceId);
  elements.unclaimDeviceStatus.textContent = "";
  elements.shareDeviceStatus.textContent = "";
  elements.shareInvitationResult.hidden = true;
  elements.sharedViewerList.replaceChildren();
  latestSharedViewerAccess = undefined;
  activeShareInvitationCode = "";
  const isSharedViewer = getCloudDeviceAccessRole(deviceId) === "viewer";
  elements.otaSection.hidden = !cloudDevicePath || isSharedViewer;
  elements.cloudSyncControls.hidden = !cloudDevicePath || isSharedViewer;
  if (!cloudDevicePath || !firebaseDatabase) {
    resetCloudDashboard();
    return;
  }

  latestSDCardStatus = undefined;
  // Ne prikazuj stanja prej izbranega panja, dokler Firebase ne vrne novega odziva.
  renderDeviceStatus(null);
  renderHistoryManagementStatus(null);
  renderCloudWifiResetStatus(null);
  renderLoadCellTareStatus(null);
  renderBme680CalibrationStatus(null);
  renderTimeStatus(null);
  renderWeatherSettings(null);
  resetWeatherOverview();
  localStorage.setItem(CLOUD_DEVICE_STORAGE_KEY, deviceId);
  const { database, onValue, ref } = firebaseDatabase;
  const subscribe = (path, renderer) => {
    stopCloudDeviceListeners.push(onValue(ref(database, `${cloudDevicePath}/${path}`), (snapshot) => renderer(snapshot.val()), showDataError));
  };
  subscribe("latest", isSharedViewer ? renderSharedLatestMeasurement : renderLatestMeasurement);
  if (!isSharedViewer) {
    subscribe("status/device", renderDeviceStatus);
    subscribe("status/sd_card", renderSDStatus);
    subscribe("status/firmware", renderFirmwareVersion);
    subscribe("status/ota", renderOtaDeviceStatus);
    subscribe("status/history", renderHistoryManagementStatus);
    if (isCloudAdministrator()) subscribe("status/network_reset", renderCloudWifiResetStatus);
    subscribe("status/load_cell", renderLoadCellTareStatus);
    subscribe("status/bme680", renderBme680CalibrationStatus);
    if (canManageCloudDevice(deviceId)) {
      subscribe("weather", renderWeatherSettings);
    }
    if (isCloudAdministrator()) subscribe("measurement_settings", renderMeasurementSettings);
  } else {
    subscribe("weather_public", renderSharedWeatherSettings);
    stopCloudDeviceListeners.push(onValue(ref(database, `users/${currentCloudUser.uid}/weather_preferences/${deviceId}`), (snapshot) => {
      renderSharedWeatherPreference(snapshot.val());
    }, showDataError));
  }
  if (getCloudDeviceAccessRole(deviceId) === "owner") {
    stopCloudDeviceListeners.push(onValue(ref(database, `device_access/${deviceId}`), (snapshot) => {
      latestSharedViewerAccess = snapshot.val();
      renderSharedViewerList(deviceId, latestSharedViewerAccess);
    }, showDataError));
  }
  historyViewLoading = undefined;
  refreshVisibleHistory();
  void refreshWeightChangeOverview();
  void refreshOverviewAnalytics();
}

function setConnectionState(text, state = "connected") {
  elements.connectionStatus.className = `connection-status ${state}`;
  elements.connectionStatus.setAttribute("aria-label", translateText(text));
  elements.connectionText.textContent = translateText(text);
}

function isDeviceOnline(status) {
  const lastSeenTimestamp = Number(status?.last_seen_timestamp);
  const secondsSinceLastSeen = Math.floor(Date.now() / 1000) - lastSeenTimestamp;
  return Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0
    && secondsSinceLastSeen <= DEVICE_ONLINE_TIMEOUT_SECONDS;
}

function renderHeaderDeviceState() {
  if (isLocalDashboard) {
    setConnectionState("Lokalna povezava", "connected");
    return;
  }
  if (!currentCloudUser) {
    setConnectionState("Prijava je potrebna", "error");
    return;
  }
  if (!cloudDevicePath) {
    setConnectionState("Izberi panj", "connecting");
    return;
  }
  if (isDeviceOnline(latestDeviceStatus)) {
    setConnectionState("Naprava online", "connected");
    return;
  }

  const lastSeenTimestamp = Number(latestDeviceStatus?.last_seen_timestamp);
  setConnectionState(
    Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0 ? "Naprava offline" : "Čakam na odziv naprave …",
    Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0 ? "error" : "connecting",
  );
}

function parseMeasurementValue(value) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeMeasurementSettings(settings) {
  const measurementIntervalSeconds = Math.floor(Number(settings?.measurement_interval_seconds));
  const sdArchiveIntervalMinutes = Math.floor(Number(settings?.sd_archive_interval_minutes));
  const weightDisplayDecimals = Math.floor(Number(settings?.weight_display_decimals));
  return {
    measurementIntervalSeconds: measurementIntervalSeconds >= 5 && measurementIntervalSeconds <= 120
      ? measurementIntervalSeconds
      : 10,
    sdArchiveIntervalMinutes: sdArchiveIntervalMinutes >= 1 && sdArchiveIntervalMinutes <= 30
      ? sdArchiveIntervalMinutes
      : 5,
    weightDisplayDecimals: weightDisplayDecimals === 1 || weightDisplayDecimals === 2
      ? weightDisplayDecimals
      : 2,
  };
}

function currentWeightDisplayDecimals() {
  return latestMeasurementSettings?.weightDisplayDecimals ?? 2;
}

function formatValue(value, decimals = 1) {
  const numericValue = parseMeasurementValue(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(decimals) : "—";
}

function formatDashboardDate(date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function formatDashboardTime(date, includeSeconds = false) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
}

function formatDashboardDateTime(date, includeSeconds = false) {
  const connector = getDashboardLanguage() === "en" ? "at" : getDashboardLanguage() === "hr" ? "u" : "ob";
  return `${formatDashboardDate(date)} ${connector} ${formatDashboardTime(date, includeSeconds)}`;
}

function formatDateTimeInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function formatStoredDate(dateValue) {
  const match = String(dateValue).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return match ? `${Number(match[3])}/${Number(match[2])}/${Number(match[1])}` : String(dateValue);
}

function formatDateTime(record) {
  if (record?.date && record?.time) {
    const connector = getDashboardLanguage() === "en" ? "at" : getDashboardLanguage() === "hr" ? "u" : "ob";
    return `${formatStoredDate(record.date)} ${connector} ${record.time}`;
  }

  const timestamp = Number(record?.timestamp);
  return Number.isFinite(timestamp)
    ? formatDashboardDateTime(new Date(timestamp * 1000), true)
    : translateText("Čakam na podatke …");
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat(getDashboardLocale(), options).format(date);
}

function compareFirmwareVersions(candidateVersion, currentVersion) {
  const parseVersion = (version) => {
    const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-(beta|rc)\.(\d+))?$/);
    if (!match) return null;
    const releaseStage = match[4] === undefined ? 2 : match[4] === "rc" ? 1 : 0;
    const prereleaseNumber = match[5] === undefined ? Number.MAX_SAFE_INTEGER : Number(match[5]);
    return [Number(match[1]), Number(match[2]), Number(match[3]), releaseStage, prereleaseNumber];
  };
  const candidate = parseVersion(candidateVersion);
  const current = parseVersion(currentVersion);
  if (!candidate || !current) return 0;
  for (let index = 0; index < candidate.length; index += 1) {
    if (candidate[index] !== current[index]) return candidate[index] > current[index] ? 1 : -1;
  }
  return 0;
}

function formatRange(range) {
  return `${formatDashboardDateTime(range.from)} – ${formatDashboardDateTime(range.to)}`;
}

function renderLatestMetric(element, value, decimals, hasMeasurement) {
  const numericValue = parseMeasurementValue(value);
  const unavailable = numericValue === null;
  const valueContainer = element.parentElement;
  valueContainer?.classList.toggle("measurement-unavailable", unavailable && hasMeasurement);
  const unit = valueContainer?.querySelector("small");
  if (unit) unit.hidden = unavailable && hasMeasurement;
  element.textContent = unavailable && hasMeasurement ? translateText("Ni na voljo") : formatValue(value, decimals);
}

function renderLatestMeasurement(measurement) {
  latestMeasurement = measurement;
  const hasMeasurement = measurement !== null && measurement !== undefined;
  renderLatestMetric(elements.temperature, measurement?.temperature_c, 1, hasMeasurement);
  renderLatestMetric(elements.humidity, measurement?.humidity_percent, 1, hasMeasurement);
  renderLatestMetric(elements.weight, measurement?.weight_kg, currentWeightDisplayDecimals(), hasMeasurement);
  elements.latestTime.textContent = formatDateTime(measurement);
}

function getOverviewAnalyticsWindow() {
  const to = Math.floor(Date.now() / 1000) + 1;
  return { from: to - OVERVIEW_ANALYTICS_WINDOW_SECONDS, to };
}

function getOverviewMetricDefinitions() {
  return [
    {
      valueKey: "temperature_c",
      rangeElement: elements.temperatureRange,
      sparkline: elements.temperatureSparkline,
      sparklineFrame: elements.temperatureSparklineFrame,
      decimals: 1,
      sparklineLabel: "Trend temperature v zadnjih 24 urah",
    },
    {
      valueKey: "humidity_percent",
      rangeElement: elements.humidityRange,
      sparkline: elements.humiditySparkline,
      sparklineFrame: elements.humiditySparklineFrame,
      decimals: 1,
      sparklineLabel: "Trend relativne vlage v zadnjih 24 urah",
    },
    {
      valueKey: "weight_kg",
      rangeElement: elements.weightRange,
      sparkline: elements.weightSparkline,
      sparklineFrame: elements.weightSparklineFrame,
      decimals: currentWeightDisplayDecimals(),
      sparklineLabel: "Trend mase panja v zadnjih 24 urah",
    },
  ];
}

function getOverviewMetricValues(readings, valueKey) {
  return readings
    .map((reading) => parseMeasurementValue(reading?.[valueKey]))
    .filter((value) => value !== null);
}

function createSparklinePath(aggregates, valueKey, window) {
  const validPoints = aggregates
    .map((reading) => ({
      timestamp: Number(reading?.timestamp),
      value: parseMeasurementValue(reading?.[valueKey]),
    }))
    .filter((point) => Number.isFinite(point.timestamp) && point.value !== null);
  if (!validPoints.length) return { paths: [], scaleMin: null, scaleMax: null };

  const minimum = Math.min(...validPoints.map((point) => point.value));
  const maximum = Math.max(...validPoints.map((point) => point.value));
  const valueSpan = Math.max(maximum - minimum, Math.max(Math.abs(maximum) * 0.04, 0.01));
  const valueCenter = (minimum + maximum) / 2;
  const scaleMin = valueCenter - valueSpan / 2;
  const scaleMax = valueCenter + valueSpan / 2;
  // Sparkline nima časovne osi, zato veljavne točke razporedimo po celotni
  // risalni širini z enakim notranjim odmikom na obeh straneh panela.
  const firstTimestamp = Math.min(...validPoints.map((point) => point.timestamp));
  const lastTimestamp = Math.max(...validPoints.map((point) => point.timestamp));
  const xSpan = Math.max(1, lastTimestamp - firstTimestamp);
  const xInset = 4;
  const xWidth = 120 - xInset * 2;
  const segments = [];
  let segment = [];
  let previousTimestamp;

  validPoints.forEach((point) => {
    if (previousTimestamp !== undefined && point.timestamp - previousTimestamp > OVERVIEW_SPARKLINE_BUCKET_SECONDS * 1.5) {
      if (segment.length) segments.push(segment);
      segment = [];
    }
    const x = firstTimestamp === lastTimestamp
      ? 60
      : xInset + ((point.timestamp - firstTimestamp) / xSpan) * xWidth;
    const y = Math.max(3, Math.min(33, 33 - ((point.value - scaleMin) / valueSpan) * 30));
    segment.push([x, y]);
    previousTimestamp = point.timestamp;
  });
  if (segment.length) segments.push(segment);

  const paths = segments.map((points) => {
    const line = points.reduce((path, [x, y], index) => (
      `${path}${index ? " L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`
    ), "");
    const [firstX] = points[0];
    const [lastX, lastY] = points[points.length - 1];
    const areaLine = points.map(([x, y]) => ` L${x.toFixed(2)} ${y.toFixed(2)}`).join("");
    return {
      line,
      area: `M${firstX.toFixed(2)} 36${areaLine} L${lastX.toFixed(2)} 36 Z`,
      lastPoint: [lastX, lastY],
    };
  });
  return { paths, scaleMin, scaleMax };
}

function renderMetricSparkline(element, frame, paths, label) {
  if (!element || !frame) return;
  element.replaceChildren();
  const hasData = paths.length > 0;
  frame.classList.toggle("is-empty", !hasData);
  element.setAttribute("aria-label", translateText(label));
  paths.forEach((pathData, index) => {
    const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
    area.classList.add("metric-sparkline-area");
    area.setAttribute("d", pathData.area);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.classList.add("metric-sparkline-line");
    line.setAttribute("d", pathData.line);
    element.append(area, line);
    if (index === paths.length - 1) {
      const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      point.classList.add("metric-sparkline-point");
      point.setAttribute("cx", pathData.lastPoint[0].toFixed(2));
      point.setAttribute("cy", pathData.lastPoint[1].toFixed(2));
      point.setAttribute("r", "2.1");
      element.append(point);
    }
  });
}

function renderMetricRange(element, min, max, unit) {
  if (!element) return;
  const createValue = (label, value) => {
    const container = document.createElement("span");
    const valueElement = document.createElement("span");
    valueElement.className = "metric-range-value";
    valueElement.textContent = value === "—" ? value : `${value} ${unit}`;
    container.append(`${translateText(label)} `, valueElement);
    return container;
  };
  const separator = document.createElement("span");
  separator.className = "metric-range-separator";
  separator.textContent = "·";
  element.replaceChildren(createValue("min", min), separator, createValue("max", max));
}

function buildOverviewAnalytics(readings, window) {
  const sourceReadings = (Array.isArray(readings) ? readings : []).filter((reading) => {
    const timestamp = Number(reading?.timestamp);
    return Number.isFinite(timestamp) && timestamp >= window.from && timestamp < window.to;
  });
  const range = {
    from: new Date(window.from * 1000),
    to: new Date(window.to * 1000),
  };
  const hourlyAverages = aggregateReadings(sourceReadings, range, {
    bucketSeconds: OVERVIEW_SPARKLINE_BUCKET_SECONDS,
    bucketAnchorTimestamp: window.from,
  });
  const metrics = {};
  getOverviewMetricDefinitions().forEach(({ valueKey }) => {
    const values = getOverviewMetricValues(sourceReadings, valueKey);
    const sparkline = createSparklinePath(hourlyAverages, valueKey, window);
    metrics[valueKey] = {
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      sparklinePaths: sparkline.paths,
      sparklineScaleMin: sparkline.scaleMin,
      sparklineScaleMax: sparkline.scaleMax,
    };
  });
  return { window, metrics };
}

function renderOverviewAnalytics(analytics = latestOverviewAnalytics) {
  const metrics = analytics?.metrics ?? {};
  getOverviewMetricDefinitions().forEach((definition) => {
    const metric = metrics[definition.valueKey];
    const min = formatValue(metric?.min, definition.decimals);
    const max = formatValue(metric?.max, definition.decimals);
    const unit = definition.valueKey === "temperature_c" ? "°C"
      : definition.valueKey === "humidity_percent" ? "%"
        : "kg";
    renderMetricRange(definition.rangeElement, min, max, unit);
    renderMetricSparkline(definition.sparkline, definition.sparklineFrame, metric?.sparklinePaths ?? [], definition.sparklineLabel);
  });
}

function resetOverviewAnalytics() {
  overviewAnalyticsRequestGeneration += 1;
  latestOverviewAnalytics = undefined;
  renderOverviewAnalytics();
}

async function refreshOverviewAnalytics() {
  if (!dashboardDataSourceReady || !isOverviewViewActive() || (!isLocalDashboard && (!cloudDevicePath || cloudRealtimePaused))) return;
  const requestGeneration = ++overviewAnalyticsRequestGeneration;
  const window = getOverviewAnalyticsWindow();
  try {
    const readings = isLocalDashboard
      ? await fetchLocalOverviewHistoryReadings(window)
      : await fetchCloudHistoryWindowReadings(cloudDevicePath, "measurements", window);
    if (requestGeneration !== overviewAnalyticsRequestGeneration || !isOverviewViewActive()) return;
    latestOverviewAnalytics = buildOverviewAnalytics(readings, window);
    renderOverviewAnalytics();
  } catch (error) {
    if (requestGeneration !== overviewAnalyticsRequestGeneration) return;
    console.warn("24-urna statistika kartic ni dosegljiva.", error);
    latestOverviewAnalytics = undefined;
    renderOverviewAnalytics();
  }
}

function renderSharedLatestMeasurement(measurement) {
  renderLatestMeasurement(measurement);
  const timestamp = Number(measurement?.timestamp);
  latestDeviceStatus = Number.isFinite(timestamp) && timestamp > 0 ? { last_seen_timestamp: timestamp } : undefined;
  renderHeaderDeviceState();
}

function getLocalCalendarDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftLocalCalendarDate(date, days) {
  const shiftedDate = new Date(date);
  shiftedDate.setDate(shiftedDate.getDate() + days);
  return shiftedDate;
}

function getLatestCompletedNightDate(now = new Date()) {
  const nightDate = new Date(now);
  nightDate.setHours(0, 0, 0, 0);
  if (now.getHours() < 5) nightDate.setDate(nightDate.getDate() - 1);
  return nightDate;
}

function getNightWindow(nightDate) {
  const start = new Date(nightDate);
  start.setHours(3, 0, 0, 0);
  const end = new Date(nightDate);
  end.setHours(5, 0, 0, 0);
  return {
    key: getLocalCalendarDateKey(nightDate),
    from: Math.floor(start.getTime() / 1000),
    to: Math.floor(end.getTime() / 1000),
  };
}

function getNightReferenceCacheScope() {
  if (isLocalDashboard) return "local";
  return cloudDevicePath ? `cloud:${cloudDevicePath}` : "";
}

function clearNightReferenceSessionCacheForScope(scope) {
  const prefix = `${scope}|`;
  [...nightReferenceSessionCache.keys()].forEach((cacheKey) => {
    if (cacheKey.startsWith(prefix)) nightReferenceSessionCache.delete(cacheKey);
  });
}

function calculateMedianWeight(readings, window) {
  const samples = (Array.isArray(readings) ? readings : [])
    .map((reading) => ({
      timestamp: Number(reading?.timestamp),
      weight: parseMeasurementValue(reading?.weight_kg),
    }))
    .filter((sample) => Number.isFinite(sample.timestamp) && sample.timestamp >= window.from
      && sample.timestamp < window.to && sample.weight !== null)
    .sort((first, second) => first.timestamp - second.timestamp);

  if (samples.length < MIN_NIGHT_REFERENCE_WEIGHT_SAMPLES) return null;
  if (samples[0].timestamp > window.from + MAX_NIGHT_REFERENCE_WEIGHT_GAP_SECONDS
    || samples[samples.length - 1].timestamp < window.to - MAX_NIGHT_REFERENCE_WEIGHT_GAP_SECONDS) {
    return null;
  }
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index].timestamp - samples[index - 1].timestamp > MAX_NIGHT_REFERENCE_WEIGHT_GAP_SECONDS) {
      return null;
    }
  }

  const weights = samples.map((sample) => sample.weight).sort((first, second) => first - second);
  const middle = Math.floor(weights.length / 2);
  const median = weights.length % 2 === 0
    ? (weights[middle - 1] + weights[middle]) / 2
    : weights[middle];
  return Number.isFinite(median) ? { weight: median, sampleCount: samples.length } : null;
}

function getCloudHistoryReadingsInRange(entry, from, to) {
  const readings = [];
  entry.readingsByKey.forEach((reading) => {
    const timestamp = Number(reading?.timestamp);
    if (Number.isFinite(timestamp) && timestamp >= from && timestamp < to) readings.push(reading);
  });
  return readings;
}

async function fetchCloudHistoryWindowReadings(devicePath, sourcePath, window) {
  if (!firebaseDatabase || !devicePath) throw new Error("Cloud zgodovina ni pripravljena.");
  const { database, endAt, get, orderByKey, query, ref, startAt } = firebaseDatabase;
  const cacheEntry = getCloudHistorySessionCacheEntry(devicePath, sourcePath);
  const missingRanges = getCloudHistoryCacheCoverageGaps(cacheEntry, window.from, window.to - 1);

  await Promise.all(missingRanges.map(async (missingRange) => {
    const snapshot = await get(query(
      ref(database, `${devicePath}/${sourcePath}`),
      orderByKey(),
      startAt(String(missingRange.from)),
      endAt(String(missingRange.to)),
    ));
    snapshot.forEach((childSnapshot) => {
      const value = childSnapshot.val();
      if (!value || typeof value !== "object") return;
      cacheEntry.readingsByKey.set(childSnapshot.key, {
        ...value,
        timestamp: Number(value.timestamp ?? childSnapshot.key),
      });
    });
    addCloudHistoryCacheCoverage(cacheEntry, missingRange.from, missingRange.to);
  }));

  return getCloudHistoryReadingsInRange(cacheEntry, window.from, window.to);
}

function fetchCloudNightWindowReadings(devicePath, window) {
  return fetchCloudHistoryWindowReadings(devicePath, "measurements", window);
}

function enqueueLocalHistoryRequest(request) {
  const queuedRequest = localHistoryRequestQueue.then(request, request);
  localHistoryRequestQueue = queuedRequest.catch(() => undefined);
  return queuedRequest;
}

function fetchLocalHistoryWindow(window, onPreparing) {
  return enqueueLocalHistoryRequest(async () => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const response = await fetch(`/api/history?from=${window.from}&to=${window.to}`, { cache: "no-store" });
      if (response.status === 202) {
        onPreparing?.();
        await delay(250);
        continue;
      }
      if (!response.ok) {
        const error = new Error("Lokalna zgodovina ni dosegljiva.");
        error.status = response.status;
        throw error;
      }
      const history = await response.json();
      return history.readings ?? [];
    }
    throw new Error("Priprava lokalne zgodovine je trajala predolgo.");
  });
}

function addLocalOverviewHistoryCacheCoverage(from, to) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return;
  const ranges = [...localOverviewHistorySessionCache.coveredRanges, { from, to }]
    .sort((first, second) => first.from - second.from);
  localOverviewHistorySessionCache.coveredRanges = ranges.reduce((mergedRanges, range) => {
    const previous = mergedRanges[mergedRanges.length - 1];
    if (!previous || range.from > previous.to + 1) mergedRanges.push({ ...range });
    else previous.to = Math.max(previous.to, range.to);
    return mergedRanges;
  }, []);
}

function getLocalOverviewHistoryCacheCoverageGaps(from, to) {
  if (from > to) return [];
  const gaps = [];
  let nextFrom = from;
  for (const range of localOverviewHistorySessionCache.coveredRanges) {
    if (range.to < nextFrom) continue;
    if (range.from > to) break;
    if (range.from > nextFrom) gaps.push({ from: nextFrom, to: Math.min(to, range.from - 1) });
    nextFrom = Math.max(nextFrom, range.to + 1);
    if (nextFrom > to) break;
  }
  if (nextFrom <= to) gaps.push({ from: nextFrom, to });
  return gaps;
}

async function fetchLocalOverviewHistoryReadings(window) {
  const retainedFrom = window.from - OVERVIEW_SPARKLINE_BUCKET_SECONDS;
  localOverviewHistorySessionCache.readingsByTimestamp.forEach((_reading, timestamp) => {
    if (timestamp < retainedFrom) localOverviewHistorySessionCache.readingsByTimestamp.delete(timestamp);
  });
  localOverviewHistorySessionCache.coveredRanges = localOverviewHistorySessionCache.coveredRanges
    .map((range) => ({ ...range, from: Math.max(range.from, retainedFrom) }))
    .filter((range) => range.from <= range.to);
  const missingRanges = getLocalOverviewHistoryCacheCoverageGaps(window.from, window.to - 1);
  for (const missingRange of missingRanges) {
    const readings = await fetchLocalHistoryWindow(missingRange);
    readings.forEach((reading) => {
      const timestamp = Number(reading?.timestamp);
      if (Number.isFinite(timestamp)) localOverviewHistorySessionCache.readingsByTimestamp.set(timestamp, reading);
    });
    addLocalOverviewHistoryCacheCoverage(missingRange.from, missingRange.to);
  }
  return [...localOverviewHistorySessionCache.readingsByTimestamp.values()]
    .filter((reading) => {
      const timestamp = Number(reading?.timestamp);
      return Number.isFinite(timestamp) && timestamp >= window.from && timestamp < window.to;
    });
}

function clearLocalOverviewHistorySessionCache() {
  localOverviewHistorySessionCache.readingsByTimestamp.clear();
  localOverviewHistorySessionCache.coveredRanges = [];
}

function fetchLocalNightWindowReadings(window) {
  return fetchLocalHistoryWindow(window);
}

async function getNightReference(scope, nightDate) {
  const window = getNightWindow(nightDate);
  const cacheKey = `${scope}|${window.key}`;
  const cachedReference = nightReferenceSessionCache.get(cacheKey);
  if (cachedReference) return cachedReference;

  const request = (scope === "local"
    ? fetchLocalNightWindowReadings(window)
    : fetchCloudNightWindowReadings(scope.slice("cloud:".length), window))
    .then((readings) => calculateMedianWeight(readings, window));
  nightReferenceSessionCache.set(cacheKey, request);
  try {
    return await request;
  } catch (error) {
    nightReferenceSessionCache.delete(cacheKey);
    throw error;
  }
}

function getWeightChangeTrend(changeKg, days) {
  if (!Number.isFinite(changeKg) || !Number.isFinite(days) || days <= 0) return null;

  const dailyAverage = changeKg / days;
  if (dailyAverage > WEIGHT_CHANGE_STABLE_THRESHOLD_KG) {
    return { className: "gain", label: "Prirast" };
  }
  if (dailyAverage < -WEIGHT_CHANGE_STABLE_THRESHOLD_KG) {
    return { className: "loss", label: "Padec" };
  }
  return { className: "stable", label: "Stabilno" };
}

function formatWeightChange(change) {
  if (!Number.isFinite(change)) return "—";
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";
  return `${sign}${Math.abs(change).toFixed(currentWeightDisplayDecimals())} kg`;
}

function renderWeightChangeValue(valueElement, trendElement, trendLabelElement, detailElement, change, days, detailText) {
  const hasChange = Number.isFinite(change);
  const trend = getWeightChangeTrend(change, days);
  valueElement.classList.remove("gain", "stable", "loss", "neutral");
  if (!hasChange) {
    valueElement.classList.add("neutral");
    valueElement.textContent = "—";
    trendElement.hidden = true;
    trendElement.className = "weight-change-trend";
    trendLabelElement.removeAttribute("data-i18n-source");
    trendLabelElement.textContent = "";
    setTranslatedElementText(detailElement, "Ni dovolj podatkov");
    return;
  }

  valueElement.classList.add(trend.className);
  valueElement.textContent = formatWeightChange(change);
  trendElement.hidden = false;
  trendElement.className = `weight-change-trend ${trend.className}`;
  setTranslatedElementText(trendLabelElement, trend.label);
  setTranslatedElementText(detailElement, detailText);
}

function getWeightChangeDayLabel(nightDate) {
  if (!(nightDate instanceof Date) || Number.isNaN(nightDate.getTime())) return "—";
  return `${String(nightDate.getDate()).padStart(2, "0")}.${String(nightDate.getMonth() + 1).padStart(2, "0")}.`;
}

function getWeightChangeDailyBars(references, nightDates) {
  const bars = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const currentReference = references[offset];
    const previousReference = references[offset + 1];
    bars.push({
      label: getWeightChangeDayLabel(nightDates[offset]),
      change: currentReference && previousReference
        ? currentReference.weight - previousReference.weight
        : null,
    });
  }
  return bars;
}

function formatWeightChangeChartValue(change) {
  if (!Number.isFinite(change)) return "—";
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";
  return `${sign}${Math.abs(change).toLocaleString(getDashboardLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatWeightChangeScaleValue(value) {
  return Math.abs(value) < 0.000001
    ? "0"
    : value.toLocaleString(getDashboardLocale(), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
}

function renderWeightChangeBarChart(bars) {
  const chart = elements.weightChangeWeekChart;
  if (!chart) return;

  const validBars = bars.filter((bar) => Number.isFinite(bar.change));
  const maxAbs = Math.max(WEIGHT_CHANGE_STABLE_THRESHOLD_KG, ...validBars.map((bar) => Math.abs(bar.change)));
  const scaleTicks = [maxAbs, maxAbs / 2, 0, -maxAbs / 2, -maxAbs];
  const scalePositions = [14, 32, 50, 68, 86];

  chart.replaceChildren();
  chart.classList.toggle("is-empty", validBars.length === 0);
  chart.setAttribute("aria-label", translateText(validBars.length
    ? "Trend spremembe mase za zadnjih 7 dni"
    : "Ni dovolj podatkov za zadnjih 7 dni"));

  const axis = document.createElement("div");
  axis.className = "weight-change-axis";
  axis.setAttribute("aria-hidden", "true");
  const axisUnit = document.createElement("span");
  axisUnit.className = "weight-change-axis-unit";
  axisUnit.textContent = "kg/d";
  axis.append(axisUnit);

  const plotGrid = document.createElement("div");
  plotGrid.className = "weight-change-plot-grid";
  plotGrid.setAttribute("aria-hidden", "true");
  const gridLines = document.createElement("div");
  gridLines.className = "weight-change-grid-lines";
  const days = document.createElement("div");
  days.className = "weight-change-days";
  scaleTicks.forEach((tick, index) => {
    const position = scalePositions[index];
    const scaleLabel = document.createElement("span");
    scaleLabel.className = "weight-change-scale-label";
    scaleLabel.style.setProperty("--weight-change-line-position", `${position}%`);
    scaleLabel.textContent = formatWeightChangeScaleValue(tick);
    axis.append(scaleLabel);

    const gridLine = document.createElement("span");
    gridLine.className = `weight-change-grid-line${tick === 0 ? " zero" : ""}`;
    gridLine.style.setProperty("--weight-change-line-position", `${position}%`);
    gridLines.append(gridLine);
  });

  bars.forEach((bar) => {
    const day = document.createElement("div");
    day.className = "weight-change-day";
    const plot = document.createElement("div");
    plot.className = "weight-change-day-plot";

    if (Number.isFinite(bar.change)) {
      const colorClass = bar.change > 0 ? "positive" : bar.change < 0 ? "negative" : "neutral";
      const heightPercent = bar.change === 0
        ? 0
        : Math.max(2, (Math.abs(bar.change) / maxAbs) * 36);
      const barElement = document.createElement("span");
      barElement.className = `weight-change-day-bar ${colorClass}`;
      barElement.style.setProperty("--bar-height", `${heightPercent}%`);
      const value = document.createElement("span");
      value.className = `weight-change-day-value ${colorClass}`;
      value.style.setProperty("--bar-height", `${heightPercent}%`);
      value.textContent = formatWeightChangeChartValue(bar.change);
      plot.append(value, barElement);
    }

    const label = document.createElement("span");
    label.className = "weight-change-day-label";
    const dateParts = /^([0-9]{2}\.)([0-9]{2}\.)$/.exec(bar.label);
    if (dateParts) {
      const dayPart = document.createElement("span");
      dayPart.className = "weight-change-day-label-day";
      dayPart.textContent = dateParts[1];
      const monthPart = document.createElement("span");
      monthPart.className = "weight-change-day-label-month";
      monthPart.textContent = dateParts[2];
      label.append(dayPart, monthPart);
    } else {
      label.textContent = bar.label;
    }
    day.append(plot, label);
    days.append(day);
  });

  plotGrid.append(gridLines, days);
  chart.append(axis, plotGrid);
}

function renderWeightChangeOverview(references = [], nightDates = []) {
  latestWeightChangeReferences = references;
  latestWeightChangeNightDates = nightDates;
  const latestReference = references[0];
  const previousReference = references[1];
  const dailyChange = latestReference && previousReference
    ? latestReference.weight - previousReference.weight
    : null;
  renderWeightChangeValue(
    elements.weightChangeDay,
    elements.weightChangeDayTrend,
    elements.weightChangeDayTrendLabel,
    elements.weightChangeDayDetail,
    dailyChange,
    1,
    "v primerjavi s prejšnjo nočjo",
  );
  renderWeightChangeBarChart(getWeightChangeDailyBars(references, nightDates));
}

function resetWeightChangeOverview() {
  renderWeightChangeOverview();
}

function getWeightChangeNightDates(latestNightDate) {
  return Array.from({ length: 8 }, (_unused, index) => shiftLocalCalendarDate(latestNightDate, -index));
}

async function getWeightChangeNightReferences(scope, nightDates) {
  if (scope !== "local") return Promise.all(nightDates.map((nightDate) => getNightReference(scope, nightDate)));

  const references = [];
  for (const nightDate of nightDates) {
    references.push(await getNightReference(scope, nightDate));
  }
  return references;
}

async function refreshWeightChangeOverview() {
  if (!isLocalDashboard && cloudRealtimePaused) return;
  const scope = getNightReferenceCacheScope();
  if (!scope) {
    resetWeightChangeOverview();
    return;
  }

  const requestGeneration = ++weightChangeRequestGeneration;
  const latestNightDate = getLatestCompletedNightDate();
  const nightDates = getWeightChangeNightDates(latestNightDate);
  try {
    // Lokalni ESP streže eno pripravljano history okno naenkrat, zato ga beremo
    // zaporedno; Firebase lahko manjkajoča ozka nočna okna bere vzporedno.
    const references = await getWeightChangeNightReferences(scope, nightDates);
    if (requestGeneration !== weightChangeRequestGeneration || scope !== getNightReferenceCacheScope()) return;
    renderWeightChangeOverview(references, nightDates);
  } catch (error) {
    if (requestGeneration !== weightChangeRequestGeneration) return;
    console.warn("Nočne reference mase niso dosegljive.", error);
    resetWeightChangeOverview();
  }
}

function scheduleWeightChangeOverviewRefresh() {
  clearTimeout(weightChangeRefreshTimer);
  if (!isLocalDashboard && cloudRealtimePaused) return;
  const now = new Date();
  const nextRefresh = new Date(now);
  nextRefresh.setHours(5, 0, 5, 0);
  if (nextRefresh <= now) nextRefresh.setDate(nextRefresh.getDate() + 1);
  weightChangeRefreshTimer = window.setTimeout(() => {
    void refreshWeightChangeOverview();
    scheduleWeightChangeOverviewRefresh();
  }, nextRefresh.getTime() - now.getTime());
}

function normalizeWeatherSettings(settings) {
  const latitude = Number(settings?.latitude);
  const longitude = Number(settings?.longitude);
  return {
    enabled: settings?.enabled === true,
    forecastDays: Number(settings?.forecast_days) === 5 ? 5 : 3,
    latitude: Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 ? latitude : null,
    longitude: Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? longitude : null,
    locationName: String(settings?.location_name || "").trim(),
  };
}

function weatherHasLocation(settings = latestWeatherSettings) {
  return Number.isFinite(settings?.latitude) && Number.isFinite(settings?.longitude);
}

function weatherLocationLabel(settings = latestWeatherSettings) {
  if (!weatherHasLocation(settings)) return translateText("Lokacija še ni nastavljena.");
  return settings.locationName || formatTranslatedText("Lokacija panja ({latitude}, {longitude})", {
    latitude: settings.latitude.toFixed(4),
    longitude: settings.longitude.toFixed(4),
  });
}

function weatherPlaceName(settings = latestWeatherSettings) {
  if (!weatherHasLocation(settings)) return translateText("izbrani lokaciji");
  const name = String(settings.locationName || "").split(",")[0].trim();
  return (name || translateText("izbrani lokaciji")).replace(/^Občina\s+/iu, "");
}

function updateWeatherOverviewTitle() {
  elements.weatherOverviewHeading.textContent = formatTranslatedText("Vreme v kraju {place}", { place: weatherPlaceName() });
}

const WEATHER_ICON_NAMES = new Set([
  "clear-day", "clear-night", "partly-cloudy-day", "partly-cloudy-night", "cloudy",
  "fog-day", "fog-night", "drizzle", "rain", "snow", "thunderstorms-day", "thunderstorms-night",
]);
const androidAnimatedWeatherIconCache = new Map();

async function loadAndroidAnimatedWeatherIcon(name) {
  let request = androidAnimatedWeatherIconCache.get(name);
  if (!request) {
    request = fetch(`assets/weather/animated/${name}.svg`, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Vremenske ikone ${name} ni bilo mogoče naložiti.`);
        return response.text();
      })
      .then((markup) => {
        if (!markup.trimStart().startsWith("<svg")) {
          throw new Error(`Vremenska ikona ${name} ni veljaven SVG.`);
        }
        return markup;
      });
    androidAnimatedWeatherIconCache.set(name, request);
  }

  try {
    return await request;
  } catch (error) {
    androidAnimatedWeatherIconCache.delete(name);
    throw error;
  }
}

async function replaceAndroidWeatherIconWithAnimation(element, name) {
  try {
    const markup = await loadAndroidAnimatedWeatherIcon(name);
    if (element.dataset.weatherIcon !== name) return;
    element.innerHTML = markup;
    const svg = element.querySelector("svg");
    svg?.classList.add("weather-icon-animation");
    svg?.setAttribute("aria-hidden", "true");
    svg?.removeAttribute("focusable");
  } catch (error) {
    // PNG ostane viden kot zanesljiv Android fallback.
    console.warn("Animirane vremenske ikone ni bilo mogoče prikazati.", error);
  }
}

function renderWeatherIcon(element, iconName) {
  const name = WEATHER_ICON_NAMES.has(iconName) ? iconName : "partly-cloudy-day";
  // Android WebView kompleksnejših animiranih SVG-jev prek <img> ne izriše
  // zanesljivo. PNG je zato začetni nadomestek, nato pa animirani SVG
  // vstavimo neposredno v DOM, kjer se njegova SMIL animacija lahko izvaja.
  if (isAndroidAppDashboard) {
    element.dataset.weatherIcon = name;
    element.innerHTML = `<img class="weather-icon-static" src="assets/weather/android/${name}.png" width="256" height="256" alt=""/>`;
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      void replaceAndroidWeatherIconWithAnimation(element, name);
    }
    return;
  }
  delete element.dataset.weatherIcon;
  element.innerHTML = `<picture class="weather-icon-picture"><source media="(prefers-reduced-motion: no-preference)" srcset="assets/weather/animated/${name}.svg" type="image/svg+xml"/><img src="assets/weather/static/${name}.svg" alt=""/></picture>`;
}

function weatherCodeInfo(weatherCode, isDay = true) {
  const code = Number(weatherCode);
  const period = isDay === false ? "night" : "day";
  if (code === 0) return { label: translateText("Jasno"), icon: `clear-${period}` };
  if ([1, 2].includes(code)) return { label: translateText("Delno oblačno"), icon: `partly-cloudy-${period}` };
  if (code === 3) return { label: translateText("Oblačno"), icon: "cloudy" };
  if ([45, 48].includes(code)) return { label: translateText("Megla"), icon: `fog-${period}` };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: translateText(code < 61 ? "Pršenje" : "Dež"), icon: code < 61 ? "drizzle" : "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: translateText("Sneg"), icon: "snow" };
  if ([95, 96, 99].includes(code)) return { label: translateText("Nevihta"), icon: `thunderstorms-${period}` };
  return { label: translateText("Spremenljivo"), icon: `partly-cloudy-${period}` };
}

function formatWindDirection(direction) {
  const degrees = Number(direction);
  if (!Number.isFinite(degrees)) return "—";
  const labels = ["S", "SV", "V", "JV", "J", "JZ", "Z", "SZ"];
  return labels[Math.round((((degrees % 360) + 360) % 360) / 45) % labels.length];
}

function updateWeatherOverviewVisibility() {
  const isVisible = !isLocalDashboard && (canManageCloudDevice() || isSharedCloudDeviceSelected()) &&
    latestWeatherSettings?.enabled === true && weatherHasLocation();
  elements.weatherOverview.hidden = !isVisible;
  if (!isVisible) {
    weatherFetchController?.abort();
    return;
  }
  updateWeatherOverviewTitle();
  elements.weatherLocationName.textContent = weatherLocationLabel();
  if (isOverviewViewActive()) void refreshWeatherForecast();
}

function renderWeatherSettings(settings) {
  latestWeatherSettings = normalizeWeatherSettings(settings);
  const hasLocation = weatherHasLocation();
  elements.weatherEnabled.checked = latestWeatherSettings.enabled;
  elements.weatherForecastDays.value = String(latestWeatherSettings.forecastDays);
  elements.weatherSettingsFields.disabled = !latestWeatherSettings.enabled;
  elements.weatherSavedLocation.textContent = weatherLocationLabel();
  elements.weatherLocationQuery.value = "";
  elements.weatherLocationResults.hidden = true;
  elements.weatherLocationResults.replaceChildren();
  weatherLocationSearchResults = [];
  if (latestWeatherSettings.enabled && !hasLocation) {
    elements.weatherSettingsStatus.textContent = translateText("Za prikaz vremena najprej uporabi trenutno lokacijo ali poišči kraj.");
  } else if (elements.weatherSettingsStatus.textContent.startsWith("Za prikaz vremena")) {
    elements.weatherSettingsStatus.textContent = "";
  }
  void updateGenericWeatherLocationName();
  void publishPublicWeatherSettings();
  updateWeatherOverviewVisibility();
}

function createPublicWeatherSettings(settings = latestWeatherSettings, updatedAt = Math.floor(Date.now() / 1000)) {
  return {
    enabled: settings?.enabled === true,
    forecast_days: Number(settings?.forecastDays) === 5 ? 5 : 3,
    location_name: String(settings?.locationName || "").trim(),
    updated_at: updatedAt,
  };
}

function publicWeatherSettingsKey(settings) {
  return `${settings.enabled}:${settings.forecast_days}:${settings.location_name}`;
}

async function publishPublicWeatherSettings(settings = latestWeatherSettings, updatedAt = Math.floor(Date.now() / 1000)) {
  if (!weatherSettingsCanBeChanged()) return;
  const publicSettings = createPublicWeatherSettings(settings, updatedAt);
  if (!publicSettings.location_name) return;
  const publishKey = publicWeatherSettingsKey(publicSettings);
  if (weatherPublicPublishKey === publishKey) return;
  const { database, ref, update } = firebaseDatabase;
  try {
    await update(ref(database), {
      [`${cloudDevicePath}/weather_public`]: publicSettings,
    });
    weatherPublicPublishKey = publishKey;
  } catch (error) {
    console.warn("Javnega prikaza vremena ni bilo mogoče posodobiti.", error);
  }
}

async function renderSharedWeatherSettings(settings) {
  latestSharedWeatherPublicSettings = normalizeWeatherSettings(settings);
  updateSharedWeatherSettings();
}

function renderSharedWeatherPreference(preference) {
  sharedWeatherEnabled = preference?.show_weather === true;
  updateSharedWeatherSettings();
}

async function updateSharedWeatherSettings() {
  const publicSettings = latestSharedWeatherPublicSettings;
  const isSharedViewer = isSharedCloudDeviceSelected();
  elements.sharedWeatherSettingsPanel.hidden = !isSharedViewer;
  if (!isSharedViewer) return;

  const hasPublicLocation = Boolean(publicSettings?.locationName);
  elements.sharedWeatherEnabled.checked = sharedWeatherEnabled;
  elements.sharedWeatherEnabled.disabled = !hasPublicLocation;
  elements.sharedWeatherSettingsStatus.textContent = hasPublicLocation
    ? translateText("Nastavitev velja samo za tvoj pregled deljenega panja.")
    : translateText("Lastnik za ta panj še ni nastavil kraja za vreme.");

  latestWeatherSettings = {
    ...publicSettings,
    enabled: sharedWeatherEnabled && hasPublicLocation,
  };
  if (!latestWeatherSettings.enabled) {
    weatherSharedLocationLookupKey = "";
    updateWeatherOverviewVisibility();
    return;
  }

  const lookupKey = `${cloudDevicePath}:${publicSettings.forecastDays}:${publicSettings.locationName}`;
  if (weatherSharedLocationLookupKey === lookupKey) return;
  weatherSharedLocationLookupKey = lookupKey;
  try {
    const url = new URL(OPEN_METEO_GEOCODING_URL);
    url.searchParams.set("name", publicSettings.locationName);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", getDashboardLanguage());
    url.searchParams.set("format", "json");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Iskanje kraja ni uspelo (${response.status}).`);
    const result = (await response.json()).results?.find((item) =>
      Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
    if (!result) throw new Error("Za shranjeni kraj ni koordinat.");
    if (weatherSharedLocationLookupKey !== lookupKey) return;
    latestWeatherSettings = {
      ...publicSettings,
      enabled: true,
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
    };
    updateWeatherOverviewVisibility();
  } catch (error) {
    console.warn("Kraja za deljeni prikaz vremena ni bilo mogoče določiti.", error);
    weatherSharedLocationLookupKey = "";
    elements.weatherUpdated.textContent = translateText("Vremenskih podatkov za ta kraj ni mogoče pridobiti.");
  }
}

function resetWeatherOverview() {
  elements.weatherUpdated.textContent = translateText("Čakam na podatke …");
  renderWeatherIcon(elements.weatherCurrentIcon, "cloudy");
  elements.weatherCurrentCondition.textContent = "—";
  elements.weatherCurrentTemperature.textContent = "—";
  elements.weatherCurrentHumidity.textContent = "—";
  elements.weatherCurrentPressure.textContent = "—";
  elements.weatherCurrentWind.textContent = "—";
  elements.weatherForecast.replaceChildren();
}

function formatWeatherTemperature(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(0)}°` : "—";
}

function renderWeatherForecast(weather) {
  const current = weather?.current;
  const daily = weather?.daily;
  if (!current || !daily) {
    throw new Error("Vremenska storitev ni vrnila popolnih podatkov.");
  }
  const currentInfo = weatherCodeInfo(current.weather_code, Number(current.is_day) !== 0);
  renderWeatherIcon(elements.weatherCurrentIcon, currentInfo.icon);
  elements.weatherCurrentCondition.textContent = translateText(currentInfo.label);
  elements.weatherCurrentTemperature.textContent = Number.isFinite(Number(current.temperature_2m))
    ? Number(current.temperature_2m).toFixed(1)
    : "—";
  elements.weatherCurrentHumidity.textContent = Number.isFinite(Number(current.relative_humidity_2m))
    ? `${Math.round(Number(current.relative_humidity_2m))} %`
    : "—";
  elements.weatherCurrentPressure.textContent = Number.isFinite(Number(current.pressure_msl))
    ? `${Math.round(Number(current.pressure_msl))} hPa`
    : "—";
  const windSpeed = Number(current.wind_speed_10m);
  elements.weatherCurrentWind.textContent = Number.isFinite(windSpeed)
    ? `${Math.round(windSpeed)} km/h · ${formatWindDirection(current.wind_direction_10m)}`
    : "—";
  elements.weatherUpdated.textContent = current.time
    ? formatTranslatedText("Posodobljeno: {time}", { time: String(current.time).replace("T", " ") })
    : translateText("Posodobljeno");

  elements.weatherForecast.replaceChildren();
  (daily.time ?? []).forEach((date, index) => {
    const info = weatherCodeInfo(daily.weather_code?.[index]);
    const day = document.createElement("article");
    day.className = "weather-forecast-day";
    const weatherLocale = getDashboardLanguage() === "en" ? "en-GB" : getDashboardLanguage() === "hr" ? "hr-HR" : "sl-SI";
    const dateLabel = new Intl.DateTimeFormat(weatherLocale, { weekday: "short", day: "numeric", month: "short" })
      .format(new Date(`${date}T12:00:00`));
    const precipitationProbability = Number(daily.precipitation_probability_max?.[index]);
    const precipitationLabel = Number.isFinite(precipitationProbability)
      ? formatTranslatedText("{value} % padavin", { value: Math.round(precipitationProbability) })
      : translateText("Padavine —");
    const dateElement = document.createElement("p");
    dateElement.textContent = dateLabel;
    const icon = document.createElement("span");
    icon.className = "weather-forecast-icon";
    icon.setAttribute("aria-hidden", "true");
    renderWeatherIcon(icon, info.icon);
    const temperatures = document.createElement("strong");
    temperatures.textContent = `${formatWeatherTemperature(daily.temperature_2m_max?.[index])} `;
    const minimumTemperature = document.createElement("small");
    minimumTemperature.textContent = formatWeatherTemperature(daily.temperature_2m_min?.[index]);
    temperatures.append(minimumTemperature);
    const precipitation = document.createElement("small");
    precipitation.textContent = precipitationLabel;
    day.append(dateElement, icon, temperatures, precipitation);
    elements.weatherForecast.append(day);
  });
}

async function refreshWeatherForecast(force = false) {
  if (!isLocalDashboard && cloudRealtimePaused) return;
  const settings = latestWeatherSettings;
  if (!isOverviewViewActive() || elements.weatherOverview.hidden || !settings?.enabled || !weatherHasLocation(settings)) return;
  const deviceId = cloudDevicePath.replace("devices/", "");
  const requestKey = `${deviceId}:${settings.latitude}:${settings.longitude}:${settings.forecastDays}`;
  if (!force && requestKey === weatherRequestKey && Date.now() - weatherLastFetchedAt < WEATHER_REFRESH_INTERVAL_MS) return;

  weatherFetchController?.abort();
  const controller = new AbortController();
  weatherFetchController = controller;
  weatherRequestKey = requestKey;
  elements.weatherUpdated.textContent = translateText("Pridobivam vreme …");
  try {
    const url = new URL(OPEN_METEO_FORECAST_URL);
    url.searchParams.set("latitude", String(settings.latitude));
    url.searchParams.set("longitude", String(settings.longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,weather_code,is_day");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    url.searchParams.set("forecast_days", String(settings.forecastDays));
    url.searchParams.set("timezone", "auto");
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Vremenska storitev je vrnila napako ${response.status}.`);
    const weather = await response.json();
    if (controller.signal.aborted || requestKey !== weatherRequestKey) return;
    renderWeatherForecast(weather);
    weatherLastFetchedAt = Date.now();
  } catch (error) {
    if (error.name === "AbortError") return;
    console.warn("Vremenskih podatkov ni bilo mogoče pridobiti.", error);
    elements.weatherUpdated.textContent = translateText("Vremenski podatki trenutno niso dosegljivi.");
  }
}

function weatherSettingsCanBeChanged() {
  return Boolean(firebaseDatabase && cloudDevicePath && canManageCloudDevice());
}

function measurementSettingsCanBeChanged() {
  return Boolean(firebaseDatabase && cloudDevicePath && isCloudAdministrator());
}

function renderMeasurementSettings(settings) {
  latestMeasurementSettings = normalizeMeasurementSettings(settings);
  if (elements.measurementSettingsPanel) {
    elements.measurementSettingsPanel.hidden = !isCloudAdministrator() || !cloudDevicePath;
    elements.weightDisplayDecimals.value = String(latestMeasurementSettings.weightDisplayDecimals);
    elements.measurementIntervalSeconds.value = String(latestMeasurementSettings.measurementIntervalSeconds);
    elements.sdArchiveIntervalMinutes.value = String(latestMeasurementSettings.sdArchiveIntervalMinutes);
  }
  if (latestMeasurement) renderLatestMeasurement(latestMeasurement);
  renderOverviewAnalytics();
  renderWeightChangeOverview(latestWeightChangeReferences, latestWeightChangeNightDates);
  if (weightChart) updateChartTheme();
}

async function saveMeasurementSettings(event) {
  event.preventDefault();
  if (!measurementSettingsCanBeChanged()) return;

  const measurementIntervalSeconds = Math.floor(Number(elements.measurementIntervalSeconds.value));
  const sdArchiveIntervalMinutes = Math.floor(Number(elements.sdArchiveIntervalMinutes.value));
  const weightDisplayDecimals = Math.floor(Number(elements.weightDisplayDecimals.value));
  if (!Number.isInteger(measurementIntervalSeconds) || measurementIntervalSeconds < 5 || measurementIntervalSeconds > 120 ||
      !Number.isInteger(sdArchiveIntervalMinutes) || sdArchiveIntervalMinutes < 1 || sdArchiveIntervalMinutes > 30 ||
      ![1, 2].includes(weightDisplayDecimals)) {
    elements.measurementSettingsStatus.textContent = translateText("Preveri dovoljene meje nastavitev.");
    return;
  }
  if (sdArchiveIntervalMinutes * 60 < measurementIntervalSeconds) {
    elements.measurementSettingsStatus.textContent = translateText("Zapis zgodovine na SD ne more biti pogostejši od meritev.");
    return;
  }

  const submitButton = elements.measurementSettingsForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  elements.measurementSettingsStatus.textContent = translateText("Shranjujem nastavitve …");
  try {
    const { database, ref, set } = firebaseDatabase;
    await set(ref(database, `${cloudDevicePath}/measurement_settings`), {
      measurement_interval_seconds: measurementIntervalSeconds,
      sd_archive_interval_minutes: sdArchiveIntervalMinutes,
      weight_display_decimals: weightDisplayDecimals,
      updated_at: Math.floor(Date.now() / 1000),
    });
    elements.measurementSettingsStatus.textContent = translateText("Nastavitve so shranjene. Naprava jih prevzame v največ 30 sekundah.");
  } catch (error) {
    console.error("Nastavitev meritev ni bilo mogoče shraniti.", error);
    elements.measurementSettingsStatus.textContent = translateText("Nastavitev meritev ni bilo mogoče shraniti.");
  } finally {
    submitButton.disabled = false;
  }
}

async function saveWeatherSettings(changes, successMessage, successValues = {}) {
  if (!weatherSettingsCanBeChanged()) return false;
  const { database, ref, update } = firebaseDatabase;
  const updatedAt = Math.floor(Date.now() / 1000);
  const nextSettings = normalizeWeatherSettings({
    enabled: latestWeatherSettings?.enabled,
    forecast_days: latestWeatherSettings?.forecastDays,
    latitude: latestWeatherSettings?.latitude,
    longitude: latestWeatherSettings?.longitude,
    location_name: latestWeatherSettings?.locationName,
    ...changes,
  });
  const updates = Object.fromEntries(Object.entries({
    ...changes,
    updated_at: updatedAt,
  }).map(([key, value]) => [`${cloudDevicePath}/weather/${key}`, value]));
  const publicSettings = createPublicWeatherSettings(nextSettings, updatedAt);
  if (publicSettings.location_name) {
    updates[`${cloudDevicePath}/weather_public`] = publicSettings;
  }
  try {
    await update(ref(database), updates);
    if (publicSettings.location_name) weatherPublicPublishKey = publicWeatherSettingsKey(publicSettings);
    setTranslatedElementText(elements.weatherSettingsStatus, successMessage, successValues);
    return true;
  } catch (error) {
    console.error("Nastavitev vremena ni bilo mogoče shraniti.", error);
    elements.weatherSettingsStatus.textContent = translateText("Nastavitve vremena ni bilo mogoče shraniti.");
    return false;
  }
}

function canChangeSharedWeatherPreference() {
  return Boolean(firebaseDatabase && cloudDevicePath && currentCloudUser && isSharedCloudDeviceSelected());
}

async function saveSharedWeatherPreference(showWeather) {
  if (!canChangeSharedWeatherPreference()) return;
  elements.sharedWeatherEnabled.disabled = true;
  elements.sharedWeatherSettingsStatus.textContent = translateText("Shranjujem nastavitev …");
  try {
    const { database, ref, set } = firebaseDatabase;
    await set(ref(database, `users/${currentCloudUser.uid}/weather_preferences/${cloudDevicePath.replace("devices/", "")}`), {
      show_weather: showWeather === true,
    });
    elements.sharedWeatherSettingsStatus.textContent = showWeather
      ? translateText("Vreme je prikazano na tvojem pregledu.")
      : translateText("Vreme je skrito na tvojem pregledu.");
  } catch (error) {
    console.error("Nastavitve vremena za deljeni panj ni bilo mogoče shraniti.", error);
    elements.sharedWeatherEnabled.checked = !showWeather;
    elements.sharedWeatherSettingsStatus.textContent = translateText("Nastavitve vremena ni bilo mogoče shraniti.");
  } finally {
    elements.sharedWeatherEnabled.disabled = !latestSharedWeatherPublicSettings?.locationName;
  }
}

function getBrowserLocation() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error(translateText("Brskalnik ne podpira določanja lokacije.")));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

function needsWeatherLocationName(settings = latestWeatherSettings) {
  const name = String(settings?.locationName || "").trim();
  return weatherHasLocation(settings) && (!name || name === "Trenutna lokacija" || name.startsWith("Lokacija brskalnika ("));
}

async function reverseGeocodeWeatherLocation(latitude, longitude) {
  const fallbackName = formatTranslatedText("Lokacija brskalnika ({latitude}, {longitude})", {
    latitude: latitude.toFixed(3),
    longitude: longitude.toFixed(3),
  });
  const url = new URL(OPENSTREETMAP_REVERSE_GEOCODING_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", getDashboardLanguage());
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Določanje kraja ni uspelo (${response.status}).`);
  const result = await response.json();
  const address = result?.address ?? {};
  const settlement = address.city || address.town || address.village || address.municipality || address.county;
  return [settlement, address.country].filter(Boolean).join(", ") || fallbackName;
}

async function updateGenericWeatherLocationName() {
  const settings = latestWeatherSettings;
  if (!weatherSettingsCanBeChanged() || !needsWeatherLocationName(settings)) return;
  const lookupKey = `${settings.latitude}:${settings.longitude}`;
  if (weatherLocationLookupKey === lookupKey) return;
  weatherLocationLookupKey = lookupKey;
  try {
    const locationName = await reverseGeocodeWeatherLocation(settings.latitude, settings.longitude);
    if (latestWeatherSettings !== settings || !needsWeatherLocationName(settings)) return;
    await saveWeatherSettings({ location_name: locationName }, "Lokacija {name} je shranjena za ta panj.", { name: locationName });
  } catch (error) {
    console.warn("Kraja za shranjeno lokacijo ni bilo mogoče določiti.", error);
  }
}

async function useBrowserWeatherLocation() {
  if (!weatherSettingsCanBeChanged()) return;
  elements.weatherUseLocation.disabled = true;
  elements.weatherSettingsStatus.textContent = translateText("Brskalnik čaka na dovoljenje za lokacijo …");
  try {
    const position = await getBrowserLocation();
    const latitude = Number(position.coords.latitude.toFixed(5));
    const longitude = Number(position.coords.longitude.toFixed(5));
    let locationName;
    try {
      locationName = await reverseGeocodeWeatherLocation(latitude, longitude);
    } catch (error) {
      console.warn("Kraja za lokacijo brskalnika ni bilo mogoče določiti.", error);
      locationName = formatTranslatedText("Lokacija brskalnika ({latitude}, {longitude})", {
        latitude: latitude.toFixed(3),
        longitude: longitude.toFixed(3),
      });
    }
    await saveWeatherSettings({
      latitude,
      longitude,
      location_name: locationName,
    }, "Lokacija {name} je shranjena za ta panj.", { name: locationName });
  } catch (error) {
    console.warn("Lokacije brskalnika ni bilo mogoče pridobiti.", error);
    const message = translateText(error?.code === 1
      ? "Dovoljenje za lokacijo je zavrnjeno. Kraj lahko poiščeš ročno."
      : "Lokacije ni bilo mogoče pridobiti. Poskusi znova ali poišči kraj ročno.");
    elements.weatherSettingsStatus.textContent = message;
  } finally {
    elements.weatherUseLocation.disabled = false;
  }
}

function weatherSearchResultLabel(result) {
  return [result.name, result.admin1, result.country].filter(Boolean).join(", ");
}

function renderWeatherLocationResults(results) {
  weatherLocationSearchResults = results;
  elements.weatherLocationResults.replaceChildren();
  elements.weatherLocationResults.hidden = results.length === 0;
  results.forEach((result, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "weather-location-result";
    button.textContent = weatherSearchResultLabel(result);
    button.addEventListener("click", () => saveSearchedWeatherLocation(index));
    elements.weatherLocationResults.append(button);
  });
}

async function searchWeatherLocation() {
  const query = elements.weatherLocationQuery.value.trim();
  if (!query) {
    elements.weatherSettingsStatus.textContent = translateText("Vnesi kraj, ki ga želiš poiskati.");
    return;
  }
  elements.weatherSearchLocation.disabled = true;
  elements.weatherSettingsStatus.textContent = translateText("Iščem kraj …");
  try {
    const url = new URL(OPEN_METEO_GEOCODING_URL);
    url.searchParams.set("name", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", getDashboardLanguage());
    url.searchParams.set("format", "json");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Iskanje kraja ni uspelo (${response.status}).`);
    const data = await response.json();
    const results = (data.results ?? []).filter((result) =>
      Number.isFinite(Number(result.latitude)) && Number.isFinite(Number(result.longitude)));
    renderWeatherLocationResults(results);
    elements.weatherSettingsStatus.textContent = translateText(results.length
      ? "Izberi kraj za lokacijo panja."
      : "Za vneseni kraj ni rezultatov.");
  } catch (error) {
    console.warn("Kraja ni bilo mogoče poiskati.", error);
    elements.weatherSettingsStatus.textContent = translateText("Iskanje kraja trenutno ni dosegljivo.");
  } finally {
    elements.weatherSearchLocation.disabled = false;
  }
}

async function saveSearchedWeatherLocation(index) {
  const result = weatherLocationSearchResults[index];
  if (!result) return;
  const saved = await saveWeatherSettings({
    latitude: Number(Number(result.latitude).toFixed(5)),
    longitude: Number(Number(result.longitude).toFixed(5)),
    location_name: weatherSearchResultLabel(result),
  }, "Lokacija {name} je shranjena za ta panj.", { name: weatherSearchResultLabel(result) });
  if (saved) {
    elements.weatherLocationResults.hidden = true;
    elements.weatherLocationResults.replaceChildren();
    weatherLocationSearchResults = [];
  }
}

function initializeWeatherSettings() {
  elements.measurementSettingsForm.addEventListener("submit", saveMeasurementSettings);
  elements.weatherSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void searchWeatherLocation();
  });
  elements.weatherEnabled.addEventListener("change", () => {
    void saveWeatherSettings({ enabled: elements.weatherEnabled.checked }, elements.weatherEnabled.checked
      ? "Prikaz vremena je vključen."
      : "Prikaz vremena je izključen.");
  });
  elements.weatherForecastDays.addEventListener("change", () => {
    void saveWeatherSettings({ forecast_days: Number(elements.weatherForecastDays.value) === 5 ? 5 : 3 }, "Dolžina napovedi je shranjena.");
  });
  elements.weatherUseLocation.addEventListener("click", () => void useBrowserWeatherLocation());
  elements.weatherSearchLocation.addEventListener("click", () => void searchWeatherLocation());
  elements.sharedWeatherEnabled.addEventListener("change", () => {
    void saveSharedWeatherPreference(elements.sharedWeatherEnabled.checked);
  });
}

const COMPONENT_DEFINITIONS = [
  { key: "bme680", name: "BME680", element: "componentBme680", description: "Temperatura in vlaga" },
  { key: "hx711", name: "HX711", element: "componentHx711", description: "Merilne celice" },
  { key: "ds3231", name: "DS3231", element: "componentDs3231", description: "RTC ura" },
  { key: "sd_card", name: "SD kartica", element: "componentSdCard", description: "Dnevnik meritev" },
];

function isComponentOperational(componentKey, fallbackStatus) {
  const component = latestDeviceStatus?.components?.[componentKey];
  const status = component ?? fallbackStatus;
  return status?.ready === true && status?.state !== "error";
}

function isSDCardOperational(status = latestSDCardStatus) {
  const component = latestDeviceStatus?.components?.sd_card;
  return status?.present === true && status?.error !== true &&
    component?.ready !== false && component?.state !== "error";
}

function getComponentPresentation(component, key) {
  let state = component?.state ?? "checking";
  const failures = Number(component?.failures ?? 0);
  // Starejši firmware lahko ob prvih neuspelih preverjanjih pošlje state=ok
  // skupaj z ready=false. Takšna komponenta ne sme biti prikazana kot zdrava.
  if (component?.ready === false && state === "ok") state = "checking";
  if (key === "ds3231" && component?.ready === true && component?.time_valid === false) state = "warning";

  const stateLabels = {
    checking: "Čakam na preverjanje",
    ok: "Deluje normalno",
    warning: "Potrebno preverjanje",
    error: "Napaka komponente",
  };
  let detail = state === "checking"
    ? component?.ready === false
      ? "Komponenta trenutno ni dosegljiva; preverjanje se ponavlja."
      : "Komponenta še ni preverjena."
    : state === "ok"
      ? "Deluje normalno."
      : failures > 0
        ? `${failures} zaporednih neuspelih preverjanj.`
        : "Preveri povezavo ali napajanje.";
  if (key === "ds3231" && component?.ready === true && component?.time_valid === false) {
    detail = "RTC ura nima veljavnega časa.";
  }
  return { state, label: stateLabels[state] ?? stateLabels.checking, detail };
}

function renderComponentHealth(components) {
  const alerts = [];
  COMPONENT_DEFINITIONS.forEach((definition) => {
    const presentation = getComponentPresentation(components?.[definition.key], definition.key);
    const card = elements[definition.element];
    card.className = `component-health-card ${presentation.state}`;
    card.querySelector("strong").textContent = translateText(presentation.label);
    card.querySelector("small").textContent = translateText(presentation.detail);
    if (presentation.state === "warning" || presentation.state === "error") {
      alerts.push({ name: definition.name, ...presentation });
    }
  });

  const hasAlerts = alerts.length > 0;
  const hasError = alerts.some((alert) => alert.state === "error");
  elements.hardwareAlertStatus.hidden = !hasAlerts;
  elements.hardwareAlertStatus.className = `hardware-alert-status ${hasError ? "error" : "warning"}`;
  elements.hardwareAlertText.textContent = hasAlerts
    ? `${alerts.length} ${alerts.length === 1 ? "opozorilo" : "opozorili komponent"}`
    : "";

  elements.componentAlertPanel.hidden = !hasAlerts;
  elements.componentAlertList.replaceChildren();
  alerts.forEach((alert) => {
    const item = document.createElement("p");
    item.className = `component-alert-item ${alert.state}`;
    item.textContent = `${alert.name}: ${translateText(alert.detail)}`;
    elements.componentAlertList.append(item);
  });
}

function renderDeviceStatus(status, localDashboard = isLocalDashboard) {
  latestDeviceStatus = status;
  elements.deviceId.textContent = status?.device_id ?? "—";
  elements.cloudWifiSsidCard.hidden = localDashboard;
  elements.cloudWifiSsid.textContent = status?.station_ssid || "—";
  elements.ipAddress.textContent = status?.ip_address ?? "—";
  elements.wifiSignal.textContent = Number.isFinite(Number(status?.wifi_rssi_dbm)) ? `${status.wifi_rssi_dbm} dBm` : "—";
  const values = [status?.uptime_days, status?.uptime_hours, status?.uptime_minutes];
  elements.uptime.textContent = values.every((value) => value !== undefined)
    ? formatTranslatedText("{days} dni {hours} h {minutes} min", {
      days: values[0],
      hours: String(values[1]).padStart(2, "0"),
      minutes: String(values[2]).padStart(2, "0"),
    })
    : "—";

  const lastSeenTimestamp = Number(status?.last_seen_timestamp);
  const isOnline = localDashboard || isDeviceOnline(status);
  elements.deviceStateCard.classList.toggle("online", isOnline);
  elements.deviceStateCard.classList.toggle("offline", !isOnline);
  elements.deviceStatusDot.classList.toggle("online", isOnline);
  elements.deviceStatusDot.classList.toggle("offline", !isOnline);
  elements.deviceOnlineStatus.textContent = translateText(isOnline ? "Online" : "Offline");
  elements.deviceLastSeen.textContent = localDashboard
    ? translateText("Dosegljiv prek lokalnega IP-ja.")
    : Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0
      ? formatTranslatedText("Zadnji odziv: {time}", { time: formatDashboardDateTime(new Date(lastSeenTimestamp * 1000)) })
       : translateText("Čakam na prvi odziv naprave.");

  renderHeaderDeviceState();
  renderComponentHealth(status?.components);
  renderLoadCellTareStatus(latestLoadCellTareStatus);
  renderBme680CalibrationStatus(latestBme680CalibrationStatus);
  if (!localDashboard) {
    renderHistoryManagementStatus(latestHistoryManagementStatus);
    renderCloudWifiResetStatus(latestNetworkResetStatus);
    renderTimeStatus(status);
    renderCloudSynchronization(status?.history_sync, { station_connected: isOnline }, latestSDCardStatus);
  }
}

function renderTimeStatus(status, network = latestNetworkStatus) {
  latestTimeStatus = status;
  const timestamp = Number(status?.timestamp ?? status?.current_time_timestamp);
  const source = status?.source ?? status?.time_source ?? "unavailable";
  const rtcPresent = status?.rtc_present === true;
  const rtcValid = status?.rtc_valid === true;
  const ntpPending = status?.ntp_sync_pending === true;
  const lastSyncTimestamp = Number(status?.last_sync_timestamp ?? status?.last_time_sync_timestamp);
  const sourceLabels = {
    rtc: "Vir časa: DS3231 RTC",
    ntp: "Vir časa: internetna NTP ura",
    manual_local: "Vir časa: ročna lokalna nastavitev",
    manual_cloud: "Vir časa: ročna cloud nastavitev",
    unavailable: "Veljaven čas še ni na voljo",
  };

  elements.deviceCurrentTime.textContent = Number.isFinite(timestamp) && timestamp > 0
    ? formatDashboardDateTime(new Date(timestamp * 1000), true)
    : "—";
  elements.deviceTimeSource.textContent = translateText(sourceLabels[source] ?? sourceLabels.unavailable);
  if (!rtcPresent) {
    elements.rtcStatus.textContent = translateText("DS3231 ni zaznan. Ročna ali NTP ura se ob izpadu napajanja ne bo ohranila.");
  } else if (!rtcValid) {
    elements.rtcStatus.textContent = translateText("DS3231 je zaznan, vendar nima veljavnega časa. Preveri baterijo in nastavi uro.");
  } else if (Number.isFinite(lastSyncTimestamp) && lastSyncTimestamp > 0) {
    elements.rtcStatus.textContent = formatTranslatedText("DS3231 je pripravljen. Zadnja nastavitev: {time}.", { time: formatDashboardDateTime(new Date(lastSyncTimestamp * 1000), true) });
  } else {
    elements.rtcStatus.textContent = translateText("DS3231 je zaznan in vsebuje veljaven čas.");
  }

  if (document.activeElement !== elements.deviceDateTime && Number.isFinite(timestamp) && timestamp > 0) {
    elements.deviceDateTime.value = formatDateTimeInput(new Date(timestamp * 1000));
  }

  const rtcOperational = isComponentOperational("ds3231", {
    ready: rtcPresent,
    state: rtcPresent ? "ok" : "error",
  });
  const cloudDeviceReady = Boolean(cloudDevicePath && currentCloudUser && isDeviceOnline(latestDeviceStatus));
  const canSetTime = (isLocalDashboard || cloudDeviceReady) && rtcOperational;
  const internetAvailable = (isLocalDashboard ? network?.station_connected === true : cloudDeviceReady) && rtcOperational;
  elements.setDeviceTime.disabled = !canSetTime || ntpPending;
  elements.syncDeviceTime.disabled = !internetAvailable || ntpPending;
  if (ntpPending) {
    elements.deviceTimeStatus.textContent = translateText("Čakam na internetno časovno sinhronizacijo …");
  } else if (!rtcOperational) {
    elements.deviceTimeStatus.textContent = translateText("DS3231 ni pripravljen; nastavljanje in sinhronizacija časa trenutno nista mogoča.");
  } else if (!isLocalDashboard && cloudDevicePath && currentCloudUser && !cloudDeviceReady) {
    elements.deviceTimeStatus.textContent = translateText("Panj je offline; nastavljanje datuma in ure trenutno ni možno.");
  } else if (!isLocalDashboard && cloudDeviceReady) {
    elements.deviceTimeStatus.textContent = translateText("Naprava je online; datum in uro lahko nastaviš ali sinhroniziraš z internetom.");
  }
}

function renderLoadCellTareStatus(status) {
  latestLoadCellTareStatus = status;
  const reportedState = status?.state ?? status?.tare_state ?? "idle";
  const updatedAt = Number(status?.updated_at);
  const isStaleCloudTare = !isLocalDashboard &&
    (reportedState === "queued" || reportedState === "taring") &&
    (!Number.isFinite(updatedAt) || (Date.now() / 1000) - updatedAt > LOAD_CELL_TARE_TIMEOUT_SECONDS);
  const state = isStaleCloudTare ? "error" : reportedState;
  const messages = {
    idle: "S ploščadi odstrani vse in nato tariraj tehtnico.",
    queued: "Ukaz za tariranje čaka na izvedbo.",
    taring: "Nastavljam prazno ploščad na 0,00 kg …",
    completed: "Tariranje je uspešno; nova ničla je shranjena.",
    error: "Tariranje ni uspelo. Preveri povezavo HX711.",
  };
  const isBusy = state === "queued" || state === "taring";
  const loadCellReady = isComponentOperational("hx711", status);
  const cloudDeviceReady = Boolean(cloudDevicePath && currentCloudUser && isDeviceOnline(latestDeviceStatus));
  const canTare = (isLocalDashboard || cloudDeviceReady) && loadCellReady;
  const button = isLocalDashboard ? elements.localLoadCellTare : elements.cloudLoadCellTare;
  const statusElement = isLocalDashboard ? elements.localLoadCellTareStatus : elements.cloudLoadCellTareStatus;

  button.disabled = !canTare || isBusy;
  const tareMessage = isStaleCloudTare
    ? "Prejšnje tariranje se ni zaključilo. Odstrani uteži in poskusi znova."
    : !isLocalDashboard && !cloudDeviceReady
      ? cloudDevicePath
        ? "Panj je offline; tariranje trenutno ni možno."
        : "Izberi online panj za tariranje."
      : !loadCellReady
        ? "HX711 ni pripravljen; tariranje trenutno ni možno."
       : status?.message ?? messages[state] ?? messages.idle;
  statusElement.textContent = translateText(tareMessage);
}

function formatCalibrationOffset(value, unit) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  const sign = numericValue >= 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(1).replace(".", ",")} ${unit}`;
}

function renderBme680CalibrationStatus(status) {
  latestBme680CalibrationStatus = status;
  const temperatureOffset = Number(status?.temperature_offset_c ?? 0);
  const humidityOffset = Number(status?.humidity_offset_percent ?? 0);
  const offsetsValid = Number.isFinite(temperatureOffset) && Number.isFinite(humidityOffset);
  const reportedState = status?.state ?? "idle";
  const nowSeconds = Date.now() / 1000;
  const updatedAt = Number(status?.updated_at);
  const calibrationRequestIsPending = bme680CalibrationPendingUntil > nowSeconds;
  const commandAwaitingResponse = calibrationRequestIsPending &&
    (!Number.isFinite(updatedAt) || updatedAt < bme680CalibrationRequestedAt);
  const state = commandAwaitingResponse ? "queued" : reportedState;
  const calibrationRequestFinished = calibrationRequestIsPending && !commandAwaitingResponse &&
    (reportedState === "completed" || reportedState === "error");
  if (calibrationRequestFinished || bme680CalibrationPendingUntil <= nowSeconds) {
    bme680CalibrationPendingUntil = 0;
  }

  const isBusy = state === "queued" || state === "applying";
  const bme680Operational = isComponentOperational("bme680", status);
  const cloudDeviceReady = Boolean(cloudDevicePath && currentCloudUser && isDeviceOnline(latestDeviceStatus));
  const canChange = (isLocalDashboard || cloudDeviceReady) && bme680Operational;
  const controls = isLocalDashboard
    ? [{
      temperature: elements.localTemperatureOffset,
      humidity: elements.localHumidityOffset,
      button: elements.localSaveBme680Calibration,
      status: elements.localBme680CalibrationStatus,
      form: elements.localBme680CalibrationForm,
    }]
    : [{
      temperature: elements.cloudTemperatureOffset,
      humidity: elements.cloudHumidityOffset,
      button: elements.cloudSaveBme680Calibration,
      status: elements.cloudBme680CalibrationStatus,
      form: elements.cloudBme680CalibrationForm,
    }];

  const messages = {
    idle: offsetsValid
      ? formatTranslatedText("Trenutna odmika: temperatura {temperature}, vlaga {humidity}.", {
        temperature: formatCalibrationOffset(temperatureOffset, "°C"),
        humidity: formatCalibrationOffset(humidityOffset, "%"),
      })
      : "Čakam na stanje kalibracije BME680 …",
    queued: "Ukaz za kalibracijo čaka na izvedbo.",
    applying: "Shranjujem kalibracijo BME680 …",
    completed: "Kalibracija BME680 je shranjena in uporabljena pri novih meritvah.",
    error: "Kalibracije BME680 ni bilo mogoče shraniti.",
  };

  controls.forEach((control) => {
    if (calibrationRequestFinished) control.form.dataset.dirty = "false";
    const preserveUserInput = control.form.dataset.dirty === "true";
    if (offsetsValid && !preserveUserInput) {
      control.temperature.value = temperatureOffset.toFixed(1);
      control.humidity.value = humidityOffset.toFixed(1);
    }
    control.temperature.disabled = !canChange || isBusy;
    control.humidity.disabled = !canChange || isBusy;
    control.button.disabled = !canChange || isBusy;
    const calibrationMessage = !isLocalDashboard && !cloudDeviceReady
      ? cloudDevicePath
        ? "Panj je offline; kalibracije trenutno ni mogoče nastaviti."
        : "Izberi online panj za kalibracijo."
      : !bme680Operational
        ? "BME680 ni pripravljen; odmikov trenutno ni mogoče nastaviti."
      : (state === "completed" || state === "error") && status?.message
        ? status.message
        : messages[state] ?? messages.idle;
    control.status.textContent = translateText(calibrationMessage);
  });
}

function updateWiFiTransitionNotice() {
  if (!elements.wifiTransitionNotice || wifiTransitionMode !== "access_point" || wifiTransitionDeadline === 0) return;

  const remainingSeconds = Math.max(0, Math.ceil((wifiTransitionDeadline - Date.now()) / 1000));
  elements.wifiTransitionNotice.textContent = remainingSeconds > 0
    ? formatTranslatedText("Dostopna točka bo na voljo še približno {seconds} s. Za nadaljnjo uporabo priporočamo spletno nadzorno ploščo; lokalni IP lahko preveriš v usmerjevalniku.", { seconds: remainingSeconds })
    : translateText("Dostopna točka se je zaprla. Poveži se z domačim Wi‑Fi omrežjem in nadaljuj v spletni nadzorni plošči; lokalni IP lahko preveriš v usmerjevalniku.");
}

function dashboardUsesProvisioningAddress() {
  return window.location.hostname === "192.168.4.1";
}

function localHostnameUrl(network = latestNetworkStatus) {
  const hostname = network?.local_hostname?.trim();
  return hostname ? `http://${hostname}/` : "";
}

function cloudDashboardUrl() {
  return CLOUD_DASHBOARD_URL;
}

function setWiFiTransitionAddress(address) {
  wifiTransitionAddress = address;
  elements.wifiNewIpAddress.textContent = address || "—";
  elements.wifiNewIpAddress.href = address || "#";
  elements.wifiOpenAddress.href = address || "#";
  elements.wifiOpenAddress.classList.toggle("is-disabled", !address);
  elements.wifiOpenAddress.setAttribute("aria-disabled", String(!address));
}

function showWiFiTransitionResult({ mode, eyebrow, heading, message, addressLabel, address, notice }) {
  wifiTransitionMode = mode;
  wifiTransitionDeadline = 0;
  wifiTransitionProbeGeneration += 1;
  elements.wifiConnectionResult.hidden = false;
  elements.wifiConnectionResult.dataset.transition = mode;
  elements.wifiForm.hidden = true;
  elements.wifiConnectionResultEyebrow.textContent = translateText(eyebrow);
  elements.wifiConnectionResultHeading.textContent = translateText(heading);
  elements.wifiConnectionResultMessage.textContent = translateText(message);
  elements.wifiAddressLabel.textContent = translateText(addressLabel);
  elements.wifiLocalHostnameRow.hidden = true;
  elements.wifiTransitionNotice.textContent = translateText(notice);
  elements.wifiCopyStatus.textContent = "";
  const showCloudAccess = mode !== "forgotten";
  const cloudUrl = cloudDashboardUrl();
  elements.wifiCloudCard.hidden = !showCloudAccess;
  elements.wifiCloudAddress.href = cloudUrl;
  elements.wifiOpenCloud.hidden = !showCloudAccess;
  elements.wifiOpenCloud.href = cloudUrl;
  elements.wifiOpenCloud.classList.toggle("primary-button", showCloudAccess);
  elements.wifiOpenCloud.classList.toggle("secondary-button", !showCloudAccess);
  elements.wifiOpenAddress.classList.toggle("primary-button", !showCloudAccess);
  elements.wifiOpenAddress.classList.toggle("secondary-button", showCloudAccess);
  setWiFiTransitionAddress(address);
}

async function probeDeviceOnLocalHostname(hostnameUrl, generation) {
  if (!hostnameUrl) return;

  for (let attempt = 0; attempt < 30 && generation === wifiTransitionProbeGeneration; attempt += 1) {
    await delay(2_000);
    try {
      await fetch(hostnameUrl, { mode: "no-cors", cache: "no-store" });
      if (generation !== wifiTransitionProbeGeneration || wifiTransitionMode !== "home_network") return;
      elements.wifiTransitionNotice.textContent = translateText("Naprava je dosegljiva na novem omrežju. Za nadaljnjo uporabo priporočamo spletno nadzorno ploščo; lokalni dostop ostaja na voljo prek stalnega naslova.");
      return;
    } catch {
      // Telefon ali računalnik morda še ni povezan z novim SSID-jem; poskus tiho ponovimo.
    }
  }
}

function showHomeNetworkTransition(ssid) {
  const hostnameUrl = localHostnameUrl();
  showWiFiTransitionResult({
    mode: "home_network",
    eyebrow: "Menjava omrežja",
    heading: "Naprava se povezuje z novim Wi‑Fi omrežjem",
    message: formatTranslatedText("Naprava prehaja v omrežje {ssid}. Ko bo povezava vzpostavljena, za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.", { ssid }),
    addressLabel: "Stalni lokalni naslov naprave",
    address: hostnameUrl,
    notice: hostnameUrl
      ? "Tudi telefon ali računalnik poveži z novim omrežjem. Za lokalni dostop počakaj nekaj sekund in odpri stalni naslov; če .local ne deluje, novi IP preveri v usmerjevalniku."
      : "Tudi telefon ali računalnik poveži z novim omrežjem. Za lokalni dostop novi IP preveri med povezanimi napravami v usmerjevalniku.",
  });
  const generation = wifiTransitionProbeGeneration;
  probeDeviceOnLocalHostname(hostnameUrl, generation);
}

function showForgottenWiFiTransition() {
  const accessPointSsid = latestNetworkStatus?.access_point_ssid || "dostopna točka naprave";
  const accessPointUrl = "http://192.168.4.1/";
  showWiFiTransitionResult({
    mode: "forgotten",
    eyebrow: "Wi‑Fi je odstranjen",
    heading: "Ponovno poveži napravo",
    message: formatTranslatedText("Shranjeno omrežje bo izbrisano. Naprava bo odprla dostopno točko {ssid}.", { ssid: accessPointSsid }),
    addressLabel: "Naslov nastavitev na dostopni točki",
    address: accessPointUrl,
    notice: formatTranslatedText("V nastavitvah Wi‑Fi telefona ali računalnika izberi {ssid}, nato odpri {url} in ponovno vnesi poverilnice.", { ssid: accessPointSsid, url: accessPointUrl }),
  });
  elements.wifiOpenAddress.textContent = translateText("Odpri nastavitve");
}

function renderWiFiConnectionResult(network, connectionState, isConnected) {
  if (wifiTransitionMode === "home_network" || wifiTransitionMode === "forgotten") return;

  const stationIp = network?.station_ip ?? "";
  const localHostname = network?.local_hostname ?? "";
  const remainingSeconds = Number(network?.access_point_shutdown_remaining_seconds);
  const showResult = connectionState === "connected" && isConnected && stationIp &&
    Number.isFinite(remainingSeconds) && remainingSeconds > 0;

  elements.wifiConnectionResult.hidden = !showResult;
  elements.wifiForm.hidden = showResult;
  if (!showResult) {
    wifiTransitionMode = "idle";
    wifiTransitionDeadline = 0;
    wifiTransitionAddress = "";
    return;
  }

  wifiTransitionMode = "access_point";
  elements.wifiConnectionResult.dataset.transition = "access_point";
  elements.wifiConnectionResultEyebrow.textContent = translateText("Povezava je uspela");
  elements.wifiConnectionResultHeading.textContent = translateText("Naprava je povezana");
  elements.wifiAddressLabel.textContent = translateText("Novi lokalni naslov");
  const cloudUrl = cloudDashboardUrl();
  elements.wifiCloudCard.hidden = false;
  elements.wifiCloudAddress.href = cloudUrl;
  elements.wifiLocalHostnameRow.hidden = false;
  elements.wifiOpenAddress.textContent = translateText("Odpri lokalno");
  elements.wifiOpenCloud.hidden = false;
  elements.wifiOpenCloud.href = cloudUrl;
  elements.wifiOpenCloud.classList.add("primary-button");
  elements.wifiOpenCloud.classList.remove("secondary-button");
  elements.wifiOpenAddress.classList.add("secondary-button");
  elements.wifiOpenAddress.classList.remove("primary-button");
  elements.wifiOpenAddress.classList.remove("is-disabled");
  elements.wifiOpenAddress.setAttribute("aria-disabled", "false");
  const stationUrl = `http://${stationIp}/`;
  const hostnameUrl = localHostname ? `http://${localHostname}/` : "";
  wifiTransitionAddress = stationUrl;
  wifiTransitionDeadline = Date.now() + remainingSeconds * 1000;
  elements.wifiConnectionResultMessage.textContent = network?.station_ssid
    ? formatTranslatedText("Naprava je povezana z internetom prek omrežja {ssid}. Za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.", { ssid: network.station_ssid })
    : translateText("Naprava je povezana z internetom. Za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.");
  elements.wifiNewIpAddress.textContent = stationUrl;
  elements.wifiNewIpAddress.href = stationUrl;
  elements.wifiOpenAddress.href = stationUrl;
  elements.wifiNewLocalHostname.textContent = localHostname || "Ni na voljo";
  elements.wifiNewLocalHostname.href = hostnameUrl || stationUrl;
  elements.wifiTransitionNotice.textContent = translateText("Za lokalni dostop poveži telefon ali računalnik z istim Wi‑Fi omrežjem. Če lokalni naslov ni dosegljiv, IP preveri med povezanimi napravami v usmerjevalniku.");
  elements.wifiCopyStatus.textContent = "";
  updateWiFiTransitionNotice();
}

function renderProvisioning(network) {
  latestNetworkStatus = network;
  elements.provisioningSection.hidden = false;
  elements.localDeviceId.textContent = latestDeviceStatus?.device_id ?? "—";
  elements.activationCode.textContent = network?.activation_code ?? "—";
  elements.localActivationCard.hidden = false;
  elements.localActivationCode.textContent = network?.activation_code ?? "—";
  const accessPointName = network?.access_point_ssid ? ` (${network.access_point_ssid})` : "";
  const connectionState = network?.connection_state ?? "idle";
  const isConnecting = connectionState === "connecting";
  const isUsingAccessPoint = network?.provisioning_active === true;
  const isConnected = network?.station_connected === true;
  const hasSavedCredentials = network?.credentials_saved === true;
  elements.connectedWifiSsid.textContent = isConnected && network?.station_ssid ? network.station_ssid : "—";
  renderWiFiConnectionResult(network, connectionState, isConnected);

  if (isConnecting) {
    elements.provisioningDescription.textContent = formatTranslatedText("Naprava preverja izbrano Wi‑Fi omrežje. Ostani povezan na dostopni točki{ap}.", { ap: accessPointName });
  } else if (isConnected) {
    elements.provisioningDescription.textContent = network?.station_ssid
      ? formatTranslatedText("Naprava je povezana v Wi‑Fi omrežje {ssid}. Nastavitve lahko po potrebi spremeniš ali izbrišeš.", { ssid: network.station_ssid })
      : translateText("Naprava je povezana v domače Wi‑Fi omrežje.");
  } else if (connectionState === "connected") {
    elements.provisioningDescription.textContent = translateText("Povezava z Wi‑Fi je uspela. Čakam na potrditev omrežnega naslova.");
  } else if (connectionState === "failed") {
    elements.provisioningDescription.textContent = formatTranslatedText("Povezava z Wi‑Fi ni uspela. AP{ap} ostaja na voljo za ponoven poskus.", { ap: accessPointName });
  } else if (isUsingAccessPoint) {
    elements.provisioningDescription.textContent = formatTranslatedText("Povezan si neposredno na dostopno točko naprave{ap}. Vpiši domače Wi‑Fi omrežje za dostop do clouda.", { ap: accessPointName });
  }

  elements.wifiScan.disabled = isConnecting;
  elements.wifiForget.hidden = !hasSavedCredentials;
  elements.wifiForget.disabled = isConnecting || !hasSavedCredentials;
  elements.wifiPasswordToggle.disabled = isConnecting;
  elements.wifiForm.querySelector("button[type='submit']").disabled = isConnecting;
  if (network?.connection_message) elements.wifiFormStatus.textContent = network.connection_message;
}

function renderCloudSynchronization(sync, network, sdCard) {
  const isPending = sync?.pending === true;
  const isCaughtUp = sync?.caught_up === true;
  const hasCloudConnection = network?.station_connected === true;
  const hasSDCard = isSDCardOperational(sdCard);
  const lastSyncedTimestamp = Number(sync?.last_synced_timestamp);
  const reconciliation = sync?.reconciliation ?? {};
  const reconciliationState = reconciliation.state;
  const localDays = Number(reconciliation.local_days);
  const daysToTransfer = Number(reconciliation.days_to_transfer);
  const daysCompleted = Number(reconciliation.days_completed);
  const measurementsToTransfer = Number(reconciliation.measurements_to_transfer);
  const measurementsUploaded = Number(reconciliation.measurements_uploaded);

  if (!hasSDCard) {
    elements.cloudSyncStatus.textContent = translateText(sdCard?.error === true
      ? "SD kartica javlja napako; sinhronizacija s Firebase trenutno ni mogoča."
      : "SD kartica ni dosegljiva; sinhronizacija s Firebase trenutno ni mogoča.");
  } else if (!hasCloudConnection) {
    elements.cloudSyncStatus.textContent = translateText("Cloud ni dosegljiv; meritve varno čakajo na SD kartici.");
  } else if (reconciliationState === "preparing") {
    elements.cloudSyncStatus.textContent = translateText("Pripravljam dnevni indeks SD zgodovine …");
  } else if (reconciliationState === "checking") {
    const daysText = Number.isFinite(localDays) && localDays > 0 ? ` (${localDays} dni)` : "";
    elements.cloudSyncStatus.textContent = formatTranslatedText("Primerjam dnevni indeks SD kartice s Firebase{days} …", { days: daysText });
  } else if (reconciliationState === "syncing") {
    const completedText = Number.isFinite(daysCompleted) ? daysCompleted : 0;
    const localDaysText = Number.isFinite(localDays) && localDays > 0 ? localDays : "?";
    const transferText = Number.isFinite(daysToTransfer) ? daysToTransfer : 0;
    const measurementProgress = Number.isFinite(measurementsToTransfer) && measurementsToTransfer > 0
      ? ` ${formatTranslatedText("Prenesenih meritev: {uploaded}/{total}.", { uploaded: Number.isFinite(measurementsUploaded) ? measurementsUploaded : 0, total: measurementsToTransfer })}`
      : "";
    elements.cloudSyncStatus.textContent = transferText > 0
      ? formatTranslatedText("Pregledujem in obnavljam dneve: {completed}/{total}. Manjkajočih ali neskladnih dni: {missing}.{progress}", { completed: completedText, total: localDaysText, missing: transferText, progress: measurementProgress })
      : translateText("Dopolnjujem dnevni indeks Firebase brez ponovnega prenosa meritev …");
  } else if (reconciliationState === "error") {
    elements.cloudSyncStatus.textContent = translateText("Primerjava SD zgodovine s Firebase ni uspela. Preveri SD kartico in povezavo ter poskusi znova.");
  } else if (isPending) {
    const lastRecordText = Number.isFinite(lastSyncedTimestamp) && lastSyncedTimestamp > 0
      ? ` ${formatTranslatedText("Zadnji potrjen zapis: {time}.", { time: formatDashboardDateTime(new Date(lastSyncedTimestamp * 1000)) })}`
      : ` ${translateText("Čakam na potrditev prvega zapisa.")}`;
    elements.cloudSyncStatus.textContent = formatTranslatedText("Pošiljam zgodovino v Firebase …{detail}", { detail: lastRecordText });
  } else if (isCaughtUp) {
    elements.cloudSyncStatus.textContent = translateText("SD kartica in Firebase sta sinhronizirana.");
  } else if (Number.isFinite(lastSyncedTimestamp) && lastSyncedTimestamp > 0) {
    elements.cloudSyncStatus.textContent = formatTranslatedText("Zadnji preneseni zapis: {time}.", {
      time: formatDashboardDateTime(new Date(lastSyncedTimestamp * 1000)),
    });
  } else {
    elements.cloudSyncStatus.textContent = translateText("Zgodovina čaka na prvi prenos v Firebase.");
  }

  elements.cloudResync.disabled = isPending || !hasSDCard || !hasCloudConnection;
}

function renderLocalMeasurementLogStatus(status, sdCard, sync) {
  const state = status?.deletion_state ?? "idle";
  const hasSDCard = sdCard?.present === true && sdCard?.error !== true;
  const synchronizationActive = sync?.pending === true || ["preparing", "checking", "syncing"].includes(sync?.reconciliation?.state);
  const deletionActive = state === "queued" || state === "deleting";
  const controlsAvailable = isLocalDashboard && hasSDCard && !synchronizationActive && !deletionActive;

  [elements.openMeasurementLog, elements.downloadMeasurementLog].forEach((link) => {
    link.setAttribute("aria-disabled", String(!controlsAvailable));
    if (controlsAvailable) link.href = link.dataset.href;
    else link.removeAttribute("href");
  });
  elements.deleteLocalMeasurementLog.disabled = !controlsAvailable;

  if (!hasSDCard) {
    elements.localMeasurementLogStatus.textContent = translateText("SD kartica ni dosegljiva.");
  } else if (synchronizationActive) {
    elements.localMeasurementLogStatus.textContent = translateText("Počakaj, da se sinhronizacija zgodovine zaključi.");
  } else if (state === "queued") {
    elements.localMeasurementLogStatus.textContent = translateText("Brisanje dnevnika je uvrščeno v čakalno vrsto …");
  } else if (state === "deleting") {
    elements.localMeasurementLogStatus.textContent = translateText("Brišem meritve s SD kartice …");
  } else if (state === "completed") {
    elements.localMeasurementLogStatus.textContent = translateText("Meritve so izbrisane s SD kartice. Zgodovina v Firebase je ostala nespremenjena.");
  } else if (state === "error") {
    elements.localMeasurementLogStatus.textContent = translateText("Brisanje meritev s SD kartice ni uspelo.");
  } else {
    elements.localMeasurementLogStatus.textContent = translateText("Dnevnik meritev je pripravljen.");
  }
}

function renderHistoryManagementStatus(status) {
  latestHistoryManagementStatus = status;
  const hasSelectedDevice = Boolean(cloudDevicePath && currentCloudUser && firebaseDatabase);
  const state = status?.state;
  const updatedAt = Number(status?.updated_at);
  const isDeleting = state === "queued" || state === "deleting";
  const isSelectedDeviceOnline = hasSelectedDevice && isDeviceOnline(latestDeviceStatus);
  const hasOperationalSDCard = isSDCardOperational();
  elements.deleteDeviceHistory.disabled = !isSelectedDeviceOnline || !hasOperationalSDCard || isDeleting;

  if (!hasSelectedDevice) {
    elements.historyManagementStatus.textContent = translateText("Izberi panj za upravljanje zgodovine.");
    return;
  }
  if (!isSelectedDeviceOnline) {
    elements.historyManagementStatus.textContent = translateText("Panj je offline; brisanje merilne zgodovine trenutno ni možno.");
    return;
  }
  if (!hasOperationalSDCard) {
    elements.historyManagementStatus.textContent = translateText("SD kartica ni pripravljena; popoln izbris SD in cloud zgodovine ni dovoljen.");
    return;
  }
  if (!state) {
    elements.historyManagementStatus.textContent = translateText("Naprava je online in pripravljena na brisanje merilne zgodovine.");
    return;
  }

  const messages = {
    queued: "Ukaz za brisanje čaka, da ga naprava prevzame.",
    deleting: "Naprava briše SD dnevnik in cloud zgodovino …",
    completed: Number.isFinite(updatedAt) && updatedAt > 0
      ? formatTranslatedText("Zadnji ukaz za brisanje je bil uspešno zaključen: {time}.", { time: formatDashboardDateTime(new Date(updatedAt * 1000)) })
      : "Zadnji ukaz za brisanje je bil uspešno zaključen.",
    error: "Brisanje ni uspelo. Preveri stanje naprave in SD kartice.",
  };
  elements.historyManagementStatus.textContent = state === "completed"
    ? translateText(messages.completed)
    : status?.message || translateText(messages[state] || "Stanje brisanja ni znano.");
}

function renderCloudWifiResetStatus(status) {
  latestNetworkResetStatus = status;
  if (!elements.networkResetControl || !isCloudAdministrator()) return;

  const hasSelectedDevice = Boolean(cloudDevicePath && currentCloudUser && firebaseDatabase);
  const state = status?.state;
  const updatedAt = Number(status?.updated_at);
  const lastSeenAt = Number(latestDeviceStatus?.last_seen_timestamp);
  // Zapis `queued` mora po izbrisu ostati v Firebase, ker se naprava nato odklopi.
  // Nov odziv naprave po poznejši Wi-Fi nastavitvi zato pomeni nov zagon povezave in ne
  // sme trajno blokirati naslednje ponastavitve.
  const resetBelongsToCurrentConnection = !Number.isFinite(updatedAt) || !Number.isFinite(lastSeenAt) ||
    lastSeenAt <= updatedAt;
  const isProcessing = (state === "queued" || state === "resetting") && resetBelongsToCurrentConnection;
  const isSelectedDeviceOnline = hasSelectedDevice && isDeviceOnline(latestDeviceStatus);
  elements.clearCloudWifiCredentials.disabled = !isSelectedDeviceOnline || isProcessing;

  if (!hasSelectedDevice) {
    elements.cloudWifiResetStatus.textContent = translateText("Izberi panj za ponastavitev omrežja.");
  } else if (state === "completed") {
    elements.cloudWifiResetStatus.textContent = Number.isFinite(updatedAt) && updatedAt > 0
      ? formatTranslatedText("Wi-Fi poverilnice so izbrisane ({time}). Poveži se s provisioning Wi-Fi omrežjem naprave in odpri 192.168.4.1.", { time: formatDashboardDateTime(new Date(updatedAt * 1000)) })
      : translateText("Wi-Fi poverilnice so izbrisane. Poveži se s provisioning Wi-Fi omrežjem naprave in odpri 192.168.4.1.");
  } else if (state === "error") {
    elements.cloudWifiResetStatus.textContent = status?.message || translateText("Brisanje Wi-Fi poverilnic ni uspelo; naprava ostaja povezana.");
  } else if (isProcessing) {
    elements.cloudWifiResetStatus.textContent = status?.message || translateText("Naprava ponastavlja shranjeno Wi-Fi omrežje …");
  } else if (!isSelectedDeviceOnline) {
    elements.cloudWifiResetStatus.textContent = translateText("Panj je offline; ponastavitev omrežja trenutno ni mogoča.");
  } else {
    elements.cloudWifiResetStatus.textContent = translateText("Naprava je online in pripravljena na ponastavitev omrežja.");
  }
}

function updateConfirmationDialogState() {
  const requiresTypedConfirmation = Boolean(confirmationDialogRequiredText);
  elements.confirmationDialogConfirm.disabled = requiresTypedConfirmation &&
    elements.confirmationDialogInput.value !== confirmationDialogRequiredText;
}

function settleConfirmationDialog(confirmed) {
  const resolver = confirmationDialogResolver;
  confirmationDialogResolver = undefined;
  confirmationDialogRequiredText = "";
  if (elements.confirmationDialog.open) {
    elements.confirmationDialog.close();
  }
  resolver?.(confirmed);
}

function initializeConfirmationDialog() {
  elements.confirmationDialogCancel.addEventListener("click", () => settleConfirmationDialog(false));
  elements.confirmationDialogInput.addEventListener("input", updateConfirmationDialogState);
  elements.confirmationDialogForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (elements.confirmationDialogConfirm.disabled) {
      elements.confirmationDialogInput.focus();
      return;
    }
    settleConfirmationDialog(true);
  });
  elements.confirmationDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    settleConfirmationDialog(false);
  });
  elements.confirmationDialog.addEventListener("close", () => {
    if (confirmationDialogResolver) {
      settleConfirmationDialog(false);
    }
  });
}

function confirmDashboardAction({
  title,
  message,
  confirmLabel = "Nadaljuj",
  requiredText = "",
  danger = false,
}) {
  if (confirmationDialogResolver) {
    return Promise.resolve(false);
  }

  elements.confirmationDialogEyebrow.textContent = translateText(danger ? "Nevarno dejanje" : "Potrditev dejanja");
  elements.confirmationDialogTitle.textContent = translateText(title);
  elements.confirmationDialogMessage.textContent = translateText(message);
  elements.confirmationDialogConfirm.textContent = translateText(confirmLabel);
  elements.confirmationDialog.classList.toggle("confirmation-dialog-danger", danger);
  confirmationDialogRequiredText = requiredText;
  elements.confirmationDialogInput.value = "";
  elements.confirmationDialogInputLabel.hidden = !requiredText;
  elements.confirmationDialogInput.required = Boolean(requiredText);
  elements.confirmationDialogInputHint.textContent = requiredText
    ? formatTranslatedText("Za potrditev vpiši {text}.", { text: requiredText })
    : "";
  updateConfirmationDialogState();

  return new Promise((resolve) => {
    confirmationDialogResolver = resolve;
    elements.confirmationDialog.showModal();
    window.setTimeout(() => {
      if (!elements.confirmationDialog.open) return;
      if (requiredText) {
        elements.confirmationDialogInput.focus();
      } else {
        elements.confirmationDialogConfirm.focus();
      }
    }, 0);
  });
}

function confirmPermanentHistoryDeletion(message) {
  return confirmDashboardAction({
    title: "Trajni izbris meritev",
    message,
    confirmLabel: "Trajno izbriši",
    requiredText: "IZBRIŠI",
    danger: true,
  });
}

function confirmCloudWifiCredentialReset() {
  return confirmDashboardAction({
    title: "Izbriši Wi-Fi poverilnice",
    message: "Naprava bo trajno izbrisala shranjeno domače Wi-Fi omrežje, prekinila cloud povezavo in odprla lokalni nastavitveni dostop. Nato se poveži z njenim provisioning Wi-Fi omrežjem in odpri 192.168.4.1.",
    confirmLabel: "Izbriši Wi-Fi",
    requiredText: "WI-FI",
    danger: true,
  });
}

async function deleteDeviceHistory() {
  if (!cloudDevicePath || !firebaseDatabase) return;
  if (!isDeviceOnline(latestDeviceStatus)) {
    elements.historyManagementStatus.textContent = translateText("Za popoln izbris mora biti naprava online.");
    return;
  }
  if (!isSDCardOperational()) {
    elements.historyManagementStatus.textContent = translateText("SD kartica ni pripravljena; cloud zgodovine brez brisanja SD dnevnika ni dovoljeno izbrisati.");
    elements.deleteDeviceHistory.disabled = true;
    return;
  }
  if (!await confirmPermanentHistoryDeletion("Trajno izbrišem vse meritve iz SD kartice in Firebase? Tega ni mogoče razveljaviti.")) return;

  elements.deleteDeviceHistory.disabled = true;
  elements.historyManagementStatus.textContent = translateText("Ukaz za popoln izbris pošiljam napravi …");
  try {
    const { database, ref, set } = firebaseDatabase;
    await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
      action: "delete_history",
      requested_at: Math.floor(Date.now() / 1000),
    });
    // Ukaz bo zgodovino trajno izbrisal; za varnost ne uporabljaj več že prenesenih
    // zapisov te naprave, tudi če naprava ukaz zaključi z zamikom.
    clearCloudHistorySessionCacheForDevice(cloudDevicePath);
    elements.historyManagementStatus.textContent = translateText("Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.");
  } catch (error) {
    console.error(error);
    elements.historyManagementStatus.textContent = translateText("Pošiljanje ukaza za brisanje ni uspelo.");
    renderHistoryManagementStatus(latestHistoryManagementStatus);
  }
}

async function clearCloudWifiCredentials() {
  if (!isCloudAdministrator() || !cloudDevicePath || !firebaseDatabase) return;
  if (!isDeviceOnline(latestDeviceStatus)) {
    renderCloudWifiResetStatus(latestNetworkResetStatus);
    return;
  }
  if (!await confirmCloudWifiCredentialReset()) return;

  elements.clearCloudWifiCredentials.disabled = true;
  elements.cloudWifiResetStatus.textContent = translateText("Ukaz za izbris Wi-Fi poverilnic pošiljam napravi …");
  try {
    const { database, ref, set } = firebaseDatabase;
    await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
      action: "clear_wifi_credentials",
      requested_at: Math.floor(Date.now() / 1000),
    });
    elements.cloudWifiResetStatus.textContent = translateText("Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.");
  } catch (error) {
    console.error(error);
    elements.cloudWifiResetStatus.textContent = translateText("Pošiljanje ukaza za izbris Wi-Fi poverilnic ni uspelo.");
    renderCloudWifiResetStatus(latestNetworkResetStatus);
  }
}

async function saveWiFiConfiguration(event) {
  event.preventDefault();
  const ssid = elements.wifiSsid.value.trim();
  const password = elements.wifiPassword.value;
  if (!ssid) {
    elements.wifiFormStatus.textContent = translateText("Vpiši ime Wi‑Fi omrežja.");
    return;
  }

  const submitButton = elements.wifiForm.querySelector("button[type='submit']");
  const requestFromAccessPoint = dashboardUsesProvisioningAddress();
  submitButton.disabled = true;
  elements.wifiConnectionResult.hidden = true;
  wifiTransitionDeadline = 0;
  wifiTransitionAddress = "";
  elements.wifiFormStatus.textContent = translateText("Preverjam povezavo z Wi‑Fi omrežjem …");
  try {
    const response = await fetch("/api/wifi", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ ssid, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Nastavitev Wi‑Fi ni uspela");

    if (requestFromAccessPoint) {
      elements.wifiFormStatus.textContent = translateText("Naprava preverja povezavo. Nastavitve shrani šele po uspehu …");
    } else {
      showHomeNetworkTransition(ssid);
    }
  } catch (error) {
    elements.wifiFormStatus.textContent = error.message;
    submitButton.disabled = false;
  }
}

function toggleWiFiPasswordVisibility() {
  const revealPassword = elements.wifiPassword.type === "password";
  elements.wifiPassword.type = revealPassword ? "text" : "password";
  elements.wifiPasswordToggle.setAttribute("aria-pressed", String(revealPassword));
  const actionLabel = revealPassword ? "Skrij Wi‑Fi geslo" : "Prikaži Wi‑Fi geslo";
  elements.wifiPasswordToggle.setAttribute("aria-label", translateText(actionLabel));
  elements.wifiPasswordToggle.title = translateText(actionLabel);
  elements.wifiPassword.focus();
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function copyWiFiTransitionAddress() {
  if (!wifiTransitionAddress) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(wifiTransitionAddress);
    } else {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = wifiTransitionAddress;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();
      if (!copied) throw new Error("Naslova ni bilo mogoče kopirati");
    }
    elements.wifiCopyStatus.textContent = translateText("Novi lokalni naslov je kopiran.");
  } catch (error) {
    elements.wifiCopyStatus.textContent = translateText("Kopiranje ni uspelo. Naslov označi in kopiraj ročno.");
  }
}

function renderWiFiNetworks(networks) {
  elements.wifiNetworks.replaceChildren();
  elements.wifiNetworks.hidden = false;
  if (networks.length === 0) {
    elements.wifiNetworks.textContent = translateText("Ni najdenih Wi‑Fi omrežij.");
    return;
  }

  networks
    .sort((first, second) => Number(second.rssi) - Number(first.rssi))
    .forEach((network) => {
      const option = document.createElement("button");
      const name = document.createElement("span");
      const detail = document.createElement("small");
      option.type = "button";
      option.className = "wifi-network-option";
      name.textContent = network.ssid;
      detail.textContent = `${network.rssi} dBm${translateText(network.secured ? " · zaščiteno" : " · odprto")}`;
      option.append(name, detail);
      option.addEventListener("click", () => {
        elements.wifiSsid.value = network.ssid;
        elements.wifiPassword.focus();
        elements.wifiFormStatus.textContent = formatTranslatedText("Izbrano omrežje: {ssid}", { ssid: network.ssid });
      });
      elements.wifiNetworks.append(option);
    });
}

async function scanWiFiNetworks() {
  elements.wifiScan.disabled = true;
  elements.wifiScanStatus.textContent = translateText("Iščem omrežja …");
  try {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const response = await fetch("/api/wifi/networks", { cache: "no-store" });
      const result = await response.json();
      if (response.status === 202) {
        await delay(500);
        continue;
      }
      if (!response.ok) throw new Error(result.error ?? "Skeniranje Wi‑Fi omrežij ni uspelo");

      renderWiFiNetworks(result.networks ?? []);
      elements.wifiScanStatus.textContent = formatTranslatedText("Najdenih omrežij: {count}", { count: (result.networks ?? []).length });
      return;
    }
    throw new Error("Skeniranje Wi‑Fi omrežij je poteklo");
  } catch (error) {
    elements.wifiScanStatus.textContent = error.message;
  } finally {
    elements.wifiScan.disabled = false;
  }
}

async function forgetWiFiConfiguration() {
  if (!await confirmDashboardAction({
    title: "Izbriši shranjeni Wi‑Fi",
    message: "Naprava bo nato odprla svojo dostopno točko.",
    confirmLabel: "Izbriši Wi‑Fi",
    danger: true,
  })) return;

  elements.wifiForget.disabled = true;
  showForgottenWiFiTransition();
  // Brskalniku omogočimo, da navodila izriše še pred prekinitvijo STA povezave.
  await delay(50);
  try {
    const response = await fetch("/api/wifi", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Brisanje Wi‑Fi nastavitev ni uspelo");
  } catch (error) {
    if (error instanceof TypeError) {
      elements.wifiTransitionNotice.textContent = translateText("Povezava z napravo je bila prekinjena. To je po brisanju omrežja pričakovano; nadaljuj prek prikazane dostopne točke.");
      return;
    }
    wifiTransitionMode = "idle";
    elements.wifiConnectionResult.hidden = true;
    elements.wifiForm.hidden = false;
    elements.wifiFormStatus.textContent = error.message;
    elements.wifiForget.disabled = false;
  }
}

async function resetCloudHistorySynchronization() {
  if (!isSDCardOperational()) {
    elements.cloudSyncStatus.textContent = translateText("SD kartica ni pripravljena; sinhronizacije ni mogoče začeti.");
    elements.cloudResync.disabled = true;
    return;
  }
  if (!await confirmDashboardAction({
    title: "Ponovno sinhroniziraj zgodovino",
    message: "Primerjam dnevne indekse SD kartice in Firebase ter prenesem samo manjkajoče ali neskladne dneve.",
    confirmLabel: "Začni sinhronizacijo",
  })) return;

  elements.cloudResync.disabled = true;
  elements.cloudSyncStatus.textContent = translateText("Pripravljam primerjavo SD zgodovine in Firebase …");
  try {
    if (isLocalDashboard) {
      const response = await fetch("/api/sync/reset", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Ponastavitev sinhronizacije ni uspela");
      elements.cloudSyncStatus.textContent = translateText("Primerjava dnevne zgodovine se je začela.");
    } else {
      if (!cloudDevicePath || !firebaseDatabase || !currentCloudUser || !isDeviceOnline(latestDeviceStatus)) {
        throw new Error("Za ponovno sinhronizacijo mora biti izbrani panj online.");
      }
      const { database, ref, set } = firebaseDatabase;
      await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
        action: "sync_history",
        requested_at: Math.floor(Date.now() / 1000),
      });
      elements.cloudSyncStatus.textContent = translateText("Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.");
    }
  } catch (error) {
    elements.cloudSyncStatus.textContent = error.message;
    const hasCloudConnection = isLocalDashboard
      ? latestNetworkStatus?.station_connected === true
      : isDeviceOnline(latestDeviceStatus);
    elements.cloudResync.disabled = !isSDCardOperational() || !hasCloudConnection;
  }
}

async function deleteLocalMeasurementHistory() {
  if (!isSDCardOperational()) {
    elements.localMeasurementLogStatus.textContent = translateText("SD kartica ni pripravljena; meritev ni mogoče izbrisati.");
    elements.deleteLocalMeasurementLog.disabled = true;
    return;
  }
  if (!await confirmPermanentHistoryDeletion("Trajno izbrišem vse meritve samo s SD kartice? Zgodovina v Firebase bo ostala nespremenjena.")) return;

  elements.deleteLocalMeasurementLog.disabled = true;
  elements.localMeasurementLogStatus.textContent = translateText("Zahtevo za brisanje pošiljam napravi …");
  try {
    const response = await fetch("/api/history", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Brisanje meritev s SD kartice ni uspelo");
    clearNightReferenceSessionCacheForScope("local");
    clearLocalOverviewHistorySessionCache();
    weightChangeRequestGeneration += 1;
    resetWeightChangeOverview();
    resetOverviewAnalytics();
    elements.localMeasurementLogStatus.textContent = translateText("Brisanje dnevnika je uvrščeno v čakalno vrsto …");
  } catch (error) {
    elements.localMeasurementLogStatus.textContent = error.message;
    elements.deleteLocalMeasurementLog.disabled = !isSDCardOperational();
  }
}

async function requestLoadCellTare() {
  const statusElement = isLocalDashboard ? elements.localLoadCellTareStatus : elements.cloudLoadCellTareStatus;
  if (!isComponentOperational("hx711", latestLoadCellTareStatus)) {
    statusElement.textContent = translateText("HX711 ni pripravljen; tariranje trenutno ni možno.");
    return;
  }
  if (!await confirmDashboardAction({
    title: "Tariraj tehtnico",
    message: "Odstrani panj in vse uteži s ploščadi. Trenutno stanje bo nastavljeno na 0,00 kg.",
    confirmLabel: "Tariraj",
  })) return;

  const previousStatus = latestLoadCellTareStatus;
  const button = isLocalDashboard ? elements.localLoadCellTare : elements.cloudLoadCellTare;
  button.disabled = true;
  statusElement.textContent = translateText(isLocalDashboard
    ? "Tariranje pošiljam napravi …"
    : "Ukaz za tariranje pošiljam napravi …");
  try {
    if (isLocalDashboard) {
      const response = await fetch("/api/sensors/load-cell/tare", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Tariranja ni bilo mogoče začeti");
    } else {
      if (!cloudDevicePath || !firebaseDatabase || !currentCloudUser || !isDeviceOnline(latestDeviceStatus)) {
        throw new Error("Za tariranje mora biti izbrana naprava online");
      }
      const { database, ref, set } = firebaseDatabase;
      await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
        action: "tare_load_cell",
        requested_at: Math.floor(Date.now() / 1000),
      });
    }
    renderLoadCellTareStatus({ state: "queued" });
  } catch (error) {
    latestLoadCellTareStatus = previousStatus;
    renderLoadCellTareStatus(previousStatus);
    statusElement.textContent = translateText(error.message);
  }
}

function readBme680CalibrationInputs() {
  const temperatureInput = isLocalDashboard ? elements.localTemperatureOffset : elements.cloudTemperatureOffset;
  const humidityInput = isLocalDashboard ? elements.localHumidityOffset : elements.cloudHumidityOffset;
  const temperatureOffset = Number(String(temperatureInput.value).replace(",", "."));
  const humidityOffset = Number(String(humidityInput.value).replace(",", "."));
  if (!Number.isFinite(temperatureOffset) || temperatureOffset < -10 || temperatureOffset > 10) {
    throw new Error("Temperaturni odmik mora biti med -10,0 in +10,0 °C.");
  }
  if (!Number.isFinite(humidityOffset) || humidityOffset < -30 || humidityOffset > 30) {
    throw new Error("Odmik vlage mora biti med -30,0 in +30,0 %.");
  }
  return { temperatureOffset, humidityOffset };
}

async function saveBme680Calibration(event) {
  event.preventDefault();
  const statusElement = isLocalDashboard
    ? elements.localBme680CalibrationStatus
    : elements.cloudBme680CalibrationStatus;
  try {
    if (!isComponentOperational("bme680", latestBme680CalibrationStatus)) {
      throw new Error("BME680 ni pripravljen; odmikov trenutno ni mogoče nastaviti.");
    }
    const { temperatureOffset, humidityOffset } = readBme680CalibrationInputs();
    bme680CalibrationRequestedAt = Math.floor(Date.now() / 1000);
    bme680CalibrationPendingUntil = bme680CalibrationRequestedAt + BME680_CALIBRATION_TIMEOUT_SECONDS;
    statusElement.textContent = translateText(isLocalDashboard
      ? "Kalibracijo pošiljam napravi …"
      : "Ukaz za kalibracijo pošiljam napravi …");
    if (isLocalDashboard) {
      const body = new URLSearchParams({
        temperature_offset_c: temperatureOffset.toFixed(1),
        humidity_offset_percent: humidityOffset.toFixed(1),
      });
      const response = await fetch("/api/sensors/bme680/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Kalibracije BME680 ni bilo mogoče začeti");
    } else {
      if (!cloudDevicePath || !firebaseDatabase || !currentCloudUser || !isDeviceOnline(latestDeviceStatus)) {
        throw new Error("Za kalibracijo mora biti izbrana naprava online");
      }
      const { database, ref, set } = firebaseDatabase;
      await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
        action: "set_bme680_calibration",
        temperature_offset_c: Number(temperatureOffset.toFixed(1)),
        humidity_offset_percent: Number(humidityOffset.toFixed(1)),
        requested_at: bme680CalibrationRequestedAt,
      });
    }
    renderBme680CalibrationStatus({
      ready: latestBme680CalibrationStatus?.ready,
      temperature_offset_c: temperatureOffset,
      humidity_offset_percent: humidityOffset,
      state: "queued",
    });
  } catch (error) {
    bme680CalibrationPendingUntil = 0;
    renderBme680CalibrationStatus(latestBme680CalibrationStatus);
    statusElement.textContent = translateText(error.message);
  }
}

async function sendDeviceTimeCommand(action, timestamp) {
  if (!isComponentOperational("ds3231", {
    ready: latestTimeStatus?.rtc_present === true,
    state: latestTimeStatus?.rtc_present === true ? "ok" : "error",
  })) {
    throw new Error("DS3231 ni pripravljen; nastavljanje in sinhronizacija časa trenutno nista mogoča.");
  }
  if (isLocalDashboard) {
    const body = new URLSearchParams({ action });
    if (timestamp !== undefined) body.set("timestamp", String(timestamp));
    const response = await fetch("/api/time", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Nastavitev časa ni uspela");
    return;
  }

  if (!cloudDevicePath || !firebaseDatabase || !currentCloudUser || !isDeviceOnline(latestDeviceStatus)) {
    throw new Error("Za nastavitev časa mora biti izbrana naprava online");
  }
  const { database, ref, set } = firebaseDatabase;
  const command = { action, requested_at: Math.floor(Date.now() / 1000) };
  if (timestamp !== undefined) command.timestamp = timestamp;
  await set(ref(database, `${cloudDevicePath}/commands/time`), command);
}

async function setDeviceTime(event) {
  event.preventDefault();
  const selectedDate = new Date(elements.deviceDateTime.value);
  const timestamp = Math.floor(selectedDate.getTime() / 1000);
  if (!Number.isFinite(timestamp) || selectedDate.getFullYear() < 2023 || selectedDate.getFullYear() > 2099) {
    elements.deviceTimeStatus.textContent = translateText("Izberi veljaven datum med letoma 2023 in 2099.");
    return;
  }

  elements.setDeviceTime.disabled = true;
  elements.syncDeviceTime.disabled = true;
  elements.deviceTimeStatus.textContent = translateText(isLocalDashboard
    ? "Ročno nastavitev pošiljam napravi …"
    : "Ročno nastavitev pošiljam izbranemu panju …");
  try {
    await sendDeviceTimeCommand("set", timestamp);
    elements.deviceTimeStatus.textContent = translateText(isLocalDashboard
      ? "Nastavitev je sprejeta. Naprava bo posodobila sistemsko uro in DS3231."
      : "Ukaz je poslan. Naprava ga prevzame v največ 15 sekundah.");
  } catch (error) {
    elements.deviceTimeStatus.textContent = translateText(error.message);
    renderTimeStatus(latestTimeStatus);
  }
}

async function synchronizeDeviceTime() {
  elements.setDeviceTime.disabled = true;
  elements.syncDeviceTime.disabled = true;
  elements.deviceTimeStatus.textContent = translateText("Zahtevam sinhronizacijo z internetno uro …");
  try {
    await sendDeviceTimeCommand("sync_ntp");
    elements.deviceTimeStatus.textContent = translateText(isLocalDashboard
      ? "NTP sinhronizacija je uvrščena."
      : "Ukaz je poslan. Naprava ga prevzame v največ 15 sekundah.");
  } catch (error) {
    elements.deviceTimeStatus.textContent = translateText(error.message);
    renderTimeStatus(latestTimeStatus);
  }
}

function initializeProvisioningForm() {
  elements.wifiForm.addEventListener("submit", saveWiFiConfiguration);
  elements.wifiPasswordToggle.addEventListener("click", toggleWiFiPasswordVisibility);
  elements.wifiScan.addEventListener("click", scanWiFiNetworks);
  elements.wifiForget.addEventListener("click", forgetWiFiConfiguration);
  elements.wifiCopyAddress.addEventListener("click", copyWiFiTransitionAddress);
  elements.cloudResync.addEventListener("click", resetCloudHistorySynchronization);
  elements.deleteLocalMeasurementLog.addEventListener("click", deleteLocalMeasurementHistory);
  elements.localLoadCellTare.addEventListener("click", requestLoadCellTare);
  elements.cloudLoadCellTare.addEventListener("click", requestLoadCellTare);
  elements.localBme680CalibrationForm.addEventListener("submit", saveBme680Calibration);
  elements.cloudBme680CalibrationForm.addEventListener("submit", saveBme680Calibration);
  [elements.localBme680CalibrationForm, elements.cloudBme680CalibrationForm].forEach((form) => {
    form.addEventListener("input", () => {
      form.dataset.dirty = "true";
    });
  });
  elements.deviceTimeForm.addEventListener("submit", setDeviceTime);
  elements.syncDeviceTime.addEventListener("click", synchronizeDeviceTime);
  setInterval(updateWiFiTransitionNotice, 1_000);
}

function renderSDStatus(status) {
  latestSDCardStatus = status;
  const isPresent = status?.present === true;
  const hasError = status?.error === true;
  elements.sdCard.classList.toggle("ok", isPresent && !hasError);
  elements.sdCard.classList.toggle("error", hasError);
  elements.sdStatus.textContent = translateText(isPresent ? "Zaznana" : "Ni zaznana");
  elements.sdStatusDetail.textContent = hasError ? translateText("Po petih poskusih ni bila zaznana.") : `${status?.initialization_failures ?? 0} neuspelih inicializacij`;
  if (!isLocalDashboard) {
    renderCloudSynchronization(latestDeviceStatus?.history_sync,
      { station_connected: isDeviceOnline(latestDeviceStatus) }, status);
    renderHistoryManagementStatus(latestHistoryManagementStatus);
  }
}

function renderFirmwareVersion(status) {
  latestFirmwareVersion = status?.version ?? "";
  const displayedVersion = latestFirmwareVersion ? `v${latestFirmwareVersion}` : "—";
  elements.otaCurrentVersion.textContent = displayedVersion;
  elements.localCurrentVersion.textContent = displayedVersion;
  if (!isLocalDashboard && latestOtaStatus) renderOtaDeviceStatus(latestOtaStatus);
  elements.firmwareVersion.textContent = latestFirmwareVersion || "—";
  if (!isLocalDashboard && latestFirmwareVersion) checkForFirmwareRelease();
}

function resetOtaProgress() {
  elements.otaProgress.hidden = true;
  elements.otaProgressBar.style.width = "0%";
  elements.otaProgressTrack.setAttribute("aria-valuenow", "0");
  elements.otaProgressTrack.removeAttribute("aria-valuetext");
  elements.otaProgressText.textContent = translateText("Skupaj 0 %");
  elements.otaCard.classList.remove("ota-error");
  elements.otaSafetyNotice.hidden = true;
}

function updateOtaActionState() {
  const isOtaActive = otaCommandPending || OTA_ACTIVE_STATES.has(latestOtaState);
  const hasAvailableRelease = Boolean(availableOtaRelease);
  elements.otaInstall.disabled = !hasAvailableRelease || isOtaActive;
  elements.otaIgnore.disabled = !hasAvailableRelease || isOtaActive;
  elements.otaInstall.textContent = translateText(isOtaActive ? "Posodobitev poteka" : "Posodobi napravo");
  elements.otaCard.setAttribute("aria-busy", String(isOtaActive));
  elements.otaSafetyNotice.hidden = !isOtaActive;
}

function renderOtaProgress(progressPercent, hasError = false) {
  const numericProgress = Number(progressPercent);
  const hasProgress = Number.isFinite(numericProgress);
  elements.otaCard.classList.toggle("ota-error", hasError);
  elements.otaProgress.hidden = !hasProgress;
  if (!hasProgress) return;

  const clampedProgress = Math.max(0, Math.min(100, Math.round(numericProgress)));
  elements.otaProgressBar.style.width = `${clampedProgress}%`;
  elements.otaProgressTrack.setAttribute("aria-valuenow", String(clampedProgress));
  elements.otaProgressTrack.setAttribute("aria-valuetext", formatTranslatedText("Skupni napredek OTA: {value} %", { value: clampedProgress }));
  elements.otaProgressText.textContent = formatTranslatedText("Skupaj {value} %", { value: clampedProgress });
}

function renderOtaDeviceStatus(status) {
  latestOtaStatus = status;
  if (!status?.state) {
    latestOtaState = "";
    resetOtaProgress();
    updateOtaActionState();
    return;
  }

  const reportedState = String(status.state);
  const targetVersion = String(status.target_version ?? "");
  const message = String(status.message ?? "").trim();
  const installedAfterCloudRestart = reportedState === "restarting"
    && Boolean(targetVersion)
    && targetVersion === latestFirmwareVersion;
  const staleInvalidCommand = reportedState === "error" && message === "Neveljaven OTA ukaz.";
  const state = installedAfterCloudRestart ? "installed" : (staleInvalidCommand ? "" : reportedState);
  const currentVersionInstalled = state === "installed"
    && Boolean(targetVersion)
    && targetVersion === latestFirmwareVersion;
  const requestedVersionAlreadyInstalled = state === "ignored"
    && Boolean(targetVersion)
    && targetVersion === latestFirmwareVersion
    && message === "Zahtevana različica ni novejša.";
  latestOtaState = state;
  if (currentVersionInstalled) {
    const updatedAt = Number(status.updated_at);
    const installedAt = Number.isFinite(updatedAt) && updatedAt > 0
      ? formatDashboardDateTime(new Date(updatedAt * 1000))
      : translateText("neznanem času");
    elements.otaDeviceStatus.textContent = formatTranslatedText("Zadnja uspešna OTA posodobitev: {time}.", { time: installedAt });
    renderOtaProgress(100);
  } else if (requestedVersionAlreadyInstalled) {
    elements.otaDeviceStatus.textContent = formatTranslatedText("Različica v{version} je že nameščena.", { version: targetVersion });
    renderOtaProgress(100);
    availableOtaRelease = undefined;
    elements.otaActions.hidden = true;
  } else if (staleInvalidCommand) {
    elements.otaDeviceStatus.textContent = translateText("Zadnja cloud OTA posodobitev ni zabeležena.");
    resetOtaProgress();
  } else {
    const stateLabel = translateText(OTA_STATE_LABELS[state] ?? state);
    const translatedMessage = translateText(message);
    const hasRepeatedPhase = translatedMessage.toLocaleLowerCase().startsWith(stateLabel.toLocaleLowerCase());
    elements.otaDeviceStatus.textContent = translatedMessage && hasRepeatedPhase
      ? translatedMessage
      : `${stateLabel}${translatedMessage ? `: ${translatedMessage}` : ""}`;
    renderOtaProgress(status.progress_percent, state === "error");
  }

  if (OTA_TERMINAL_STATES.has(state)) {
    otaCommandPending = false;
  }
  if (state === "installed") {
    elements.otaActions.hidden = true;
  }
  if (state === "error" && availableOtaRelease) elements.otaActions.hidden = false;
  updateOtaActionState();
}

function showOtaAvailability(release) {
  availableOtaRelease = release;
  const ignoredVersion = localStorage.getItem(OTA_IGNORE_STORAGE_KEY);
  const isIgnored = ignoredVersion === release.version;
  elements.otaLabel.textContent = translateText(isIgnored ? "Posodobitev prezrta" : "Na voljo je nova različica");
  elements.otaVersion.textContent = `v${release.version}`;
  elements.otaDetail.textContent = release.name || translateText("Nova različica naprave je pripravljena na GitHub Releases.");
  elements.otaActions.hidden = isIgnored;
  if (isIgnored) elements.otaDeviceStatus.textContent = translateText("Prezrto v tem brskalniku.");
  updateOtaActionState();
}

async function checkForFirmwareRelease() {
  if (!latestFirmwareVersion || isLocalDashboard) return;
  try {
    const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (response.status === 404) {
      elements.otaLabel.textContent = translateText("OTA izdaja ni javno dosegljiva");
      elements.otaVersion.textContent = "—";
      elements.otaDetail.textContent = translateText("Preveri GitHub Release in javni dostop do repozitorija.");
      elements.otaActions.hidden = true;
      return;
    }
    if (!response.ok) throw new Error("GitHub Release ni dosegljiv");

    const release = await response.json();
    const releaseVersion = String(release.tag_name ?? "").replace(/^v/, "");
    if (compareFirmwareVersions(releaseVersion, latestFirmwareVersion) > 0) {
      showOtaAvailability({ version: releaseVersion, name: release.name });
    } else {
      availableOtaRelease = undefined;
      elements.otaLabel.textContent = translateText("Naprava je posodobljena");
      elements.otaVersion.textContent = `v${latestFirmwareVersion}`;
      elements.otaDetail.textContent = translateText("Ni navoljo novejše različice.");
      elements.otaActions.hidden = true;
    }
  } catch (error) {
    console.error(error);
    elements.otaLabel.textContent = translateText("Preverjanje OTA ni uspelo");
    elements.otaVersion.textContent = "—";
    elements.otaDetail.textContent = translateText("GitHub Release trenutno ni dosegljiv.");
    elements.otaActions.hidden = true;
  }
}

async function requestFirmwareUpdate() {
  if (!firebaseDatabase || !availableOtaRelease || otaCommandPending) return;
  if (!await confirmDashboardAction({
    title: "Namesti posodobitev",
    message: formatTranslatedText("Napravo posodobim na verzijo {version}? Med prenosom naprave ne izklapljaj in ne prekinjaj povezave Wi-Fi.", { version: availableOtaRelease.version }),
    confirmLabel: "Začni posodobitev",
  })) return;

  otaCommandPending = true;
  updateOtaActionState();
  renderOtaProgress(0);
  elements.otaDeviceStatus.textContent = translateText("OTA ukaz pošiljam napravi …");
  try {
    const { ref, set } = firebaseDatabase;
    await set(ref(firebaseDatabase.database, `${cloudDevicePath}/commands/firmware_update`), {
      action: "install",
      target_version: availableOtaRelease.version,
      requested_at: Math.floor(Date.now() / 1000),
    });
    elements.otaDeviceStatus.textContent = translateText("Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.");
  } catch (error) {
    console.error(error);
    elements.otaDeviceStatus.textContent = translateText("Pošiljanje OTA ukaza ni uspelo.");
    otaCommandPending = false;
    updateOtaActionState();
  }
}

function ignoreFirmwareUpdate() {
  if (!availableOtaRelease) return;
  localStorage.setItem(OTA_IGNORE_STORAGE_KEY, availableOtaRelease.version);
  showOtaAvailability(availableOtaRelease);
}

function initializeOtaControls() {
  elements.otaInstall.addEventListener("click", requestFirmwareUpdate);
  elements.otaIgnore.addEventListener("click", ignoreFirmwareUpdate);
  elements.localElegantOtaLink.addEventListener("click", (event) => {
    if (!isLocalDashboard) return;
    event.preventDefault();
    if (!elements.localOtaWarningDialog.open) elements.localOtaWarningDialog.showModal();
  });
  elements.localOtaWarningCancel.addEventListener("click", () => elements.localOtaWarningDialog.close());
  elements.localOtaWarningProceed.addEventListener("click", () => {
    window.location.assign(elements.localElegantOtaLink.href);
  });
}


function getLocalBucketSeconds(range) {
  const rangeSeconds = (range.to.getTime() - range.from.getTime()) / 1000;
  if (rangeSeconds <= 24 * 60 * 60) return 60;
  if (rangeSeconds <= 7 * 24 * 60 * 60) return 60 * 60;
  if (rangeSeconds <= 31 * 24 * 60 * 60) return 6 * 60 * 60;
  return 24 * 60 * 60;
}

function getCloudBucketSeconds(range) {
  const rangeSeconds = (range.to.getTime() - range.from.getTime()) / 1000;
  if (rangeSeconds <= CHART_AXIS_DAY_SECONDS) return 60;
  if (rangeSeconds <= 7 * CHART_AXIS_DAY_SECONDS) return CHART_AXIS_HOUR_SECONDS;
  if (rangeSeconds <= CHART_AXIS_MONTH_SECONDS) return 6 * CHART_AXIS_HOUR_SECONDS;
  if (rangeSeconds <= CHART_AXIS_SIX_MONTHS_SECONDS) return 12 * CHART_AXIS_HOUR_SECONDS;
  return 24 * 60 * 60;
}

function getBucketSeconds(range) {
  return isLocalDashboard ? getLocalBucketSeconds(range) : getCloudBucketSeconds(range);
}

function getCloudHistorySource(from, to) {
  const duration = to - from;
  if (duration <= CHART_AXIS_DAY_SECONDS) {
    return { path: "measurements", periodSeconds: 0 };
  }
  if (duration <= CHART_AXIS_SIX_MONTHS_SECONDS) {
    return { path: "aggregates/hourly", periodSeconds: 60 * 60 };
  }
  return { path: "aggregates/daily", periodSeconds: 24 * 60 * 60 };
}

function getCloudHistoryRealtimeTailStart(source, queryFrom, to) {
  if (source.path === "measurements") {
    return Math.max(queryFrom, to - LIVE_HISTORY_RAW_TAIL_OVERLAP_SECONDS);
  }
  return Math.floor(to / source.periodSeconds) * source.periodSeconds;
}

function getCloudHistorySessionCacheKey(devicePath, sourcePath) {
  return `${devicePath}|${sourcePath}`;
}

function getCloudHistorySessionCacheEntry(devicePath, sourcePath) {
  const cacheKey = getCloudHistorySessionCacheKey(devicePath, sourcePath);
  let entry = cloudHistorySessionCache.get(cacheKey);
  if (!entry) {
    entry = {
      readingsByKey: new Map(),
      coveredRanges: [],
    };
    cloudHistorySessionCache.set(cacheKey, entry);
  }
  return entry;
}

function clearCloudHistorySessionCacheForDevice(devicePath) {
  const prefix = `${devicePath}|`;
  [...cloudHistorySessionCache.keys()].forEach((cacheKey) => {
    if (cacheKey.startsWith(prefix)) cloudHistorySessionCache.delete(cacheKey);
  });
  clearNightReferenceSessionCacheForScope(`cloud:${devicePath}`);
  if (getNightReferenceCacheScope() === `cloud:${devicePath}`) {
    weightChangeRequestGeneration += 1;
    resetWeightChangeOverview();
  }
  if (cloudDevicePath === devicePath) resetOverviewAnalytics();
}

function addCloudHistoryCacheCoverage(entry, from, to) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return;

  const ranges = [...entry.coveredRanges, { from, to }]
    .sort((first, second) => first.from - second.from);
  entry.coveredRanges = ranges.reduce((mergedRanges, range) => {
    const previous = mergedRanges[mergedRanges.length - 1];
    if (!previous || range.from > previous.to + 1) {
      mergedRanges.push({ ...range });
    } else {
      previous.to = Math.max(previous.to, range.to);
    }
    return mergedRanges;
  }, []);
}

function getCloudHistoryCacheCoverageGaps(entry, from, to) {
  if (from > to) return [];

  const gaps = [];
  let nextFrom = from;
  for (const range of entry.coveredRanges) {
    if (range.to < nextFrom) continue;
    if (range.from > to) break;
    if (range.from > nextFrom) {
      gaps.push({ from: nextFrom, to: Math.min(to, range.from - 1) });
    }
    nextFrom = Math.max(nextFrom, range.to + 1);
    if (nextFrom > to) break;
  }
  if (nextFrom <= to) gaps.push({ from: nextFrom, to });
  return gaps;
}

function restoreCloudHistoryReadingsFromSessionCache(entry, from, to) {
  cloudHistoryReadingsByKey = new Map();
  entry.readingsByKey.forEach((reading, key) => {
    const timestamp = Number(reading?.timestamp);
    if (Number.isFinite(timestamp) && timestamp >= from && timestamp <= to) {
      cloudHistoryReadingsByKey.set(key, reading);
    }
  });
}

function clearCloudHistoryListeners() {
  stopHistoryListeners.forEach((unsubscribe) => unsubscribe());
  stopHistoryListeners = [];
  cloudHistoryReadingsByKey = new Map();
  cloudHistoryRequestGeneration += 1;
  if (scheduledCloudHistoryRender) {
    cancelAnimationFrame(scheduledCloudHistoryRender);
    scheduledCloudHistoryRender = 0;
  }
}

function getCloudHistoryReadingsInAppliedRange() {
  if (!appliedRange) return [];
  const from = Math.floor(appliedRange.from.getTime() / 1000);
  const to = Math.floor(appliedRange.to.getTime() / 1000);
  const source = getCloudHistorySource(from, to);
  const visibleFrom = source.periodSeconds > 0 ? Math.floor(from / source.periodSeconds) * source.periodSeconds : from;
  const readings = [];

  cloudHistoryReadingsByKey.forEach((reading, key) => {
    const timestamp = Number(reading?.timestamp);
    if (!Number.isFinite(timestamp) || timestamp < visibleFrom) {
      cloudHistoryReadingsByKey.delete(key);
      return;
    }
    if (timestamp <= to) readings.push(reading);
  });
  return readings.sort((first, second) => Number(first.timestamp) - Number(second.timestamp));
}

function renderCloudHistoryFromCache() {
  scheduledCloudHistoryRender = 0;
  renderHistory(getCloudHistoryReadingsInAppliedRange());
}

function scheduleCloudHistoryRender() {
  if (scheduledCloudHistoryRender) return;
  scheduledCloudHistoryRender = requestAnimationFrame(renderCloudHistoryFromCache);
}

function aggregateReadings(readings, range, options = {}) {
  const bucketSeconds = options.bucketSeconds ?? getBucketSeconds(range);
  const bucketAnchorTimestamp = Number.isFinite(options.bucketAnchorTimestamp)
    ? options.bucketAnchorTimestamp
    : 0;
  const buckets = new Map();

  readings.forEach((reading) => {
    const timestamp = Number(reading.timestamp);
    const temperature = parseMeasurementValue(reading.temperature_c);
    const humidity = parseMeasurementValue(reading.humidity_percent);
    const weight = parseMeasurementValue(reading.weight_kg);
    if (!Number.isFinite(timestamp) || (temperature === null && humidity === null && weight === null)) return;
    const reportedSampleCount = Math.floor(Number(reading.sample_count));
    const sampleCount = Number.isFinite(reportedSampleCount) && reportedSampleCount > 0
      ? reportedSampleCount
      : 1;
    const getComponentSampleCount = (value) => {
      const count = Math.floor(Number(value));
      return Number.isFinite(count) && count > 0 ? count : sampleCount;
    };

    const bucket = bucketAnchorTimestamp + Math.floor((timestamp - bucketAnchorTimestamp) / bucketSeconds) * bucketSeconds;
    const current = buckets.get(bucket) ?? {
      timestamp: bucket,
      temperature: 0,
      humidity: 0,
      weight: 0,
      temperatureCount: 0,
      humidityCount: 0,
      weightCount: 0,
    };
    if (temperature !== null) {
      const temperatureCount = getComponentSampleCount(reading.temperature_sample_count);
      current.temperature += temperature * temperatureCount;
      current.temperatureCount += temperatureCount;
    }
    if (humidity !== null) {
      const humidityCount = getComponentSampleCount(reading.humidity_sample_count);
      current.humidity += humidity * humidityCount;
      current.humidityCount += humidityCount;
    }
    if (weight !== null) {
      const weightCount = getComponentSampleCount(reading.weight_sample_count);
      current.weight += weight * weightCount;
      current.weightCount += weightCount;
    }
    buckets.set(bucket, current);
  });

  return [...buckets.values()]
    .map((bucket) => ({
      timestamp: bucket.timestamp,
      temperature_c: bucket.temperatureCount > 0 ? bucket.temperature / bucket.temperatureCount : null,
      humidity_percent: bucket.humidityCount > 0 ? bucket.humidity / bucket.humidityCount : null,
      weight_kg: bucket.weightCount > 0 ? bucket.weight / bucket.weightCount : null,
    }))
    .sort((first, second) => first.timestamp - second.timestamp);
}

function getAppliedChartRange() {
  const from = Math.floor(appliedRange.from.getTime() / 1000);
  const to = Math.floor(appliedRange.to.getTime() / 1000);
  return { min: from, max: Math.max(from + 1, to) };
}

function getChartXRange(chart) {
  const minimum = Number(chart?.scales?.x?.min);
  const maximum = Number(chart?.scales?.x?.max);
  return Number.isFinite(minimum) && Number.isFinite(maximum) && maximum > minimum
    ? { min: minimum, max: maximum }
    : undefined;
}

function getChartRangeAsDates(chart) {
  const range = getChartXRange(chart);
  if (!range) return undefined;
  return {
    from: new Date(range.min * 1000),
    to: new Date(range.max * 1000),
  };
}

function canReaggregateCloudZoom() {
  if (isLocalDashboard || latestHistoryAlreadyAggregated || !appliedRange) return false;
  const appliedSeconds = (appliedRange.to.getTime() - appliedRange.from.getTime()) / 1000;
  return appliedSeconds > 0 && appliedSeconds <= CHART_AXIS_MONTH_SECONDS;
}

function getCloudZoomAggregationRange() {
  if (!canReaggregateCloudZoom()) return undefined;

  const preferredChart = lastZoomedChartType === "climate"
    ? climateChart
    : lastZoomedChartType === "weight"
      ? weightChart
      : undefined;
  const fallbackChart = climateChartHasUserZoom ? climateChart : weightChartHasUserZoom ? weightChart : undefined;
  const zoomedChart = preferredChart ?? fallbackChart;
  return zoomedChart ? getChartRangeAsDates(zoomedChart) : undefined;
}

function refreshCloudZoomAggregation() {
  if (!canReaggregateCloudZoom()) return;
  const aggregationRange = getCloudZoomAggregationRange() ?? appliedRange;

  renderHistory(latestHistoryReadings, false, {
    climateZoom: climateChartHasUserZoom ? getChartXRange(climateChart) : undefined,
    weightZoom: weightChartHasUserZoom ? getChartXRange(weightChart) : undefined,
  }, aggregationRange);
}

function scheduleCloudZoomAggregation() {
  if (!canReaggregateCloudZoom() || scheduledCloudZoomAggregation) return;
  scheduledCloudZoomAggregation = requestAnimationFrame(() => {
    scheduledCloudZoomAggregation = 0;
    refreshCloudZoomAggregation();
  });
}

function formatChartAxisNumber(value, decimals = 1, fixedDecimals = false) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? numericValue.toLocaleString(getDashboardLocale(), {
      minimumFractionDigits: fixedDecimals ? decimals : 0,
      maximumFractionDigits: decimals,
    })
    : "";
}

// Meje mase poravnamo na isti korak kot oznake osi. Tako nobena veljavna
// meritev ne more ostati pod najnižjo izrisano oznako oziroma mrežno črto.
function getWeightChartScaleRange(_chart, minimum, maximum) {
  const lowerValue = Number(minimum);
  const upperValue = Number(maximum);
  if (!Number.isFinite(lowerValue) || !Number.isFinite(upperValue)) return [minimum, maximum];

  const span = Math.max(upperValue - lowerValue, 0.01);
  const targetIncrement = span / 4;
  const increment = WEIGHT_AXIS_INCREMENTS.find((value) => value >= targetIncrement)
    ?? WEIGHT_AXIS_INCREMENTS.at(-1);
  const epsilon = increment / 1_000_000;
  let lowerBound = Math.floor((lowerValue + epsilon) / increment) * increment;
  let upperBound = Math.ceil((upperValue - epsilon) / increment) * increment;

  if (lowerBound === upperBound) {
    lowerBound -= increment;
    upperBound += increment;
  }

  return [lowerBound, upperBound];
}

function getDashboardLanguage() {
  const language = document.documentElement.lang?.toLowerCase();
  return LANGUAGE_OPTIONS[language] ? language : "sl";
}

function getDashboardLocale() {
  const language = getDashboardLanguage();
  return language === "en" ? "en-GB" : language === "hr" ? "hr-HR" : "sl-SI";
}

function getChartAxisFormatters() {
  const language = getDashboardLanguage();
  const cached = CHART_AXIS_FORMATTERS.get(language);
  if (cached) return cached;

  const locale = getDashboardLocale();
  const formatters = {
    time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    shortDateTime: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
    shortDate: new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric" }),
    month: new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }),
    year: new Intl.DateTimeFormat(locale, { year: "numeric" }),
  };
  CHART_AXIS_FORMATTERS.set(language, formatters);
  return formatters;
}

function getVisibleChartSpanSeconds(chart) {
  const minimum = Number(chart?.scales?.x?.min);
  const maximum = Number(chart?.scales?.x?.max);
  return Number.isFinite(minimum) && Number.isFinite(maximum) && maximum > minimum
    ? maximum - minimum
    : CHART_AXIS_DAY_SECONDS;
}

function formatChartTimeAxis(chart, splits) {
  const spanSeconds = getVisibleChartSpanSeconds(chart);
  const formatters = getChartAxisFormatters();
  const formatter = spanSeconds <= CHART_AXIS_DAY_SECONDS
    ? formatters.time
    : spanSeconds <= 7 * CHART_AXIS_DAY_SECONDS
      ? formatters.shortDateTime
      : spanSeconds <= 120 * CHART_AXIS_DAY_SECONDS
        ? formatters.shortDate
        : spanSeconds <= 2 * 365 * CHART_AXIS_DAY_SECONDS
          ? formatters.month
          : formatters.year;

  return splits.map((timestamp) => formatter.format(new Date(timestamp * 1000)));
}

function getChartXAxisSpace(_chart, _axisIndex, minimum, maximum, plotWidth) {
  const requestedSpan = Number(maximum) - Number(minimum);
  const spanSeconds = Number.isFinite(requestedSpan) && requestedSpan > 0
    ? requestedSpan
    : getVisibleChartSpanSeconds(_chart);
  const width = Math.max(1, Number(plotWidth) || 0);
  const targetLabelCount = width < 460 ? 3 : width < 760 ? 5 : 7;
  const labelWidth = spanSeconds <= CHART_AXIS_DAY_SECONDS
    ? 62
    : spanSeconds <= 7 * CHART_AXIS_DAY_SECONDS
      ? 112
      : spanSeconds <= 120 * CHART_AXIS_DAY_SECONDS
        ? 66
        : spanSeconds <= 2 * 365 * CHART_AXIS_DAY_SECONDS
          ? 84
          : 58;
  return Math.max(labelWidth + 14, Math.floor(width / targetLabelCount));
}

function buildUPlotData(readings) {
  const measurementsByTimestamp = new Map();

  for (const reading of Array.isArray(readings) ? readings : []) {
    const timestamp = Number(reading?.timestamp);
    if (!Number.isFinite(timestamp) || timestamp <= 0) continue;
    measurementsByTimestamp.set(timestamp, {
      temperature: parseMeasurementValue(reading?.temperature_c),
      humidity: parseMeasurementValue(reading?.humidity_percent),
      weight: parseMeasurementValue(reading?.weight_kg),
    });
  }

  const timestamps = [...measurementsByTimestamp.keys()].sort((first, second) => first - second);
  const temperatures = new Array(timestamps.length);
  const humidities = new Array(timestamps.length);
  const weights = new Array(timestamps.length);

  timestamps.forEach((timestamp, index) => {
    const measurement = measurementsByTimestamp.get(timestamp);
    temperatures[index] = measurement.temperature;
    humidities[index] = measurement.humidity;
    weights[index] = measurement.weight;
  });

  return {
    climate: [timestamps, temperatures, humidities],
    weight: [timestamps, weights],
  };
}

function countValidChartValues(values) {
  return values.reduce((count, value) => count + (Number.isFinite(value) ? 1 : 0), 0);
}

function isChartSeriesVisible(chartType, seriesIndex) {
  return chartSeriesVisibility[chartType]?.[seriesIndex] !== false;
}

function setChartLegendItemState(item, isVisible) {
  item.classList.toggle("is-hidden", !isVisible);
  item.setAttribute("aria-pressed", String(isVisible));
}

function createChartLegend(container, entries) {
  const legend = document.createElement("div");
  legend.className = "chart-legend";
  const items = entries.map((entry) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "chart-legend-item";
    item.dataset.seriesIndex = String(entry.seriesIndex);
    item.setAttribute("aria-label", formatTranslatedText("{label}: prikaži ali skrij serijo", { label: entry.label }));
    setChartLegendItemState(item, isChartSeriesVisible(entry.chartType, entry.seriesIndex));
    const marker = document.createElement("span");
    marker.className = "chart-legend-marker";
    marker.style.backgroundColor = entry.color;
    const label = document.createElement("span");
    label.textContent = entry.label;
    item.append(marker, label);
    legend.append(item);
    return { element: item, seriesIndex: entry.seriesIndex };
  });
  container.append(legend);
  return items;
}

function createChartTooltip(chartHost, entries) {
  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  tooltip.hidden = true;
  const timestamp = document.createElement("p");
  timestamp.className = "chart-tooltip-time";
  tooltip.append(timestamp);

  const rows = entries.map((entry) => {
    const row = document.createElement("p");
    row.className = "chart-tooltip-row";
    const marker = document.createElement("span");
    marker.className = "chart-tooltip-marker";
    marker.style.backgroundColor = entry.color;
    const label = document.createElement("span");
    label.textContent = `${entry.label}: `;
    const value = document.createElement("strong");
    row.append(marker, label, value);
    tooltip.append(row);
    return { row, value, seriesIndex: entry.seriesIndex, decimals: entry.decimals ?? 1 };
  });

  chartHost.append(tooltip);
  return { element: tooltip, timestamp, rows, chartHost };
}

function createChartPresentation(containerId, chartType, legendEntries, tooltipEntries) {
  const container = document.querySelector(`#${containerId}`);
  container.replaceChildren();
  const legendItems = createChartLegend(
    container,
    legendEntries.map((entry) => ({ ...entry, chartType })),
  );
  const chartHost = document.createElement("div");
  chartHost.className = "chart-plot";
  container.append(chartHost);
  const resetZoomButton = document.createElement("button");
  resetZoomButton.type = "button";
  resetZoomButton.className = "chart-reset-zoom";
  resetZoomButton.textContent = UI_TEXT[getDashboardLanguage()].resetZoom;
  resetZoomButton.hidden = true;
  chartHost.append(resetZoomButton);
  return {
    chartHost,
    tooltip: createChartTooltip(chartHost, tooltipEntries),
    resetZoomButton,
    legendItems,
  };
}

function hideChartTooltip(tooltip) {
  if (tooltip) tooltip.element.hidden = true;
}

function updateChartTooltip(chart, tooltip) {
  const index = chart.cursor.idx;
  const timestamp = Number.isInteger(index) ? Number(chart.data[0]?.[index]) : NaN;
  if (!Number.isFinite(timestamp)) {
    hideChartTooltip(tooltip);
    return;
  }

  let hasValue = false;
  tooltip.timestamp.textContent = formatDashboardDateTime(new Date(timestamp * 1000));
  tooltip.rows.forEach(({ row, value, seriesIndex, decimals }) => {
    const measurement = parseMeasurementValue(chart.data[seriesIndex]?.[index]);
    const isVisible = chart.series[seriesIndex]?.show !== false;
    const isValid = measurement !== null;
    row.hidden = !isVisible || !isValid;
    if (isValid) {
      value.textContent = formatValue(measurement, decimals);
      hasValue = true;
    }
  });
  if (!hasValue) {
    hideChartTooltip(tooltip);
    return;
  }

  tooltip.element.hidden = false;
  const desiredLeft = chart.bbox.left + chart.cursor.left + 16;
  const desiredTop = chart.bbox.top + chart.cursor.top + 16;
  const maximumLeft = Math.max(12, tooltip.chartHost.clientWidth - tooltip.element.offsetWidth - 12);
  const maximumTop = Math.max(12, tooltip.chartHost.clientHeight - tooltip.element.offsetHeight - 12);
  tooltip.element.style.left = `${Math.max(12, Math.min(desiredLeft, maximumLeft))}px`;
  tooltip.element.style.top = `${Math.max(12, Math.min(desiredTop, maximumTop))}px`;
}

function updateClimateGridAxis(chart) {
  const temperatureVisible = isChartSeriesVisible("climate", 1);
  const humidityVisible = isChartSeriesVisible("climate", 2);

  chart.axes[1].grid.show = temperatureVisible;
  chart.axes[2].grid.show = !temperatureVisible && humidityVisible;
}

function initializeChartLegend(chart, chartType, legendItems, tooltip) {
  legendItems.forEach(({ element, seriesIndex }) => {
    element.addEventListener("click", () => {
      const isVisible = !isChartSeriesVisible(chartType, seriesIndex);
      chartSeriesVisibility[chartType][seriesIndex] = isVisible;
      if (chartType === "climate") {
        chart.batch(() => {
          chart.setSeries(seriesIndex, { show: isVisible });
          updateClimateGridAxis(chart);
        });
      } else {
        chart.setSeries(seriesIndex, { show: isVisible });
      }
      setChartLegendItemState(element, isVisible);
      updateChartTooltip(chart, tooltip);
    });
  });
}

function getChartSize(chartHost) {
  return {
    width: Math.max(1, Math.floor(chartHost.clientWidth)),
    height: Math.max(1, Math.floor(chartHost.clientHeight)),
  };
}

function setChartZoomState(chartType, isZoomed, resetZoomButton) {
  if (chartType === "climate") climateChartHasUserZoom = isZoomed;
  else weightChartHasUserZoom = isZoomed;
  if (isZoomed) {
    lastZoomedChartType = chartType;
  } else if (lastZoomedChartType === chartType) {
    lastZoomedChartType = climateChartHasUserZoom ? "climate" : weightChartHasUserZoom ? "weight" : undefined;
  }
  if (resetZoomButton) resetZoomButton.hidden = !isZoomed;
}

function resetChartZoom(chartType, chart, resetZoomButton) {
  setChartZoomState(chartType, false, resetZoomButton);
  chart.setScale("x", getAppliedChartRange());
  scheduleCloudZoomAggregation();
  if (hasLiveHistoryRange()) requestAnimationFrame(refreshLiveHistoryRange);
}

function createXZoomPlugin(chartType, resetZoomButton) {
  let removeZoomListeners = null;

  return {
    hooks: {
      setSelect: [(chart) => {
        // Native uPlot med vlečenjem sproti riše `.u-select`, ob spustu pa
        // sam nastavi X merilo. Hook samo vključi naš gumb za ponastavitev.
        if (chart.select.width >= 5) {
          setChartZoomState(chartType, true, resetZoomButton);
          // Po uPlotovem končanem nastavljanju X merila ponovno združimo
          // surove cloud meritve za dejansko približan interval.
          scheduleCloudZoomAggregation();
        }
      }],
      ready: [(chart) => {
        removeZoomListeners?.();
        let panAnimationFrame = 0;
        let panGesture = null;
        let pendingPanClientX = null;
        const reset = () => resetChartZoom(chartType, chart, resetZoomButton);
        const applyPendingPan = () => {
          panAnimationFrame = 0;
          if (!panGesture || pendingPanClientX === null) return;

          const deltaPixels = pendingPanClientX - panGesture.startClientX;
          const shiftedRange = -(deltaPixels / Math.max(1, panGesture.plotWidth)) * panGesture.range;
          const applied = getAppliedChartRange();
          let minimum = panGesture.minimum + shiftedRange;
          let maximum = panGesture.maximum + shiftedRange;
          if (minimum < applied.min) {
            minimum = applied.min;
            maximum = minimum + panGesture.range;
          }
          if (maximum > applied.max) {
            maximum = applied.max;
            minimum = maximum - panGesture.range;
          }

          chart.setScale("x", { min: minimum, max: maximum });
          setChartZoomState(chartType, true, resetZoomButton);
          pendingPanClientX = null;
        };
        const handlePanStart = (event) => {
          if (event.button !== 0 || !event.shiftKey) return;

          const minimum = Number(chart.scales.x.min);
          const maximum = Number(chart.scales.x.max);
          const applied = getAppliedChartRange();
          const range = maximum - minimum;
          const appliedRange = applied.max - applied.min;
          if (!Number.isFinite(range) || range <= 0 || range >= appliedRange) return;

          event.preventDefault();
          event.stopImmediatePropagation();
          panGesture = {
            startClientX: event.clientX,
            minimum,
            maximum,
            range,
            plotWidth: chart.over.getBoundingClientRect().width,
          };
          pendingPanClientX = event.clientX;
          chart.over.classList.add("is-panning");
        };
        const handlePanMove = (event) => {
          if (!panGesture) return;
          event.preventDefault();
          pendingPanClientX = event.clientX;
          if (!panAnimationFrame) panAnimationFrame = requestAnimationFrame(applyPendingPan);
        };
        const stopPan = () => {
          if (!panGesture) return;
          if (panAnimationFrame && pendingPanClientX !== null) applyPendingPan();
          else if (panAnimationFrame) cancelAnimationFrame(panAnimationFrame);
          panAnimationFrame = 0;
          panGesture = null;
          pendingPanClientX = null;
          chart.over.classList.remove("is-panning");
        };
        const handleDoubleClick = (event) => {
          event.preventDefault();
          reset();
        };
        const handleResetClick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          reset();
        };

        chart.over.addEventListener("mousedown", handlePanStart, true);
        document.addEventListener("mousemove", handlePanMove, { passive: false });
        document.addEventListener("mouseup", stopPan);
        window.addEventListener("blur", stopPan);
        chart.over.addEventListener("dblclick", handleDoubleClick);
        resetZoomButton?.addEventListener("click", handleResetClick);

        removeZoomListeners = () => {
          chart.over.removeEventListener("mousedown", handlePanStart, true);
          document.removeEventListener("mousemove", handlePanMove);
          document.removeEventListener("mouseup", stopPan);
          window.removeEventListener("blur", stopPan);
          chart.over.removeEventListener("dblclick", handleDoubleClick);
          resetZoomButton?.removeEventListener("click", handleResetClick);
          stopPan();
        };
      }],
      destroy: [() => {
        removeZoomListeners?.();
        removeZoomListeners = null;
      }],
    },
  };
}

function createTouchChartPlugin(chartType, tooltip, resetZoomButton) {
  let removeTouchListeners = null;

  return {
    hooks: {
      ready: [(chart) => {
        removeTouchListeners?.();

        let animationFrame = 0;
        let gesture = null;
        let pendingCursorTouch = null;
        let pendingTwoFingerTouches = null;

        const copyTouch = (touch) => ({ clientX: touch.clientX, clientY: touch.clientY });
        const copyTouches = (touches) => [copyTouch(touches[0]), copyTouch(touches[1])];
        const clampToPlot = (value, maximum) => Math.max(0, Math.min(maximum, value));
        const getPlotPoint = (touch, rect) => ({
          left: clampToPlot(touch.clientX - rect.left, rect.width),
          top: clampToPlot(touch.clientY - rect.top, rect.height),
        });
        const getTwoFingerGeometry = (touches, rect) => {
          const first = getPlotPoint(touches[0], rect);
          const second = getPlotPoint(touches[1], rect);
          const deltaX = second.left - first.left;
          return {
            midpointLeft: (first.left + second.left) / 2,
            distance: Math.max(1, Math.abs(deltaX)),
          };
        };
        const isZoomedFromAppliedRange = (minimum, maximum) => {
          const applied = getAppliedChartRange();
          const tolerance = Math.max(1, (applied.max - applied.min) * 0.0001);
          return Math.abs(minimum - applied.min) > tolerance
            || Math.abs(maximum - applied.max) > tolerance;
        };
        const applyPendingTouch = () => {
          animationFrame = 0;

          if (pendingTwoFingerTouches && gesture?.mode === "two-finger") {
            const current = getTwoFingerGeometry(pendingTwoFingerTouches, gesture.rect);
            const distanceDelta = current.distance - gesture.distance;
            const midpointDelta = current.midpointLeft - gesture.midpointLeft;
            const zoomThreshold = Math.max(10, gesture.distance * 0.06);
            const panThreshold = 8;

            if (gesture.intent === "pending") {
              const isPinch = Math.abs(distanceDelta) >= zoomThreshold
                && Math.abs(distanceDelta) > Math.abs(midpointDelta) * 1.2;
              const isPan = Math.abs(midpointDelta) >= panThreshold
                && Math.abs(distanceDelta) < Math.max(zoomThreshold, Math.abs(midpointDelta) * 0.35);
              if (isPinch) gesture.intent = "pinch";
              else if (isPan) gesture.intent = "pan";
            }

            if (gesture.intent === "pending") {
              pendingTwoFingerTouches = null;
              return;
            }

            const applied = getAppliedChartRange();
            const appliedRange = applied.max - applied.min;
            const scaleFactor = gesture.intent === "pinch" ? gesture.distance / current.distance : 1;
            const nextRange = Math.min(appliedRange, gesture.range * scaleFactor);
            const midpointRatio = current.midpointLeft / Math.max(1, gesture.rect.width);
            let minimum = gesture.anchorValue - midpointRatio * nextRange;
            let maximum = minimum + nextRange;
            if (minimum < applied.min) {
              minimum = applied.min;
              maximum = minimum + nextRange;
            }
            if (maximum > applied.max) {
              maximum = applied.max;
              minimum = maximum - nextRange;
            }

            if (Number.isFinite(minimum) && Number.isFinite(maximum) && maximum > minimum) {
              chart.setScale("x", { min: minimum, max: maximum });
              setChartZoomState(
                chartType,
                isZoomedFromAppliedRange(minimum, maximum),
                resetZoomButton,
              );
            }
            pendingTwoFingerTouches = null;
            return;
          }

          if (pendingCursorTouch && gesture?.mode === "cursor") {
            const rect = chart.over.getBoundingClientRect();
            const point = getPlotPoint(pendingCursorTouch, rect);
            chart.setCursor(point);
            pendingCursorTouch = null;
          }
        };
        const scheduleTouchUpdate = () => {
          if (!animationFrame) animationFrame = requestAnimationFrame(applyPendingTouch);
        };
        const beginCursorGesture = (touch) => {
          gesture = {
            mode: "cursor",
            startClientX: touch.clientX,
            startClientY: touch.clientY,
            direction: "pending",
          };
          pendingTwoFingerTouches = null;
          pendingCursorTouch = copyTouch(touch);
          scheduleTouchUpdate();
        };
        const beginTwoFingerGesture = (event) => {
          const rect = chart.over.getBoundingClientRect();
          const geometry = getTwoFingerGeometry(event.touches, rect);
          const minimum = Number(chart.scales.x.min);
          const maximum = Number(chart.scales.x.max);
          if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum) return;

          gesture = {
            mode: "two-finger",
            intent: "pending",
            rect,
            distance: geometry.distance,
            midpointLeft: geometry.midpointLeft,
            range: maximum - minimum,
            anchorValue: chart.posToVal(geometry.midpointLeft, "x"),
          };
          pendingCursorTouch = null;
          pendingTwoFingerTouches = copyTouches(event.touches);
          chart.setCursor({ left: -10, top: -10 });
          hideChartTooltip(tooltip);
          scheduleTouchUpdate();
        };
        const handleTouchStart = (event) => {
          if (event.touches.length >= 2) {
            event.preventDefault();
            beginTwoFingerGesture(event);
          } else if (event.touches.length === 1) {
            beginCursorGesture(event.touches[0]);
          }
        };
        const handleTouchMove = (event) => {
          if (!gesture) return;

          if (event.touches.length >= 2) {
            event.preventDefault();
            if (gesture.mode !== "two-finger") beginTwoFingerGesture(event);
            pendingTwoFingerTouches = copyTouches(event.touches);
            scheduleTouchUpdate();
            return;
          }

          if (event.touches.length !== 1 || gesture.mode !== "cursor") return;
          const touch = event.touches[0];
          const deltaX = Math.abs(touch.clientX - gesture.startClientX);
          const deltaY = Math.abs(touch.clientY - gesture.startClientY);
          if (gesture.direction === "pending" && Math.max(deltaX, deltaY) >= 6) {
            gesture.direction = deltaX >= deltaY ? "horizontal" : "vertical";
          }
          if (gesture.direction === "vertical") return;

          event.preventDefault();
          pendingCursorTouch = copyTouch(touch);
          scheduleTouchUpdate();
        };
        const handleTouchEnd = (event) => {
          if (event.touches.length >= 2) {
            if (gesture?.mode !== "two-finger") beginTwoFingerGesture(event);
            return;
          }
          if (gesture?.mode === "two-finger" && event.touches.length === 1) {
            gesture = { mode: "wait-for-release" };
            pendingTwoFingerTouches = null;
            return;
          }
          if (event.touches.length === 1) {
            beginCursorGesture(event.touches[0]);
            return;
          }

          gesture = null;
          pendingCursorTouch = null;
          pendingTwoFingerTouches = null;
          scheduleCloudZoomAggregation();
        };
        const handleTouchCancel = () => {
          gesture = null;
          pendingCursorTouch = null;
          pendingTwoFingerTouches = null;
          if (animationFrame) cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        };

        chart.over.addEventListener("touchstart", handleTouchStart, { passive: false });
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd, { passive: false });
        document.addEventListener("touchcancel", handleTouchCancel, { passive: false });

        removeTouchListeners = () => {
          chart.over.removeEventListener("touchstart", handleTouchStart);
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleTouchEnd);
          document.removeEventListener("touchcancel", handleTouchCancel);
          handleTouchCancel();
        };
      }],
      destroy: [() => {
        removeTouchListeners?.();
        removeTouchListeners = null;
      }],
    },
  };
}

function createUPlotOptions(type, chartHost, tooltip, resetZoomButton) {
  const colors = getChartTheme();
  const isClimate = type === "climate";
  const temperatureVisible = isChartSeriesVisible("climate", 1);
  const humidityVisible = isChartSeriesVisible("climate", 2);
  const size = getChartSize(chartHost);
  const xRange = getAppliedChartRange();
  const sharedOptions = {
    width: size.width,
    height: size.height,
    legend: { show: false },
    select: {
      show: true,
      over: true,
    },
    cursor: {
      x: true,
      y: false,
      points: {
        show: () => document.createElement("span"),
        size: 11,
        width: 2,
        fill: (_chart, seriesIndex) => {
          if (!isClimate) return colors.weight;
          return seriesIndex === 1 ? colors.temperature : colors.humidity;
        },
        stroke: colors.surface,
      },
      drag: { x: true, y: false, setScale: true, dist: 5 },
    },
    scales: { x: { time: true, auto: false, min: xRange.min, max: xRange.max } },
    axes: [
      {
        scale: "x",
        side: 2,
        size: 64,
        gap: 8,
        space: getChartXAxisSpace,
        lineGap: 1.35,
        stroke: colors.textSoft,
        font: "600 12px Inter, system-ui, sans-serif",
        values: formatChartTimeAxis,
        ticks: { stroke: colors.border },
        border: { stroke: colors.border },
        grid: { show: false },
      },
    ],
    plugins: [
      createXZoomPlugin(type, resetZoomButton),
      createTouchChartPlugin(type, tooltip, resetZoomButton),
      {
        hooks: {
          setCursor: [(chart) => updateChartTooltip(chart, tooltip)],
          destroy: [() => hideChartTooltip(tooltip)],
        },
      },
    ],
  };

  if (isClimate) {
    return {
      ...sharedOptions,
      scales: {
        ...sharedOptions.scales,
        temperature: { auto: true },
        humidity: { auto: true },
      },
      series: [
        {},
        {
        label: translateText("Temperatura (°C)"),
          scale: "temperature",
          show: isChartSeriesVisible("climate", 1),
          stroke: colors.temperature,
          width: 2,
          points: { show: (chart) => countValidChartValues(chart.data[1]) === 1, size: 10, fill: colors.temperature, stroke: colors.temperature },
        },
        {
        label: translateText("Vlaga (%)"),
          scale: "humidity",
          show: isChartSeriesVisible("climate", 2),
          stroke: colors.humidity,
          width: 2,
          points: { show: (chart) => countValidChartValues(chart.data[2]) === 1, size: 10, fill: colors.humidity, stroke: colors.humidity },
        },
      ],
      axes: [
        ...sharedOptions.axes,
        {
          scale: "temperature",
          side: 3,
          size: 56,
          gap: 8,
          label: "°C",
          labelSize: 24,
          stroke: colors.textSoft,
          font: "600 12px Inter, system-ui, sans-serif",
          values: (_chart, splits) => splits.map((value) => formatChartAxisNumber(value)),
          ticks: { stroke: colors.border },
          border: { stroke: colors.border },
          grid: { show: temperatureVisible, stroke: colors.grid, width: 1 },
        },
        {
          scale: "humidity",
          side: 1,
          size: 54,
          gap: 8,
          label: "%",
          labelSize: 24,
          stroke: colors.textSoft,
          font: "600 12px Inter, system-ui, sans-serif",
          values: (_chart, splits) => splits.map((value) => formatChartAxisNumber(value)),
          ticks: { stroke: colors.border },
          border: { stroke: colors.border },
          grid: { show: !temperatureVisible && humidityVisible, stroke: colors.grid, width: 1 },
        },
      ],
    };
  }

  return {
    ...sharedOptions,
    scales: { ...sharedOptions.scales, weight: { auto: true, range: getWeightChartScaleRange } },
    series: [
      {},
      {
        label: translateText("Masa (kg)"),
        scale: "weight",
        show: isChartSeriesVisible("weight", 1),
        stroke: colors.weight,
        width: 2,
        points: { show: (chart) => countValidChartValues(chart.data[1]) === 1, size: 10, fill: colors.weight, stroke: colors.weight },
      },
    ],
    axes: [
      ...sharedOptions.axes,
      {
        scale: "weight",
        side: 3,
        size: 56,
        gap: 8,
        label: "kg",
        labelSize: 28,
        stroke: colors.textSoft,
        font: "600 12px Inter, system-ui, sans-serif",
        incrs: WEIGHT_AXIS_INCREMENTS,
        values: (_chart, splits) => splits.map((value) => formatChartAxisNumber(value, currentWeightDisplayDecimals(), true)),
        ticks: { stroke: colors.border },
        border: { stroke: colors.border },
        grid: { stroke: colors.grid, width: 1 },
      },
    ],
  };
}

function resizeCharts() {
  [climateChart, weightChart].forEach((chart) => {
    if (!chart?.root?.parentElement) return;
    const size = getChartSize(chart.root.parentElement);
    if (chart.width !== size.width || chart.height !== size.height) chart.setSize(size);
  });
}

function initializeChartResizeObserver() {
  chartResizeObserver?.disconnect();
  chartResizeObserver = new ResizeObserver(() => {
    if (scheduledChartResize) return;
    scheduledChartResize = requestAnimationFrame(() => {
      scheduledChartResize = 0;
      resizeCharts();
    });
  });
  [climateChart, weightChart].forEach((chart) => {
    if (chart?.root?.parentElement) chartResizeObserver.observe(chart.root.parentElement);
  });
}

function destroyCharts() {
  chartResizeObserver?.disconnect();
  chartResizeObserver = undefined;
  if (scheduledChartResize) cancelAnimationFrame(scheduledChartResize);
  scheduledChartResize = 0;
  if (scheduledCloudZoomAggregation) cancelAnimationFrame(scheduledCloudZoomAggregation);
  scheduledCloudZoomAggregation = 0;
  climateChart?.destroy();
  weightChart?.destroy();
  climateChart = undefined;
  weightChart = undefined;
}

function applyChartData(chart, data, chartType, shouldKeepZoom, zoomRange, resetZoomButton) {
  const preservedRange = zoomRange ?? (shouldKeepZoom ? getChartXRange(chart) : undefined);
  if (!preservedRange) setChartZoomState(chartType, false, resetZoomButton);
  chart.setData(data, true);
  chart.setScale("x", preservedRange ?? getAppliedChartRange());
}

function renderHistory(readings, alreadyAggregated = false, zoomRanges = {}, aggregationRange) {
  const sourceReadings = Array.isArray(readings) ? readings : [];
  const effectiveAggregationRange = aggregationRange ?? getCloudZoomAggregationRange() ?? appliedRange;
  const chartReadings = alreadyAggregated ? sourceReadings : aggregateReadings(sourceReadings, effectiveAggregationRange);
  latestHistoryReadings = sourceReadings;
  latestHistoryAlreadyAggregated = alreadyAggregated;
  elements.historySummary.textContent = chartReadings.length
    ? formatTranslatedText("Prikazanih je {count} povprečnih točk. Za približanje povlecite po izbranem grafu.", { count: chartReadings.length })
    : translateText("Za izbrano obdobje še ni meritev.");
  if (!climateChart || !weightChart) return;

  const chartData = buildUPlotData(chartReadings);
  applyChartData(
    climateChart,
    chartData.climate,
    "climate",
    climateChartHasUserZoom,
    zoomRanges.climateZoom,
    climateChart.resetZoomButton,
  );
  applyChartData(
    weightChart,
    chartData.weight,
    "weight",
    weightChartHasUserZoom,
    zoomRanges.weightZoom,
    weightChart.resetZoomButton,
  );
}

function createCharts(zoomRanges = {}) {
  if (climateChart || weightChart || !window.uPlot) return;
  const colors = getChartTheme();
  const climatePresentation = createChartPresentation(
    "climate-chart",
    "climate",
    [
      { label: translateText("Temperatura (°C)"), color: colors.temperature, seriesIndex: 1 },
      { label: translateText("Vlaga (%)"), color: colors.humidity, seriesIndex: 2 },
    ],
    [
      { label: translateText("Temperatura (°C)"), color: colors.temperature, seriesIndex: 1 },
      { label: translateText("Vlaga (%)"), color: colors.humidity, seriesIndex: 2 },
    ],
  );
  const weightPresentation = createChartPresentation(
    "weight-chart",
    "weight",
    [{ label: translateText("Masa (kg)"), color: colors.weight, seriesIndex: 1 }],
    [{ label: translateText("Masa (kg)"), color: colors.weight, seriesIndex: 1, decimals: currentWeightDisplayDecimals() }],
  );
  climateChart = new window.uPlot(
    createUPlotOptions("climate", climatePresentation.chartHost, climatePresentation.tooltip, climatePresentation.resetZoomButton),
    [[], [], []],
    climatePresentation.chartHost,
  );
  weightChart = new window.uPlot(
    createUPlotOptions("weight", weightPresentation.chartHost, weightPresentation.tooltip, weightPresentation.resetZoomButton),
    [[], []],
    weightPresentation.chartHost,
  );
  climateChart.resetZoomButton = climatePresentation.resetZoomButton;
  weightChart.resetZoomButton = weightPresentation.resetZoomButton;
  initializeChartLegend(climateChart, "climate", climatePresentation.legendItems, climatePresentation.tooltip);
  initializeChartLegend(weightChart, "weight", weightPresentation.legendItems, weightPresentation.tooltip);
  initializeChartResizeObserver();
  renderHistory(latestHistoryReadings, latestHistoryAlreadyAggregated, zoomRanges);
}

function loadResource(resource, elementId, url, unavailableMessage) {
  const existing = document.querySelector(`#${elementId}`);
  if (existing?.dataset.loaded === "true" || existing?.sheet) return Promise.resolve();
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => {
        existing.remove();
        reject(new Error(unavailableMessage));
      }, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const element = document.createElement(resource === "style" ? "link" : "script");
    element.id = elementId;
    if (resource === "style") {
      element.rel = "stylesheet";
      element.href = url;
    } else {
      element.src = url;
      element.async = true;
    }
    element.addEventListener("load", () => {
      element.dataset.loaded = "true";
      resolve();
    }, { once: true });
    element.addEventListener("error", () => {
      element.remove();
      reject(new Error(unavailableMessage));
    }, { once: true });
    document.head.append(element);
  });
}

function loadUPlot() {
  if (window.uPlot) return Promise.resolve();
  if (uPlotLoading) return uPlotLoading;

  uPlotLoading = Promise.all([
    loadResource("style", "uplot-styles", "vendor/uPlot-1.6.32.min.css", "uPlot CSS ni dosegljiv."),
    loadResource("script", "uplot-script", "vendor/uPlot-1.6.32.iife.min.js", "uPlot ni dosegljiv."),
  ]).then(() => {
    if (!window.uPlot) throw new Error("uPlot se ni pravilno naložil.");
  }).catch((error) => {
    uPlotLoading = undefined;
    throw error;
  });
  return uPlotLoading;
}

function showDataError(error) {
  console.error(error);
  setConnectionState("Napaka pri branju podatkov", "error");
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getPresetRange(preset) {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const ago = (milliseconds) => new Date(now.getTime() - milliseconds);

  const presets = {
    today: { from: today, to: now },
    yesterday: { from: yesterday, to: endOfDay(yesterday) },
    week: { from: weekStart, to: now },
    month: { from: monthStart, to: now },
    year: { from: yearStart, to: now },
    hour: { from: ago(60 * 60 * 1000), to: now },
    hours12: { from: ago(12 * 60 * 60 * 1000), to: now },
    hours24: { from: ago(24 * 60 * 60 * 1000), to: now },
    days7: { from: ago(7 * 24 * 60 * 60 * 1000), to: now },
    days30: { from: ago(30 * 24 * 60 * 60 * 1000), to: now },
  };
  return presets[preset];
}

function cloneRange(range) {
  return { from: new Date(range.from), to: new Date(range.to) };
}

function toTimeInputValue(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function setDateTime(date, timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function syncRangeControls() {
  elements.rangeDialogValue.textContent = draftRange.to ? formatRange(draftRange) : translateText("Izberite končni datum");
  elements.startTime.value = toTimeInputValue(draftRange.from);
  elements.endTime.value = toTimeInputValue(draftRange.to ?? draftRange.from);
}

function isSameDay(first, second) {
  return dateKey(first) === dateKey(second);
}

function getCalendarDayRange(date) {
  const dayStart = startOfDay(date);
  const now = new Date();
  return {
    from: dayStart,
    to: isSameDay(dayStart, now) ? now : endOfDay(dayStart),
  };
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const numberOfDays = new Date(year, month + 1, 0).getDate();
  const leadingEmptyCells = (firstDay.getDay() + 6) % 7;
  elements.calendarMonthLabel.textContent = formatDate(firstDay, { month: "long", year: "numeric" });
  elements.calendarDays.replaceChildren(...Array.from({ length: leadingEmptyCells }, () => document.createElement("span")));

  for (let day = 1; day <= numberOfDays; day += 1) {
    const date = new Date(year, month, day);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = day;
    button.dataset.date = date.toISOString();
    button.className = "calendar-day";
    if (isSameDay(date, new Date())) button.classList.add("today");
    if (draftRange.to && date >= startOfDay(draftRange.from) && date <= startOfDay(draftRange.to)) button.classList.add("in-range");
    if (isSameDay(date, draftRange.from)) button.classList.add("range-start");
    if (draftRange.to && isSameDay(date, draftRange.to)) button.classList.add("range-end");
    elements.calendarDays.append(button);
  }
}

function selectCalendarDate(date) {
  draftRelativeHistoryPreset = undefined;
  const selectedRange = getCalendarDayRange(date);
  if (!selectingRangeEnd) {
    draftRange = selectedRange;
    selectingRangeEnd = true;
  } else {
    if (selectedRange.from < startOfDay(draftRange.from)) {
      const previousEnd = new Date(draftRange.to);
      draftRange.from = selectedRange.from;
      draftRange.to = isSameDay(previousEnd, new Date()) ? new Date() : endOfDay(previousEnd);
    } else {
      draftRange.to = selectedRange.to;
    }
    selectingRangeEnd = false;
  }
  syncRangeControls();
  renderCalendar();
}

function openRangeDialog() {
  draftRange = cloneRange(appliedRange);
  draftRelativeHistoryPreset = activeRelativeHistoryPreset;
  calendarMonth = new Date(draftRange.from.getFullYear(), draftRange.from.getMonth(), 1);
  selectingRangeEnd = false;
  syncRangeControls();
  renderCalendar();
  elements.rangeDialog.showModal();
}

function applyRange() {
  if (!draftRange.to || draftRange.to <= draftRange.from) {
    elements.rangeDialogValue.textContent = translateText("Končni datum mora biti po začetnem datumu.");
    return;
  }

  appliedRange = cloneRange(draftRange);
  activeRelativeHistoryPreset = LIVE_HISTORY_PRESETS.has(draftRelativeHistoryPreset)
    ? draftRelativeHistoryPreset
    : undefined;
  climateChartHasUserZoom = false;
  weightChartHasUserZoom = false;
  lastZoomedChartType = undefined;
  elements.rangeValue.textContent = formatRange(appliedRange);
  elements.rangeDialog.close();
  historyViewLoading = undefined;
  refreshVisibleHistory();
}

function initializeDateRangePicker() {
  appliedRange = getPresetRange("hours24");
  activeRelativeHistoryPreset = "hours24";
  elements.rangeValue.textContent = formatRange(appliedRange);
  elements.rangeTrigger.addEventListener("click", openRangeDialog);
  document.querySelector("#date-range-cancel").addEventListener("click", () => elements.rangeDialog.close());
  document.querySelector("#date-range-apply").addEventListener("click", applyRange);
  document.querySelector("#calendar-previous").addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    renderCalendar();
  });
  document.querySelector("#calendar-next").addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    renderCalendar();
  });
  elements.calendarDays.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-date]");
    if (button) selectCalendarDate(new Date(button.dataset.date));
  });
  elements.startTime.addEventListener("change", () => {
    draftRelativeHistoryPreset = undefined;
    draftRange.from = setDateTime(draftRange.from, elements.startTime.value);
    syncRangeControls();
  });
  elements.endTime.addEventListener("change", () => {
    draftRelativeHistoryPreset = undefined;
    draftRange.to = setDateTime(draftRange.to ?? draftRange.from, elements.endTime.value);
    syncRangeControls();
  });
  document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
    draftRelativeHistoryPreset = button.dataset.preset;
    draftRange = getPresetRange(button.dataset.preset);
    calendarMonth = new Date(draftRange.from.getFullYear(), draftRange.from.getMonth(), 1);
    selectingRangeEnd = false;
    syncRangeControls();
    renderCalendar();
  }));
}

function describeAuthError(error) {
  const messages = {
    "auth/invalid-credential": "E-poštni naslov ali geslo ni pravilno.",
    "auth/email-already-in-use": "Za ta e-poštni naslov račun že obstaja.",
    "auth/weak-password": "Geslo mora imeti najmanj šest znakov.",
    "auth/popup-closed-by-user": "Google prijava je bila zaprta.",
    "auth/operation-not-allowed": "Ta način prijave še ni omogočen v Firebase Authentication.",
  };
  return translateText(messages[error?.code] ?? "Postopka ni bilo mogoče dokončati. Poskusi znova.");
}

function setAuthStatus(message) {
  elements.authStatus.textContent = translateText(message);
}

function getAccountInitials(user) {
  const source = String(user?.displayName || user?.email || "PP").trim();
  const words = source.split(/\s+|@/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join("");
  return (initials || "PP").toLocaleUpperCase("sl-SI");
}

function renderAccountIdentity(user) {
  const email = user?.email || "Google račun";
  const avatarUrl = String(user?.photoURL || "").trim();
  elements.accountEmail.textContent = email;
  elements.accountAvatarInitials.textContent = getAccountInitials(user);
  elements.accountAvatar.classList.toggle("has-photo", Boolean(avatarUrl));
  elements.accountAvatarImage.hidden = !avatarUrl;
  elements.accountAvatarInitials.hidden = Boolean(avatarUrl);

  if (avatarUrl) {
    elements.accountAvatarImage.src = avatarUrl;
    elements.accountAvatarImage.alt = `Profilna slika uporabnika ${user.displayName || email}`;
    elements.accountAvatarImage.onerror = () => {
      elements.accountAvatar.classList.remove("has-photo");
      elements.accountAvatarImage.hidden = true;
      elements.accountAvatarInitials.hidden = false;
    };
  } else {
    elements.accountAvatarImage.removeAttribute("src");
    elements.accountAvatarImage.alt = "";
    elements.accountAvatarImage.onerror = null;
  }
}

async function renderHeaderAuthIdentity(user) {
  elements.authTriggerLabel.textContent = translateText(user ? "Odjava" : "Prijava");
  elements.authTriggerAvatar.hidden = true;

  if (!user) {
    elements.authTriggerAvatar.removeAttribute("src");
    elements.authTriggerAvatar.alt = "";
    elements.authTriggerAvatar.onerror = null;
    return;
  }

  let isGoogleSignIn = false;
  try {
    const tokenResult = await firebaseAuthModule.getIdTokenResult(user);
    isGoogleSignIn = tokenResult.signInProvider === "google.com";
  } catch {
    isGoogleSignIn = false;
  }

  if (currentCloudUser !== user) return;
  const avatarUrl = isGoogleSignIn ? String(user.photoURL || "").trim() : "";
  elements.authTriggerAvatar.hidden = !avatarUrl;

  if (avatarUrl) {
    elements.authTriggerAvatar.src = avatarUrl;
    elements.authTriggerAvatar.alt = `Profilna slika uporabnika ${user.displayName || user.email || "Google"}`;
    elements.authTriggerAvatar.onerror = () => {
      elements.authTriggerAvatar.hidden = true;
    };
  } else {
    elements.authTriggerAvatar.removeAttribute("src");
    elements.authTriggerAvatar.alt = "";
    elements.authTriggerAvatar.onerror = null;
  }
}

function openAuthDialog() {
  setAuthStatus("");
  if (!elements.authDialog.open) elements.authDialog.showModal();
}

async function signInWithEmail(event) {
  event.preventDefault();
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;
  if (!email || !password) return;

  elements.authStatus.textContent = translateText("Prijavljam …");
  try {
    await firebaseAuthModule.signInWithEmailAndPassword(firebaseAuth, email, password);
    elements.authDialog.close();
  } catch (error) {
    console.error(error);
    setAuthStatus(describeAuthError(error));
  }
}

async function registerEmailAccount() {
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;
  if (!email || !password) {
    setAuthStatus("Vnesi e-poštni naslov in geslo.");
    return;
  }

  elements.authStatus.textContent = translateText("Ustvarjam račun …");
  try {
    await firebaseAuthModule.createUserWithEmailAndPassword(firebaseAuth, email, password);
    elements.authDialog.close();
  } catch (error) {
    console.error(error);
    setAuthStatus(describeAuthError(error));
  }
}

async function signInWithGoogle() {
  elements.authStatus.textContent = translateText("Odpiram Google prijavo …");
  try {
    if (isAndroidAppDashboard) {
      const result = await requestNativeAuthentication("google-sign-in");
      const idToken = result?.idToken;
      if (!idToken) {
        throw new Error("Google prijava ni vrnila veljavnega identifikacijskega žetona.");
      }

      const credential = firebaseAuthModule.GoogleAuthProvider.credential(
        idToken,
        result.accessToken || undefined,
      );
      await firebaseAuthModule.signInWithCredential(firebaseAuth, credential);
    } else {
      const provider = new firebaseAuthModule.GoogleAuthProvider();
      await firebaseAuthModule.signInWithPopup(firebaseAuth, provider);
    }
    elements.authDialog.close();
  } catch (error) {
    console.error(error);
    setAuthStatus(describeAuthError(error));
  }
}

function requestNativeAuthentication(action) {
  if (!isAndroidAppDashboard || window.parent === window) {
    return Promise.reject(new Error("Nativna prijava ni na voljo. Posodobi ali znova namesti aplikacijo."));
  }

  try {
    const nativeBridge = window.parent.PametniCebelnjakNativeAuth;
    if (typeof nativeBridge?.request === "function") {
      return Promise.resolve().then(() => nativeBridge.request(action));
    }
  } catch (error) {
    console.warn("Neposredni Android auth most ni dosegljiv; uporabljam rezervni postMessage most.", error);
  }

  const requestId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Nativna prijava se ni odzvala. Poskusi znova."));
    }, NATIVE_AUTH_REQUEST_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handleResult);
    }

    function handleResult(event) {
      if (event.source !== window.parent) {
        return;
      }

      const response = event.data;
      if (!response || response.type !== NATIVE_AUTH_RESULT_TYPE || response.requestId !== requestId) {
        return;
      }

      cleanup();
      if (response.ok) {
        resolve(response.payload || {});
        return;
      }

      const error = new Error(response.error?.message || "Nativna prijava ni uspela.");
      if (response.error?.code) {
        error.code = response.error.code;
      }
      reject(error);
    }

    window.addEventListener("message", handleResult);
    window.parent.postMessage({
      type: NATIVE_AUTH_REQUEST_TYPE,
      requestId,
      action,
    }, "*");
  });
}

async function signOutCurrentUser() {
  try {
    await firebaseAuthModule.signOut(firebaseAuth);
    if (isAndroidAppDashboard) {
      try {
        await requestNativeAuthentication("sign-out");
      } catch (nativeError) {
        console.warn("Nativne Google seje ni bilo mogoče počistiti.", nativeError);
      }
    }
  } catch (error) {
    console.error(error);
    setConnectionState("Odjava ni uspela", "error");
  }
}

function getCloudInactivityRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(CLOUD_INACTIVITY_STORAGE_KEY) || "null");
    return record && typeof record === "object" ? record : undefined;
  } catch {
    return undefined;
  }
}

function formatInactivityCountdown(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function updateInactivityWarning() {
  if (!cloudInactivityWarningActive) return;
  const remaining = CLOUD_INACTIVITY_TIMEOUT_MS + CLOUD_LOGOUT_WARNING_MS - (Date.now() - cloudInactivityLastActivityAt);
  setTranslatedElementText(elements.inactivityWarningDescription, "Zaradi neaktivnosti boste čez {time} samodejno odjavljeni.", {
    time: formatInactivityCountdown(remaining),
  });
}

function scheduleCloudInactivityCheck() {
  clearTimeout(cloudInactivityCheckTimer);
  clearInterval(cloudLogoutCountdownTimer);
  if (isLocalDashboard || !currentCloudUser) return;
  const elapsed = Date.now() - cloudInactivityLastActivityAt;
  const timeout = cloudInactivityWarningActive
    ? CLOUD_INACTIVITY_TIMEOUT_MS + CLOUD_LOGOUT_WARNING_MS - elapsed
    : CLOUD_INACTIVITY_TIMEOUT_MS - elapsed;
  cloudInactivityCheckTimer = window.setTimeout(checkCloudInactivity, Math.max(0, timeout));
  if (cloudInactivityWarningActive) {
    updateInactivityWarning();
    cloudLogoutCountdownTimer = window.setInterval(updateInactivityWarning, 1000);
  }
}

function broadcastCloudInactivity(message) {
  cloudInactivityChannel?.postMessage(message);
}

function persistCloudInactivityActivity(timestamp, type = "activity") {
  if (!currentCloudUser) return;
  const record = { uid: currentCloudUser.uid, timestamp, type };
  localStorage.setItem(CLOUD_INACTIVITY_STORAGE_KEY, JSON.stringify(record));
  broadcastCloudInactivity(record);
}

function pauseCloudRealtimeForInactivity() {
  if (cloudRealtimePaused || isLocalDashboard || !currentCloudUser) return;
  cloudRealtimePaused = true;
  clearCloudDeviceListeners();
  stopCloudDirectoryListeners();
  clearTimeout(weightChangeRefreshTimer);
}

function resumeCloudRealtimeAfterInactivity() {
  if (!cloudRealtimePaused || !currentCloudUser || isLocalDashboard) return;
  cloudRealtimePaused = false;
  const selectedDeviceId = cloudDevicePath.replace("devices/", "");
  if (isCloudAdministrator()) void refreshAdminDeviceDirectory();
  else startCloudUserDirectoryListeners();
  if (selectedDeviceId && cloudDevices[selectedDeviceId]) selectCloudDevice(selectedDeviceId);
  scheduleWeightChangeOverviewRefresh();
  void refreshWeatherForecast(true);
}

function showCloudInactivityWarning() {
  if (cloudInactivityWarningActive || isLocalDashboard || !currentCloudUser) return;
  cloudInactivityWarningActive = true;
  pauseCloudRealtimeForInactivity();
  updateInactivityWarning();
  if (!elements.inactivityWarningDialog.open) elements.inactivityWarningDialog.showModal();
  scheduleCloudInactivityCheck();
}

function closeCloudInactivityWarning() {
  cloudInactivityWarningActive = false;
  clearInterval(cloudLogoutCountdownTimer);
  if (elements.inactivityWarningDialog.open) elements.inactivityWarningDialog.close();
}

async function signOutForCloudInactivity(broadcast = true) {
  if (!currentCloudUser) return;
  const uid = currentCloudUser.uid;
  closeCloudInactivityWarning();
  clearTimeout(cloudInactivityCheckTimer);
  if (broadcast) broadcastCloudInactivity({ type: "logout", uid });
  await signOutCurrentUser();
}

function checkCloudInactivity() {
  if (isLocalDashboard || !currentCloudUser) return;
  const elapsed = Date.now() - cloudInactivityLastActivityAt;
  if (elapsed >= CLOUD_INACTIVITY_TIMEOUT_MS + CLOUD_LOGOUT_WARNING_MS) {
    void signOutForCloudInactivity();
    return;
  }
  if (elapsed >= CLOUD_INACTIVITY_TIMEOUT_MS) showCloudInactivityWarning();
  else scheduleCloudInactivityCheck();
}

function recordCloudActivity() {
  if (isLocalDashboard || !currentCloudUser || cloudInactivityWarningActive) return;
  const timestamp = Date.now();
  if (timestamp - cloudInactivityLastActivityAt < 1000) return;
  cloudInactivityLastActivityAt = timestamp;
  persistCloudInactivityActivity(timestamp);
  scheduleCloudInactivityCheck();
}

function resumeCloudSessionFromInactivity(broadcast = true) {
  if (isLocalDashboard || !currentCloudUser) return;
  cloudInactivityLastActivityAt = Date.now();
  closeCloudInactivityWarning();
  if (broadcast) persistCloudInactivityActivity(cloudInactivityLastActivityAt, "resume");
  resumeCloudRealtimeAfterInactivity();
  scheduleCloudInactivityCheck();
}

function handleSharedCloudInactivityMessage(message) {
  if (!message || message.uid !== currentCloudUser?.uid) return;
  if (message.type === "logout") {
    void signOutForCloudInactivity(false);
    return;
  }
  const timestamp = Number(message.timestamp);
  if (!Number.isFinite(timestamp) || timestamp <= cloudInactivityLastActivityAt) return;
  if (message.type === "resume") {
    cloudInactivityLastActivityAt = timestamp;
    closeCloudInactivityWarning();
    resumeCloudRealtimeAfterInactivity();
    scheduleCloudInactivityCheck();
    return;
  }
  if (!cloudInactivityWarningActive) {
    cloudInactivityLastActivityAt = timestamp;
    scheduleCloudInactivityCheck();
  }
}

function startCloudInactivityTracking() {
  if (isLocalDashboard || !currentCloudUser) return;
  const sharedRecord = getCloudInactivityRecord();
  const sharedTimestamp = Number(sharedRecord?.timestamp);
  const maxSharedRecordAge = CLOUD_INACTIVITY_TIMEOUT_MS + CLOUD_LOGOUT_WARNING_MS;
  const hasUsableSharedRecord = sharedRecord?.uid === currentCloudUser.uid
    && Number.isFinite(sharedTimestamp)
    && sharedTimestamp > 0
    && sharedTimestamp <= Date.now()
    && Date.now() - sharedTimestamp < maxSharedRecordAge;
  cloudInactivityLastActivityAt = hasUsableSharedRecord ? sharedTimestamp : Date.now();
  if (!hasUsableSharedRecord) persistCloudInactivityActivity(cloudInactivityLastActivityAt);
  if (!cloudInactivityTrackingInitialized) {
    cloudInactivityTrackingInitialized = true;
    ["pointerdown", "touchstart", "keydown", "scroll", "wheel"].forEach((eventName) => {
      window.addEventListener(eventName, recordCloudActivity, { passive: eventName !== "keydown" });
    });
    document.addEventListener("visibilitychange", checkCloudInactivity);
    window.addEventListener("storage", (event) => {
      if (event.key !== CLOUD_INACTIVITY_STORAGE_KEY || !event.newValue) return;
      try {
        const record = JSON.parse(event.newValue);
        handleSharedCloudInactivityMessage({ ...record, type: record?.type || "activity" });
      } catch {}
    });
    if ("BroadcastChannel" in window) {
      cloudInactivityChannel = new BroadcastChannel(CLOUD_INACTIVITY_CHANNEL_NAME);
      cloudInactivityChannel.addEventListener("message", (event) => handleSharedCloudInactivityMessage(event.data));
    }
    elements.inactivityWarningStaySignedIn.addEventListener("click", () => resumeCloudSessionFromInactivity());
    elements.inactivityWarningDialog.addEventListener("cancel", (event) => event.preventDefault());
  }
  checkCloudInactivity();
}

function stopCloudInactivityTracking() {
  clearTimeout(cloudInactivityCheckTimer);
  clearInterval(cloudLogoutCountdownTimer);
  cloudRealtimePaused = false;
  closeCloudInactivityWarning();
}

async function claimDevice(event) {
  event.preventDefault();
  if (!currentCloudUser || !firebaseDatabase) return;

  const deviceId = elements.claimDeviceId.value.trim().toUpperCase();
  const activationCode = elements.claimActivationCode.value.trim().toUpperCase();
  const displayName = elements.claimDeviceName.value.trim();
  if (!isValidDeviceId(deviceId) || !isValidActivationCode(activationCode)) {
    elements.claimDeviceStatus.textContent = translateText("Preveri obliko ID-ja in osemmestne aktivacijske kode.");
    return;
  }

  const { database, ref, remove, set } = firebaseDatabase;
  const claimPath = `device_claims/${deviceId}/${currentCloudUser.uid}`;
  elements.claimDeviceStatus.textContent = translateText("Preverjam aktivacijsko kodo …");
  try {
    await set(ref(database, claimPath), {
      activation_code: activationCode,
      requested_at: Date.now(),
    });
    await set(ref(database, `devices/${deviceId}/owner_uid`), currentCloudUser.uid);
    if (currentCloudUser.email) {
      await set(ref(database, `devices/${deviceId}/owner_email`), currentCloudUser.email);
    }
    await set(ref(database, `users/${currentCloudUser.uid}/devices/${deviceId}`), {
      display_name: displayName || deviceId,
      claimed_at: Date.now(),
    });
    await remove(ref(database, claimPath));
    elements.claimDeviceForm.reset();
    elements.claimDeviceStatus.textContent = translateText("Panj je uspešno registriran na tvoj račun.");
  } catch (error) {
    console.error(error);
    try {
      await remove(ref(database, claimPath));
    } catch {}
    elements.claimDeviceStatus.textContent = translateText("Registracija ni uspela. Preveri ID, kodo in ali je naprava že povezana v Firebase.");
  }
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function generateShareInvitationCode() {
  const randomValues = new Uint8Array(8);
  crypto.getRandomValues(randomValues);
  return [...randomValues].map((value) => SHARE_INVITATION_ALPHABET[value % SHARE_INVITATION_ALPHABET.length]).join("");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = text;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";
  document.body.append(temporaryInput);
  temporaryInput.select();
  const copied = document.execCommand("copy");
  temporaryInput.remove();
  if (!copied) throw new Error("Kopiranje ni uspelo");
}

async function createShareInvitation(event) {
  event.preventDefault();
  if (!currentCloudUser || !firebaseDatabase) return;

  const deviceId = elements.cloudDeviceSelect.value;
  const device = cloudDevices[deviceId];
  const recipientEmail = normalizeEmail(elements.shareRecipientEmail.value);
  const ownerEmail = normalizeEmail(currentCloudUser.email);
  if (!deviceId || device?.access_role !== "owner") {
    elements.shareDeviceStatus.textContent = translateText("Izberi svoj panj, ki ga želiš deliti.");
    return;
  }
  if (!recipientEmail || recipientEmail === ownerEmail) {
    elements.shareDeviceStatus.textContent = recipientEmail
      ? translateText("Povabila ne moreš poslati svojemu računu.")
      : translateText("Vnesi veljaven e-poštni naslov prejemnika.");
    return;
  }

  elements.createShareInvitation.disabled = true;
  elements.shareDeviceStatus.textContent = translateText("Ustvarjam varno povabilo …");
  elements.shareInvitationResult.hidden = true;
  const { database, ref, set } = firebaseDatabase;
  const createdAt = Date.now();
  const invitation = {
    device_id: deviceId,
    owner_uid: currentCloudUser.uid,
    recipient_email: recipientEmail,
    display_name: device.display_name || deviceId,
    role: "viewer",
    created_at: createdAt,
    expires_at: createdAt + SHARE_INVITATION_VALIDITY_MS,
  };

  try {
    let invitationCode = "";
    for (let attempt = 0; attempt < 5 && !invitationCode; attempt += 1) {
      const candidateCode = generateShareInvitationCode();
      try {
        await set(ref(database, `share_invites/${candidateCode}`), invitation);
        invitationCode = candidateCode;
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
    activeShareInvitationCode = invitationCode;
    elements.shareInvitationCode.textContent = invitationCode;
    elements.shareInvitationDetail.textContent = formatTranslatedText("Za {email}; velja do {time}.", { email: recipientEmail, time: formatDashboardDateTime(new Date(invitation.expires_at)) });
    elements.shareInvitationResult.hidden = false;
    elements.shareDeviceStatus.textContent = translateText("Povabilo je pripravljeno. Prejemniku pošlji prikazano kodo.");
  } catch (error) {
    console.error(error);
    elements.shareDeviceStatus.textContent = translateText("Povabila ni bilo mogoče ustvariti. Preveri povezavo in Firebase pravila.");
  } finally {
    elements.createShareInvitation.disabled = false;
  }
}

async function copyShareInvitationCode() {
  if (!activeShareInvitationCode) return;
  try {
    await copyText(activeShareInvitationCode);
    elements.shareDeviceStatus.textContent = translateText("Koda povabila je kopirana.");
  } catch (error) {
    console.error(error);
    elements.shareDeviceStatus.textContent = translateText("Kopiranje ni uspelo. Kodo označi in kopiraj ročno.");
  }
}

async function acceptShareInvitation(event) {
  event.preventDefault();
  if (!currentCloudUser || !firebaseDatabase) return;

  const invitationCode = elements.acceptShareCode.value.trim().toUpperCase();
  const recipientEmail = normalizeEmail(currentCloudUser.email);
  if (!isValidShareInvitationCode(invitationCode) || !recipientEmail) {
    elements.acceptShareStatus.textContent = translateText("Preveri osemmestno kodo povabila in e-poštni naslov računa.");
    return;
  }

  const submitButton = elements.acceptShareForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  elements.acceptShareStatus.textContent = translateText("Preverjam povabilo …");
  const { database, get, ref, update } = firebaseDatabase;
  try {
    const invitationSnapshot = await get(ref(database, `share_invites/${invitationCode}`));
    const invitation = invitationSnapshot.val();
    const deviceId = String(invitation?.device_id ?? "");
    const createdAt = Number(invitation?.created_at);
    const expiresAt = Number(invitation?.expires_at);
    const effectiveExpiration = Math.min(expiresAt, createdAt + SHARE_INVITATION_VALIDITY_MS);
    if (
      !invitation
      || !isValidDeviceId(deviceId)
      || normalizeEmail(invitation.recipient_email) !== recipientEmail
      || !Number.isFinite(createdAt)
      || !Number.isFinite(expiresAt)
      || effectiveExpiration < Date.now()
    ) {
      throw new Error("Povabilo ni veljavno");
    }

    const sharedAt = Date.now();
    const accessRecord = {
      role: "viewer",
      email: recipientEmail,
      owner_uid: invitation.owner_uid,
      shared_at: sharedAt,
      invite_code: invitationCode,
    };
    await update(ref(database), {
      [`device_access/${deviceId}/${currentCloudUser.uid}`]: accessRecord,
      [`users/${currentCloudUser.uid}/shared_devices/${deviceId}`]: {
        ...accessRecord,
        display_name: invitation.display_name || deviceId,
      },
      [`share_invites/${invitationCode}`]: null,
    });
    elements.acceptShareForm.reset();
    elements.acceptShareStatus.textContent = formatTranslatedText("Deljeni panj »{name}« je dodan v izbirnik.", { name: invitation.display_name || deviceId });
  } catch (error) {
    console.error(error);
    elements.acceptShareStatus.textContent = translateText("Povabilo ni veljavno, je poteklo ali je namenjeno drugemu e-poštnemu naslovu.");
  } finally {
    submitButton.disabled = false;
  }
}

function renderSharedViewerList(deviceId, accessRecords) {
  elements.sharedViewerList.replaceChildren();
  const viewers = Object.entries(accessRecords ?? {}).filter(([, access]) => access?.role === "viewer");
  if (!viewers.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted";
    emptyState.textContent = translateText("Panj še ni deljen z nobenim uporabnikom.");
    elements.sharedViewerList.append(emptyState);
    return;
  }

  viewers.sort(([, left], [, right]) => String(left.email).localeCompare(String(right.email))).forEach(([viewerUid, access]) => {
    const row = document.createElement("div");
    row.className = "shared-viewer-row";
    const identity = document.createElement("div");
    const email = document.createElement("strong");
    email.textContent = access.email || translateText("Uporabnik brez e-poštnega naslova");
    const role = document.createElement("small");
    role.textContent = translateText("Samo ogled");
    identity.append(email, role);
    const revokeButton = document.createElement("button");
    revokeButton.type = "button";
    revokeButton.className = "secondary-button danger-button";
    revokeButton.textContent = translateText("Prekliči dostop");
    revokeButton.addEventListener("click", () => revokeSharedViewer(deviceId, viewerUid, access.email, revokeButton));
    row.append(identity, revokeButton);
    elements.sharedViewerList.append(row);
  });
}

async function revokeSharedViewer(deviceId, viewerUid, viewerEmail, button) {
  if (!currentCloudUser || !firebaseDatabase || getCloudDeviceAccessRole(deviceId) !== "owner") return;
  if (!await confirmDashboardAction({
    title: "Prekliči deljeni dostop",
    message: formatTranslatedText("Prekličem dostop samo za ogled uporabniku {user}?", { user: viewerEmail || viewerUid }),
    confirmLabel: "Prekliči dostop",
    danger: true,
  })) return;

  button.disabled = true;
  elements.shareDeviceStatus.textContent = translateText("Preklicujem deljeni dostop …");
  try {
    const { database, ref, update } = firebaseDatabase;
    await update(ref(database), {
      [`device_access/${deviceId}/${viewerUid}`]: null,
      [`users/${viewerUid}/shared_devices/${deviceId}`]: null,
      [`users/${viewerUid}/weather_preferences/${deviceId}`]: null,
    });
    elements.shareDeviceStatus.textContent = translateText("Dostop uporabnika je preklican.");
  } catch (error) {
    console.error(error);
    button.disabled = false;
    elements.shareDeviceStatus.textContent = translateText("Dostopa ni bilo mogoče preklicati.");
  }
}

async function appendSharedViewerRemovalUpdates(deviceId, updates) {
  const { database, get, ref } = firebaseDatabase;
  const accessSnapshot = await get(ref(database, `device_access/${deviceId}`));
  Object.keys(accessSnapshot.val() ?? {}).forEach((viewerUid) => {
    updates[`device_access/${deviceId}/${viewerUid}`] = null;
    updates[`users/${viewerUid}/shared_devices/${deviceId}`] = null;
    updates[`users/${viewerUid}/weather_preferences/${deviceId}`] = null;
  });
}

async function appendDeviceShareInvitationRemovalUpdates(deviceId, updates) {
  const { database, get, ref } = firebaseDatabase;
  const invitationsSnapshot = await get(ref(database, "share_invites"));
  Object.entries(invitationsSnapshot.val() ?? {}).forEach(([invitationCode, invitation]) => {
    if (invitation?.device_id === deviceId) {
      updates[`share_invites/${invitationCode}`] = null;
    }
  });
}

async function unclaimDevice() {
  if (!currentCloudUser || !firebaseDatabase) return;

  const deviceId = elements.cloudDeviceSelect.value;
  if (!deviceId || !cloudDevices[deviceId]) return;

  if (getCloudDeviceAccessRole(deviceId) === "viewer") {
    await removeSharedDeviceAccess(deviceId);
    return;
  }

  const displayName = cloudDevices[deviceId].display_name || deviceId;
  const isConfirmed = await confirmDashboardAction({
    title: "Odregistriraj panj",
    message: formatTranslatedText("Ali želiš panj »{name}« odregistrirati? Meritve in zgodovina ostanejo v bazi, vsi deljeni dostopi pa bodo preklicani. Za ponoven dostop bo panj treba registrirati z aktivacijsko kodo.", { name: displayName }),
    confirmLabel: "Odregistriraj",
    danger: true,
  });
  if (!isConfirmed) return;

  const { database, ref, update } = firebaseDatabase;
  elements.unclaimDevice.disabled = true;
  elements.unclaimDeviceStatus.textContent = translateText("Odregistriram panj …");

  try {
    const updates = {
      [`users/${currentCloudUser.uid}/devices/${deviceId}`]: null,
      [`devices/${deviceId}/owner_email`]: null,
      [`devices/${deviceId}/owner_uid`]: null,
    };
    await appendSharedViewerRemovalUpdates(deviceId, updates);
    await update(ref(database), updates);

    localStorage.removeItem(CLOUD_DEVICE_STORAGE_KEY);
    elements.unclaimDeviceStatus.textContent = translateText("Panj je odregistriran in vsi deljeni dostopi so preklicani. Merilni podatki ostanejo shranjeni.");
  } catch (error) {
    console.error(error);
    elements.unclaimDeviceStatus.textContent = translateText("Odregistracija ni uspela. Panj ostaja povezan s tvojim računom.");
    elements.unclaimDevice.disabled = false;
  }
}

async function removeSharedDeviceAccess(deviceId) {
  if (!currentCloudUser || !firebaseDatabase || getCloudDeviceAccessRole(deviceId) !== "viewer") return;

  const displayName = cloudDevices[deviceId]?.display_name || deviceId;
  const isConfirmed = await confirmDashboardAction({
    title: "Odstrani deljeni panj",
    message: formatTranslatedText("Ali želiš deljeni panj »{name}« odstraniti iz svojega računa? Lastnik panja, meritve in zgodovina ostanejo nespremenjeni. Za ponoven dostop boš potreboval novo povabilo lastnika.", { name: displayName }),
    confirmLabel: "Odstrani",
    danger: true,
  });
  if (!isConfirmed) return;

  const { database, ref, update } = firebaseDatabase;
  elements.unclaimDevice.disabled = true;
  elements.unclaimDeviceStatus.textContent = translateText("Odstranjujem deljeni panj …");

  try {
    await update(ref(database), {
      [`device_access/${deviceId}/${currentCloudUser.uid}`]: null,
      [`users/${currentCloudUser.uid}/shared_devices/${deviceId}`]: null,
      [`users/${currentCloudUser.uid}/weather_preferences/${deviceId}`]: null,
    });

    if (localStorage.getItem(CLOUD_DEVICE_STORAGE_KEY) === deviceId) {
      localStorage.removeItem(CLOUD_DEVICE_STORAGE_KEY);
    }
    elements.unclaimDeviceStatus.textContent = translateText("Deljeni panj je odstranjen iz tvojega računa.");
  } catch (error) {
    console.error(error);
    elements.unclaimDeviceStatus.textContent = translateText("Deljenega panja ni bilo mogoče odstraniti. Dostop ostaja aktiven.");
    elements.unclaimDevice.disabled = false;
  }
}

function confirmAdministratorUnclaim(deviceId, ownerEmail) {
  const ownerDescription = ownerEmail
    ? formatTranslatedText("uporabnika {email}", { email: ownerEmail })
    : translateText("trenutnega uporabnika");
  return confirmDashboardAction({
    title: "Odjavi lastnika",
    message: formatTranslatedText("Ali želiš panj {deviceId} odjaviti od {owner}? Meritve, SD sinhronizacija in aktivacijska koda ostanejo shranjeni, vsi deljeni dostopi pa bodo preklicani. Panj bo nato mogoče registrirati na drug račun.", { deviceId, owner: ownerDescription }),
    confirmLabel: "Odjavi lastnika",
    requiredText: "ODJAVI",
    danger: true,
  });
}

function confirmAdministratorDeviceDeletion(deviceId) {
  return confirmDashboardAction({
    title: "Trajno izbriši napravo",
    message: formatTranslatedText("Ali želiš napravo {deviceId} trajno izbrisati iz Firebase? Izbrisani bodo lastništvo, meritve, agregati, stanje naprave, ukazi, aktivacijska koda, zahtevki in deljeni dostopi. Tega ni mogoče razveljaviti. Če je naprava še povezana, lahko z istim firmwareom začne znova pošiljati nove podatke.", { deviceId }),
    confirmLabel: "Trajno izbriši",
    requiredText: "IZBRIŠI",
    danger: true,
  });
}

async function unclaimDeviceAsAdministrator(deviceId, button, statusElement) {
  if (!isCloudAdministrator() || !firebaseDatabase) return;

  const device = cloudDevices[deviceId];
  const ownerUid = String(device?.owner_uid || "");
  if (!ownerUid) {
    statusElement.textContent = translateText("Panj nima registriranega lastnika.");
    return;
  }
  if (!await confirmAdministratorUnclaim(deviceId, device.owner_email)) return;

  button.disabled = true;
  statusElement.textContent = translateText("Odjavljam lastnika …");
  try {
    const { database, ref, update } = firebaseDatabase;
    // Več lokacij posodobimo z enim atomarnim zapisom, da panj ne ostane delno odjavljen.
    const updates = {
      [`devices/${deviceId}/owner_uid`]: null,
      [`devices/${deviceId}/owner_email`]: null,
      [`users/${ownerUid}/devices/${deviceId}`]: null,
    };
    await appendSharedViewerRemovalUpdates(deviceId, updates);
    await update(ref(database), updates);
    statusElement.textContent = translateText("Lastnik in vsi deljeni dostopi so odjavljeni. Merilni podatki ostanejo shranjeni.");
  } catch (error) {
    console.error(error);
    statusElement.textContent = translateText("Odjava lastnika ni uspela. Panj ostaja povezan z računom.");
    button.disabled = false;
  }
}

async function deleteDeviceAsAdministrator(deviceId, actionButtons, statusElement) {
  if (!isCloudAdministrator() || !firebaseDatabase) return;
  if (!await confirmAdministratorDeviceDeletion(deviceId)) return;

  const device = cloudDevices[deviceId] ?? {};
  actionButtons.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  statusElement.textContent = translateText("Brišem napravo in njene Firebase zapise …");

  try {
    const { database, ref, update } = firebaseDatabase;
    const updates = {
      [`devices/${deviceId}`]: null,
      [`device_secrets/${deviceId}`]: null,
      [`device_claims/${deviceId}`]: null,
    };
    const ownerUid = String(device.owner_uid ?? "");
    if (ownerUid) {
      updates[`users/${ownerUid}/devices/${deviceId}`] = null;
    }
    await appendSharedViewerRemovalUpdates(deviceId, updates);
    await appendDeviceShareInvitationRemovalUpdates(deviceId, updates);
    await update(ref(database), updates);

    clearCloudHistorySessionCacheForDevice(`devices/${deviceId}`);
    ownerEmailSyncedDeviceIds.delete(deviceId);
    if (localStorage.getItem(CLOUD_DEVICE_STORAGE_KEY) === deviceId) {
      localStorage.removeItem(CLOUD_DEVICE_STORAGE_KEY);
    }
    statusElement.textContent = translateText("Naprava in vsi njeni Firebase zapisi so izbrisani.");
    // Seznam se ne posluša na korenu /devices; po administrativnem izbrisu ga enkrat poceni osveži shallow REST zahteva.
    await refreshAdminDeviceDirectory();
  } catch (error) {
    console.error(error);
    statusElement.textContent = translateText("Izbris naprave ni uspel. Firebase zapisi ostanejo nespremenjeni.");
    actionButtons.querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });
  }
}

function handleCloudAuthState(user) {
  clearCloudDeviceListeners();
  stopCloudDirectoryListeners();
  cloudDevices = {};
  ownedCloudDevices = {};
  sharedCloudDevices = {};
  ownedCloudDevicesLoaded = false;
  sharedCloudDevicesLoaded = false;
  ownerEmailSyncedDeviceIds.clear();
  currentCloudUser = user;

  if (!user) {
    stopCloudInactivityTracking();
    localStorage.removeItem(CLOUD_INACTIVITY_STORAGE_KEY);
    cloudInactivityLastActivityAt = 0;
    document.body.dataset.authState = "signed-out";
    cloudDevicePath = "";
    elements.accountSection.hidden = true;
    elements.accountAvatarImage.removeAttribute("src");
    elements.authTrigger.hidden = false;
    renderHeaderAuthIdentity(undefined);
    resetCloudDashboard();
    setConnectionState("Prijava je potrebna", "error");
    window.requestAnimationFrame(openAuthDialog);
    return;
  }

  document.body.dataset.authState = "signed-in";
  elements.accountSection.hidden = false;
  elements.authTrigger.hidden = false;
  renderHeaderAuthIdentity(user);
  renderAccountIdentity(user);
  configureCloudAccountView();
  showView(DEFAULT_VIEW);
  renderHeaderDeviceState();
  startCloudInactivityTracking();
  if (isCloudAdministrator()) {
    void refreshAdminDeviceDirectory();
    return;
  }

  startCloudUserDirectoryListeners(user);
}

function initializeAuthControls() {
  if (authControlsInitialized) return;
  authControlsInitialized = true;
  elements.authTrigger.addEventListener("click", () => {
    if (currentCloudUser) signOutCurrentUser();
    else openAuthDialog();
  });
  elements.authForm.addEventListener("submit", signInWithEmail);
  elements.authRegister.addEventListener("click", registerEmailAccount);
  elements.authGoogle.addEventListener("click", signInWithGoogle);
  elements.authClose.addEventListener("click", () => elements.authDialog.close());
  elements.authSignout.addEventListener("click", signOutCurrentUser);
  elements.cloudDeviceSelect.addEventListener("change", () => selectCloudDevice(elements.cloudDeviceSelect.value));
  elements.claimDeviceForm.addEventListener("submit", claimDevice);
  elements.shareDeviceForm.addEventListener("submit", createShareInvitation);
  elements.copyShareInvitation.addEventListener("click", copyShareInvitationCode);
  elements.acceptShareForm.addEventListener("submit", acceptShareInvitation);
  elements.unclaimDevice.addEventListener("click", unclaimDevice);
  elements.deleteDeviceHistory.addEventListener("click", deleteDeviceHistory);
  elements.clearCloudWifiCredentials.addEventListener("click", clearCloudWifiCredentials);
}

async function useLocalDataSource() {
  const response = await fetch("/api/status", { cache: "no-store" });
  if (!response.ok) throw new Error("Lokalni API ni dosegljiv");
  const initialStatus = await response.json();
  isLocalDashboard = true;
  applyBrandAssets(true);
  document.body.dataset.dashboardMode = "local";
  delete document.body.dataset.authState;
  elements.updatesHeading.textContent = translateText("Ročna posodobitev naprave");
  elements.updatesSubtitle.textContent = translateText("Brez interneta namesti programsko opremo ali lokalni spletni vmesnik.");
  elements.otaSection.hidden = true;
  elements.localManualUpdateSection.hidden = false;
  elements.localElegantOtaLink.href = "/update";
  elements.updatesNavigationItem.hidden = false;
  document.querySelectorAll("[data-local-only]").forEach((element) => { element.hidden = false; });
  elements.cloudSyncControls.hidden = false;
  setCloudDeviceManagementVisibility(false);
  elements.authTrigger.hidden = true;
  elements.accountSection.hidden = true;

  function renderLocalStatus(status) {
    latestMeasurementSettings = normalizeMeasurementSettings(status.measurement_settings);
    renderLatestMeasurement(status.latest);
    renderDeviceStatus(status.device, true);
    renderProvisioning(status.network);
    renderTimeStatus(status.time, status.network);
    renderCloudSynchronization(status.sync, status.network, status.sd_card);
    renderLocalMeasurementLogStatus(status.local_history, status.sd_card, status.sync);
    renderSDStatus(status.sd_card);
    renderFirmwareVersion(status.firmware);
    renderLoadCellTareStatus(status.sensors?.load_cell);
    renderBme680CalibrationStatus(status.sensors?.bme680);
    setConnectionState("Lokalna povezava");
  }

  async function refreshStatus() {
    const statusResponse = await fetch("/api/status", { cache: "no-store" });
    if (!statusResponse.ok) throw new Error("Lokalno stanje ni dosegljivo");
    renderLocalStatus(await statusResponse.json());
  }

  refreshHistory = async () => {
    const from = Math.floor(appliedRange.from.getTime() / 1000);
    const to = Math.floor(appliedRange.to.getTime() / 1000);
    const requestGeneration = ++localHistoryRequestGeneration;
    try {
      const readings = await fetchLocalHistoryWindow({ from, to }, () => {
        if (requestGeneration === localHistoryRequestGeneration) {
          elements.historySummary.textContent = translateText("Pripravljam lokalno zgodovino s SD kartice …");
        }
      });
      if (requestGeneration !== localHistoryRequestGeneration) return;
      renderHistory(readings, true);
    } catch (error) {
      if (requestGeneration !== localHistoryRequestGeneration) return;
      console.error(error);
      renderHistory([], true);
      elements.historySummary.textContent = translateText(error?.status === 503
        ? "SD kartica trenutno ni dosegljiva; lokalno stanje naprave ostaja na voljo."
        : error?.message === "Priprava lokalne zgodovine je trajala predolgo."
          ? "Priprava lokalne zgodovine je trajala predolgo."
          : "Lokalne zgodovine ni bilo mogoče prebrati; povezava z napravo ostaja aktivna.");
    }
  };

  renderLocalStatus(initialStatus);
  void refreshWeightChangeOverview();
  setInterval(() => refreshStatus().catch(showDataError), 5_000);
}

async function useFirebaseDataSource() {
  isLocalDashboard = false;
  applyBrandAssets(false);
  document.body.dataset.dashboardMode = "cloud";
  document.body.dataset.authState = "loading";
  elements.updatesHeading.textContent = translateText("Posodobitev naprave");
  elements.updatesSubtitle.textContent = translateText("Varna namestitev nove različice na izbrano napravo.");
  elements.updatesNavigationItem.hidden = false;
  elements.localManualUpdateSection.hidden = true;
  document.querySelectorAll("[data-local-only]").forEach((element) => { element.hidden = true; });
  setCloudDeviceManagementVisibility(false);
  const [{ initializeApp }, authModule, databaseModule, configModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js"),
    import("./firebase-config.js"),
  ]);
  const {
    endAt,
    get,
    getDatabase,
    onChildAdded,
    onChildChanged,
    onChildRemoved,
    onValue,
    orderByKey,
    query,
    ref,
    remove,
    set,
    startAt,
    update,
  } = databaseModule;
  const firebaseApp = initializeApp(configModule.firebaseConfig);
  const database = getDatabase(firebaseApp);
  firebaseAuth = authModule.getAuth(firebaseApp);
  firebaseAuthModule = authModule;
  firebaseDatabaseUrl = String(configModule.firebaseConfig.databaseURL || "");
  firebaseDatabase = { database, endAt, get, onValue, orderByKey, query, ref, remove, set, startAt, update };
  elements.otaSection.hidden = true;
  elements.provisioningSection.hidden = true;
  initializeAuthControls();

  refreshHistory = async () => {
    if (cloudRealtimePaused) return;
    clearCloudHistoryListeners();
    const requestGeneration = cloudHistoryRequestGeneration;
    if (!cloudDevicePath) {
      renderHistory([]);
      return;
    }
    const from = Math.floor(appliedRange.from.getTime() / 1000);
    const to = Math.floor(appliedRange.to.getTime() / 1000);
    const source = getCloudHistorySource(from, to);
    const queryFrom = source.periodSeconds > 0 ? Math.floor(from / source.periodSeconds) * source.periodSeconds : from;
    const isLiveQuery = hasLiveHistoryRange() && !climateChartHasUserZoom && !weightChartHasUserZoom;
    const historyReference = ref(database, `${cloudDevicePath}/${source.path}`);
    const cacheEntry = getCloudHistorySessionCacheEntry(cloudDevicePath, source.path);
    const realtimeUpdatedKeys = new Set();
    const isCurrentRequest = () => requestGeneration === cloudHistoryRequestGeneration;
    const getReadingFromSnapshot = (snapshot) => {
      const value = snapshot.val();
      if (!value || typeof value !== "object") return undefined;
      return {
        ...value,
        timestamp: Number(value.timestamp ?? snapshot.key),
      };
    };
    const saveReading = (snapshot) => {
      const reading = getReadingFromSnapshot(snapshot);
      if (!reading) return;
      cacheEntry.readingsByKey.set(snapshot.key, reading);
      cloudHistoryReadingsByKey.set(snapshot.key, reading);
    };
    const upsertReading = (snapshot) => {
      if (!isCurrentRequest()) return;
      realtimeUpdatedKeys.add(snapshot.key);
      saveReading(snapshot);
      scheduleCloudHistoryRender();
    };
    const removeReading = (snapshot) => {
      if (!isCurrentRequest()) return;
      realtimeUpdatedKeys.add(snapshot.key);
      cacheEntry.readingsByKey.delete(snapshot.key);
      cloudHistoryReadingsByKey.delete(snapshot.key);
      scheduleCloudHistoryRender();
    };

    // Prejšnji graf se vedno počisti takoj. Tako prazna Firebase poizvedba ne more
    // pustiti narisanih podatkov iz starega, že izbranega obdobja.
    renderHistory([]);
    restoreCloudHistoryReadingsFromSessionCache(cacheEntry, queryFrom, to);
    renderCloudHistoryFromCache();

    const missingRanges = getCloudHistoryCacheCoverageGaps(cacheEntry, queryFrom, to);
    // Fiksno, v celoti predpomnjeno obdobje ne potrebuje niti nove Firebase poizvedbe.
    // Živo obdobje pa kljub temu potrebuje majhne realtime listenerje za novi rep in spremembe.
    if (!missingRanges.length && !isLiveQuery) return;

    // Začetni prenos ne uporablja onChildAdded nad celotnim intervalom: omejeni get()
    // omogoča pokritost cache-a tudi ob praznem odgovoru. Pri živem obdobju se
    // realtime nikoli ne naroči na celotno zgodovino, temveč samo na majhen rep.
    if (isLiveQuery) {
      const liveTailFrom = getCloudHistoryRealtimeTailStart(source, queryFrom, to);
      const liveTailQuery = query(historyReference, orderByKey(), startAt(String(liveTailFrom)));
      stopHistoryListeners = [
        onChildAdded(liveTailQuery, upsertReading, showDataError),
        onChildChanged(liveTailQuery, upsertReading, showDataError),
        onChildRemoved(liveTailQuery, removeReading, showDataError),
      ];
    }

    if (!missingRanges.length) return;

    await Promise.all(missingRanges.map(async (missingRange) => {
      const missingQuery = query(
        historyReference,
        orderByKey(),
        startAt(String(missingRange.from)),
        endAt(String(missingRange.to)),
      );
      const snapshot = await get(missingQuery);
      if (!isCurrentRequest()) return;
      snapshot.forEach((childSnapshot) => {
        // Realtime dogodek je lahko prišel med začetnim branjem. Ne prepisi ga s
        // starejšim posnetkom get(), ampak ohrani že prejeto novejšo vrednost.
        if (!realtimeUpdatedKeys.has(childSnapshot.key)) saveReading(childSnapshot);
      });
      addCloudHistoryCacheCoverage(cacheEntry, missingRange.from, missingRange.to);
    }));

    if (isCurrentRequest()) renderCloudHistoryFromCache();
  };

  authModule.onAuthStateChanged(firebaseAuth, handleCloudAuthState);
}

async function startDashboard() {
  initializeTheme();
  initializeLanguage();
  initializeNavigation();
  initializeDateRangePicker();
  initializeConfirmationDialog();
  initializeWeatherSettings();
  initializeOtaControls();
  initializeProvisioningForm();
  setInterval(() => {
    if (!latestDeviceStatus) return;
    if (isSharedCloudDeviceSelected()) renderHeaderDeviceState();
    else renderDeviceStatus(latestDeviceStatus);
  }, 15_000);
  setInterval(() => {
    void refreshWeatherForecast();
  }, WEATHER_REFRESH_INTERVAL_MS);
  setInterval(refreshLiveHistoryRange, LIVE_HISTORY_REFRESH_INTERVAL_MS);

  if (isAndroidAppDashboard) {
    await useFirebaseDataSource();
  } else {
    try {
      await useLocalDataSource();
    } catch {
      await useFirebaseDataSource();
    }
  }
  dashboardDataSourceReady = true;
  scheduleWeightChangeOverviewRefresh();
  void refreshOverviewAnalytics();
  refreshVisibleHistory();
}

window.addEventListener("DOMContentLoaded", startDashboard);
