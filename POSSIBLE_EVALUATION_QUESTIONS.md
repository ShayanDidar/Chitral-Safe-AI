# Possible Evaluation Questions — ChitralSafe AI

This guide is for our team. It lists the 50 questions judges are most likely to ask, with simple answers you can say in your own words. Do not memorise them word for word: understand them, then speak naturally.

**Golden rule: if you don't know something, say so honestly.** "We haven't built that yet, but here is how we would do it" is a strong answer. Making something up is the fastest way to lose points.

---

## Before you present

**Checklist (10 minutes before):**

1. Open the live site: https://chitral-safe-ai.vercel.app
2. Sign in as **Admin**. If the sample reports are missing from the map, open **Admin portal → Review queue** and press **Restore demo reports**.
3. Open **AI Assistant** and check the green **Live AI** badge. If it says **Demo responses**, the AI service is busy; the app still works with backup answers (see Question 24).
4. Have a phone ready to show the mobile version.
5. Keep a mobile hotspot ready in case the hall Wi-Fi is slow.

**A 3-minute demo plan:**

| Time | Show | Say |
|---|---|---|
| 0:00 | Home page | "This is ChitralSafe AI. In one screen you see live weather, active hazards, alerts and an AI risk summary for Chitral." |
| 0:30 | Live Map | "Every approved hazard is on this map. Colour shows how serious it is. Red is critical." |
| 1:00 | Sign in as **User** → Report | "Anyone can report a hazard in under a minute: type, location, photo, description, severity." Submit it. |
| 1:40 | Sign in as **Admin** → Review queue | "Nothing goes public until an admin approves it. This stops fake news." Approve it, then show it on the map. |
| 2:10 | AI Assistant | Ask: "Is it safe to drive from Chitral Town to Booni today?" "The AI reads the live reports and weather to answer." |
| 2:40 | Switch to Urdu | "The whole app, including the AI, works in Urdu." |

**Things to be honest about (so nobody can trap you):**

- **The reports you see are sample reports**, marked "Sample". We made them to show how the app works. They are not real events happening today.
- **The AI does not look at photos.** It reads the report details and the weather. Photo checking is our next step.
- **The demo Admin and User buttons have no password.** That is only for the demo, and it can be switched off with one setting.
- **We used an AI coding assistant to help write the code.** Our GitHub history shows this. Say it openly (see Question 7).
- **Weather numbers are estimates**, except near Chitral Town and Drosh, where we use real station readings.

---

## A. The idea and the problem

### 1. What is ChitralSafe AI, in one sentence?
It is a website where people in Chitral report hazards like floods, landslides and blocked roads with a photo and location, an admin checks each report, the reports appear on a live map, and AI turns the reports and the weather into a risk level and safety advice.

### 2. Why did you choose this problem?
We live in Chitral. Every year floods, glacier floods (GLOFs), landslides and rockfall damage homes and block roads. The 2015 floods badly hit many villages. Right now, news about a blocked road or a rising stream travels by word of mouth and often arrives too late. We wanted one place where everyone can see what is happening, right now.

### 3. Who will use this app?
- **Local people and families**: to check if it is safe before travelling.
- **Drivers and tourists**: to see blocked roads before leaving.
- **Volunteers or the district administration**: to review reports and see where help is needed.
- **Students and schools**: to report what they see in their own villages.

### 4. How is this different from a WhatsApp or Facebook group?
In a group, messages get lost, rumours spread, and there is no map. In our app:
- every report has an exact **location on a map**,
- every report is **checked by an admin** before it is shown,
- reports are sorted by **how serious** they are,
- **AI** summarises the whole situation in seconds,
- it works in **English and Urdu**.

### 5. The government already gives warnings. Why do we need this?
Official warnings from PDMA and the Met Department are very important, but they cover large areas, like "heavy rain expected in Chitral". Our app adds **local, street-level information from people on the spot**, like "the road near Ayun bridge is blocked right now". The two work together. We do not replace official warnings, and the app says clearly that it is not an official warning system.

### 6. What makes your project innovative?
- It mixes **community reports, live weather and AI** in one place, built for Chitral.
- It **corrects weather forecasts with real weather-station readings**, because forecasts are often several degrees wrong in our deep valleys.
- It has **privacy built in**: photo location data is removed, and crime reports can be confidential or anonymous.
- It works fully in **Urdu**, including the AI.

