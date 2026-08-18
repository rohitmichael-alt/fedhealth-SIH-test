# Person 6: Pitch, deck, DPDP research, rehearsal

**Branch:** `feat/pitch`
**Folder:** `pitch/`

You write no code. You own whether the other five people's work lands. Treat that as the harder job.

---

## Your deliverables, in order

### 1. DPDP fact sheet, `pitch/DPDP_FACTS.md`, do this first

Everything else depends on getting these facts exactly right. A wrong legal claim destroys credibility faster than any technical error.

Verify and write up, each with a source link:

- DPDP Act 2023 passed, Rules notified November 2025
- **Substantive obligations enforceable from 13 May 2027.** Never say "currently illegal", always "from May 2027"
- **Up to 250 crore rupees** penalty, specifically for failure to implement reasonable security safeguards leading to a personal data breach
- **Up to 150 crore rupees** for breach of Significant Data Fiduciary obligations under Section 10
- **Rule 13**: SDFs must conduct a DPIA and an audit once every twelve months, plus algorithmic due diligence
- Cross-border transfers use a **negative list** model, allowed except to specified restricted countries
- **No separate sensitive personal data category**, unlike GDPR
- **All** breaches must be notified, not only high-risk ones
- What a DPIA actually requires, at least three concrete components, because this will be a follow-up question

Also research and note: what ABDM is and its current digitisation status, since our honest caveat depends on it.

Search for current information rather than relying on memory. Some of these may have changed.

### 2. The deck, `pitch/deck.pptx`

Maximum 8 slides. The demo carries the pitch; slides support it.

1. **Title**, project name, team, problem statement number
2. **The problem**, three gaps: accuracy, legal, surveillance. One line each.
3. **Why now**, the May 2027 timeline. This is your strongest slide, make it a countdown.
4. **The solution**, the three-layer architecture diagram from the README
5. **Results**, Person 5's cross-site comparison chart. Your only data slide.
6. **Privacy proven, not claimed**, Person 4's attack results table plus the privacy-utility curve
7. **What we do not claim**, the honesty slide. Digitisation is a prerequisite, no clinical validation, not a better framework than Flower. **Keep this slide.** It is disarming and judges remember it.
8. **Roadmap**, secure aggregation, robust aggregation against poisoning, hospital pilot, DPIA generation

Upload the finished `.pptx` to the repo under `pitch/`. Do not leave it in Google Slides only, and do not leave it on your own laptop.

### 3. Presentation script, `pitch/SCRIPT.md`

Five minutes, timed. Structure:

- 0:00 to 0:45 setup, three hospitals, none can train alone, pooling costs 250 crore from 2027
- 0:45 to 1:30 the failure, hospital A's model tested on hospital C's patients, accuracy drops
- 1:30 to 3:00 federated training live, narrate rounds, point at IMAGES SENT: 0
- 3:00 to 4:00 **hand the attacker laptop to the judge**, they intercept, retina reconstructs, pause, flip DP on, attack fails
- 4:00 to 5:00 surveillance map, close on: hospitals get models that generalise, patients keep provable privacy, public health gets visibility, and nothing on this table ever shared a scan

Final line, delivered flat: we are not building a better federated learning framework, we are building the compliance and deployment layer India needs before May 2027.

Assign who speaks each segment. Two or three speakers maximum. All six answer Q&A.

### 4. Q&A prep sheet, `pitch/QA.md`

Collect each person's expected question from their brief, plus:

- "Isn't this just Flower with a dashboard?"
- "Indian hospitals already share data with big tech, where is the problem?"
- "Indian hospital data is not even digitised, does this matter?"
- "Do you have real hospital data?" Answer: no, deliberately. Getting patient scans onto a student laptop in three weeks would require exactly the informal sharing this project prevents. We used APTOS and EyePACS and are pursuing a hospital letter of intent to participate as a node, not to hand over data.
- "How much accuracy does privacy cost?" Person 5's number.
- "What if a hospital sends poisoned updates?" Person 4's answer.

Run this as a mock Q&A with all six people before the review. Whoever hesitates, drill them again.

### 5. The backup recording

**This is your most important deliverable.**

At the hard cutoff, record a full screen capture of the working demo end to end, including the attack. Save to `pitch/backup_demo.mp4`. Have it open in a tab on demo day.

If anything fails live, you play the recording and keep talking. Nobody debugs in front of judges.

### 6. Run the rehearsal

Full run-through with real timing, all five laptops on the actual wifi, in the actual room if possible. Time it. If it runs over five minutes, cut content, do not talk faster.

## Your Q&A lane

You defend **problem, impact, legal and positioning**. Be able to explain:

- The three gaps, in one sentence each
- Every DPDP fact above, cold
- Why diabetic retinopathy: large public datasets, clean 5-class task, screening runs without specialists, large affected population in India
- Positioning: Flower is our transport layer, we build the Indian compliance layer on top, complementary not competitive

**Expected question:** "Hospitals already share data with Google, where is the problem?" Answer: correct, and that is precisely the risk. Those arrangements were struck when the regulatory cost was near zero. From May 2027 it is not. We build for the regime that is about to switch on.
