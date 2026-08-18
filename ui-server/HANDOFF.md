# Handoff, Person 3 to Person 5

This dashboard runs against `contract/mock_server.py` with placeholder numbers. Before the real demo it needs these real values from Person 5's experiments.

## Values needed

1. Local-only baseline accuracy for `hosp_a`
2. Local-only baseline accuracy for `hosp_b`
3. Local-only baseline accuracy for `hosp_c`
4. Final FedAvg accuracy
5. Final FedProx accuracy
6. Preferred epsilon ceiling, if measured differently from the placeholder
7. Surveillance iframe path or URL, once `ui-surveillance/index.html` is ready

## Where these go in app.js

Open `ui-server/app.js`. The values live in two constants near the top of the file.

```js
const LOCAL_BASELINES = {
  hosp_a: 0.68, // PERSON 5: replace with local-only baseline for hosp_a
  hosp_b: 0.66, // PERSON 5: replace with local-only baseline for hosp_b
  hosp_c: 0.64 // PERSON 5: replace with local-only baseline for hosp_c
};

const EPSILON_CEILING = 6.0; // PERSON 5: replace if final privacy-utility result uses a different ceiling
```

Replace the three `LOCAL_BASELINES` numbers with the measured local-only accuracy per hospital from `results/cross_site_comparison.png` and `results/RESULTS.md`. These drive the three faint baseline lines on the accuracy chart and the crossing detection that triggers the "federated model now beats every individual hospital" label.

Replace `EPSILON_CEILING` if the final privacy-utility curve settles on a different ceiling than 6.0. This value drives the epsilon gauge fill percentage and the amber warning threshold at 70 percent.

The final FedAvg and FedProx accuracy numbers do not need a code change. They arrive live over the websocket in the `aggregate.strategy` and `aggregate.global_acc` fields once `core/server.py` is running for real instead of the mock server.

## Surveillance iframe

The dashboard reserves a panel that loads `../ui-surveillance/index.html` by default, or a URL passed as `?surveillance=<url>` in the ui-server page address. If the default path does not resolve, the panel shows a fallback label reading "surveillance map slot" instead of a broken iframe. Once `ui-surveillance/` is built and served somewhere reachable from the projector laptop, either:

- Confirm the relative path `../ui-surveillance/index.html` will work when both apps are served from a shared root, or
- Tell Person 3 the actual URL to hardcode, or pass it via `?surveillance=` on the dashboard URL used at demo time.
