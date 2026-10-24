# Süper Ayı — İngilizce Macerası

5.5 yaş için, evde açılan, reklamsız ve internetsiz 3D oyun. Köyden gökkuşağı bahçesine geçilir; ayı zıplar, çiçek ve meyve toplar, üç arkadaşını uyku balonundan çıkarır. İngilizce cümle önce gelir, Türkçe hemen ardından.

## Oyna

`oyna.bat` dosyasına çift tıkla. Tarayıcı `http://127.0.0.1:8765/` adresini açar. Pencereyi kapatmak oyunu durdurur. Sunucu `tools/serve.py` önbelleği kapatır; dosyalar güncellenince tarayıcı her zaman yenisini yükler.

### Tablette

İki yol var:

1. **Aynı Wi-Fi, bilgisayar açıkken:** `tablet.bat` dosyasına çift tıkla. Pencerede `Tablette ac: http://…:8765/` satırı çıkar; bu adresi tabletin tarayıcısında aç. Windows güvenlik duvarı sorarsa "Özel ağlar" için izin ver. Bu yolda çevrimdışı kopya ve ana ekran simgesi olmaz.
2. **İnternetsiz, ana ekrandan (PWA):** oyun bir HTTPS adresinde yayınlanır (ör. GitHub Pages ya da Netlify). Tablette bir kez internetle açılır, tarayıcı menüsünden "Ana ekrana ekle" seçilir. Aile panelinde "Çevrimdışı kopya: hazır" yazınca oyun internetsiz de açılır. Güncellemeler, yeni sürüm yayınlandıktan sonraki ikinci açılışta gelir.

Çevrimdışı kopya (`sw.js`) bu bilgisayarın kendi sunucusunda (`oyna.bat`) kapalıdır; denemek için adrese `?pwa=1` eklenir. İkonlar `tools/make_icons.py` ile üretilir.

### Akıcılık

Dünya yüklenince hiç hareket etmeyen süsler (ağaç, kaya, ev, tepe…) malzemelerine ve 32 m'lik bölgelerine göre birkaç büyük parçada birleştirilir (`js/batch.js`); bulutlar, gökyüzü süsleri, çiçek ve altınlar da kendi içlerinde birleşir. Bu, kare başına çizim sayısını yaklaşık %40 azaltır. Hareket eden, gizlenen ya da kodun sonradan okuduğu her şey (`world` nesnesinden ulaşılabilenler) olduğu gibi kalır. Yeni hareketli bir nesne eklerken onu `world` içinde bir alana koymak yeterli; aksi halde birleştirilip donabilir. Karşılaştırmak için `?nobatch`.

Oyunun ilk saniyeleri 40 kare/sn'nin altında akarsa çözünürlük ve gölge kalitesi bir kez kendiliğinden düşürülür. Dokunmatik ekranlarda çözünürlük baştan biraz sınırlıdır.

Yol gösterme: Lila'nın kelebeği hedefe doğru uçar, hedefte renkli ışık sütunu ve yerde halkalar yanar. Görev kutusu yazı yerine resim gösterir; kutuya dokununca görev yeniden söylenir. Çocuk 13 saniye ilerlemezse kamera hedefe döner ve görev tekrar söylenir.

Klavye: WASD veya oklar, boşluk zıpla, farenin sağ tarafını sürükleyince (ya da Q sola / E sağa) kamera döner, M ses, P duraklat. Dokunmatikte solda joystick, sağda zıplama, sağ yarıda sürükleyince kamera. Oklar kamerayı çevirmez; kamera yalnızca çocuk 6 saniye hiçbir şeye dokunmazsa yavaşça hedefe döner.

Yüzme (Super Bear tarzı): suda doğal olarak batarsın, zıplama tuşunu basılı tutunca yükselirsin, yüzeyde zıplayınca sudan çıkarsın; çubuğu ne kadar çok çekersen o kadar hızlı yüzer, alta çekince dalarsın. Suyun altına inince ekran maviye döner, sis kısalır ve baloncuklar çıkar — ayrı bir su dünyası gibi.

Kaydırak: oyun alanında yürüyerek çıkılan rampa var; tepedeki sarı oka ulaşınca ayı kendiliğinden kayar, zıplamak gerekmez. Ayı yumuşak hızlanır/yavaşlar (koşu hızı 4.4) ve bacak adımı gerçek hıza göre ayarlanır.

