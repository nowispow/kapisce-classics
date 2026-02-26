# API Quota Reset Check & Automation

## Issue
- **Service**: Gemini API / Imagen-4-fast
- **Quota**: 70 images per day
- **Status**: EXHAUSTED (70/70 used)
- **Missing Images**: 3 (scene-6b.png, scene-7a.png, scene-7b.png)

## Reset Information
- **Likely reset time**: Midnight UTC (6PM CST) OR Midnight Pacific Time (2AM CST)
- **Current test**: Still getting 429 error at 7:38PM CST Feb 25
- **Next check**: Try again after 2AM CST Feb 26

## Automation Script
```bash
# Run this when quota resets:
/home/yatit/Documents/Kapisce/GitHub/kapisce-classics/src/content/chapters/metadata/pride-and-prejudice/chapter-5/generate_missing.sh
```

## Check Schedule
1. **After 2AM CST Feb 26** (midnight Pacific time) - Test quota
2. **Morning Feb 26** - Check status again
3. **If still failing** - Consider alternate image generation method

## Manual Test Command
```bash
cd /home/yatit/.openclaw/workspace && \
pixi run --manifest-path skills/pixi.toml python skills/image-generator/scripts/generate.py \
  "Renaissance oil painting test" \
  -o /tmp/quota_test.png \
  -n 1
```

## Status Log
- **Feb 25, 7:38PM CST**: Still getting 429 quota error
- **Next check**: After 2AM CST Feb 26

## When Quota Resets
1. Run `generate_missing.sh`
2. Verify 3 images created
3. Update state.json to show 14/14 images
4. Run enhancement script for Chapter 5
5. Mark Batch 1 as fully complete