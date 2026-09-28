import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isPlatform, type Platform } from "./platformRules";
import type { GenerateMode, Relationship } from "./writingOptions";

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
  /** Older entries (before modes existed) have no mode — treat as "write". */
  mode?: GenerateMode;
  promptInput: string;
  /** The message replied to, the draft rewritten, or the post tweaked. */
  context?: string | null;
  toneOverride: string | null;
  outputs: string[];
  chosenOutput: string | null;
  feedback: -1 | 0 | 1;
  /** The user edited chosenOutput by hand — the strongest "this is me" signal. */
  edited?: boolean;
  saved: boolean;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  relationship: Relationship;
  note: string;
}

export interface Template {
  id: string;
  name: string;
  body: string;
}

export interface Idea {
  id: string;
  text: string;
  createdAt: string;
}

export interface Settings {
  /** Opt-in: browser speech recognition sends audio to the browser vendor. */
  voiceInput: boolean;
}

export interface StoreData {
  version: 1;
  persona: Persona | null;
  topics: Topic[];
  generations: Generation[];
  contacts: Contact[];
  templates: Template[];
  ideas: Idea[];
  settings: Settings;
}

// Resolved at runtime; the ignore comment stops the bundler tracing the whole project.
export const DATA_DIR = path.resolve(
  /*turbopackIgnore: true*/
  process.env.COPYDOGG_DATA_DIR || path.join(process.cwd(), "data")
);
export const DATA_FILE = path.join(DATA_DIR, "copydogg.json");

const DEFAULT_SETTINGS: Settings = { voiceInput: false };

function emptyStore(): StoreData {
  return {
    version: 1,
    persona: null,
    topics: [],
    generations: [],
    contacts: [],
    templates: [],
    ideas: [],
    settings: { ...DEFAULT_SETTINGS },
  };
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
    // Files from older versions lack newer collections; fill in defaults.
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      version: 1,
      persona: parsed.persona ?? null,
      topics: parsed.topics ?? [],
      generations: parsed.generations ?? [],
      contacts: parsed.contacts ?? [],
      templates: parsed.templates ?? [],
      ideas: parsed.ideas ?? [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
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
    // Liked or hand-edited: both say "this is how I actually sound".
    .filter((g) => g.feedback === 1 || g.edited)
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
  input: Pick<Generation, "platform" | "mode" | "promptInput" | "context" | "toneOverride" | "outputs">
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
  patch: Partial<Pick<Generation, "saved" | "feedback" | "chosenOutput" | "edited">>
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

export function deleteGeneration(id: string): Promise<boolean> {
  return mutate((data) => {
    const before = data.generations.length;
    data.generations = data.generations.filter((g) => g.id !== id);
    return data.generations.length < before;
  });
}

// ---- Contacts, templates, ideas, settings ---------------------------------

/** Replaces the whole list; entries keep their id when one is given. */
export function setContacts(
  contacts: { id?: string; name: string; relationship: Relationship; note: string }[]
): Promise<Contact[]> {
  return mutate((data) => {
    data.contacts = contacts.map((c) => ({ ...c, id: c.id || randomUUID() }));
    return data.contacts;
  });
}

export function setTemplates(
  templates: { id?: string; name: string; body: string }[]
): Promise<Template[]> {
  return mutate((data) => {
    data.templates = templates.map((t) => ({ ...t, id: t.id || randomUUID() }));
    return data.templates;
  });
}

export function addIdea(text: string): Promise<Idea> {
  return mutate((data) => {
    const idea: Idea = { id: randomUUID(), text, createdAt: new Date().toISOString() };
    data.ideas.push(idea);
    return idea;
  });
}

export function deleteIdea(id: string): Promise<void> {
  return mutate((data) => {
    data.ideas = data.ideas.filter((i) => i.id !== id);
  });
}

export function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return mutate((data) => {
    data.settings = { ...data.settings, ...patch };
    return data.settings;
  });
}
