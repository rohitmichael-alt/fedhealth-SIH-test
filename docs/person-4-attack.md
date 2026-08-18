# Person 4: Attack console and adversarial evaluation

**Branch:** `feat/attack-console`
**Folder:** `ui-attacker/`, `attack/`

You own the single most important 60 seconds of the pitch. This laptop gets handed to the judge.

**Start the gradient inversion job before you write any UI.** It runs for a long time in the background while you build.

---

## Part A: the attacks, `attack/`

### A1. Gradient inversion, priority one

Reconstruct a training image from an intercepted weight update.

- Take a client update checkpoint from Person 1 with DP off
- Optimise a randomly initialised dummy image so that the gradient it produces matches the intercepted gradient
- Standard approach: cosine similarity loss between dummy gradient and target gradient, plus total variation regularisation, Adam optimiser
- **Save a frame every N iterations** to `attack/frames/no_dp/`. You need the sequence from noise to recognisable, this is what you replay on stage.
- Repeat with the DP-enabled checkpoint, saving to `attack/frames/dp/`. This one should stay noise.

Start this now. It is your long pole.

### A2. Membership inference, priority two

Determine whether a given record was in the training set. Threshold on model confidence or loss. Report attack accuracy with and without DP. Two numbers is enough, this is a supporting result, not a demo centrepiece.

### A3. Results

Write `attack/RESULTS.md` with a small table:

| Attack | DP off | DP on |
|---|---|---|
| Gradient inversion | visually recognisable, report SSIM or PSNR against original | unrecognisable, report same metric |
| Membership inference | attack accuracy % | attack accuracy % |

Numbers, not adjectives. Person 6 puts this table in the deck.

## Part B: the attacker console, `ui-attacker/`

This is a hostile-looking interface. Different visual language from the rest of the product: monospace, terminal aesthetic, red accents. It should feel like a different actor.

**Elements:**

1. **Intercepted traffic feed.** Live rows from `client_update` events showing source client, size, payload type. Looks like a packet sniffer.

2. **A big INTERCEPT AND RECONSTRUCT button.** The judge presses this. On press, emit an `intercept` event and start the reconstruction playback.

3. **Reconstruction viewport.** Replays your saved frames from noise to result over roughly 8 to 12 seconds. Show an iteration counter climbing so it reads as computation, not a video. Side by side with the original ground-truth image once complete.

4. **A DP toggle switch.** Physically prominent. Judge flips it, presses the button again, and the reconstruction stays noise. Also emits a `privacy` event with `dp_enabled` flipped so all three hospital screens turn red or green in sync. Coordinate this with Person 2.

5. **Verdict banner.** After a run: "RECONSTRUCTION SUCCESSFUL, patient image recovered from model weights" in red, or "ATTACK FAILED, no recoverable signal" in green.

## Honesty rule, non-negotiable

The reconstruction is precomputed and replayed for time. **If a judge asks whether it is live, say so plainly:** the reconstruction was computed from an intercepted update from this system and is replayed here because the optimisation takes several minutes. That is normal practice and completely defensible. Getting caught claiming it is live is not survivable.

Put a small caption in the UI: "replay of offline reconstruction, round 7 intercept".

## Definition of done

- Both frame sequences exist and play
- Judge can operate the console with one button and one toggle
- DP toggle propagates to hospital screens
- `attack/RESULTS.md` has real numbers

## Your Q&A lane

You defend **the threat model and privacy attacks**. Be able to explain:

- The four adversaries and which you defend against: honest-but-curious server (secure aggregation, roadmap), external eavesdropper (TLS plus aggregation), curious participant (DP), malicious client (**not solved**, robust aggregation like trimmed mean or Krum is next)
- Why weights leak: the gradient is a function of the input, so the input can be optimised for
- What DP does mechanically: clip per-sample gradients, add calibrated gaussian noise
- Why federated learning alone is data minimisation, not privacy

**Expected question:** "What if a hospital sends poisoned updates?" Answer: model poisoning is real and we do not fully defend against it today. Robust aggregation is our next step. We chose to solve privacy properly before solving poisoning partially. Say it confidently, admitting a gap makes everything else credible.
