# Claude Code Project Instructions

## Project Overview

Mojido (文字道 - "The Way of Characters") is a Japanese reading practice app. Users see Japanese characters and type the romaji from memory. The app validates input character-by-character and provides instant feedback.

## Tech Stack

- **Framework:** Tauri v2 + Svelte 5 + SvelteKit
- **Styling:** TailwindCSS v4 + shadcn-svelte
- **i18n:** Paraglide (all text must use messages)
- **Database:** SQLite via tauri-plugin-sql
- **Package Manager:** Bun (NOT npm)

## Key Development Rules

### 1. Always Use Bun
```bash
bun add <package>      # NOT npm install
bun run <script>       # NOT npm run
bunx <command>         # NOT npx
```

### 2. Always Use Paraglide for Text
```svelte
<!-- NEVER -->
<Button>Quit</Button>

<!-- ALWAYS -->
<Button>{m.practice_quit()}</Button>
```

### 3. Always Use Theme Tokens for Colors
```svelte
<!-- NEVER -->
<span class="text-gray-500">

<!-- ALWAYS -->
<span class="text-muted-foreground">
```

### 4. Svelte 5 Runes

Use Svelte 5 runes syntax:
```svelte
let count = $state(0);
const doubled = $derived(count * 2);

$effect(() => {
  console.log(count);
});
```

### 5. Component Props

```svelte
interface Props {
  value: string;
  onchange?: (v: string) => void;
}

let {value, onchange}: Props = $props();
```

## Frontend Style Review

After writing or modifying frontend code, spawn a review agent to check compliance with UI/UX guidelines.

**Agent configuration:**

- Tool: `Task`
- Subagent type: `general-purpose`

**Agent prompt:**

```
Review the frontend code that was just written/modified against the UI/UX guidelines.

Read the guidelines file: docs/ui-ux/GUIDELINES.md

Check the code for violations and report findings grouped by severity:

## Report Format

### [5/5 - Critical]
- Line X in `path/to/file.svelte`
  Description of violation.
  See: Guidelines section reference

### [4/5 - Important]
- ...

### [3/5 - Recommended]
- ...

### Summary
- Critical: N
- Important: N
- Recommended: N

If no violations found, report: "No violations found."
```

## Mojido-Specific: Typing Experience

The typing UX is the core of the app. These rules are sacred:

### Visual Hierarchy
```
┌─────────────────────────────────────────┐
│ [Streak]                        [Quit]  │  ← Subtle header
│                                         │
│         あ  い  う  え  お              │  ← Japanese: LARGE, current highlighted
│                                         │
│              a i|                       │  ← Typed: medium, mono, cursor visible
│                                         │
│         ═══════════════                 │  ← Progress: subtle bar
│                                         │
│        Correct: 10/15  Best: 5          │  ← Stats: muted, small
└─────────────────────────────────────────┘
```

### Character State Colors
| State | Japanese | Typed Romaji |
|-------|----------|--------------|
| Pending | `text-muted-foreground` | (not shown) |
| Current | `text-foreground` | `text-foreground` + cursor |
| Correct | `text-muted-foreground` | `text-green-600/70` (muted) |
| Error | - | `text-destructive` (last char) |

### Typing Rules
1. **Instant feedback** - No animation delay on keypress
2. **Block on error** - Can't proceed until backspace
3. **No expected romaji shown** - User must recall from memory
4. **Visual clarity** - Current char highlighted, completed muted

### Romaji Validation
```typescript
import {tokenize, matchRomaji} from "$lib/utils/romaji";

const tokens = tokenize(reading); // "きょう" → Token[]
const result = matchRomaji(tokens, index, input);
// result.matched = complete match
// result.partial = valid so far, need more
// neither = error
```

## File Structure

```
src/
├── routes/
│   ├── +layout.svelte      # App shell, theme
│   └── +page.svelte        # Main page
├── lib/
│   ├── components/
│   │   ├── ui/             # shadcn components
│   │   ├── PracticeView.svelte
│   │   ├── SentenceDisplay.svelte
│   │   ├── TypingDisplay.svelte
│   │   ├── HintToken.svelte
│   │   └── ...
│   ├── stores/
│   │   └── session.svelte.ts
│   ├── data/
│   │   └── sentences.ts
│   └── utils/
│       └── romaji.ts
```

## Axogen Commands

```bash
axogen run dev        # Start dev server
axogen run build      # Build for production
axogen run generate   # Generate sentences from Tatoeba
axogen run fmt        # Format code
```
