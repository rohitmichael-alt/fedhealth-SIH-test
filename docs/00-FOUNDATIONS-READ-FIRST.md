# READ THIS BEFORE YOU BUILD ANYTHING

**FedHealth shared foundations. All six people. No exceptions.**

Budget 30 to 40 minutes. Read it once properly now. You will lose more than 40 minutes later if you build the wrong thing or freeze during Q&A.

This document is what **everyone** must know. Your individual brief in `docs/person-N-*.md` is what **only you** must know. Read this one first.

---

## PART 0: WHY THIS DOCUMENT EXISTS

Three failure modes kill projects like ours at review:

1. **The demo works but nobody can explain it.** A judge asks a basic question, the person who built that panel is not the one holding the mic, and the team goes quiet. Fatal.
2. **Different people describe the project differently.** Person 2 calls it a hospital app, Person 5 calls it a privacy framework, Person 6 calls it a public health platform. Judges conclude the team does not know what it built.
3. **Somebody overclaims.** One sentence like "hospitals legally cannot share data today" gets corrected by a faculty member, and every other claim you made becomes suspect.

This document prevents all three. By the end you will be able to explain the whole project in 60 seconds, define every term a judge might throw at you, and know exactly which claims are off limits.

---

## PART 1: THE 60-SECOND EXPLANATION

Learn this. Not word for word, but you should be able to produce it cold.

> Hospitals each hold patient scans. Individually none of them has enough data to train a reliable AI screening model, and the model one hospital trains works badly on another hospital's patients because the cameras and populations differ.
>
> They could fix this by pooling the data, but from May 2027 India's DPDP Act makes mishandled centralised health data a liability of up to 250 crore rupees.
>
> So we do it without pooling. Each hospital trains locally on its own data and sends only the model weights, never a single image. A server averages those weights into a shared model and sends it back. Repeat, and everyone ends up with a model better than any of them could train alone.
>
> The catch is that weights themselves can leak. An attacker can reconstruct a patient's retina from an intercepted update. So we add differential privacy, which mathematically bounds what any single patient contributes, and we prove it works by running the attack against ourselves live.
>
> The same infrastructure then carries privacy-protected aggregate counts to a district health map, so public health gets visibility without receiving a single record.

If you can say that, you can survive most of Q&A.

---

## PART 2: THE CONCEPTS

### 2.1 Why normal machine learning fails here

Normal ML: gather all data in one place, train one model, deploy.

For medical AI in India that collapses:

- Patient data is legally sensitive, so moving it out of a hospital creates liability
- Hospitals will not hand data to a competitor or a startup
- Any one hospital alone has too little data for a model that generalises

Result: everyone has a small dataset, nobody pools, everyone gets a weak model.

### 2.2 Federated Learning

**Definition:** training one shared model across many organisations without any of them sending raw data anywhere. Only model updates travel.

**One round, five steps:**

1. Server holds a global model W
2. Server sends a copy of W to each hospital, called a client
3. Each hospital trains its copy on its own local data for a few epochs
4. Each hospital sends back only the trained weights
5. Server combines them into an improved global model, then repeat

Fifteen rounds in our demo.

**Vocabulary:**

| Term | Meaning |
|---|---|
| Client | One participant holding local data. Here, one hospital. |
| Server / aggregator | Coordinator that combines updates. Holds no data. |
| Round | One full cycle of distribute, train, return, aggregate. |
| Local epochs | Passes each client makes over its own data per round. |
| Global model | The shared model the server maintains. |

**The key legal property:** raw data never leaves the hospital's premises or jurisdiction.

### 2.3 FedAvg

The default aggregation rule. A weighted average of client weights, weighted by dataset size.

If A has 500 images, B has 300, C has 200:

```
W_global = 0.5 * W_A + 0.3 * W_B + 0.2 * W_C
```

That is the whole algorithm. It is not a neural network. It is arithmetic on numbers.

### 2.4 Non-IID data, the central technical problem

**IID** means Independent and Identically Distributed: every client's data comes from the same distribution.

**Non-IID** means it does not. In real hospitals it never does:

- A referral centre sees mostly severe cases
- A rural screening camp sees mostly healthy patients
- A district hospital uses a different camera brand, so images have different colour and sharpness

**Three types you should be able to name:**

