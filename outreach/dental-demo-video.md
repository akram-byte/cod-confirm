# Dental chatbot: 60–75s demo video

**Who it's for:** the dentist, not a developer. Show the patient's chat and what the clinic receives. Don't show n8n, except maybe a 2-second flash at the end ("it runs on its own").

## Before recording (about 15 min)
1. Make sure the workflow is **active** and your test page/number is connected (Messenger is easiest).
2. Fill the bot's knowledge with **realistic clinic data**: prices (détartrage, blanchiment, implant), hours, address in Algiers. Use a fake clinic name like "Cabinet Dentaire Démo", not a real clinic.
3. Clear old test conversations so the chat starts clean.
4. Have **2 phones**, or a phone plus WhatsApp Web:
   - Phone A = the patient (record this screen)
   - Phone B = the staff phone that receives alerts
5. Reminders run every hour and the waitlist every 15 min, so don't wait for them live. In n8n, open the **Due Reminders** and **Waitlist Offers** branches and run them manually after the booking (put a test appointment due soon). Record phone A when the message arrives.
6. Turn on Do Not Disturb so no personal notifications show up. Recording: Android's built-in screen recorder, or iPhone's Control Center.

## Script (record each part separately, then join in CapCut)

| # | Time | Patient phone (A) | Caption on screen |
|---|---|---|---|
| 1 | 0–4s | Clock showing ~22:30, open Messenger | "22h30, le cabinet est fermé…" |
| 2 | 4–14s | Send a **voice note**: "السلام عليكم، بغيت نعرف شحال التبييض وكاش رونديفو هاد السيمانة؟" ("Hello, how much is whitening and is there an appointment this week?") | "Le patient envoie un vocal" |
| 3 | 14–22s | Bot answers in Darija: price + available slots | "Réponse en quelques secondes, même aux vocaux" |
| 4 | 22–32s | Patient picks a slot and gives their name, bot confirms the booking | "RDV pris automatiquement" |
| 5 | 32–40s | Phone B: staff alert for the new booking | "Le cabinet est notifié" |
| 6 | 40–48s | Phone A: reminder message for the appointment | "Rappel automatique → moins d'absences" |
| 7 | 48–56s | Phone A (2nd test account): "un créneau s'est libéré" waitlist offer | "Créneau annulé ? Il se remplit tout seul" |
| 8 | 56–64s | Patient types something complex ("j'ai très mal, c'est urgent"), bot hands off, staff replies from phone B, bot goes quiet | "Les cas sensibles passent à votre équipe" |
| 9 | 64–72s | Text on a plain background | "Assistant WhatsApp & Messenger pour cabinets dentaires · 14 jours gratuits · [your WhatsApp number]" |

## Editing tips
- Speed up the typing and waiting parts (x2) and keep the bot's replies at normal speed.
- Big, readable captions in French (most dentists read French), plus the Darija voice note for authenticity.
- No music, or very low music. Under 75 seconds.
- Export vertical (9:16). The same video works for WhatsApp, DMs and a Reel.
- Make a 20s cut (parts 2–4 + 9) for cold DMs, and send the full version when they say "oui".

## If something breaks while filming
- Bot doesn't reply: check the n8n **Executions** tab for the failed node, often Gemini rate limits or an expired page token.
- Voice note not understood: re-record it slower, closer to the mic.
- Don't fake replies. If a feature isn't working, leave it out of the video.
