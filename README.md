# Süper Ayı — İngilizce Macerası

5.5 yaş için, evde açılan, reklamsız ve internetsiz 3D oyun. Köyden gökkuşağı bahçesine geçilir; ayı zıplar, çiçek ve meyve toplar, üç arkadaşını uyku balonundan çıkarır. İngilizce cümle önce gelir, Türkçe hemen ardından.

## Oyna

`oyna.bat` dosyasına çift tıkla. Tarayıcı `http://127.0.0.1:8765/` adresini açar. Pencereyi kapatmak oyunu durdurur. Sunucu `tools/serve.py` önbelleği kapatır; dosyalar güncellenince tarayıcı her zaman yenisini yükler.

Yol gösterme: Lila'nın kelebeği hedefe doğru uçar, hedefte renkli ışık sütunu ve yerde halkalar yanar. Görev kutusu yazı yerine resim gösterir; kutuya dokununca görev yeniden söylenir. Çocuk 13 saniye ilerlemezse kamera hedefe döner ve görev tekrar söylenir.

Klavye: WASD veya oklar, boşluk zıpla, farenin sağ tarafını sürükleyince (ya da Q sola / E sağa) kamera döner, M ses, P duraklat. Dokunmatikte solda joystick, sağda zıplama, sağ yarıda sürükleyince kamera. Oklar kamerayı çevirmez; kamera yalnızca çocuk 6 saniye hiçbir şeye dokunmazsa yavaşça hedefe döner.

Yüzme (Super Bear tarzı): suda doğal olarak batarsın, zıplama tuşunu basılı tutunca yükselirsin, yüzeyde zıplayınca sudan çıkarsın; çubuğu ne kadar çok çekersen o kadar hızlı yüzer, alta çekince dalarsın. Suyun altına inince ekran maviye döner, sis kısalır ve baloncuklar çıkar — ayrı bir su dünyası gibi.

Kaydırak: oyun alanında yürüyerek çıkılan rampa var; tepedeki sarı oka ulaşınca ayı kendiliğinden kayar, zıplamak gerekmez. Ayı yumuşak hızlanır/yavaşlar (koşu hızı 4.4) ve bacak adımı gerçek hıza göre ayarlanır.

Salıncak (bölüm 3): oyun alanının yanındaki salıncak setinde kırmızı ya da mavi koltuğun altındaki halkaya yaklaşınca ayı oturur. Çubuğu ileri-geri tutunca (ya da zıplama tuşuna tekrar tekrar basınca) kendi kendini sallar; yeterince hızlanınca takla atar, her takla 1 altın ve "flip" sesi getirir. 🚀 düğmesi ayıyı salıncaktan havaya fırlatır.

Uçak (bölüm 3): oyun alanının yanındaki piste gidilir; uçak ilk iki oyuncak görevi bitince açılır. Parlayan sarı halkaya basınca ayı pilot olur, kalkış otomatik. Çubukla sağa-sola/yukarı-aşağı yönlendirilir (up/down/left/right kelimeleri söylenir), zıplama tuşu 🌀 takla attırır, 🛬 düğmesi otomatik iniş yaptırır. Gökte 1-5 numaralı beş halka sırayla geçilir (one…five), yıldızlar altın verir. İnişte uçak yeniden park yerine döner; kurtarılan yavrular uçarken gizlenir.

Göl: yüzme alanı büyütüldü (yarıçap 11, merkez 49,-2). Pist gölün kuzey-batısında, ağaç ve sandıklardan arındırılmış. Uçuşta direksiyon yumuşatıldı; çubuk bırakılınca uçak sıradaki halkaya hafifçe yönelir, halkalar büyüktür.

Fikirler ve sıradaki işler için `ROADMAP.md`.

Bölüm 3 görev sırası: slide (kaydırağa bin) → seç → swing (salıncağa bin) → seç → plane (uçağa bin) → 5 halka → iniş → seç. `?step=31` kaydıraktan, `?step=35` uçaktan başlar.

