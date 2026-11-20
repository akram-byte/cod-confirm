# Dental chatbot: pitch, price, who to sell to

Based on `E:\DENTAL CHATBOT_prod.json` (55 nodes).

## What it actually does (say it in money, not in tech)
| Feature in the workflow | What the dentist hears |
|---|---|
| Answers on WhatsApp + Messenger, 24/7 | "No more missed messages at night or while you're with a patient." |
| Understands voice notes | "Patients send vocals, and the bot understands them." |
| FAQ (prices, hours, location) + AI | "The assistant stops answering the same 20 questions." |
| Books appointments | "Patients book themselves, straight into the schedule." |
| Hourly appointment reminders | "Fewer no-shows: each empty chair is money lost." |
| Waitlist: offers freed slots every 15 min | "A cancellation gets filled automatically." |
| Hands off to staff + staff alert, bot pauses when staff replies | "Hard cases go to a human, and the bot never talks over you." |
| Monthly report | "Each month: messages, bookings, no-shows." |

**One-line pitch:** a 24/7 receptionist on WhatsApp and Messenger that books appointments, sends reminders and fills cancellations.

## Price (starting point, adjust after 3 calls)
- **Setup:** 40,000–60,000 DA (one time): their FAQ, prices, hours, connecting their page and WhatsApp.
- **Monthly:** 5,000–8,000 DA for hosting, fixes, and changes to prices or hours.
- **Hook:** 14 days free on their Messenger page. If no booking comes through the bot, they pay nothing.

Check before quoting: the WhatsApp Cloud API charges Meta fees for messages the clinic sends first (reminders, waitlist offers). Gemini is free up to a limit. Either include these costs in the monthly price, or bill them through the clinic's own Meta account.

## Who to target
1. **Dental clinics with an active Facebook page**, which are already getting messages. Search Facebook and Google Maps for "cabinet dentaire" or "عيادة أسنان" + your wilaya, then nearby wilayas.
2. **Clinics running ads**: Meta Ad Library, country Algeria, search "cabinet dentaire" or "عيادة طب الأسنان". They pay for messages, so missing them hurts.
3. **Busy clinics**: lots of Google reviews mentioning "difficile de joindre" or "ما يردوش" (hard to reach / they don't answer). Quote that pain back to them.
4. If Smile Care Clinic (Koléa) already uses it, get a short testimonial or screenshot of real bookings. That's your best sales tool.

Test first: send a message to their page at 10pm. If nobody answers, open your DM with that.

## DM (French; most dentists prefer it)
> Bonjour Docteur, j'ai écrit à votre page hier soir à 22h et personne n'a répondu, c'est normal, vous êtes humain 🙂
> J'ai créé un assistant WhatsApp/Messenger pour cabinets dentaires : il répond 24h/24 (même aux vocaux), prend les rendez-vous, envoie des rappels pour réduire les absences, et propose les créneaux annulés à la liste d'attente.
> Je l'installe gratuitement 14 jours sur votre page. Je vous envoie une vidéo d'1 minute ?

## DM (Darija)
> السلام عليكم دكتور، بعثت للصفحة تاعكم البارح على 10 تاع الليل وما ردش حتى واحد، عادي 🙂
> درت assistant لعيادات الأسنان: يرد 24/24 على WhatsApp و Messenger حتى على الـ vocaux، ياخذ المواعيد، يفكر المرضى بالرونديفو، ويعمر المواعيد اللي تلغات.
> نركبهولكم 14 يوم بلاش. نبعثلكم فيديو دقيقة؟

## Demo video (60s, same idea as Confirmi)
Phone screen: send a voice note "بغيت رونديفو للتبييض" ("I'd like an appointment for whitening") → the bot replies with available slots → book → reminder message → staff alert. End with: "14 jours gratuits."
