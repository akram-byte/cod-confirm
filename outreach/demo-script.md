# Confirmi: 60-second demo video

Record your screen (phone or PC) with your voice over it, in Darja. Keep it raw and fast: no music, no intro.
Arabic interface. Only demo data (all names and phones in the demo database are fake).

## Before you record (5 minutes)

1. `npm run build` then `npx next start -p 3001`, and open http://localhost:3001
   (the production version: no "N" badge in the corner). Or use the online Vercel version if your internet is slow.
2. Fresh data for today: `npm run db:demo-topup -- --days=0`
   (run it again before each retake: every take uses up orders in the queue).
3. **Delivery → To send**: pick a stop desk for any desk order (yellow "اختر مكتب التوصيل"), so sending works in one click.
4. Open these tabs in order so you only switch, never type:
   Today (`/`) · order form (`/order/montre-connectee-sport`) · Confirmation · Delivery · Save the parcel (`/rescue`)
5. Don't name ZR Express or Yalidine in the video: the demo courier button says "Démo". Say "شركة التوصيل".

## The script

| Time | On screen | What you say |
|---|---|---|
| 0–5s | **Today**: 9 to call, 3 parcels at risk, 2 unfinished orders | "خويا، إذا راك تبيع بالدفع عند الاستلام، عطيني دقيقة برك." |
| 5–10s | Stay on **Today** | "هذا Confirmi. كل صباح تحلّو، تعرف واش لازم تدير: شكون تعيطلو، واش من طرد راهو فخطر." |
| 10–17s | **Order form**: pick a wilaya, the delivery fee fills itself | "الزبون يدخل من الإعلان تاعك، يختار الولاية والبلدية، والتوصيل يتحسب وحدو. والـcommande تطيح عندك ديراكت." |
| 17–25s | **Confirmation**: first order shows "ملء سريع" + "نفس الجهاز". Tap **إلغاء** | "شوف هاذي: تعمّرت فـ4 ثواني، ومن نفس التيليفون تاع طلبيات أخرى. fake. ما تضيعش عليها وقتك." |
| 25–31s | Next order with the **"زبون مشبوه"** badge | "وهذا الزبون رجّع طرد من قبل. تعرفها قبل ما تبعث، ماشي بعد ما تخسر." |
| 31–37s | A normal order: tap the phone button, then **تأكيد**. The next order opens by itself | "تعيطلو بكليك، ولا تبعثلو واتساب، تكليكي تأكيد، والتالية تجي وحدها. لا كراس لا Excel." |
| 37–44s | **Delivery → To send**: select all → send. The orders move to "On the road" | "المأكدين تختارهم، كليك وحدة، يروحو لشركة التوصيل، ويرجعلك رقم التتبع والـétiquette." |
| 44–51s | **Save the parcel**: 3 parcels the courier could not deliver | "والطرود اللي الليفرور ما قدرش يسلمهم يجو هنا. تعيطل للزبون قبل ما يرجع الطرد، وما تخلصش التوصيل زوج مرات." |
| 51–56s | **Today**, scroll to profit: **53.650 د.ج** | "وفالأخير، الربح الحقيقي: من بعد الإشهار، التوصيل، والطرود اللي رجعو." |
| 56–60s | Stay on profit | "7 أيام بلاش، ونديرلك كلش أنا. ابعثلي 'نحب نجرب'." |

## If it runs long
Cut in this order: the order form (10–17s), then the phone-call step (31–37s).
The fake-order warning, the risky customer, "Save the parcel" and the profit are the strongest moments. Keep them.

## Short version (15–20s, for a Reel or TikTok)
Only 17–31s (fake order + risky customer), then the last line:
"7 أيام بلاش. ابعثلي 'نحب نجرب'."

## How to send it
- As a video file in the DM (not a link), right after they reply "yes" or "video?".
- Never show real customer names or phone numbers, only demo data.
