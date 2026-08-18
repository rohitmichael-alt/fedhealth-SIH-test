# How to turn this folder into the repo

Every file here is named with its destination path encoded, using `__` in place of a slash.

- `ROOT__README.md` goes to `README.md` at the repo root
- `contract__events.md` goes to `contract/events.md`
- `docs__person-1-core-fl.md` goes to `docs/person-1-core-fl.md`

and so on.

---

## Option A, the script, fastest

Put every file from this folder into one empty directory, then:

```bash
chmod +x SETUP.sh
./SETUP.sh
```

It creates the folder structure, moves every file into place, adds `.gitkeep` files, writes a `.gitignore`, and makes the first commit.

Then:

```bash
cd fedhealth
git remote add origin <your-github-url>
git branch -M main
git push -u origin main

for b in core-fl ui-hospital ui-server attack-console surveillance pitch; do git branch feat/$b; done
git push origin --all
```

## Option B, Claude Code

`cd` into the folder holding these files and paste:

```
Every file in this folder is named with its destination path encoded, using __ in place
of a slash. ROOT__ means the repo root.

Create a folder called fedhealth and move each file to its decoded path inside it. For
example contract__events.md becomes fedhealth/contract/events.md, and ROOT__README.md
becomes fedhealth/README.md.

Also create these empty folders each containing a .gitkeep file: core, ui-hospital,
ui-server, ui-attacker, ui-surveillance, attack, results, pitch, assets/fundus.

Create a .gitignore covering Python caches, virtualenvs, node_modules, .DS_Store, model
checkpoints (*.pt, *.pth), core/checkpoints/, attack/frames/, and dataset folders, but do
not ignore the .gitkeep files.

Then run git init, git add -A, and commit with the message
"repo scaffold, docs and frozen event contract".

Do not modify the contents of any file. Only move, rename and create.
```

## Option C, manual

Create the folders yourself and drag each file across, stripping the prefix and replacing
`__` with a slash.

---

## Final structure

```
fedhealth/
├── README.md
├── .gitignore
├── contract/
│   ├── events.md
│   └── mock_server.py
├── docs/
│   ├── 00-FOUNDATIONS-READ-FIRST.md
│   ├── README.md
│   ├── CLAUDE_CODE_PROMPTS.md
│   ├── person-1-core-fl.md
│   ├── person-2-ui-hospital.md
│   ├── person-3-ui-server.md
│   ├── person-4-attack.md
│   ├── person-5-results-surveillance.md
│   └── person-6-pitch.md
├── core/
├── ui-hospital/
├── ui-server/
├── ui-attacker/
├── ui-surveillance/
├── attack/
├── results/
├── pitch/
└── assets/fundus/
```

## Then tell the team

| Person | Branch | Reads |
|---|---|---|
| 1 | `feat/core-fl` | `docs/00-FOUNDATIONS-READ-FIRST.md`, then `docs/person-1-core-fl.md` |
| 2 | `feat/ui-hospital` | foundations, then `docs/person-2-ui-hospital.md` |
| 3 | `feat/ui-server` | foundations, then `docs/person-3-ui-server.md` |
| 4 | `feat/attack-console` | foundations, then `docs/person-4-attack.md` |
| 5 | `feat/surveillance` | foundations, then `docs/person-5-results-surveillance.md` |
| 6 | `feat/pitch` | foundations, then `docs/person-6-pitch.md` |

Everyone then opens `docs/CLAUDE_CODE_PROMPTS.md` and runs their section.
