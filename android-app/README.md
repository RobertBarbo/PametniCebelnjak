# Pametni čebelnjak za Android

Android aplikacija združuje začetno nastavitev naprave in dostop do spletne nadzorne plošče.

## Funkcije

- poišče provisioning dostopno točko `Cebelnjak-XXXXXX` prek sistemskega Android izbirnika,
- vzpostavi začasno povezavo z napravo brez preusmeritve celotnega telefona na omrežje brez interneta,
- prek lokalnega API-ja naprave poišče domača Wi-Fi omrežja,
- napravi varno pošlje izbrani SSID in geslo,
- prikaže rezultat povezovanja, novi lokalni IP ter ID naprave,
- odpre spletno nadzorno ploščo `https://pametnicebelnjak.web.app/` v istem aplikacijskem WebView,
- Google prijavo izvede z nativnim Android izbirnikom računa in rezultat varno preda Firebase spletni aplikaciji brez odpiranja zunanjega brskalnika.

Wi-Fi geslo se ne shranjuje v aplikaciji. Posreduje se neposredno napravi prek njene začasne lokalne povezave.

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
- `android/app/src/main/java/si/pametnicebelnjak/app/ProvisioningWifiPlugin.java` – Android Wi-Fi povezava in lokalni HTTP klici,
- `android/app/src/main/res/xml/network_security_config.xml` – dovoljen lokalni HTTP samo do `192.168.4.1`,
- `@capacitor-firebase/authentication` – nativna Google prijava brez prehoda v zunanji brskalnik,
- `capacitor.config.json` – Capacitor konfiguracija aplikacije.