Salıncak (bölüm 3): oyun alanının yanındaki salıncak setinde kırmızı ya da mavi koltuğun altındaki halkaya yaklaşınca ayı oturur. Çubuğu ileri-geri tutunca (ya da zıplama tuşuna tekrar tekrar basınca) kendi kendini sallar; yeterince hızlanınca takla atar, her takla 1 altın ve "flip" sesi getirir. 🚀 düğmesi ayıyı salıncaktan havaya fırlatır.

Uçak (bölüm 3): oyun alanının yanındaki piste gidilir; uçak ilk iki oyuncak görevi bitince açılır. Parlayan sarı halkaya basınca ayı pilot olur, kalkış otomatik. Çubukla sağa-sola/yukarı-aşağı yönlendirilir (up/down/left/right kelimeleri söylenir), zıplama tuşu 🌀 takla attırır, 🛬 düğmesi otomatik iniş yaptırır. Gökte 1-5 numaralı beş halka sırayla geçilir (one…five), yıldızlar altın verir. İnişte uçak yeniden park yerine döner, ayı sarı biniş halkasının dışında kalır; yeniden uçmak için halkaya tekrar girilir. Kurtarılan yavrular uçarken gizlenir.

Göl: yüzme alanı büyütüldü (yarıçap 11, merkez 49,-2). Pist gölün kuzey-batısında, ağaç ve sandıklardan arındırılmış. Uçuşta direksiyon yumuşatıldı; çubuk bırakılınca uçak sıradaki halkaya hafifçe yönelir, halkalar büyüktür.

Fikirler ve sıradaki işler için `ROADMAP.md`.

Bölüm 3 görev sırası: slide (kaydırağa bin) → seç → swing (salıncağa bin) → seç → plane (uçağa bin) → 5 halka → iniş → seç. `?step=31` kaydıraktan, `?step=35` uçaktan başlar.

Bölüm 4 — Balon Festivali (sayılar, `?step=39`): ayının çevresinde balonlar uçuşur. "Pop the red balloon!" görevinde doğru renkteki balon patlatılır; yanlış renk de patlar ama "That's blue." denir ve yerine yenisi gelir. "Pop three balloons!" görevinde her patlayan balon yüksek sesle sayılır (one, two, three…), ardından "Where is three?" kartları gelir (rakam + o kadar nokta). Alçak balonlara yürüyerek, yüksektekilere zıplayarak ulaşılır. Sayılar 1–5 kelime listesine eklendi.

Bölüm 5 — Saklambaç (`?step=52`): tavşan, kuş, tilki ve tavuk sırayla yuvarlak bir çalının içine saklanır ve arada başını çıkarıp bakar (ayı yaklaştıkça daha sık). "Where is the fox?" Aramak oyunun kendisi olduğu için kelebek ilk 9 saniye yol göstermez. Ayı çalıya varınca hayvan zıplayarak çıkar ("Peekaboo! I see you!"), sonra kartlar gelir. Balonlar ve çalılar her seferinde ayının çevresindeki boş yerlere (su, ev, ağaç, yol ve oyuncaklardan uzağa) yerleştirilir (`js/spots.js`).

Çıkartma albümü (📒): her kelime bir çıkartmadır. Kelime bulunup ilk seferde doğru seçilince renkli çıkartma ekranda belirip albüme uçar ve düğmede sayı rozeti çıkar. Albümde sayfalar (Renkler, Meyveler, Hayvanlar, Oyun parkı, Sayılar, Hareket) vardır; tanışılan ama henüz öğrenilmemiş kelimeler soluk, hiç görülmeyenler "?" olur. Çıkartmaya dokununca kelime okunur. "🎧 Dinle ve bul" sayfadaki tanıdık kelimelerden birini yalnızca İngilizce söyler, çocuk çıkartmasını bulur; bu cevaplar da öğrenme bilgisine (ilk seferde bildi, Türkçe azaltma) sayılır. Albüm açıkken oyun durur.

Önceki sürümde oyunu bitirmiş bir kayıt, yeni sürüm ilk açıldığında Bölüm 4'ten devam eder; kelimeler, altınlar ve kostümler korunur.

