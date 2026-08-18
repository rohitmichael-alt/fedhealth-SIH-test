# Person 3: Aggregation server dashboard

**Branch:** `feat/ui-server`
**Folder:** `ui-server/`

This goes on the projector. It is the screen everyone in the room looks at for most of the pitch. It has to look like a product, not a student project.

---

## Required elements

**1. Live network graph, the centrepiece.**
Three hospital nodes arranged around a central server node. Animate a packet travelling from a node to the centre on every `client_update`, with the byte size labelled on the packet. On `round_start`, animate packets going outward from the server to all nodes.

Nodes pulse while `client_training` events arrive for them. A dropped node greys out on `client_dropout`.

Use SVG or canvas. This is the single most visually valuable element you own, spend your time here.

**2. Global accuracy curve.**
Live line chart, accuracy versus round, from `aggregate.global_acc`. Overlay three fainter horizontal lines showing each hospital's local-only baseline accuracy, which Person 5 gives you as static numbers. The moment the federated line crosses above all three baselines is a story beat. Highlight it, for example flash the crossing point and label it "federated model now beats every individual hospital".

**3. Epsilon budget gauge.**
A fuel-gauge or depleting bar showing cumulative epsilon against a stated ceiling. Label clearly: "privacy budget consumed, epsilon = X of Y". Turn amber `#FFB020` above 70 percent.

Add a small caption: "lower epsilon means stronger privacy". Judges will not know what epsilon is, and this caption does your explaining for you.

**4. Round and throughput panel.**
Current round of total, total bytes exchanged this session, and a large counter reading TOTAL PATIENT RECORDS RECEIVED: 0.

That zero on the server screen is the mirror of the zero on the hospital screens. It closes the loop.

**5. Strategy indicator.**
Shows `aggregate.strategy`, FedAvg or FedProx. Small, but Person 3 will be asked about it, and it prompts the question you want.

**6. Panel slot for surveillance.**
Reserve a region for Person 5's district map, loaded as an iframe or component from `ui-surveillance/`. Agree the embed method with them in the first hour.

## Technical notes

- Bind to `0.0.0.0`, projector laptop may not be the brain
- Dark theme, colour tokens from `contract/events.md`
- Assume 1920x1080 projector, test at that resolution, and assume the back row is far away
- Animations should be smooth but not distracting during speech. No sound.
- Reconnect automatically on websocket drop

## Definition of done

- All panels respond live to the mock server
- Network graph animates packets on real events, not on a timer
- Accuracy curve renders the baseline comparison
- Runs full screen with no browser chrome visible

## Your Q&A lane

You defend **non-IID and aggregation strategy**, the most technical lane. Be able to explain without notes:

- What non-IID means, and the three types: label skew, feature skew, quantity skew
- Client drift, why averaging models trained on different distributions can produce something worse than any single one
- What FedProx adds, a proximal penalty keeping local training near the global model, controlled by mu
- Your actual FedAvg versus FedProx numbers, get these from Person 5
- Why we did not use SCAFFOLD, more communication overhead, and FedProx was sufficient at our scale

**Expected question:** "Why does the federated model beat local models?" Answer: each hospital alone overfits to its own scanner and population. Aggregation exposes the model to all three distributions without any of them sharing data, so it generalises across sites. Point at the crossing point on your chart.
