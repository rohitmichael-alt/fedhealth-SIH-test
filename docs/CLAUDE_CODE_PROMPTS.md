# Claude Code prompts

Find your section. Clone the repo, check out your branch, `cd` into the repo root, start Claude Code, paste your prompt.

**Before pasting, everyone runs:**
```
git clone <repo-url> && cd fedhealth
git checkout -b <your-branch>
python -m pip install websockets
python contract/mock_server.py
```
Leave the mock server running in a second terminal.

**Rules to keep in every prompt.** Do not delete these lines when you paste:
- only create files inside your assigned folder
- read `contract/events.md` first and conform to it exactly
- no em dashes in any output, including UI text
- no code comments

---

## Person 1, `feat/core-fl`

```
Read README.md, docs/person-1-core-fl.md and contract/events.md first.

Build a federated learning system in core/ only. Do not touch any other folder.

Requirements:
1. core/event_bus.py, a websocket server on 0.0.0.0:8765 that broadcasts JSON events to all connected clients. Build and verify this FIRST before any ML code, other people are blocked on it.
2. core/data.py, loads APTOS 2019 diabetic retinopathy images, resizes to 224x224, and partitions into three non-IID clients: hosp_a oversampled on grades 3 and 4, hosp_b oversampled on grades 0 and 1, hosp_c mixed grades with gaussian blur, colour channel shift and JPEG compression applied to simulate a different camera. Write the partition indices to core/splits.json.
3. core/model.py, EfficientNet-B0 or ResNet18, pretrained, 5-class head.
4. core/client.py, a Flower NumPyClient with fit and evaluate that emits client_training and client_update events during training.
5. core/server.py, Flower strategy supporting both FedAvg and FedProx with configurable mu, emitting round_start, aggregate and privacy events.
6. Differential privacy with Opacus at each client: per-sample gradient clipping at clip_norm 1.0, gaussian noise with configurable noise_multiplier, RDP accountant reporting cumulative epsilon each round.
7. core/config.yaml holding rounds, local epochs, learning rate, batch size, mu, noise multiplier, clip norm, dp enabled, strategy. No demo parameter should require editing Python.
8. core/run.py, CLI entry point with flags --strategy fedavg|fedprox, --dp/--no-dp, --rounds N. Uses flwr.simulation.start_simulation with 3 clients.
9. Save client weight checkpoints to core/checkpoints/ for at least one round, both with DP off and DP on. Person 4 is blocked on these.
10. Emit a client_dropout event for hosp_c at round 7, then let it rejoin.

Every event must match contract/events.md exactly, field names and types. Target under 4 minutes for 15 rounds on CPU, reduce dataset size if needed.

Only create files inside core/. Read contract/events.md and conform to it exactly. No em dashes anywhere. No code comments.
```

---

## Person 2, `feat/ui-hospital`

```
Read README.md, docs/person-2-ui-hospital.md and contract/events.md first.

Build a hospital node dashboard in ui-hospital/ only. Do not touch any other folder.

Single page app, served statically, bound to 0.0.0.0 so other laptops on the LAN can reach it. Reads ?client=hosp_a|hosp_b|hosp_c from the URL and renders as that hospital using the identity table in contract/events.md. Connects to ws://<host>:8765 with automatic reconnect and a connection status dot.

Elements, in visual priority order:
1. IMAGES SENT: 0 as the single largest element on screen, green #2ECC71, with the subtitle "raw patient data transmitted this session". This is the most important pixel in the project, make it dominate.
2. Hospital identity header with name, location, population description, and a distinct accent colour per hospital.
3. Local patient queue, a grid of 8 to 12 fundus thumbnails from assets/fundus/ with patient IDs like PT-2291 and grade badges. Tiles pulse during client_training events for this client. A lock icon labelled "stays on this device".
4. Local training panel, progress bar from client_training.progress, current round, local loss, sample count.
5. Outbound transmission log, a scrolling terminal-style log. On every client_update for this client append two rows: one showing model_weights with the byte size, one showing patient_images with 0 B. Timestamped.
6. Privacy status chip showing DP ON with the current epsilon in green, flipping to DP OFF in red #FF4D4D when a privacy event has dp_enabled false.
7. On client_dropout for this client, grey the panel and show "node offline, training continues without this node", then recover on the next round_start.

Dark theme using the colour tokens in contract/events.md. Designed to be read from three metres away on a laptop screen. Large type, high contrast.

Only create files inside ui-hospital/. Read contract/events.md and conform to it exactly. No em dashes anywhere. No code comments.
```

