# Android aplikacija

## Namen

Android aplikacija omogoča celoten začetni postopek brez ročnega preklapljanja med aplikacijami:

1. uporabnik v aplikaciji izbere **Nastavi novo napravo**,
2. Android prikaže sistemski izbirnik za omrežje `Cebelnjak-XXXXXX`,
3. aplikacija prek izbranega omrežja odpre lokalni API na `192.168.4.1`,
4. uporabnik poišče in izbere domače Wi-Fi omrežje,
5. aplikacija pošlje SSID in geslo napravi,
6. po uspešni povezavi prikaže novi IP, ID naprave in povezavo na spletno nadzorno ploščo,
7. prijava, registracija panja, meritve, grafi in OTA ostanejo v obstoječi Firebase spletni aplikaciji.

S tem je provisioning nativno podprt, cloud del pa ostane enoten s spletno različico in ne podvaja Firebase logike.

## Tehnična zasnova

Aplikacija uporablja Capacitor 8, Vite, nativni Android vtičnik `ProvisioningWifi` in `@capacitor-firebase/authentication` za Google prijavo.

Vtičnik uporablja `WifiNetworkSpecifier`, zato Android uporabniku vedno pokaže sistemsko potrditev povezave. Izbrano omrežje se uporablja samo za lokalne klice do ESP32 in ne preusmeri vseh povezav aplikacije na omrežje brez interneta. Po končanem provisioningu aplikacija omrežje sprosti in HTTPS spletno nadzorno ploščo naloži neposredno v glavni Capacitor WebView, zato uporabnik ostane znotraj aplikacije.

Podprti lokalni klici so:

- `GET http://192.168.4.1/api/status`,
- `GET http://192.168.4.1/api/wifi/networks`,
- `POST http://192.168.4.1/api/wifi`.

Android dovoljuje nešifriran HTTP samo za lokalni naslov `192.168.4.1`. Cloud povezava vedno uporablja HTTPS.

Vsebina WebViewa samodejno upošteva višino zgornje statusne vrstice in spodnje Android navigacije. Sistemskih elementov zato ne prekriva niti cloud nadzorna plošča niti lokalni provisioning pogled.

Google prijava v aplikaciji ne uporablja spletnega `signInWithPopup`, ker bi se OAuth stran odprla v zunanjem brskalniku in izgubila Firebase stanje iz aplikacijskega WebViewa. Android zato nativno izbere Google račun, pridobi Google ID žeton in ga v istem WebViewu zamenja za Firebase sejo prek `signInWithCredential`. Običajna cloud spletna stran v brskalniku še naprej uporablja standardno Firebase pojavno prijavo.

Gostovana cloud stran ob zaznanem nativnem okolju dinamično registrira Capacitorjev `FirebaseAuthentication` most. Če most ni na voljo, aplikacija prijavo ustavi in ne pade nazaj na spletni popup/redirect tok, ki bi v zunanjem brskalniku povzročil napako **missing initial state**.

Za delovanje mora biti paket `si.pametnicebelnjak.app` registriran v Firebase projektu, dodana morata biti SHA-1 in SHA-256 podpisnega ključa, projektna datoteka `google-services.json` pa mora biti shranjena v `android-app/android/app/`. Datoteka ni sledena v Git-u.

## Dovoljenja

- `INTERNET` za spletno nadzorno ploščo in lokalni API,
- `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE` in `CHANGE_WIFI_STATE` za upravljanje povezave,
- `NEARBY_WIFI_DEVICES` na Androidu 13 ali novejšem,
- lokacijska dovoljenja samo do Androida 12, kjer jih Android zahteva za Wi-Fi izbiro.

Aplikacija ne bere sistemsko shranjenih Wi-Fi gesel, ne shranjuje vpisanega gesla in ne vsebuje Firebase Admin poverilnic.

## Uporabniški tok

Začetni zaslon ponuja dve ločeni poti:

- **Odpri nadzorno ploščo** za že nastavljeno napravo,
- **Nastavi novo napravo** za prvi zagon ali ponovno nastavitev.

Med provisioningom aplikacija prikaže trenutni korak, napake povezave in možnost ponovitve. Gumba za ponovno iskanje omrežij in prikaz gesla uporabljata lastni SVG ikoni, zato sta poravnana in enaka na različnih telefonih. Gumb za nadzorno ploščo takoj prikaže stanje odpiranja. Po uspehu aplikacija v istem oknu odpre cloud nadzorno ploščo, Google prijava pa ostane v aplikaciji, zato so registracija z aktivacijsko kodo in lastništvo panjev nespremenjeni.

## Gradnja in distribucija

Navodila za lokalno gradnjo so v `android-app/README.md`. Trenutno je pripravljen namestljiv debug APK. Pred javno distribucijo so potrebni:

- produkcijski podpis in varno hranjen podpisni ključ,
- Android App Bundle (`.aab`),
- politika zasebnosti in Play Console opis dovoljenj,
- testiranje na več različicah Androida in različnih proizvajalcih telefonov,
- končna odločitev o zaščiti provisioning AP-ja.

## Omejitve

- Najnižja podprta različica je Android 10 zaradi zanesljive uporabe `WifiNetworkSpecifier`.
- Sistem Android vedno nadzoruje dejansko povezavo z začasnim omrežjem; aplikacija tega dialoga ne more preskočiti.
- Aplikacija pričakuje trenutno firmware API strukturo in ime AP-ja s predpono `Cebelnjak-`.
- Cloud nadzorna plošča se naloži v aplikacijskem WebView; Google prijava zahteva pravilno konfigurirane Firebase Android SHA prstne odtise za vsak uporabljeni podpisni ključ.
