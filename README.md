# Mojido (文字道)

**The Way of Characters** - A Japanese reading practice app that teaches you to read Japanese by typing romaji from memory.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.1.0-green.svg)

## How It Works

1. **See Japanese** - A sentence appears with the current token highlighted
2. **Recall the reading** - You must remember the romaji (no hints shown by default)
3. **Type it** - Your typed romaji appears below with instant feedback
4. **Learn from mistakes** - Errors block progress until you backspace and correct them

This is **active recall** practice - you're training your brain to recognize and read Japanese characters, not just copy what you see.

## Features

- **Real sentences** from Tatoeba - learn with meaningful context, never random characters
- **Token-by-token validation** with instant green/red feedback
- **Kanji hints** - click any kanji (dotted underline) to reveal its reading
- **Smart romaji handling**:
  - Multiple input styles accepted (し = "shi" or "si", つ = "tsu" or "tu")
  - Proper ん handling (requires "nn" before vowels/y-sounds)
  - っ (small tsu) consonant doubling
- **Day streak tracking** with celebration on first sentence each day
- **Progress tracking** - per-character accuracy stored locally
- **Dark mode** support

## Screenshots

*Coming soon*

## Installation

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Rust](https://rustup.rs/) (for Tauri)

### Development

```bash
# Install dependencies
bun install

# Run development server
bun run tauri:dev

# Or use axogen
bunx axogen run dev
```

### Build

```bash
# Build for production
bun run tauri:build

# Or use axogen
bunx axogen run build
```

## Tech Stack

- **Frontend**: Svelte 5, SvelteKit, TailwindCSS v4
- **UI Components**: shadcn-svelte
- **Desktop**: Tauri v2
- **Database**: SQLite (via tauri-plugin-sql)
- **i18n**: Paraglide

## Data Sources

- **Sentences**: [Tatoeba](https://tatoeba.org/) (CC BY 2.0 FR)
- **Tokenization**: [Kuroshiro](https://github.com/hexenq/kuroshiro) + kuromoji

## Generating Sentences

The app comes with pre-generated sentences. To regenerate:

```bash
bunx axogen run generate
```

This downloads Japanese sentences from Tatoeba, tokenizes them with readings, and outputs to `src/lib/data/sentences-generated.ts`.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Tatoeba contributors for the sentence corpus
- The Kuroshiro project for Japanese text processing