---

## Person 3, `feat/ui-server`

```
Read README.md, docs/person-3-ui-server.md and contract/events.md first.

Build the aggregation server dashboard in ui-server/ only. Do not touch any other folder.

Full-screen dashboard for a 1920x1080 projector, bound to 0.0.0.0, connecting to ws://<host>:8765 with automatic reconnect.

Elements:
1. Live network graph as the centrepiece. Three hospital nodes around a central server node, SVG or canvas. On round_start animate packets outward from server to nodes. On client_update animate a packet from that node to the centre labelled with its byte size. Nodes pulse while client_training events arrive for them. Grey out a node on client_dropout.
2. Global accuracy curve, live line chart of aggregate.global_acc versus round. Overlay three faint horizontal baseline lines for local-only accuracy, values configurable in a constants file. When the federated line crosses above all three, flash the crossing point and label it "federated model now beats every individual hospital".
3. Epsilon budget gauge, cumulative epsilon from privacy events shown against a configurable ceiling, amber #FFB020 above 70 percent. Caption underneath reading "lower epsilon means stronger privacy".
4. Round and throughput panel: current round of total, cumulative bytes exchanged, and a large TOTAL PATIENT RECORDS RECEIVED: 0 counter in green.
5. Strategy indicator showing aggregate.strategy.
6. An empty reserved panel region for an embedded surveillance map, loadable via iframe from ui-surveillance/.

Dark theme using the colour tokens in contract/events.md. Smooth animations, no sound, nothing distracting during speech. Must run full screen with no browser chrome visible.

Only create files inside ui-server/. Read contract/events.md and conform to it exactly. No em dashes anywhere. No code comments.
```

---

## Person 4, `feat/attack-console`

```
Read README.md, docs/person-4-attack.md and contract/events.md first.

Build in attack/ and ui-attacker/ only. Do not touch any other folder.

PART A, attack/, build this first:
1. attack/gradient_inversion.py, reconstructs a training image from an intercepted model update. Loads a client checkpoint from core/checkpoints/, initialises a dummy image from random noise, and optimises it so its gradient matches the intercepted gradient using cosine similarity loss plus total variation regularisation with Adam. Saves a frame every N iterations to attack/frames/no_dp/ as numbered PNGs. Runs the same against a DP-enabled checkpoint saving to attack/frames/dp/. Also saves the ground-truth original image for side-by-side comparison. Make this runnable immediately as a long background job.
2. attack/membership_inference.py, threshold-based membership inference on model confidence or loss, reporting attack accuracy with DP on and off.
3. attack/RESULTS.md, a table of both attacks with DP off versus DP on, including SSIM or PSNR for the reconstruction. Numbers, not adjectives.

PART B, ui-attacker/:
Single page app bound to 0.0.0.0, connecting to ws://<host>:8765. Deliberately hostile visual language, distinct from the rest of the product: monospace, terminal aesthetic, red #FF4D4D accents on dark background.
1. Intercepted traffic feed, live rows from client_update events showing source client, byte size, payload type, styled like a packet sniffer.
2. A large INTERCEPT AND RECONSTRUCT button. On press, emit an intercept event and begin reconstruction playback.
3. Reconstruction viewport that replays the saved frames from attack/frames/ over 8 to 12 seconds with a climbing iteration counter so it reads as live computation. Shows the ground-truth original side by side once complete.
4. A prominent DP toggle switch. When flipped it sends a privacy event with dp_enabled flipped so hospital dashboards change state in sync, and switches playback between the no_dp and dp frame sequences.
5. Verdict banner after each run: "RECONSTRUCTION SUCCESSFUL, patient image recovered from model weights" in red, or "ATTACK FAILED, no recoverable signal" in green.
6. A small permanent caption reading "replay of offline reconstruction, round 7 intercept". Do not remove this, we disclose that playback is precomputed.

This screen is handed to a judge, so it must be operable with one button and one toggle and nothing else.

Only create files inside attack/ and ui-attacker/. Read contract/events.md and conform to it exactly. No em dashes anywhere. No code comments.
```