Oyun sonu: Bölüm 5 bitince kelebek Lila'ya götürür. Lila'ya varınca kutlama olur, bütün kelimeler dokununca okunan çıkartmalar olarak gelir. "Dolaş" bahçede serbest oyuna devam eder, "Tekrar oyna" maceraya baştan başlatır. Kurtarılan yavrular ayının arkasından yürür.

### Çocuk profilleri

Aynı cihazda en fazla 4 çocuk oynayabilir; her birinin simgesi, adı ve ilerlemesi ayrıdır. İkinci çocuk eklenince (ya da ilk çocuğa ad verilince) açılış ekranında "Kim oynuyor?" kartları çıkar; karta dokunmak o çocuğa geçer. Profiller aile panelinin "Çocuklar" sekmesinden eklenir, adlandırılır, simgesi değiştirilir ve silinir. İlk çocuğun kaydı eski anahtarda (`superayi_en_v2`) kalır, diğerleri `superayi_en_v2_<id>` anahtarında durur; profil listesi `superayi_profiles` içindedir.

### Aile paneli (👪)

Çarpma sorusuyla korunur. Dört sekme:
- **İlerleme:** her kelime için duyuldu, bulundu, ilk seferde bildi, sonra hatırladı; EN rozeti (Türkçe artık kendiliğinden çalmıyor) ve 🗣️ (kaç kez sesli söyledi).
- **Bu hafta:** son 7 günün oyun dakikaları (çubuk grafik), bu hafta kazanılan çıkartmalar, en çok zorlandığı kelimeler.
- **Ayarlar:** müzik / oyun sesleri / konuşma ses düzeyi, Türkçe çeviri, konuşma pratiği modu, günlük oyun süresi, çevrimdışı kopya durumu, ilerlemeyi sıfırlama, sürüm.
- **Çocuklar:** profiller.

### Günlük oyun süresi ve mola

Ayarlar'dan 10–60 dakikalık günlük sınır seçilebilir (varsayılan: sınırsız). Son iki dakikada Lila "Two more minutes!" der; süre dolunca sakin bir "Mola zamanı!" ekranı açılır ve oyun durur. Bu ekrandan yalnızca ebeveyn (çarpma sorusu) 10 dakika daha ekleyebilir. Süre yalnızca oyun gerçekten oynanırken sayılır (duraklatılmışken ya da sekme arka plandayken sayılmaz).

### Konuşma pratiği ("Sıra sende!")

Doğru karttan sonra (yeni kelimelerde her zaman, söylenmiş kelimelerde ara sıra) Lila kelimeyi söyler, sonra "Your turn! Say it!" der:
- **Mikrofonsuz** (varsayılan): mikrofon simgesi birkaç saniye nabız gibi atar, çocuk kelimeyi tekrar eder, "Well said!".
- **Mikrofonla:** çocuğun sesi ~2 saniye kaydedilir ve hemen biraz incelterek geri çalınır ("Listen to you!"). Çok sessizse bir kez "A little louder!" denir. Kayıt hiçbir yere kaydedilmez veya gönderilmez. Mikrofon izni, ebeveyn Ayarlar'da "Mikrofonla"yı seçtiğinde istenir; böylece izin penceresi oyunun ortasında çocuğu şaşırtmaz.
- **Kapalı.**
"Geç ▶" düğmesi bu anı atlar.

### Günün kelimesi

Hikâyede biraz ilerledikten sonra (8. adım) her gün, çocuğun tanıştığı kelimelerden biri (tercihen zayıf olanı) bahçenin üç ayrı yerine ışıklı jeton olarak saklanır; jetonların üstünde kelimenin resmi ve uzaktan görünen bir ışık sütunu vardır. Görev kartının altındaki 🔎 çipi ilerlemeyi gösterir, dokununca kelime söylenir. Üçü bulununca 8 altın kazanılır ve kelime yeniden "bulundu" sayılır. Hikâyeyi hiç durdurmaz.

### Müzik

Kodla üretilen, dosyası olmayan sakin bir marimba ezgisi (C majör, 92 vuruş). Biri konuşurken kısılır, konuşma pratiğinde neredeyse susar, su altında boğuk duyulur. Ses düzeyleri cihaz ayarıdır (`superayi_settings`).