Oyun sonu: üç arkadaş kurtarılınca kelebek Lila'ya götürür. Lila'ya varınca kutlama olur, öğrenilen altı kelime dokununca okunan çıkartmalar olarak gelir. "Dolaş" bahçede serbest oyuna devam eder, "Tekrar oyna" maceraya baştan başlatır. Kurtarılan yavrular ayının arkasından yürür.

İlerleme tarayıcıda `superayi_en_v2` anahtarıyla durur. Aile paneli (👪, çarpma sorusuyla korunur) her kelime için duyuldu, bulundu, ilk seferde bildi ve sonra hatırladı bilgisini gösterir.

Öğrenme kuralları:
- Seçim kartları her seferinde karışır; yanlış kartlar hep aynı gruptan gelir (renk, meyve, hayvan, oyuncak). Meyvede yalnızca iki kelime olduğu için iki kart çıkar.
- Bir kelime yalnızca ilk denemede doğru seçilirse öğrenildi sayılır. İki yanlıştan sonra doğru kart parlar.
- Üst üste iki kez ilk seferde bilinen kelimenin Türkçesi artık kendiliğinden çalmaz (panelde EN rozeti). Görev kutusuna ya da ses düğmesine dokununca Türkçe yine gelir. Yanlış seçince kelime yeniden Türkçeli olur.
- Her günün ilk oyununda, daha önce öğretilmiş en zayıf üç kelimeyle kısa bir tekrar turu (🔁) açılır; sonra macera kaldığı yerden sürer. `?review=1` tekrarı zorla açar.

Deneme: `?autostart=1` menüyü atlar. `?step=8` görev numarasından başlar.

## Ses

Gömülü sesler Microsoft Edge neural TTS ile üretilir: İngilizce **Aria**, Türkçe **Emel**. (Eski Windows Tolga sesi “kırmızı”yı yanlış okuyordu.) Üretim için bir kez internet gerekir; oyun dosyaları çevrimdışı çalar. `pip install edge-tts` sonrası:

```
powershell -File tools/make-voices.ps1
powershell -File tools/make-voices.ps1 -Force
```

Tamamen çevrimdışı üretim istersen ileride [seslen-tts](https://pypi.org/project/seslen-tts/) (~330 MB, Türkçe vurgu) veya [pocket-tts-turkish](https://pypi.org/project/pocket-tts-turkish/) de alternatif.

Kendi sesin için `assets/voice/custom/on.txt` oluştur ve aynı adlı `mp3`/`wav` dosyalarını `custom/en` ile `custom/tr` altına koy.

Dere ve gölette yüzülür (köprü kuru kalır); suya girince şıp sesi çıkar.

## Modeller

Doğa ve hayvanlar Quaternius modelleridir (CC0), Poly Pizza üzerinden alınmıştır. Kahraman ayı bu oyunun kendi modeli: büyük kafa, yürüme, zıplama, sevinme. Plumberry Plains paketindeki Bruno bu ağda indirilemediği için kullanılmadı. Ham model paketleri yeniden dağıtılmaz; oyunun içindeki kopyalar evde oynamak içindir.

Oyun yalnızca `js/assets.js` içindeki `NAMES` listesinde yazan modelleri yükler. Yeni bir model eklerken dosyayı `assets/models/` altına koyup adını bu listeye de ekle.

## Proje yapısı

- `index.html` + `js/`: oyun. three.js `vendor/three/` klasöründen yüklenir; derleme ya da `npm install` gerekmez.
- `package.json`: yalnızca hangi three.js sürümünün (0.170) kullanıldığını kaydeder. `vendor/three/` güncellenmek istenirse `npm install` ile indirilip oradan kopyalanır.
- `assets/voice/`: `tools/make_voices.py` ile üretilen sesler. Replik listesi `js/lines.js` ile aynı tutulmalı.
- Proje git ile takip edilir; her değişiklik geri alınabilir.

## Eski sürüm

Tek dosyalık önceki oyun `legacy/` klasöründedir. `legacy/index.html` eski 3D denemeyi açar.
