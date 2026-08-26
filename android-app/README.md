# Pametni čebelnjak za Android

Android aplikacija združuje začetno nastavitev naprave in dostop do spletne nadzorne plošče.

## Funkcije

- poišče provisioning dostopno točko `Cebelnjak-XXXXXX` prek sistemskega Android izbirnika,
- vzpostavi začasno povezavo z napravo brez preusmeritve celotnega telefona na omrežje brez interneta,
- prek lokalnega API-ja naprave poišče domača Wi-Fi omrežja,
- napravi varno pošlje izbrani SSID in geslo,
- prikaže rezultat povezovanja, novi lokalni IP ter ID naprave,
- v istem aplikacijskem WebView odpre ob gradnji vključeno kopijo cloud nadzorne plošče, ki se poveže z istim Firebase projektom kot `https://pametnicebelnjak.web.app/`,
- Google prijavo izvede z nativnim Android izbirnikom računa in rezultat varno preda Firebase spletni aplikaciji brez odpiranja zunanjega brskalnika.

Začetni hamburger meni pod glavnima ukazoma prikaže manjši gumb trenutno izbrane teme z SVG ikono in brez puščice; dotik odpre lebdeči prevedeni izbor štirih tem, ne da bi povečal glavni meni. Vsebuje tudi stran **O aplikaciji** (različica, avtor, e-poštni naslov in avtorske pravice) ter ukaz za izhod iz Android aplikacije.

Wi-Fi geslo se ne shranjuje v aplikaciji. Posreduje se neposredno napravi prek njene začasne lokalne povezave.

## Zagonski zaslon

Android najprej prikaže najkrajši možni sistemski splash: enotno temno ozadje brez vidne ikone, zato med ustvarjanjem WebViewa ni praznega, belega ali neujemajočega se okvirja. Takoj za njim aplikacijski HTML prikaže približno 1,75 sekunde dolgo lokalno animacijo znaka: čebela se pojavi, krili znotraj heksagona nežno zamahneta, zlata točka utripne in zaporedno se izrišeta dva razmaknjena signalna loka. Vse PNG plasti so vključene v APK in ne potrebujejo omrežja. Pri vključeni sistemski nastavitvi zmanjšanega gibanja se animacija preskoči in znak le na kratko prikaže.

## Zahteve

- Android 10 oziroma API 29 ali novejši,
- Android SDK,
- Node.js in npm,
- JDK 21.

## Firebase Google prijava

Nativna Google prijava potrebuje Android aplikacijo v istem Firebase projektu:

1. v Firebase Console pod **Project settings > Your apps** dodaj Android aplikacijo s paketom `si.pametnicebelnjak.app`;
2. aplikaciji dodaj SHA-1 in SHA-256 prstni odtis debug oziroma produkcijskega podpisnega ključa;
3. prenesi `google-services.json` in ga shrani kot `android-app/android/app/google-services.json`;
4. v **Authentication > Sign-in method** omogoči ponudnika Google;
5. ponovno izvedi `npm run sync` in namesti novo različico aplikacije.

Datoteka `google-services.json` je lokalna projektna konfiguracija in je namenoma izključena iz Git repozitorija. Brez nje Google prijava v nameščeni aplikaciji ne more delovati, e-poštna prijava in običajna spletna različica pa ostaneta nespremenjeni.

## Priprava projekta

```powershell
cd android-app
npm install
npm run sync
```

Ukaz `npm run sync` pred Android gradnjo skopira trenutno vsebino mape `web/` v aplikacijski `dashboard/`. Sprememba Firebase Hosting strani zato ne posodobi že nameščenega APK-ja; za spremembe uporabniškega vmesnika v aplikaciji je treba izdelati in namestiti nov APK.

Za odpiranje projekta v Android Studiu:

```powershell
npm run open
```

## Gradnja testnega APK-ja

```powershell
cd android-app\android
$env:JAVA_HOME='C:\Users\rober\.jdks\temurin-21'
.\gradlew.bat assembleDebug
```

APK nastane v:

```text
android-app/android/app/build/outputs/apk/debug/app-debug.apk
```

Namestitev prek ADB:

```powershell
adb install -r android-app\android\app\build\outputs\apk\debug\app-debug.apk
```

Debug APK je namenjen testiranju. Za objavo v Google Play je treba pripraviti produkcijski podpis, `release` gradnjo, politiko zasebnosti in končno ime paketa.

## Ikona

Izvorna ikona je `web/assets/favicon.png`. Kopija v `android-app/assets/icon.png` se uporablja za izdelavo Android ikon in zagonskih slik.

Ob spremembi ikone jo ponovno ustvari z:

```powershell
cd android-app
npx capacitor-assets generate --android
```

## Struktura

- `src/main.js` – uporabniški tok in povezava z nativnim vtičnikom,
- `src/styles.css` – odzivni uporabniški vmesnik,
- `public/assets/splash-*.png` – lokalne plasti animiranega aplikacijskega zagonskega znaka,
- `android/app/src/main/java/si/pametnicebelnjak/app/ProvisioningWifiPlugin.java` – Android Wi-Fi povezava in lokalni HTTP klici,
- `android/app/src/main/res/xml/network_security_config.xml` – dovoljen lokalni HTTP samo do `192.168.4.1`,
- `@capacitor-firebase/authentication` – nativna Google prijava brez prehoda v zunanji brskalnik,
- `capacitor.config.json` – Capacitor konfiguracija aplikacije.
