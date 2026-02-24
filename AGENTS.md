# Agentic Metadata Orchestration Guide

## Objective
Generate, validate, and insert chapter enhancement metadata using an orchestrator pattern with specialized sub-agents and deterministic Python scripts.

## Example Metadata Artifact
- `src/content/chapters/metadata/pride-and-prejudice/chapter-1/metadata.json`

## Orchestrator Agent (Agentic Architect)
Name: `chapter-metadata-orchestrator`

Responsibilities:
1. Load source chapter text and target metadata path.
2. Dispatch generation to the metadata composer agent.
3. Run Python validation scripts through the validation agent.
4. Route failed sections to reviewer agent and request targeted rewrites.
5. Dispatch approved image prompts to image direction agent.
6. Build and execute deterministic insertion plan for quotes/images/analysis.
7. Emit final status report (`pass`, `pass_with_warnings`, `fail`) with file paths.

Primary prompt for orchestrator:
```text
You are the Chapter Metadata Orchestrator. Coordinate specialist agents to produce compliant metadata.
Enforce: 7 analysis paragraphs (2-3 sentences), 7 image prompts with alt text, and 7 memorable quotes in Callout format.
Use canonical fields: analysis_entries, image_prompt_entries, quote_entries.
All entries must include insertion anchors and insertion_method in {replace, append, wrap}.
Do not ship if validation fails.
```

## Sub-Agent 1: Metadata Composer Agent
Name: `metadata-composer-agent`

Role:
- Create or update metadata JSON with strict schema and content quality.
- Produce analysis labels in `[n]` form and map each item to a sentence-level insertion anchor.

Prompt template:
```text
You are Metadata Composer.
Input chapter text: {{chapter_path}}
Output metadata path: {{metadata_path}}
Requirements:
- 7-7-7 minimum pattern
- analysis paragraphs are 2-3 sentences each
- analysis labels use [1]...[7]
- image prompts are consistent Renaissance oil painting style
- each image prompt includes alt_text
- each memorable quote includes Callout-ready MDX
- each item includes anchor_text_end_of_sentence and insertion_method
- output arrays are analysis_entries, image_prompt_entries, quote_entries
Return valid JSON only.
```

## Sub-Agent 2: Python Validation Agent
Name: `python-validation-agent`

Role:
- Run deterministic checks and produce machine-readable failure reports.
- Block insertion when required checks fail.

Scripts:
- `scripts/metadata/validate_schema.py`
- `scripts/metadata/validate_777.py`
- `scripts/metadata/validate_sentence_counts.py`
- `scripts/metadata/validate_callout_blocks.py`
- `scripts/metadata/validate_anchors.py`
- `scripts/metadata/validate_insertion_methods.py`

Example commands:
```bash
python scripts/metadata/validate_schema.py --metadata src/content/chapters/metadata/pride-and-prejudice/chapter-1/metadata.json
python scripts/metadata/validate_777.py --metadata src/content/chapters/metadata/pride-and-prejudice/chapter-1/metadata.json
python scripts/metadata/validate_anchors.py --metadata src/content/chapters/metadata/pride-and-prejudice/chapter-1/metadata.json --chapter src/content/chapters/pride-and-prejudice-chapter-1.mdx
```

Failure contract:
- Emit `reports/metadata/<chapter>/validation_failures.json`.
- Include `item_id`, `field`, `reason`, and `suggested_fix`.
- Forward only failing items to reviewer agent.

## Sub-Agent 3: Metadata Reviewer Agent
Name: `metadata-reviewer-agent`

Role:
- Repair only failing fragments identified by validation.
- Preserve untouched content and IDs.

Prompt template:
```text
You are Metadata Reviewer.
Patch only the failed items listed in {{failure_report}}.
Do not rewrite passing entries.
Maintain schema, IDs, and insertion anchors.
Return corrected JSON fragments keyed by item_id.
```

## Sub-Agent 4: Image Direction Agent
Name: `image-direction-agent`

Role:
- Refine image prompt wording for visual consistency and historical coherence.
- Ensure alt text remains descriptive and SEO/screen-reader friendly.

Prompt template:
```text
You are Image Direction Agent.
Input: approved metadata image_prompt_entries[]
Goal: strengthen prompt clarity while preserving Renaissance oil painting style.
Constraints: no style drift, no modern artifacts, keep alt_text explicit and factual.
Return updated image_prompt_entries[] only.
```

## Sub-Agent 5: Deterministic Insertion Agent
Name: `deterministic-insertion-agent`

Role:
- Insert generated quotes/images/analysis into source chapter text by exact anchor phrase policy.

Scripts:
- `scripts/metadata/build_insertion_plan.py`
- `scripts/metadata/apply_insertions.py`
- `scripts/metadata/verify_insertions.py`

Method semantics:
- `append`: insert block immediately after the sentence containing `anchor_text_end_of_sentence`.
- `wrap`: wrap the matched sentence in a generated container (for quotes, usually `Callout`).
- `replace`: replace an already-generated legacy block associated with the same anchor.

Example command:
```bash
python scripts/metadata/apply_insertions.py \
  --chapter src/content/chapters/pride-and-prejudice-chapter-1.mdx \
  --metadata src/content/chapters/metadata/pride-and-prejudice/chapter-1/metadata.json \
  --output src/content/chapters/pride-and-prejudice-chapter-1-enhanced.mdx
```

## Handoff Order
1. `chapter-metadata-orchestrator`
2. `metadata-composer-agent`
3. `python-validation-agent`
4. `metadata-reviewer-agent` (only on failures)
5. `image-direction-agent`
6. `deterministic-insertion-agent`
7. `python-validation-agent` (final verification pass)
8. `chapter-metadata-orchestrator` final decision

## Release Gate
Do not publish enhanced chapter output unless all are true:
1. 7 analysis entries, 7 image prompts, 7 memorable quotes.
2. Analysis entries each have 2-3 sentences.
3. Every image prompt has `alt_text`.
4. Every quote has valid Callout MDX payload.
5. Every insertion target resolves to a unique sentence anchor.
