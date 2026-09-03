# London Playbook

One codebase, three skinned sites. American-football fan guide to London —
12 curated tours, shared across every skin.

## Skins

| Skin | Site | Build |
|---|---|---|
| `playbook` | LONDON PLAYBOOK — the neutral master, an Aileron VIP product | `SKIN=playbook npm run build` |
| `truefan`  | Xs & Os of London — TrueFan Travel × Passyunk, NFL London | `SKIN=truefan npm run build` |
| `ujc`      | The College Fan Playbook — Union Jack Classic, Wembley | `SKIN=ujc npm run build` |

## How it works

- `src/data/tours.json` — **the shared core.** Add a tour here and every skin gets it.
- `src/skins/<id>.json` — what each site overrides. `extends: "playbook"` means
  inherit everything, then override only what you name.
- `src/skin.js` — deep-merges child over parent. Objects merge; arrays replace
  wholesale (declaring `scoreboard` means all of it, not a patch).

To add a skin: drop a new `src/skins/<id>.json` with `"extends": "playbook"`,
register it in `src/skin.js`, add a Vercel project with `SKIN=<id>`.

To exclude a tour from one skin: `"tours": { "exclude": ["08"] }`.
To reword one: `"tours": { "overrides": { "08": { "short": "..." } } }`.