---

## Person 5, `feat/surveillance`

```
Read README.md, docs/person-5-results-surveillance.md and contract/events.md first.

Build in results/ and ui-surveillance/ only. Do not touch any other folder.

PART A, results/, priority, launch these runs before building anything else:
1. results/run_experiments.py, loads the partition from core/splits.json so the split matches the core system exactly, then trains and evaluates: three local-only models one per client, a federated FedAvg model, and a federated FedProx model. Each evaluated on all three clients' test sets.
2. results/cross_site_comparison.png, grouped bar chart of every model tested on every client's test set. The story it must show is that local models do well on their own data and badly on others, while federated does well everywhere.
3. results/fedavg_vs_fedprox.png, accuracy versus round for both strategies on the same split.
4. results/privacy_utility.png, final accuracy versus epsilon at epsilon values of roughly 1, 3, 6 and no DP.
5. results/RESULTS.md, all three charts embedded, the raw numbers in tables, and two sentences of interpretation each. Report results honestly even if FedAvg performs comparably to FedProx.

PART B, ui-surveillance/, lower priority:
Single page app bound to 0.0.0.0, connecting to ws://<host>:8765, embeddable in an iframe.
1. A simplified Tamil Nadu district map as inline SVG with five districts: Chennai, Coimbatore, Madurai, Salem, Trichy.
2. District fill intensity driven by surveillance.cases events.
3. Clicking a district opens a small panel showing case count and high-severity count.
4. A prominent permanent caption: "aggregate counts only, differentially private, no patient records received".

Dark theme using the colour tokens in contract/events.md.

Only create files inside results/ and ui-surveillance/. Read contract/events.md and conform to it exactly. No em dashes anywhere. No code comments.
```

---

## Person 6, `feat/pitch`

```
Read README.md and docs/person-6-pitch.md first.

Work in pitch/ only. Do not touch any other folder. You are producing documents and a deck, not application code.

1. pitch/DPDP_FACTS.md. Research current information on India's DPDP Act 2023 and DPDP Rules 2025 using web search rather than memory, since details may have changed. Verify each of these with a source link: enforcement date of 13 May 2027 for substantive obligations, the 250 crore penalty and exactly which failure it attaches to, the 150 crore penalty for Significant Data Fiduciary obligations under Section 10, Rule 13 requirements for DPIA and annual audit and algorithmic due diligence, the negative-list model for cross-border transfers, the absence of a separate sensitive personal data category unlike GDPR, and the requirement to notify all breaches. Also document what a DPIA concretely requires, at least three components, and the current status of ABDM health data digitisation in India. Flag clearly anything you could not verify.

2. pitch/deck.pptx, maximum 8 slides: title with problem statement number, the three gaps, why now with the May 2027 timeline as a countdown, the three-layer architecture, results using results/cross_site_comparison.png, privacy proven not claimed using attack/RESULTS.md and results/privacy_utility.png, an explicit "what we do not claim" honesty slide, and a roadmap. Dark theme matching the colour tokens in contract/events.md. Minimal text per slide, the demo carries the pitch.

3. pitch/SCRIPT.md, a timed five-minute script with the segments and timings from docs/person-6-pitch.md, with speaker assignments for two or three presenters.

4. pitch/QA.md, consolidating the expected question from every person's brief in docs/ plus answers to: is this just Flower with a dashboard, hospitals already share data with big tech so where is the problem, Indian hospital data is not digitised so does this matter, do you have real hospital data, how much accuracy does privacy cost, and what about poisoned updates from a malicious client.

Every factual claim must be sourced. Do not overclaim anywhere: read section 3 of README.md and respect it.

Only create files inside pitch/. No em dashes anywhere.
```