### 7. Did you build this yourselves? Did you use AI to write the code?
*(Answer honestly. Our GitHub history shows that an AI coding assistant, Claude, helped write the code.)*

"Yes, we used an AI coding assistant to help write much of the code, the same way many developers do today. Our work was choosing the problem, deciding what the app should do and for whom, testing it again and again, and finding and fixing problems. For example, we noticed the temperatures were wrong and found real weather-station data to fix them. We also made sure we understand how every part works, and we are happy to explain any of it."

Then tell them truthfully who in the team worked on what, and how long you worked on it.

---

## B. How the app works

### 8. Can you walk us through reporting a hazard?
1. Sign in and press **Report a hazard**.
2. Choose the **type** (for example Landslide).
3. Set the **location**: tap "Use my location", tap the map, or choose a town.
4. Add up to **4 photos**.
5. Write a short **description**.
6. Choose the **severity**: Low, Medium, High or Critical.
7. Press **Submit for review**. The report now waits for an admin.

### 9. What types of hazards can be reported?
Flood, landslide, glacier hazard, road blockage, heavy rain, rockfall, snowfall and "other". There is also a separate form for crime and safety reports.

### 10. Why does someone need an account to report?
So that people are responsible for what they post, which reduces fake reports. It also lets people see the status of their reports and delete their own reports. Browsing the map, weather and AI needs **no account**.

### 11. What happens after a report is submitted?
It starts as **"Pending review"** and is not shown to the public. An admin then **approves** it (it appears on the map and in the community feed) or **rejects** it with a reason, which the reporter can see under "My submissions".

### 12. What can the admin do?
Approve or reject reports, see each report on a map, delete reports, restore the demo reports, and manage the emergency contact list. Admin checks happen on the server, so a normal user cannot do admin actions even with technical tricks.

### 13. How does the map show how dangerous something is?
Each marker has a colour: **green = Low, yellow = Medium, orange = High, red = Critical**. Critical and new reports have a pulsing ring so they catch your eye. You can filter by hazard type, severity and place.

### 14. What are the alerts, and where do they come from?
Nobody types them in. The app creates them automatically from real data:
- **Weather alerts** from the live forecast: heavy rain, a very hot day (heat melts glaciers faster), snow or freezing temperatures.
- **Community alerts** from approved critical and high-severity reports, each linking to its report.

If none of these applies, the app says there are no alerts. These are **not** official government warnings.

### 15. Why does a disaster app also have crime reporting?
Community safety is part of the same idea: people helping each other stay safe. Some crimes are sensitive, so we added special privacy options: a crime report can be **confidential** (only admins see it), and the reporter can stay **anonymous**.

### 16. What is the difference between "confidential" and "anonymous"?
They are two separate choices:
- **Public or confidential** = *who can see the report.* Confidential reports are seen only by admins and the reporter.
- **Named or anonymous** = *whether your name is shown.* Anonymous hides your name even from admins.

Public crime reports never show the exact spot. The location is rounded to about 1 km.

### 17. Does the app work in Urdu? Why does that matter?
Yes. One button switches the whole app to Urdu, with right-to-left layout, and the AI answers in Urdu too. Many people in Chitral, especially elders, are more comfortable reading Urdu than English. A safety app only helps if people understand it.

### 18. Does it work on mobile phones?
Yes. Most people here use the internet on phones, so we designed every screen for small screens, with a bottom menu and a red emergency button. It is a website, so nothing needs to be installed.

### 19. Does the app call Rescue 1122 when someone reports an emergency?
No, and the app says this clearly. Submitting a report does **not** contact emergency services. Rescue 1122 and Police 15 are shown as **call links** on every page, so in a real emergency people should call directly.

---

## C. The AI

### 20. Where exactly is the AI in your project?
In two places:
1. **AI risk analysis**: it reads all approved reports and the live weather and gives a **risk level** (Low, Moderate, High or Severe), a **score out of 100**, the **possible risks**, the **reason**, and a **suggested action**. It can do this for all of Chitral or for one place.
2. **AI assistant**: people can ask questions like "Which roads are blocked?" or "Is it safe to go to Booni today?" and it answers using the live app data.

