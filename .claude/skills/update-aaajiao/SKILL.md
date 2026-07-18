---
name: update-aaajiao
description: >
  Update the aaajiao agent skill after new content is added to docs/.
  Use when new interviews, project documents, letters, media articles, or works data
  are added to the repository and the aaajiao SKILL.md needs to reflect them.
  Triggers: "update skill", "update aaajiao skill", "new content added", "refresh skill".
---

# Update aaajiao Skill

When new content is added to `docs/` or `aaajiao_works.json`, follow this process to update `skills/aaajiao/SKILL.md`.

## Step 0: Sync works database

The works database is maintained by a scraper in a separate repo. Pull the latest:

```bash
curl -s https://raw.githubusercontent.com/aaajiao/aaajiao_scraper/main/aaajiao_works.json -o aaajiao_works.json
```

New docs (interviews, letters, project documents, media) are added directly to `docs/` in this repo. There is no external docs source — `woshiaaajiao` has been archived.

## Step 1: Identify what changed

```bash
git diff --name-only HEAD~5  # or however many commits back
```

Check which categories were added or modified:
- `docs/interview/` — new interviews or podcasts
- `docs/letter/` — new personal writing
- `docs/opencall/` — new exhibition applications
- `docs/project/` — new or updated project documents
- `docs/media/articles/` — new media coverage
- `docs/media/pdf/` — new print media
- `aaajiao_works.json` — new artworks

## Step 2: Check works database

Compare `aaajiao_works.json` against the Key Works table in SKILL.md:

```bash
# Count total works
python3 -c "import json; works=json.load(open('aaajiao_works.json')); print(f'{len(works)} works')"

# List works from last 2 years not yet in SKILL.md
python3 -c "
import json, datetime
works = json.load(open('aaajiao_works.json'))
cutoff = datetime.date.today().year - 1
for w in works:
    y = w.get('year','')
    parts = y.split('-')
    try: end = int(parts[-1])
    except: end = 0
    if end >= cutoff:
        print(f\"{y:12} | {w['title']:40} | {w['type']:20}\")
"
```

For each new work, ask: **does it introduce a new concept, method, or critical position?** If yes, add to Key Works. If it extends an existing pattern (e.g. another installation in the same series), skip.

## Step 3: Read the new docs

Read each new file thoroughly. While reading, extract:

1. **New concepts or vocabulary** — terms aaajiao uses that aren't in the Key Vocabulary table
2. **New stances or positions** — views that refine or extend the Core Stances section
3. **New works** — artworks from docs that demonstrate new thinking (cross-reference with Step 2)
4. **Voice samples** — quotes that capture how aaajiao thinks and speaks (for the Voice section)
5. **Methodology refinements** — new articulations of the concept-as-filter method or critical lens

## Step 4: Decide what to update

The SKILL.md has a strict economy. Not everything goes in. Apply these filters:

| Add to SKILL.md | Keep only in docs/ |
|------------------|--------------------|
| Structural concepts (new filters, new vocabulary) | Specific arguments or examples |
| Core stances that shape ALL future thinking | Positions on specific topics |
| Works that demonstrate a new methodology | Works that extend existing patterns |
| Quotes that define voice or method | Quotes that illustrate existing patterns |

**Rule: SKILL.md is the distillation. docs/ is the memory. If it's not structural, it stays in docs/.**

## Step 5: Update SKILL.md sections

For each finding, update the appropriate section:

### New vocabulary → Key Vocabulary table
```markdown
| Term | Chinese | Meaning |
```
Keep entries concise. One line per term.

### New stance → Core Stances section
Only add if it's a genuinely new position, not a restatement. Each stance should follow the pattern: **Bold name** — what it means, why it matters, one concrete example.

### New work → Key Works table
```markdown
| Work | Year | Medium | Core Concept |
```
Only add works that introduce a new concept or method. Not every new work needs to be listed.

### New critical lens → Critical Lens list
Only add if it's a genuinely new analytical question, not covered by existing checks.

### New voice insight → Voice section
Only add rules that would change how an agent writes as aaajiao.

## Step 6: Update Knowledge Base references

Add new files to the appropriate table in the Knowledge Base section:

```markdown
| Document | Path | Content |
```

Include a one-line description of what the document contains and why an agent would read it.

## Step 7: Sync media indexes and file counts

If anything was added under `docs/media/`:

1. Add an entry to the matching index — `docs/media/online-index.md` for articles,
   `docs/media/print-index.md` for PDFs. Every entry lists the original source URL plus
   a `Repo:` line with the in-repo path:

   ```markdown
   ## Article Title - source, Month Year
   Repo: `docs/media/articles/2026-01_source_slug.md`

   https://original-source-url
   ```

2. Verify full index coverage — every file in `articles/` and `pdf/` must be referenced
   by an index:

   ```bash
   python3 -c "
   import os, unicodedata
   body = open('docs/media/online-index.md').read() + open('docs/media/print-index.md').read()
   body = unicodedata.normalize('NFC', body)
   for sub in ['articles', 'pdf']:
       missing = [f for f in os.listdir(f'docs/media/{sub}')
                  if not f.startswith('.') and unicodedata.normalize('NFC', f) not in body]
       if missing: print(f'{sub} NOT indexed: {missing}')
   "
   ```

   (The NFC normalization matters: macOS lists accented filenames like `Numéro` in NFD,
   while git and the index text use NFC.)

3. Update the hardcoded file counts wherever they appear. Currently "58 articles + 40 PDFs"
   and "docs/ (108 files)" live in:
   - `skills/aaajiao/SKILL.md` — Critical Reception table
   - `README.md` — repo structure section
   - `src/components/SkillTab.tsx` — "What It Contains" card (also the works count and SKILL.md word count)
   - `public/llms.txt` — media links
   - `CLAUDE.md` — Knowledge Base section

## Step 8: Verify

After editing, check:
- [ ] SKILL.md is still under ~5k tokens (run `wc -w skills/aaajiao/SKILL.md` — target < 3500 words)
- [ ] No duplicate entries in vocabulary or works tables
- [ ] All file paths in Knowledge Base match actual files in the repo
- [ ] New GitHub raw URLs are correct: `https://raw.githubusercontent.com/aaajiao/aaajiao.md/main/` + path
- [ ] Media index coverage check (Step 7.2) passes
- [ ] `metadata.version` in the SKILL.md frontmatter is bumped (the discovery endpoint parses name/description/version from this frontmatter and exposes them at `/.well-known/agent-skills/index.json`)

## Step 9: Commit

Commit both the new docs and the updated SKILL.md together, so the skill and its references stay in sync.

## What NOT to change

- The **Who** section — only update if biographical facts change
- The **How He Sees the World** section — only update if the methodology fundamentally evolves
- The **Double Helix** diagram — only update if the framework structure changes
- The **Behaviors DO/DON'T** — only update if a new pattern of misuse is discovered

These sections are the stable core. They change rarely.
