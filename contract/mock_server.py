import asyncio
import json
import random
import websockets

CLIENTS = ["hosp_a", "hosp_b", "hosp_c"]
DISTRICTS = ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"]
TOTAL_ROUNDS = 15

connected = set()


async def broadcast(event):
    if not connected:
        return
    msg = json.dumps(event)
    await asyncio.gather(*[ws.send(msg) for ws in list(connected)], return_exceptions=True)


async def handler(ws):
    connected.add(ws)
    try:
        await ws.wait_closed()
    finally:
        connected.discard(ws)


async def simulate():
    while True:
        acc = 0.42
        eps = 0.0
        for rnd in range(1, TOTAL_ROUNDS + 1):
            await broadcast({
                "type": "round_start",
                "round": rnd,
                "total_rounds": TOTAL_ROUNDS,
                "clients": CLIENTS,
            })
            await asyncio.sleep(0.5)

            for c in CLIENTS:
                samples = {"hosp_a": 412, "hosp_b": 318, "hosp_c": 270}[c]
                for p in [0.25, 0.5, 0.75, 1.0]:
                    await broadcast({
                        "type": "client_training",
                        "client": c,
                        "samples": samples,
                        "progress": p,
                        "local_loss": round(1.4 - p * 0.5 + random.uniform(-0.05, 0.05), 3),
                    })
                    await asyncio.sleep(0.25)
                await broadcast({
                    "type": "client_update",
                    "client": c,
                    "bytes": random.randint(178000, 190000),
                    "images_sent": 0,
                    "payload_type": "model_weights",
                })
                await asyncio.sleep(0.2)

            acc = min(0.89, acc + random.uniform(0.015, 0.045))
            eps = round(eps + random.uniform(0.15, 0.25), 2)

            await broadcast({
                "type": "aggregate",
                "round": rnd,
                "global_acc": round(acc, 3),
                "per_client_acc": {c: round(acc + random.uniform(-0.04, 0.04), 3) for c in CLIENTS},
                "strategy": "FedProx",
            })
            await broadcast({
                "type": "privacy",
                "round": rnd,
                "epsilon": eps,
                "delta": 1e-5,
                "dp_enabled": True,
                "noise_multiplier": 1.1,
                "clip_norm": 1.0,
            })

            if rnd % 3 == 0:
                for d in DISTRICTS:
                    await broadcast({
                        "type": "surveillance",
                        "district": d,
                        "cases": random.randint(60, 220),
                        "severity_high": random.randint(10, 55),
                        "noised": True,
                    })

            if rnd == 7:
                await broadcast({"type": "client_dropout", "client": "hosp_c", "round": rnd})

            await asyncio.sleep(1.0)

        await asyncio.sleep(3)


async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("mock event server on ws://0.0.0.0:8765")
        await simulate()


if __name__ == "__main__":
    asyncio.run(main())
