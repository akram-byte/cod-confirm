# Confirmi: Darija voiceover

Two videos, one recording session (about 15 minutes).
Record **each line as its own file** with the exact file name below. The video stretches each scene
to the length of your line, so you don't need to hit exact timings. Just speak naturally.

## How to record (phone is fine)

1. **Quiet room with soft things**: a bedroom with curtains and a bed, or sit in front of an open wardrobe full of clothes.
   No bathroom or kitchen (echo). Turn off the fan and the fridge if you can hear it.
2. **Phone 15–20 cm from your mouth**, a bit to the side (not straight in front), so "p" and "b" don't pop.
3. Use the voice recorder app (Android "Recorder" / iPhone "Voice Memos"). Best quality setting if there is one.
4. **1 second of silence** before and after each line. Don't worry about trimming: the video trims the silence itself.
5. **Energy**: talk like you're sending a voice note to a seller friend. Smiling while you talk makes it sound warmer.
   Slightly faster than normal for the ad (30s), normal speed for the demo (60s).
6. Record **2 takes** of each line and keep the best one. If you stumble, just say the line again in the same file.
7. Put the files in `video/public/voice/`, named exactly as below (`.m4a`, `.mp3` or `.wav` all work).

---

## Video 1: 30-second ad (Reels / TikTok / Facebook)

Goal: stop the scroll, show the pain, show 3 "wow" screens, ask for the trial message.

| File | On screen | Say (Darija) |
|---|---|---|
| `ad-01` | Big text: "30 commande / يوم" then "شحال منهم يوليو دراهم؟" | خويا، تجيك ثلاثين commande فالنهار… شحال منهم يوليو دراهم فيدك؟ |
| `ad-02` | Pain cards drop in: fake, ما يردش, طرد راجع | commandes fake، زبون ما يردش، والطرد يرجعلك… وانت خلّصت التوصيل والإشهار باطل. |
| `ad-03` | App: the order flagged "ملء سريع" + "نفس الجهاز" | Confirmi يبيّنلك الـfake من الأول: هاذي تعمّرت فأربع ثواني. ما تضيعش عليها وقتك. |
| `ad-04` | App: the "زبون مشبوه" badge | وهذا الزبون رجّع طرد من قبل. تعرفها قبل ما تبعث، ماشي من بعد. |
| `ad-05` | App: tap call → تأكيد → next order slides in | تعيطل بكليك، تأكّد بكليك، والطلبية الجاية تجي وحدها. |
| `ad-06` | App: profit card counting up | وتشوف الربح الحقيقي، من بعد الإشهار والتوصيل والطرود اللي رجعو. |
| `ad-07` | Logo + "7 أيام بلاش" + "ابعثلي: نحب نجرب" | Confirmi. سبع أيام بلاش، ونديرلك كلش أنا. ابعثلي "نحب نجرب". |

About 70 words, so 26–32 seconds at a lively pace.

---

## Video 2: 60-second demo (to send in DMs)

Same story as `outreach/demo-script.md`, now with captions and zooms.

| File | On screen | Say (Darija) |
|---|---|---|
| `demo-01` | Today: to call, parcels at risk, unfinished orders | خويا، إذا راك تبيع بالدفع عند الاستلام، عطيني دقيقة برك. |
| `demo-02` | Stay on Today | هذا Confirmi. كل صباح تحلّو، تعرف واش لازم تدير: شكون تعيطلو، وواش من طرد راهو فخطر. |
| `demo-03` | Order form: wilaya, fee fills itself | الزبون يدخل من الإعلان تاعك، يختار الولاية والبلدية، والتوصيل يتحسب وحدو. والـcommande تطيح عندك ديراكت. |
| `demo-04` | Confirmation: "ملء سريع" + "نفس الجهاز" | شوف هاذي: تعمّرت فأربع ثواني، ومن نفس التيليفون تاع طلبيات أخرى. fake. ما تضيعش عليها وقتك. |
| `demo-05` | Order with the "زبون مشبوه" badge | وهذا الزبون رجّع طرد من قبل. تعرفها قبل ما تبعث، ماشي بعد ما تخسر. |
| `demo-06` | Call button, then تأكيد, next order opens | تعيطلو بكليك، ولا تبعثلو واتساب، تكليكي تأكيد، والتالية تجي وحدها. لا كراس لا Excel. |
| `demo-07` | Delivery: select all → send | المأكدين تختارهم، كليك وحدة، يروحو لشركة التوصيل، ويرجعلك رقم التتبع والـétiquette. |
| `demo-08` | Save the parcel: failed deliveries | والطرود اللي الليفرور ما قدرش يسلمهم يجو هنا. تعيطل للزبون قبل ما يرجع الطرد، وما تخلصش التوصيل زوج مرات. |
| `demo-09` | Today: real profit | وفالأخير، الربح الحقيقي: من بعد الإشهار، التوصيل، والطرود اللي رجعو. |
| `demo-10` | Logo + offer | سبع أيام بلاش، ونديرلك كلش أنا. ابعثلي "نحب نجرب". |

---

## After recording

Tell Claude "the voice files are in", or run it yourself:

```
cd video
npm run voice        # cleans each line (rumble, silence, loudness) and measures it
npm run render:ad    # → out/confirmi-ad-30s.mp4
npm run render:demo  # → out/confirmi-demo-60s.mp4
```

Each scene stretches to fit its line. `npm run voice` prints the total: aim for **24–30 s** for the ad.
If the ad runs long, re-record the longest lines a bit faster rather than cutting words.

Optional music: put a royalty-free track at `public/voice/music.mp3` before `npm run voice`.
It plays very low under your voice. Use only music you have the right to use in ads
(Facebook's Sound Collection or TikTok's Commercial Music Library are safe).

Until your files are there, the videos render silent, with placeholder timings.

## Re-shooting the app screens

The screenshots come from the real app with demo data (`npm run capture`, see `capture/capture.mjs`).
Run `npm run db:demo-topup -- --days=0` in the project root first: the capture confirms, cancels and
sends demo orders, so every run uses up part of the queue. Preview while editing with `npm run studio`.