| Type | Meaning | Our example |
|---|---|---|
| Label skew | Different class proportions | hosp_a is grade 3 and 4 heavy |
| Feature skew | Same labels, different appearance | hosp_c has a different camera |
| Quantity skew | Very different dataset sizes | 412 vs 318 vs 270 samples |

**Why it breaks FedAvg:** each client trains toward its own local optimum. Those optima point in different directions. Averaging them can land somewhere worse than any individual model. This is **client drift**.

This is the intellectual core of the project. If you remember one technical concept, remember this one.

### 2.5 FedProx

FedProx adds a penalty to each client's local training that discourages drifting far from the global model it received. Strength controlled by a parameter **mu**.

Plain English: it tells each hospital "improve the shared model, do not run off and build your own."

We compare FedAvg against FedProx under our deliberately skewed split. That comparison is our main scientific result. Person 5 owns the numbers, but everyone should know the comparison exists and why.

**SCAFFOLD** is a stronger alternative using drift-correction terms. We did not use it because it costs more communication and FedProx was sufficient at our scale. Know that sentence in case someone asks.

### 2.6 Why weights alone still leak

Intuition says weights are safe because they are just numbers. Wrong, and this is where the project gets its teeth.

**Gradient inversion.** An attacker intercepting an update asks: what input image, if fed through this model, would produce exactly this gradient? Starting from random noise and optimising, the attacker reconstructs a recognisable version of the training image. This has been demonstrated on medical images in published work.

**Membership inference.** Weaker but still damaging. The attacker asks whether a specific person's record was in the training set. Models behave slightly differently on data they have seen. For a diabetic retinopathy model, confirming membership reveals that a named person was screened for diabetes complications, which is itself sensitive.

**Conclusion everyone must internalise:** federated learning alone is **data minimisation, not privacy**. It needs a second layer. That second layer is what makes us more than a Flower tutorial.

### 2.7 Differential Privacy

**Definition:** a mathematical guarantee that the output is nearly identical whether or not any single individual's data was included.

**Mechanism, two steps:**

- **Clipping.** Cap how much any single training sample can influence the update. Without it, one outlier patient dominates and becomes easy to extract.
- **Noise.** Add calibrated gaussian noise to the clipped update. Enough to hide any one patient, small enough that it averages out across clients and rounds so the model still learns.

**Epsilon**, the privacy budget:

- Low epsilon, say 1: strong privacy, more noise, lower accuracy
- High epsilon, say 10: weak privacy, less noise, higher accuracy
- It **accumulates**. Every round spends some budget.

**Delta:** probability the guarantee fails. Conventionally set below 1 divided by the number of records.

**Privacy accountant:** the bookkeeping that tracks cumulative epsilon. We use the Rényi DP accountant via Opacus.

**The tradeoff sentence everyone must be able to say:** privacy and accuracy trade against each other, and our job is to find the point where privacy is meaningful and accuracy is still clinically useful. **Never say the cost is negligible.** Quote Person 5's actual number.

**Local vs central DP:**

- **Local:** each client adds noise before sending. No trust in the server required. More total noise.
- **Central:** server adds noise after aggregating. Requires trusting the server.

We use local DP, because the guarantee then does not depend on trusting our own server.

### 2.8 Secure aggregation

DP stops individuals being extracted from an update. Secure aggregation stops the server seeing individual updates at all.

**How the simple version works:** each pair of clients agrees on a shared random mask. One adds it, the other subtracts it. Individually the updates look like noise. Summed by the server, the masks cancel and the true total survives.

Result: the server learns the aggregate and nothing about any single hospital.

**Status in our build:** designed and explained, on the roadmap, not implemented tonight. Say that honestly if asked.

### 2.9 Threat model

Always be able to name who you defend against. Ours:

| Adversary | What they can do | Our defence |
|---|---|---|
| Honest-but-curious server | Sees all updates, follows the protocol | Secure aggregation, roadmap |
| External eavesdropper | Intercepts network traffic | TLS plus aggregation |
| Curious participant hospital | Sees the final global model | Differential privacy |
| Malicious client | Sends poisoned updates to corrupt the model | **Not solved.** Robust aggregation is next. |

Naming the one you do not solve is what makes the other three believable. Never pretend to solve everything.

### 2.10 Diabetic retinopathy, our clinical vertical

