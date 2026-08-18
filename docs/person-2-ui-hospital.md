# Person 2: Hospital node dashboard

**Branch:** `feat/ui-hospital`
**Folder:** `ui-hospital/`

You build **one** dashboard that renders as any of the three hospitals based on a URL parameter. Three laptops, one codebase.

`http://<brain-ip>:3000/?client=hosp_a`

---

## What the judge sees

This is the screen a judge looks at to answer the question "is patient data leaving this machine?" The answer must be visually obvious in two seconds from three metres away.

## Required elements

**1. Hospital identity header.**
Name and location from the table in `contract/events.md`, plus a subtitle describing the patient population, for example "Referral centre, severe case load". Each hospital gets a distinct accent colour so the three laptops are instantly distinguishable.

**2. IMAGES SENT: 0, the hero element.**
The single largest number on the screen. Green, `#2ECC71`. Never changes. Put a small live label under it reading "raw patient data transmitted this session".

This is the most important pixel in the entire project. Make it big.

**3. Local patient queue.**
A grid of fundus image thumbnails from `assets/fundus/`, 8 to 12 of them, each with a patient ID like `PT-2291` and a grade badge once classified. During training, tiles should pulse or highlight to show local processing.

Add a small lock icon on the panel with the label "stays on this device".

**4. Local training panel.**
Progress bar driven by `client_training.progress`. Show current round, local loss, sample count.

**5. Outbound transmission log.**
A scrolling log, the proof element. Each `client_update` appends a row:

```
14:22:07  OUT  model_weights  180.4 KB  encrypted
14:22:07  OUT  patient_images  0 B
```

The second line, always zero bytes, is what sells it. Make the payload type explicit on every row.

**6. Privacy status chip.**
Reads DP ON with epsilon from the `privacy` event, green. If `dp_enabled` is false, flips to DP OFF in red `#FF4D4D`. Person 4's demo turns this red, and the judge should see all three hospitals go red at once.

**7. Dropout state.**
On `client_dropout` for this client, grey the whole panel and show "node offline, training continues without this node". Then recover.

## Technical notes

- Plain HTML plus JS, or React if you are faster in it. No build pipeline complexity tonight.
- Serve statically. Must be reachable from other laptops on the LAN, so bind to `0.0.0.0`, not `localhost`.
- Reconnect automatically if the websocket drops. Show a small connection status dot.
- Design for a projector and for people standing back. Big type, high contrast, dark theme per the colour tokens.
- Test on the actual laptops that will be on the table. Screen sizes differ.

## Definition of done

- Loads as any of the three hospitals via URL param
- All required elements respond live to the mock server
- Reachable from another machine on the same wifi
- Looks like the same product as the server dashboard

## Your Q&A lane

You defend the node-side workflow. Be able to explain:

- What a hospital actually installs and runs, a local agent and their existing data stays put
- What leaves the machine, weights only, and roughly how many kilobytes
- What the hospital gets back, an improved global model
- Why an operator, not a specialist, can run screening with this
- That the images shown are public dataset samples, not real patient records

**Expected question:** "Could the hospital opt out mid-training?" Answer: yes, that is the dropout case, and we demo it. Federated systems are designed for partial participation.
