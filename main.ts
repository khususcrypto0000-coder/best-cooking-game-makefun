// main.ts — program penyerahan Warung Kilat untuk make.fun.
// Menyalin game/ dan screenshots/ dari repo ke direktori output, lalu menulis
// dossier.json memakai buildDossier dari vendor/makefun-game.ts.
// Dijalankan dua kali oleh grader; kedua run harus menghasilkan byte yang sama.
// Salinan game/ dan screenshots/ bersifat deterministik: cpSync menyalin apa
// adanya dari repo, dan buildDossier menghitung dossier dari isi direktori
// output yang sama, sehingga dossier.json identik di tiap run.
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });

const gameSrc = join(repoRoot, "game");
const shotsSrc = join(repoRoot, "screenshots");

cpSync(gameSrc, join(out, "game"), { recursive: true });
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, join(out, "screenshots"), { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(out, "dossier.json"), dossier);
