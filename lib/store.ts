import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isPlatform, type Platform } from "./platformRules";

/**
 * CopyDogg is single-user and self-hosted: everything lives in one JSON file
 * on the machine running the app. Server-side only — never import this from
 * a client component.
 */

export interface Persona {
  id: string;
  name: string;
  voiceDescription: string | null;
  toneFormality: number;
  toneHumor: number;
  toneBluntness: number;
  toneWarmth: number;
  emojiDensity: number;
  hashtagTolerance: number;
  rules: string[];
  samplePosts: string[];
  platforms: Platform[];
  platformVoices: Partial<Record<Platform, string>>;
  createdAt: string;
}

export interface Topic {
  id: string;
  label: string;
}

export interface Generation {
  id: string;
  platform: Platform;
  promptInput: string;
  toneOverride: string | null;
  outputs: string[];
  chosenOutput: string | null;
  feedback: -1 | 0 | 1;
  saved: boolean;
  createdAt: string;
}

export interface StoreData {
  version: 1;
  persona: Persona | null;
  topics: Topic[];
  generations: Generation[];
}

// Resolved at runtime; the ignore comment stops the bundler tracing the whole project.
export const DATA_DIR = path.resolve(
  /*turbopackIgnore: true*/
  process.env.COPYDOGG_DATA_DIR || path.join(process.cwd(), "data")
);
export const DATA_FILE = path.join(DATA_DIR, "copydogg.json");

function emptyStore(): StoreData {
  return { version: 1, persona: null, topics: [], generations: [] };
}

async function readFile(): Promise<StoreData> {
  let raw: string;
  try {
    raw = await fs.readFile(DATA_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyStore();
    throw error;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      version: 1,
      persona: parsed.persona ?? null,
      topics: parsed.topics ?? [],
      generations: parsed.generations ?? [],
    };
  } catch {
    // Never silently replace a file we can't read — that would wipe the user's data.
    throw new Error(
      `CopyDogg couldn't parse ${DATA_FILE}. Fix or move that file, then restart.`
    );
  }
}

async function writeFile(data: StoreData) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

// Writes are serialized through one promise chain. It lives on globalThis so
// route handlers and server actions (separate bundles, same process) share it.
const globalQueue = globalThis as { __copydoggWriteQueue?: Promise<unknown> };

function mutate<T>(change: (data: StoreData) => T): Promise<T> {
  const run = (globalQueue.__copydoggWriteQueue ?? Promise.resolve()).then(async () => {
    const data = await readFile();
    const result = change(data);
    await writeFile(data);
    return result;
  });
  globalQueue.__copydoggWriteQueue = run.catch(() => {});
  return run;
}

// ---- Reads ----------------------------------------------------------------

export function readStore(): Promise<StoreData> {
  return readFile();
}

export async function getPersona(): Promise<Persona | null> {
  return (await readFile()).persona;
}

export async function getRecentLikedOutputs(limit: number): Promise<string[]> {
  const { generations } = await readFile();
  return generations
    .filter((g) => g.feedback === 1)
    .slice(-limit)
    .reverse()
    .map((g) => g.chosenOutput ?? g.outputs[0]);
}

// ---- Writes ---------------------------------------------------------------

export type PersonaInput = Omit<Persona, "id" | "name" | "createdAt">;

/** Creates the single persona, or replaces its contents (keeping id and name). */
export function savePersona(input: PersonaInput): Promise<Persona> {
  return mutate((data) => {
    const persona: Persona = {
      id: data.persona?.id ?? randomUUID(),
      name: data.persona?.name ?? "Default",
      createdAt: data.persona?.createdAt ?? new Date().toISOString(),
      ...input,
    };
    data.persona = persona;
    return persona;
  });
}

export function updatePersona(
  patch: Partial<PersonaInput>
): Promise<Persona | null> {
  return mutate((data) => {
    if (!data.persona) return null;
    data.persona = { ...data.persona, ...patch };
    return data.persona;
  });
}

export function setTopics(labels: string[]): Promise<void> {
  return mutate((data) => {
    const existing = new Map(data.topics.map((t) => [t.label, t]));
    data.topics = [...new Set(labels)].map(
      (label) => existing.get(label) ?? { id: randomUUID(), label }
    );
  });
}

export function addGeneration(
  input: Pick<Generation, "platform" | "promptInput" | "toneOverride" | "outputs">
): Promise<Generation> {
  return mutate((data) => {
    const generation: Generation = {
      id: randomUUID(),
      chosenOutput: null,
      feedback: 0,
      saved: false,
      createdAt: new Date().toISOString(),
      ...input,
    };
    data.generations.push(generation);
    return generation;
  });
}

export function updateGeneration(
  id: string,
  patch: Partial<Pick<Generation, "saved" | "feedback" | "chosenOutput">>
): Promise<boolean> {
  return mutate((data) => {
    const generation = data.generations.find((g) => g.id === id);
    if (!generation) return false;
    Object.assign(generation, patch);
    return true;
  });
}

export function resetStore(): Promise<void> {
  return mutate((data) => {
    Object.assign(data, emptyStore());
  });
}

// ---- Input cleaning (shared by server actions) ----------------------------

export function cleanPlatforms(value: unknown): Platform[] {
  return Array.isArray(value) ? [...new Set(value.filter(isPlatform))] : [];
}

export function cleanPlatformVoices(value: unknown): Partial<Record<Platform, string>> {
  if (!value || typeof value !== "object") return {};
  const result: Partial<Record<Platform, string>> = {};
  for (const [key, note] of Object.entries(value)) {
    if (isPlatform(key) && typeof note === "string" && note.trim()) {
      result[key] = note.trim().slice(0, 1000);
    }
  }
  return result;
}

export function cleanTone(value: unknown, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function cleanStrings(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}
