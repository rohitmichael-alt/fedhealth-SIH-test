# Person 5: Scientific results and surveillance map

**Branch:** `feat/surveillance`
**Folder:** `results/`, `ui-surveillance/`

You own the project's only real scientific claim. **Start the training runs before you build anything.** They run in the background on Colab while you build the map.

---

## Part A: results, `results/` — this is your priority

Everything else in this project is engineering. This is the part that makes it research.

### A1. The core comparison

Using Person 1's exact split from `core/splits.json`, produce:

| Model | Tested on hosp_a | hosp_b | hosp_c |
|---|---|---|---|
| Local only, hosp_a | | | |
| Local only, hosp_b | | | |
| Local only, hosp_c | | | |
| Federated, FedAvg | | | |
| Federated, FedProx | | | |

The story this table must tell: **local models do well on their own data and badly on everyone else's. Federated does well everywhere.**

Export as `results/cross_site_comparison.png`, a grouped bar chart. Give Person 3 the three local-only baseline numbers for the server dashboard.

### A2. FedAvg versus FedProx convergence

Accuracy versus round, both strategies, same split. Under non-IID, FedAvg should be noisier and plateau lower. Export `results/fedavg_vs_fedprox.png`.

If FedAvg happens to do fine, report that honestly and say heterogeneity at our scale was mild. Do not fake a gap.

### A3. Privacy-utility curve

Final accuracy versus epsilon, at least four points, for example epsilon of 1, 3, 6, and no DP. Export `results/privacy_utility.png`.

This chart is how you answer "how much accuracy does privacy cost". Person 6 needs the exact number for the deck.

### A4. Write it up

`results/RESULTS.md` with all three charts, the numbers, and two sentences of interpretation each. Every number quoted in the deck must come from this file.

## Part B: surveillance map, `ui-surveillance/`

Lower priority. Build after the runs are launched, and this is first to be dropped if time runs out.

- Tamil Nadu district outline map, five districts is enough
- Colour intensity by `surveillance.cases` from the event stream
- Click a district for a small panel showing case count and high-severity count
- A prominent caption: **"aggregate counts only, differentially private, no patient records received"**
- Embeddable into Person 3's dashboard, agree the method with them in the first hour

Keep it simple. A static SVG map with fills driven by events beats a real mapping library tonight.

## Definition of done

- Three charts exported as PNG
- `results/RESULTS.md` written with real numbers
- Baseline numbers handed to Person 3
- Privacy cost number handed to Person 6
- Map renders and responds to events, or is cleanly dropped

## Your Q&A lane

You defend **the privacy-utility tradeoff and the results**. Be able to explain:

- What epsilon means: privacy budget, lower is stronger privacy, and it accumulates each round
- Delta: the probability the guarantee fails, set below 1 over the number of records
- Your actual accuracy cost from DP, as a number
- Why the surveillance layer is safe: only aggregate counts, noised, no records
- Your methodology: same split, same model, same rounds, only the variable of interest changed

**Expected question:** "How much accuracy do you lose to privacy?" Give the number. **Never say negligible.** Then say: at epsilon of X we retain Y percent accuracy, which is above the threshold used for screening referral, and the operator decision is refer or do not refer, not diagnose.
