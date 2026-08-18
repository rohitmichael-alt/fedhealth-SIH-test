# FedHealth

**Privacy-preserving federated health intelligence for Indian hospitals.**

VITISH 2026, internal hackathon for Smart India Hackathon 2026.

Anchor problem statement: **#30 Privacy-preserving Federated AI Platform (DeepTech)**
Absorbed: **#41 Early Disease Detection**, **#47 Predictive Public Health Surveillance**

---

## 1. What this project is

FedHealth lets multiple hospitals jointly train a medical AI model without any patient data ever leaving the hospital that owns it.

Hospitals train locally. Only model weights travel. Those weights are protected with differential privacy so that even the weights cannot be reverse-engineered back into patient images. The same infrastructure carries privacy-protected aggregate statistics to a district-level public health dashboard.

Clinical vertical for this build: **diabetic retinopathy screening** from retinal fundus images, graded 0 to 4.

## 2. The problem

Three specific gaps, in order of importance.

**Accuracy gap.** A model trained at a single hospital degrades badly on another hospital's patients. Different fundus cameras, different populations, different case mixes. Every hospital individually has too little data to train a model that generalises.

**Legal gap.** Pooling the data would fix accuracy, but under India's DPDP Act 2023, with Rules notified in November 2025 and substantive obligations enforceable from **13 May 2027**, mishandled centralised health data carries penalties up to **250 crore rupees** for failure of reasonable security safeguards. No Indian-context tooling exists for compliant collaborative training.

**Surveillance gap.** Public health agencies have no live view of disease burden because the data sits locked inside disconnected hospital systems.

## 3. What we are honest about

Do not overclaim in any document, PR, or presentation. These are the project's real limits:

- Hospitals in India are **not currently forbidden** from sharing data. The legal risk becomes concrete in 2027. We build for that regime.
- Federated learning does **not** solve poor digitisation, non-standard formats, or annotation cost. Those remain prerequisites.
- Privacy is **not free**. It costs accuracy, and we measure exactly how much.
- We have **no clinical validation** and make no diagnostic claims.
- We are **not building a better framework** than Flower or NVIDIA FLARE. We build the Indian compliance and deployment layer on top of Flower.

## 4. The solution, three layers

**Layer 1, federated training.** Hospitals train a shared diabetic retinopathy grading model. Only weights move. FedProx handles non-IID data caused by different scanners and populations.

**Layer 2, privacy enforcement.** Local differential privacy at each client with a tracked epsilon budget. Verified by running real gradient inversion and membership inference attacks against our own system and reporting success rates with and without DP.

**Layer 3, compliance and surveillance.** Audit logging of every round, bytes exchanged, epsilon consumed and participating nodes. DP-noised aggregate case counts feed a district-level public health map.

## 5. Architecture

```
Hospital A            Hospital B            Hospital C
local data            local data            local data
local training        local training        local training
DP clip + noise       DP clip + noise       DP clip + noise
     |                     |                     |
     +----------- weights only, no images -------+
                           |
                  Aggregation server (brain)
                  FedProx aggregation
                  privacy accountant
                  websocket event bus
                           |
        +------------------+------------------+
        |                  |                  |
  Global model      Surveillance map     Audit dashboard
  back to nodes     district heat map    rounds, bytes, epsilon
                           |
                    Attacker console
                    proves the guarantee by trying to break it
```

## 6. Demo staging

Five machines on the table.

| Machine | Shows |
|---|---|
| Brain | Runs the Flower simulation and the websocket event bus. Not shown to judges. |
| Hospital A | Local patient queue, local training, IMAGES SENT: 0 |
| Hospital B | Same, different data skew |
| Hospital C | Same, degraded image quality skew |
| Server / projector | Network graph, accuracy curve, epsilon gauge, surveillance map |
| Attacker | Handed to the judge. Intercept and reconstruct. |

The three hospital UIs and the server UI are browser clients connecting to the brain over local network. Training processes are co-located on the brain for this review. **This is stated openly if asked.** The protocol is unchanged; node distribution is a deployment detail.

## 7. Repo structure

```
fedhealth/
├── README.md                 this file
├── docs/                     per-person task briefs, read yours
├── contract/                 event schema and mock server, DO NOT EDIT without telling everyone
├── core/                     Flower FL simulation, DP, event emitter
├── ui-hospital/              hospital node dashboard
├── ui-server/                aggregation server dashboard
├── ui-attacker/              judge-operated attack console
├── ui-surveillance/          district heat map
├── attack/                   gradient inversion and membership inference scripts
├── results/                  FedAvg vs FedProx charts, privacy-utility curve
├── pitch/                    deck, script, DPDP fact sheet
└── assets/fundus/            sample retinal images
```

## 8. Ground rules for today

1. **Touch only your own folder.** The only shared files are in `contract/`, and those are frozen.
2. **Build against `contract/mock_server.py`**, never against someone else's unfinished code.
3. **PR early**, even if incomplete. Small merges beat one big merge at midnight.
4. **Merge bar is low tonight.** Does it run, does it connect, does it not break anyone else. Code style is not reviewed today.
5. **Hard cutoff three hours before sleep.** Whatever works at that point gets recorded end to end. The recording is the real deliverable.

## 9. Drop order if time runs out

Drop in this order and no other:

1. Surveillance map
2. Epsilon gauge
3. Third hospital node

**Never drop the attacker console.** It is the only part of this demo nobody else in the room will have.

## 10. Branches

| Branch | Owner | Folder |
|---|---|---|
| `feat/core-fl` | Person 1 | `core/` |
| `feat/ui-hospital` | Person 2 | `ui-hospital/` |
| `feat/ui-server` | Person 3 | `ui-server/` |
| `feat/attack-console` | Person 4 | `ui-attacker/`, `attack/` |
| `feat/surveillance` | Person 5 | `ui-surveillance/`, `results/` |
| `feat/pitch` | Person 6 | `pitch/` |
