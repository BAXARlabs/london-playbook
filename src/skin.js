// Skin registry. Static imports so the same module works in the Astro config
// (plain Node) and inside the Vite bundle during `generating static routes`.
import playbook from './skins/playbook.json' with { type: 'json' };
import truefan from './skins/truefan.json' with { type: 'json' };
import ujc from './skins/ujc.json' with { type: 'json' };

const REGISTRY = { playbook, truefan, ujc };
const SKIN = process.env.SKIN || 'playbook';

function resolve(id, seen = new Set()) {
  if (seen.has(id)) throw new Error(`Circular skin extends: ${id}`);
  seen.add(id);
  const raw = REGISTRY[id];
  if (!raw) throw new Error(`Unknown skin "${id}". Known: ${Object.keys(REGISTRY).join(', ')}`);
  return raw.extends ? merge(resolve(raw.extends, seen), raw) : raw;
}

// Deep merge, child wins. Arrays replace wholesale — a skin that declares
// `scoreboard` or `partners` means all of them, not a partial patch.
function merge(base, child) {
  const out = { ...base };
  for (const [k, v] of Object.entries(child)) {
    if (k === 'extends') continue;
    const b = base[k];
    out[k] = (v && typeof v === 'object' && !Array.isArray(v) && b && typeof b === 'object' && !Array.isArray(b))
      ? merge(b, v) : v;
  }
  return out;
}

const skin = resolve(SKIN);
skin.id = SKIN;
export default skin;