### 21. How is the risk score calculated?
The AI gets the current reports (most serious first) and the weather, and decides the score and level from that data. Our built-in backup method uses a simple formula: more rain, more reports and more serious reports mean a higher score. A critical report counts much more than a low one (critical 14 points, high 9, medium 5, low 2).

### 22. Which AI model do you use?
Google Gemini on our live site. The code also works with Anthropic Claude or any OpenAI-compatible model, chosen just by the API key. If one Gemini model is busy, the app automatically tries the next one.

### 23. What if the AI gives a wrong answer?
The AI only gives **information and advice**, not orders. Every AI box says it is "informational, not an official warning". We tell the AI to use only the app's data, never to claim certainty, and to always point to Rescue 1122 in emergencies. People should still use their own judgement.

### 24. What happens if the AI service is down or there is no API key?
The app does not break. It switches to **demo mode**: built-in backup answers made from the same live data, in English or Urdu. The badge then says "Demo responses" instead of "Live AI", so we never pretend.

### 25. Does the AI look at the photos to detect the hazard?
**Not yet.** Right now the person chooses the hazard type and severity, and an admin checks it. Our next step is AI photo checking: the AI would look at each photo, suggest the hazard type and severity, and help admins handle the most urgent reports first.

### 26. Your project description says AI "prioritizes" reports. How?
The AI receives the reports sorted with the **most serious and newest first**, and it weighs them by severity when it calculates the risk. The alerts also show critical reports first. So the most dangerous situations always appear at the top. Automatic priority from photos is our next step (Question 25).

### 27. What information do you send to the AI? Do you send personal data?
We send only what the AI needs: hazard type, severity, place, a short description and the weather. We do **not** send names, phone numbers or emails. For crime reports we send only the category and the approximate area. Our AI key is kept on the server and never reaches the browser.

### 28. Can the AI answer in Urdu?
Yes. When the app is in Urdu, we tell the AI to answer in simple Urdu, and the backup demo answers are in Urdu too.

---

## D. Weather and accuracy

### 29. Where does your weather data come from? Is it real?
Yes, it is real:
- **Open-Meteo**, a free weather service, gives the forecast for every town, valley and pass.
- **Real measurements** from the Pakistan Meteorological Department weather stations in **Chitral Town and Drosh**, published every 3 hours through a free service called OGIMET.

Neither needs a paid API key.

### 30. Your temperature is different from Google's. Why?
Google and other apps also use computer forecasts, which can be several degrees wrong in deep mountain valleys. For example, one day the forecast said 22°C in Chitral while the station really measured 28°C. Near Chitral Town and Drosh, our app corrects the forecast using the station's real reading, and the page shows that reading, for example "Chitral Town weather station measured 28°C at 14:00". Small differences of 1–2°C between apps are normal.

### 31. How do you correct the forecast?
In simple words: when the station measures, we compare its real temperature with what the forecast said for that same time. If the forecast was 6°C too low, we add 6°C to places within 30 km of the station. The correction fades over the next 12 hours. Places far from a station are labelled "Forecast estimate".

### 32. Why is mountain weather hard to get right?
Temperature drops about 6°C for every 1,000 m you go up. If the computer thinks a town is on a mountainside, it shows the wrong temperature. So we tell the weather service the **real height of each town**. If the forecast says "snow" but the town is clearly above freezing, we show rain instead.

### 33. Do you pay for weather or maps?
No. Open-Meteo, the station data and the Esri maps are free and need no key.

---

## E. Trust, privacy and security

### 34. How do you stop fake or prank reports?
- You must **sign in** to report.
- **Every report is checked by an admin** before it is public.
- A report must be **inside the Chitral area**, so one from London is rejected.
- Each account can only submit a limited number of reports per hour.
- Admins can reject reports with a reason, or delete them.

### 35. How do you protect privacy in photos?
Phone photos often hide the exact GPS location and camera details inside the file. Our server **re-creates every photo**, which removes all that hidden data before saving it.

### 36. Can someone find out where a crime reporter lives?
No. Public crime reports never show the typed address or the exact spot. The location is rounded to about 1 km and only the nearest town name is shown. Confidential reports are never shown publicly at all.

### 37. Is an anonymous report completely anonymous?
We are honest about this, and the form explains it: the name is hidden from everyone, including admins. But the report is still linked to the account in the database, so the person can track and delete it. Someone with direct database access could see that link. The text or photo could also give clues. We do not save IP addresses with reports.