Öğrenme kuralları:
- Seçim kartları her seferinde karışır; yanlış kartlar hep aynı gruptan gelir (renk, meyve, hayvan, oyuncak). Meyvede yalnızca iki kelime olduğu için iki kart çıkar.
- Bir kelime yalnızca ilk denemede doğru seçilirse öğrenildi sayılır. İki yanlıştan sonra doğru kart parlar.
- Üst üste iki kez ilk seferde bilinen kelimenin Türkçesi artık kendiliğinden çalmaz (panelde EN rozeti). Görev kutusuna ya da ses düğmesine dokununca Türkçe yine gelir. Yanlış seçince kelime yeniden Türkçeli olur.
- Her günün ilk oyununda, daha önce öğretilmiş en zayıf üç kelimeyle kısa bir tekrar turu (🔁) açılır; sonra macera kaldığı yerden sürer. `?review=1` tekrarı zorla açar.

Deneme: `?autostart=1` menüyü atlar. `?step=8` görev numarasından başlar.

## Ses

Ses kanalları (konuşma, oyun sesleri, müzik) ayrı ayrı ayarlanır; 🔇 düğmesi hepsini kapatır. Bir replik telefon araması gibi bir kesintide takılırsa birkaç saniye sonra kendiliğinden bırakılır. iPad/iPhone'da ses ilk dokunuşla açılır ve uygulama arka plandan dönünce yeniden açılır.

Gömülü sesler Microsoft Edge neural TTS ile üretilir: İngilizce **Aria**, Türkçe **Emel**. Replik listesi yalnızca `js/lines.js` içindedir; `tools/make_voices.py` listeyi oradan okur ve yalnızca eksik sesleri üretir. (Eski Windows Tolga sesi “kırmızı”yı yanlış okuyordu.) Üretim için bir kez internet gerekir; oyun dosyaları çevrimdışı çalar. `pip install edge-tts` sonrası:

```
powershell -File tools/make-voices.ps1
powershell -File tools/make-voices.ps1 -Force
```

Tamamen çevrimdışı üretim istersen ileride [seslen-tts](https://pypi.org/project/seslen-tts/) (~330 MB, Türkçe vurgu) veya [pocket-tts-turkish](https://pypi.org/project/pocket-tts-turkish/) de alternatif.

Kendi sesin için `assets/voice/custom/on.txt` oluştur ve aynı adlı `mp3`/`wav` dosyalarını `custom/en` ile `custom/tr` altına koy.

Dere ve gölette yüzülür (köprü kuru kalır); suya girince şıp sesi çıkar.

## Modeller

Doğa ve hayvanlar Quaternius modelleridir (CC0), Poly Pizza üzerinden alınmıştır. Kahraman ayı bu oyunun kendi modeli: büyük kafa, yürüme, zıplama, sevinme. Plumberry Plains paketindeki Bruno bu ağda indirilemediği için kullanılmadı. CC0 lisansı serbest paylaşıma izin verir; oyun yalnızca kullandığı modelleri içerir, paketlerin tamamını değil.

Oyun yalnızca `js/assets.js` içindeki `NAMES` listesinde yazan modelleri yükler. Yeni bir model eklerken dosyayı `assets/models/` altına koyup adını bu listeye de ekle.

## Proje yapısı

- `index.html` + `js/`: oyun. `sw.js` + `manifest.webmanifest`: çevrimdışı kopya ve ana ekran simgesi. three.js `vendor/three/` klasöründen yüklenir; derleme ya da `npm install` gerekmez.
- `package.json`: yalnızca hangi three.js sürümünün (0.170) kullanıldığını kaydeder. `vendor/three/` güncellenmek istenirse `npm install` ile indirilip oradan kopyalanır.
- `assets/voice/`: `tools/make_voices.py` ile üretilen sesler. Replik listesi `js/lines.js` ile aynı tutulmalı.
- Proje git ile takip edilir; her değişiklik geri alınabilir.

## Eski sürüm

Tek dosyalık önceki oyun `legacy/` klasöründedir. `legacy/index.html` eski 3D denemeyi açar.

## Yayın ve lisanslar

Oyun GitHub Pages'te yayınlanır: https://emirozyilmaz.github.io/super-ayi/ (çevrimdışı kurulum için tablette bu adres açılır). `main` dalına gönderilen her değişiklik birkaç dakika içinde yayına çıkar.

- three.js: MIT lisansı.
- Doğa ve hayvan modelleri: Quaternius, CC0.
- Sesler: Microsoft Edge sesli okuma (Aria, Emel) ile üretildi; kişisel, ticari olmayan kullanım içindir.
