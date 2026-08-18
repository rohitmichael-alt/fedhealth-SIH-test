#!/usr/bin/env bash
set -e

echo "building fedhealth repo structure"

mkdir -p fedhealth/contract fedhealth/docs
mkdir -p fedhealth/core fedhealth/ui-hospital fedhealth/ui-server fedhealth/ui-attacker
mkdir -p fedhealth/ui-surveillance fedhealth/attack fedhealth/results fedhealth/pitch
mkdir -p fedhealth/assets/fundus

mv ROOT__README.md fedhealth/README.md

mv contract__events.md fedhealth/contract/events.md
mv contract__mock_server.py fedhealth/contract/mock_server.py

mv docs__00-FOUNDATIONS-READ-FIRST.md fedhealth/docs/00-FOUNDATIONS-READ-FIRST.md
mv docs__README.md fedhealth/docs/README.md
mv docs__CLAUDE_CODE_PROMPTS.md fedhealth/docs/CLAUDE_CODE_PROMPTS.md
mv docs__person-1-core-fl.md fedhealth/docs/person-1-core-fl.md
mv docs__person-2-ui-hospital.md fedhealth/docs/person-2-ui-hospital.md
mv docs__person-3-ui-server.md fedhealth/docs/person-3-ui-server.md
mv docs__person-4-attack.md fedhealth/docs/person-4-attack.md
mv docs__person-5-results-surveillance.md fedhealth/docs/person-5-results-surveillance.md
mv docs__person-6-pitch.md fedhealth/docs/person-6-pitch.md

for d in core ui-hospital ui-server ui-attacker ui-surveillance attack results pitch assets/fundus; do
  echo "owner builds here" > "fedhealth/$d/.gitkeep"
done

cat > fedhealth/.gitignore <<'GITIGNORE'
__pycache__/
*.py[cod]
.venv/
venv/
env/
.ipynb_checkpoints/
node_modules/
dist/
build/
.DS_Store
Thumbs.db
*.pt
*.pth
*.onnx
core/checkpoints/
data/
datasets/
assets/fundus/*
!assets/fundus/.gitkeep
attack/frames/
.env
.vscode/
.idea/
GITIGNORE

cd fedhealth
git init -q
git add -A
git commit -q -m "repo scaffold, docs and frozen event contract"

echo ""
echo "done. repo is at ./fedhealth"
echo ""
echo "next:"
echo "  cd fedhealth"
echo "  git remote add origin <your-github-url>"
echo "  git branch -M main && git push -u origin main"
echo ""
echo "then create the six branches:"
echo "  for b in core-fl ui-hospital ui-server attack-console surveillance pitch; do git branch feat/\$b; done"
echo "  git push origin --all"
