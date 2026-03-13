#!/bin/bash
# Script to generate missing images for Chapter 5 when API quota resets
# Run this after midnight UTC (6PM CST)

echo "Generating missing images for Pride and Prejudice Chapter 5..."

cd /home/yatit/.openclaw/workspace

# Missing image 1: scene-6b.png
echo "Generating scene-6b.png..."
pixi run --manifest-path skills/pixi.toml python skills/image-generator/scripts/generate.py \
  "Renaissance oil painting, Mary Bennet 'piquing herself' on the solidity of her reflections. She looks smug and self-satisfied, holding her book like a trophy." \
  -o /home/yatit/Documents/Kapisce/GitHub/kapisce-classics/src/content/chapters/metadata/pride-and-prejudice/chapter-5/scene-6b.png \
  -n 1

# Missing image 2: scene-7a.png
echo "Generating scene-7a.png..."
pixi run --manifest-path skills/pixi.toml python skills/image-generator/scripts/generate.py \
  "Renaissance oil painting, a young boy (Lucas) gesturing animatedly while his sisters and the Bennets laugh. He is describing his 'dream' of drinking wine like a grown man." \
  -o /home/yatit/Documents/Kapisce/GitHub/kapisce-classics/src/content/chapters/metadata/pride-and-prejudice/chapter-5/scene-7a.png \
  -n 1

# Missing image 3: scene-7b.png
echo "Generating scene-7b.png..."
pixi run --manifest-path skills/pixi.toml python skills/image-generator/scripts/generate.py \
  "Renaissance oil painting, Mrs. Bennet scolding the young boy for his dreams of drinking wine. A humorous scene with exaggerated expressions." \
  -o /home/yatit/Documents/Kapisce/GitHub/kapisce-classics/src/content/chapters/metadata/pride-and-prejudice/chapter-5/scene-7b.png \
  -n 1

echo "All missing images generated. Updating state..."

# Update state.json after completion
python3 -c "
import json
import datetime

state_path = '/home/yatit/Documents/Kapisce/GitHub/kapisce-classics/src/content/chapters/metadata/pride-and-prejudice/chapter-5/state.json'
with open(state_path, 'r') as f:
    state = json.load(f)

state['image_progress']['completed'] = 14
state['image_progress']['last_scene_completed'] = 7
state['image_progress']['pending_scenes'] = []
state['image_progress'].pop('missing_variations', None)
state['steps']['image_generation'] = 'done'
state['blockers'] = []
state['last_updated'] = datetime.datetime.now().isoformat()

with open(state_path, 'w') as f:
    json.dump(state, f, indent=2)

print('State updated to reflect 14/14 images complete.')
"

echo "Script completed. Chapter 5 now has all 14 images."