# Person 1: Federated learning core, the brain

**Branch:** `feat/core-fl`
**Folder:** `core/`
**You are the critical path.** Four other people depend on your event stream. Ship the emitter early even if training is still rough.

---

## What you are building

A Flower simulation with three clients training a diabetic retinopathy classifier on a deliberately non-IID split, with differential privacy at each client, emitting the events in `contract/events.md` over a websocket on port 8765.

## Build order, do not reorder

**1. Websocket emitter first, before any ML.**
Get `core/event_bus.py` broadcasting on `ws://0.0.0.0:8765`. Confirm a browser can connect. The moment this works, tell the team, because everyone can switch off the mock.

**2. Data and non-IID split.**
Use APTOS 2019 from Kaggle. Downscale to 224x224. Take a subset, roughly 1500 images total, speed beats accuracy tonight.

Partition as specified in `contract/events.md`:
- `hosp_a`, severe skew: oversample grades 3 and 4
- `hosp_b`, mild skew: oversample grades 0 and 1
- `hosp_c`, mixed grades, then apply degradation to simulate a different camera: gaussian blur plus a colour channel shift plus mild JPEG compression

Save the partition indices to `core/splits.json` so Person 5 can reproduce your exact split for the results charts. This matters, your numbers and theirs must match.

**3. Model.**
EfficientNet-B0 or ResNet18, pretrained, 5-class head. Nothing exotic.

**4. Flower simulation.**
`flwr.simulation.start_simulation` with 3 clients, `NumPyClient` with `fit` and `evaluate`. Start with `FedAvg`, then add `FedProx` with configurable `mu`. Expose strategy as a CLI flag so Person 5 can run both.

**5. Differential privacy.**
Opacus at each client. Per-sample gradient clipping with `clip_norm=1.0`, gaussian noise with `noise_multiplier` configurable. Use the RDP accountant to report cumulative epsilon after each round. Add a `--dp` flag so DP can be toggled off, which Person 4 needs for the attack demo.

**6. Save artefacts for other people.**
- `core/checkpoints/round_N_hosp_a.pt`, at least one round's raw client update with DP off. Person 4 needs this for gradient inversion.
- `core/checkpoints/round_N_hosp_a_dp.pt`, same round with DP on.
- Tell Person 4 the moment these exist. This is a blocker for them.

**7. Dropout event.**
Make one client drop out at a fixed round and emit `client_dropout`, then recover. This is a demo beat.

## Config file

Put everything in `core/config.yaml`: rounds, local epochs, learning rate, batch size, mu, noise multiplier, clip norm, dp on or off, strategy. Nobody should edit Python to change a demo parameter.

## Definition of done

- `python core/run.py` starts, emits every event type in the contract, and completes 15 rounds in under 4 minutes
- Works with `--strategy fedavg` and `--strategy fedprox`
- Works with `--dp` and `--no-dp`
- Checkpoints written for Person 4
- `core/splits.json` written for Person 5

## Your Q&A lane

You defend the federated architecture. Be able to explain, without notes:

- The round loop: distribute, train locally, return weights, aggregate, repeat
- What FedAvg actually computes, a weighted average by dataset size
- Why the server holds no data and never sees an image
- What is co-located in this demo and what would be distributed in deployment, and why that does not change the protocol
- Communication cost per round, quote the actual kilobyte number from your logs

**Expected question:** "Isn't this just Flower?" Answer: Flower is our transport and orchestration layer, the way a web app uses a web server. Our work is the non-IID handling, the DP accounting, the attack evaluation and the compliance layer.