### 38. How do you keep passwords and accounts safe?
Passwords are scrambled with a strong method called **scrypt**, so even we cannot read them. Sign-in uses a secure cookie that websites and scripts cannot steal easily. Admin permissions are checked on the server for every admin action.

### 39. Anyone can press "Admin" on your sign-in page. Isn't that a security hole?
Yes, and we did it on purpose **only for the demo**, so judges can try everything without passwords. In real use we switch it off with one setting (`DEMO_LOGIN=false`), and admins are created only by email or by a command.

### 40. Are the reports on the map real?
They are **sample reports** we created to show how the app works, and each is clearly marked **"Sample"**. Their page says "Sample report (demo data, not a real event)". Any report submitted by a real person appears without that label.

---

## F. Technology

### 41. What technologies did you use, and why?
| Part | Tool | Why |
|---|---|---|
| Website | **Next.js, React, TypeScript** | Modern, fast, and runs on phones and computers |
| Design | **Tailwind CSS** | Quick, clean design that also works right-to-left for Urdu |
| Map | **Leaflet** with Esri maps | Free, detailed mountain maps |
| Database | **PostgreSQL** | Reliable storage for users, reports and photos |
| AI | **Google Gemini** | Smart answers, with a free tier |
| Weather | **Open-Meteo + PMD stations** | Free and real |
| Hosting | **Vercel + Neon** | Free hosting, online in minutes |

### 42. Where is the data stored?
In a **PostgreSQL database** online (Neon). Photos are stored in the database too, and can only be opened through our server, which checks who is allowed to see them. Secret keys are stored as server settings on Vercel, never in the code.

### 43. How does a new report appear on other people's screens?
After an admin approves it, every open copy of the app checks for new reports **every 30 seconds** and whenever the page comes back into view, so it appears without reloading.

### 44. What if thousands of people use it at the same time?
Vercel runs the app on many servers automatically, and PostgreSQL handles large amounts of data. For a much bigger scale we would move photos to a separate file store, add a shared rate limiter, and add more admins or trusted volunteers to review reports quickly.

### 45. How much does it cost to run?
For now, **nothing**. We use free plans of Vercel, Neon, Open-Meteo and the Gemini API. With many users, the database and AI could need paid plans, but they start at a low cost.

### 46. What was the hardest part?
*(Use your own experience. Some true examples from this project:)*
- **Getting the weather right**: temperatures were up to 6°C wrong in the valleys, and some places showed −2°C because their map pin was on a mountainside. We fixed it with town heights and real station readings.
- **Privacy for crime reports**: keeping "who can see it" and "is my name shown" as two separate, clear choices.
- **Making everything work in Urdu**, including right-to-left layout and the AI.

---

## G. Real world, impact and future

### 47. How will you get people in Chitral to use it?
Start with **schools** (students report from their villages), **local volunteers** and **community groups**. Share the link on WhatsApp and Facebook groups people already use. Then show the district administration and Rescue 1122 how it helps them. The app works in a normal phone browser, so there is nothing to install.

### 48. What about villages with weak or no internet?
This is a real limit today: the app needs internet. Our plans: **reporting by SMS**, and **saving a report offline** and sending it automatically when the phone gets signal.

### 49. What would you add next?
1. **AI photo checking**: suggest the hazard type and severity from the photo.
2. **Khowar language**: Chitral's own language.
3. **SMS and offline reporting** for remote villages.
4. **Official alerts** from PDMA and the Met Department inside the app.
5. **Push notifications** when a critical hazard is reported near you.

### 50. Could the government or rescue services use this?
Yes, that is our goal. Rescue 1122 or the district administration could act as admins: approve reports, see all hazards on one map, and know where help is needed. The AI risk summary gives them a quick overview. We would love to work with them to make it official.

---

## Final tips

- **Speak simply.** Judges like clear answers more than big words.
- **Show, don't just tell.** If a question is about a feature, open it on screen.
- **Share the answers.** Each team member should know one area well: the idea, the map and reports, the AI, the weather, or privacy.
- **Stay calm with hard questions.** "That's a good point; it is a limit today, and here is how we would solve it" is a great answer.
- **Remember the "be honest" list** at the top of this page.

Good luck! 🏔️