Diabetes damages small blood vessels in the retina. Undetected, it progresses to blindness. It is visible early in a photograph of the back of the eye, a **fundus image**.

Grades 0 to 4: no DR, mild, moderate, severe, proliferative.

**Why we chose it, four reasons, know all four:**

1. Large public datasets exist, APTOS 2019 and EyePACS, so we need no patient data
2. It is a clean 5-class classification task, so our engineering time goes into the federated layer where the real contribution is
3. Screening is done by camera operators, not specialists, so the workflow already tolerates AI assistance
4. India has a very large diabetic population and a severe shortage of ophthalmologists

### 2.11 DPDP Act 2023, the legal layer

Getting these wrong destroys credibility faster than any technical error. Person 6 owns the detail and is verifying every figure with sources, but **everyone must know these**:

- Act passed 2023, Rules notified November 2025
- Substantive obligations enforceable from **13 May 2027**. Always say "from May 2027", never "currently illegal"
- **Up to 250 crore rupees** for failure of reasonable security safeguards leading to a personal data breach
- **Up to 150 crore rupees** for breach of Significant Data Fiduciary obligations under Section 10
- **Rule 13**: SDFs must conduct a DPIA and an audit annually, plus algorithmic due diligence
- Cross-border transfers use a **negative list**, allowed except to restricted countries
- **No separate sensitive personal data category**, unlike GDPR
- **All** breaches must be notified, not only high-risk ones

**Our strongest legal hook:** in federated learning the data never crosses an institutional or national boundary, so an entire category of compliance risk disappears by design rather than by policy.

### 2.12 The tools

**Flower (flwr):** open-source federated learning framework. Handles client-server communication and round orchestration. We use `start_simulation` to run all clients on one machine.

**Opacus:** PyTorch differential privacy library. Per-sample gradient clipping, noise, epsilon accounting.

**Our position on both:** they are our transport and privacy primitives, the way a web app uses a web server. Our contribution sits on top.

---

## PART 3: WHAT THE PROJECT IS

### 3.1 One line

A federated learning platform letting Indian hospitals jointly train medical AI and contribute to public health surveillance without patient data ever leaving their premises, with privacy guarantees mapped to the DPDP Act.

### 3.2 The three gaps

**Accuracy gap.** Single-site models degrade badly on other hospitals' patients. No hospital alone has enough data.

**Legal gap.** Pooling fixes accuracy but becomes a concrete liability from May 2027, and no Indian-context tooling exists for compliant collaborative training.

**Surveillance gap.** Public health agencies have no live view of disease burden because data sits locked in disconnected hospital systems.

### 3.3 The three layers

**Layer 1, federated training.** Shared DR grading model. Weights only. FedProx handles non-IID.

**Layer 2, privacy enforcement.** Local DP with tracked epsilon, verified by running real attacks against ourselves.

**Layer 3, compliance and surveillance.** Audit logging of rounds, bytes and epsilon. DP-noised aggregate counts feeding a district map.

### 3.4 The demo, five machines

| Machine | Purpose |
|---|---|
| Brain | Runs the FL simulation and event bus. Not shown. |
| Hospital A, B, C | Browser dashboards, one per laptop |
| Server / projector | Network graph, accuracy, epsilon, map |
| Attacker | **Handed to the judge** |

Training processes are co-located on the brain. **We say this openly if asked.** The protocol is unchanged, node distribution is a deployment detail.

---

## PART 4: WHAT NOBODY MAY CLAIM

Memorise these five. One violation costs more than any feature gains.

1. **Do not say hospitals are currently forbidden from sharing.** They are not. The risk becomes concrete in 2027. In fact Google struck data-sharing deals with Indian eye hospitals precisely because it was easier here than in the US. If a judge raises this, agree with them and say that is exactly the risk we are building ahead of.

2. **Do not claim we fix digitisation or annotation.** We do not. Poor digitisation is a real prerequisite problem our system does not touch.

3. **Do not say privacy is free.** It costs accuracy. Quote the number.

4. **Do not claim clinical validation.** We have none and make no diagnostic claims.

5. **Do not claim we built a better framework than Flower or NVIDIA FLARE.** We build the Indian compliance and deployment layer on top of Flower. Complementary, not competitive.

**On real data.** If asked whether we have hospital data: no, deliberately. Getting patient scans onto a student laptop in three weeks would require exactly the informal sharing this project exists to prevent. We used public datasets and are pursuing a hospital letter of intent to participate as a node, not to hand over data.

---

## PART 5: THE SIX QUESTIONS EVERYONE MUST BE ABLE TO ANSWER

Your own brief has your specialist question. These six can land on anyone.

**Q: What does your project do?**
Give the 60-second explanation from Part 1.

**Q: Isn't this just Flower with a dashboard?**
Flower is our transport layer. Our work is the non-IID handling, the DP accounting, the adversarial evaluation and the DPDP compliance artefacts, and we have measured results for all four.

**Q: Why should the data not just be pooled?**
Because from May 2027 mishandled centralised health data carries penalties up to 250 crore, and because hospitals will not hand data to each other regardless of the law.

**Q: If only weights move, why do you need privacy at all?**
Because weights leak. Gradient inversion can reconstruct a training image from an intercepted update. We demonstrate it live and then show DP defeating it.

**Q: How much accuracy does privacy cost?**
Quote Person 5's number from `results/RESULTS.md`. Then add that at that epsilon we retain enough accuracy for a refer or do-not-refer screening decision, which is the actual clinical use.

**Q: What is the weakest part of your project?**
Say it straight: model poisoning by a malicious client, which we do not defend against yet, and the fact that Indian health data digitisation is uneven, which we depend on but do not solve. A team that names its own weaknesses reads as competent, not unprepared.

---

## PART 6: SELF-TEST

Answer out loud without looking. If you cannot, reread that section.

1. What are the five steps of one federated round?
2. What does FedAvg actually compute?
3. Name the three types of non-IID skew and give our example of each.
4. What is client drift and why does it break averaging?
5. What does FedProx add, and what does mu control?
6. Explain gradient inversion in two sentences.
7. What are the two mechanical steps of differential privacy?
8. What does epsilon mean, and does higher mean more or less privacy?
9. Name our four adversaries and which one we do not defend against.
10. When do DPDP substantive obligations become enforceable?
11. What is the 250 crore penalty specifically for?
12. Give four reasons we chose diabetic retinopathy.
13. Name three things we are not allowed to claim.
14. What is co-located in our demo that would be distributed in production?

Fourteen out of fourteen before you present. Twelve is not enough, because judges pick the two you skipped.

---

## PART 7: TERM SHEET

| Term | One line |
|---|---|
| Federated learning | Train a shared model across sites, move weights not data |
| Client | One hospital holding local data |
| Round | Distribute, train locally, return, aggregate |
| FedAvg | Weighted average of client weights by dataset size |
| Non-IID | Clients have statistically different data |
| Client drift | Clients pull the model in conflicting directions |
| FedProx | Penalty keeping local training near the global model, strength mu |
| SCAFFOLD | Drift correction with control variates, more overhead |
| Differential privacy | Clip and add noise so no individual is detectable |
| Epsilon | Privacy budget, lower is more private and less accurate |
| Delta | Probability the guarantee fails |
| Privacy accountant | Tracks cumulative epsilon across rounds |
| Local DP | Noise at the client, no server trust needed |
| Central DP | Noise at the server after aggregation |
| Secure aggregation | Masking so the server sees only the sum |
| Honest-but-curious | Adversary follows protocol but inspects what it sees |
| Gradient inversion | Reconstructing training images from weight updates |
| Membership inference | Determining whether a record was in the training set |
| Model poisoning | Malicious client corrupting the global model |
| Flower | Open-source federated learning framework |
| Opacus | PyTorch differential privacy library |
| APTOS / EyePACS | Public diabetic retinopathy fundus image datasets |
| DPDP Act 2023 | Indian data protection law, enforceable May 2027 |
| DPIA | Impact assessment, annual, required under Rule 13 for SDFs |
| SDF | Significant Data Fiduciary |
| Diabetic retinopathy | Diabetes-caused retinal damage, graded 0 to 4 from fundus images |

---

## PART 8: NOW GO

1. You have read this. Do the self-test.
2. Open `docs/person-N-*.md` for your number.
3. Open `docs/CLAUDE_CODE_PROMPTS.md`, find your section, start.
4. Run `python contract/mock_server.py` if you are building a UI.
5. Person 4 and Person 5: launch your long-running jobs **before** writing any other code.

First PR in three hours, however rough.
