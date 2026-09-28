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

/** One voice ("Work me", "Friends me"...). Called persona in code and data. */
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
  /** The voice that wrote it. Missing on older entries — they belong to the first voice. */
  personaId?: string;
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
  /** BCP-47 tag for dictation, or "" for the browser's language. */
  dictationLanguage: string;
}

/** Saved text that goes in word for word when its shortcut is said or typed. */
export interface Snippet {
  id: string;
  /** What you say or type, e.g. "my bio". */
  trigger: string;
  text: string;
}

export interface StoreData {
  version: 1;
  personas: Persona[];
  /** The voice /app and Profile open with; always one of `personas` when any exist. */
  activePersonaId: string | null;
  topics: Topic[];
  generations: Generation[];
  contacts: Contact[];
  templates: Template[];
  ideas: Idea[];
  /** Names, jargon and acronyms to spell exactly (fixes misheard dictation). */
  words: string[];
  snippets: Snippet[];
  settings: Settings;
}

// Resolved at runtime; the ignore comment stops the bundler tracing the whole project.
export const DATA_DIR = path.resolve(
  /*turbopackIgnore: true*/
  process.env.COPYDOGG_DATA_DIR || path.join(process.cwd(), "data")
);
export const DATA_FILE = path.join(DATA_DIR, "copydogg.json");
export const BACKUP_DIR = path.join(DATA_DIR, "backups");

const DEFAULT_SETTINGS: Settings = { voiceInput: false, dictationLanguage: "" };
const BACKUPS_KEPT = 14;
const BACKUP_NAME = /^copydogg-\d{4}-\d{2}-\d{2}(-before-restore-\d+)?\.json$/;

function emptyStore(): StoreData {
  return {
    version: 1,
    personas: [],
    activePersonaId: null,
    topics: [],
    generations: [],
    contacts: [],
    templates: [],
    ideas: [],
    words: [],
    snippets: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/** Fills in anything older file versions lack. */
function normalize(parsed: Partial<StoreData> & { persona?: Persona | null }): StoreData {
  // Before multiple voices, files had a single `persona`.
  const personas = parsed.personas ?? (parsed.persona ? [parsed.persona] : []);
  const activePersonaId = personas.some((p) => p.id === parsed.activePersonaId)
    ? parsed.activePersonaId!
    : (personas[0]?.id ?? null);
  return {
    version: 1,
    personas,
    activePersonaId,
    topics: parsed.topics ?? [],
    generations: parsed.generations ?? [],
    contacts: parsed.contacts ?? [],
    templates: parsed.templates ?? [],
    ideas: parsed.ideas ?? [],
    words: parsed.words ?? [],
    snippets: parsed.snippets ?? [],
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
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
    return normalize(JSON.parse(raw));
  } catch {
    // Never silently replace a file we can't read — that would wipe the user's data.
    throw new Error(
      `CopyDogg couldn't parse ${DATA_FILE}. Fix or move that file (or restore one from ${BACKUP_DIR}), then restart.`
    );
  }
}

async function writeFile(data: StoreData) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

// ---- Daily backups --------------------------------------------------------

const globalState = globalThis as {
  __copydoggWriteQueue?: Promise<unknown>;
  __copydoggBackupDay?: string;
};

async function pruneBackups() {
  const names = (await fs.readdir(BACKUP_DIR)).filter((n) => BACKUP_NAME.test(n)).sort();
  for (const name of names.slice(0, Math.max(0, names.length - BACKUPS_KEPT))) {
    await fs.unlink(path.join(BACKUP_DIR, name)).catch(() => {});
  }
}

/**
 * Before the first write of each day, keep a copy of the file as it was.
 * Never blocks a save: a failed backup is logged and skipped.
 */
async function backupIfDue() {
  const today = new Date().toISOString().slice(0, 10);
  if (globalState.__copydoggBackupDay === today) return;
  const target = path.join(BACKUP_DIR, `copydogg-${today}.json`);
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.copyFile(DATA_FILE, target, fs.constants?.COPYFILE_EXCL);
    await pruneBackups();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // EEXIST: already backed up today. ENOENT: no data file yet, nothing to keep.
    if (code !== "EEXIST" && code !== "ENOENT") {
      console.warn("CopyDogg: daily backup failed, continuing without it.", error);
    }
  }
  globalState.__copydoggBackupDay = today;
}

// Writes are serialized through one promise chain. It lives on globalThis so
// route handlers and server actions (separate bundles, same process) share it.
function mutate<T>(change: (data: StoreData) => T): Promise<T> {
  const run = (globalState.__copydoggWriteQueue ?? Promise.resolve()).then(async () => {
    await backupIfDue();
    const data = await readFile();
    const result = change(data);
    await writeFile(data);
    return result;
  });
  globalState.__copydoggWriteQueue = run.catch(() => {});
  return run;
}

export interface BackupInfo {
  name: string;
  date: string;
  bytes: number;
}

export async function listBackups(): Promise<BackupInfo[]> {
  let names: string[];
  try {
    names = (await fs.readdir(BACKUP_DIR)).filter((n) => BACKUP_NAME.test(n));
  } catch {
    return [];
  }
  const infos = await Promise.all(
    names.map(async (name) => {
      const stat = await fs.stat(path.join(BACKUP_DIR, name));
      return { name, date: stat.mtime.toISOString(), bytes: stat.size };
    })
  );
  return infos.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Replaces the data with a backup. The current data is backed up first, so a
 * restore can itself be undone from the same list.
 */
export async function restoreBackup(name: string): Promise<void> {
  if (!BACKUP_NAME.test(name)) throw new Error("Not a CopyDogg backup.");
  const raw = await fs.readFile(path.join(BACKUP_DIR, name), "utf8");
  const restored = normalize(JSON.parse(raw)); // throws on a broken file — nothing changes

  const today = new Date().toISOString().slice(0, 10);
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  await fs
    .copyFile(DATA_FILE, path.join(BACKUP_DIR, `copydogg-${today}-before-restore-${Date.now()}.json`))
    .catch(() => {}); // no current file: nothing to keep
  await mutate((data) => {
    Object.assign(data, restored);
  });
  await pruneBackups().catch(() => {});
}

// ---- Reads ----------------------------------------------------------------

export function readStore(): Promise<StoreData> {
  return readFile();
}

export function activePersona(data: StoreData): Persona | null {
  return data.personas.find((p) => p.id === data.activePersonaId) ?? data.personas[0] ?? null;
}

/** Older generations have no personaId; they belong to the first voice. */
export function generationBelongsTo(g: Generation, personaId: string, data: StoreData): boolean {
  return (g.personaId ?? data.personas[0]?.id) === personaId;
}

export async function getActivePersona(): Promise<Persona | null> {
  return activePersona(await readFile());
}

export async function getRecentLikedOutputs(personaId: string, limit: number): Promise<string[]> {
  const data = await readFile();
  return data.generations
    // Liked or hand-edited: both say "this is how I actually sound".
    .filter((g) => (g.feedback === 1 || g.edited) && generationBelongsTo(g, personaId, data))
    .slice(-limit)
    .reverse()
    .map((g) => g.chosenOutput ?? g.outputs[0]);
}

// ---- Voices ---------------------------------------------------------------

export type PersonaInput = Omit<Persona, "id" | "name" | "createdAt">;

/** Onboarding: creates the first voice and makes it active. */
export function createFirstPersona(input: PersonaInput): Promise<Persona> {
  return mutate((data) => {
    const persona: Persona = {
      id: randomUUID(),
      name: "My voice",
      createdAt: new Date().toISOString(),
      ...input,
    };
    data.personas.push(persona);
    data.activePersonaId = persona.id;
    return persona;
  });
}

/** A new voice starts as a copy of an existing one, then gets edited. */
export function createPersonaFrom(sourceId: string, name: string): Promise<Persona | null> {
  return mutate((data) => {
    const source = data.personas.find((p) => p.id === sourceId);
    if (!source) return null;
    const persona: Persona = {
      ...structuredClone(source),
      id: randomUUID(),
      name,
      samplePosts: [],
      createdAt: new Date().toISOString(),
    };
    data.personas.push(persona);
    data.activePersonaId = persona.id;
    return persona;
  });
}

export function updatePersona(
  id: string,
  patch: Partial<PersonaInput> & { name?: string }
): Promise<Persona | null> {
  return mutate((data) => {
    const index = data.personas.findIndex((p) => p.id === id);
    if (index < 0) return null;
    data.personas[index] = { ...data.personas[index], ...patch };
    return data.personas[index];
  });
}

/** Deletes a voice. The last one can't be deleted — reset covers that. */
export function deletePersona(id: string): Promise<boolean> {
  return mutate((data) => {
    if (data.personas.length <= 1 || !data.personas.some((p) => p.id === id)) return false;
    // Older generations without a personaId belong to the first voice; pin
    // them before the order changes so they don't silently move voices.
    const firstId = data.personas[0].id;
    for (const g of data.generations) g.personaId ??= firstId;
    data.personas = data.personas.filter((p) => p.id !== id);
    if (data.activePersonaId === id) data.activePersonaId = data.personas[0].id;
    return true;
  });
}

export function setActivePersona(id: string): Promise<boolean> {
  return mutate((data) => {
    if (!data.personas.some((p) => p.id === id)) return false;
    data.activePersonaId = id;
    return true;
  });
}

// ---- Generations ----------------------------------------------------------

export function addGeneration(
  input: Pick<
    Generation,
    "personaId" | "platform" | "mode" | "promptInput" | "context" | "toneOverride" | "outputs"
  >
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

export function deleteGeneration(id: string): Promise<boolean> {
  return mutate((data) => {
    const before = data.generations.length;
    data.generations = data.generations.filter((g) => g.id !== id);
    return data.generations.length < before;
  });
}

export function resetStore(): Promise<void> {
  return mutate((data) => {
    Object.assign(data, emptyStore());
  });
}

// ---- Topics, contacts, templates, ideas, settings -------------------------

export function setTopics(labels: string[]): Promise<void> {
  return mutate((data) => {
    const existing = new Map(data.topics.map((t) => [t.label, t]));
    data.topics = [...new Set(labels)].map(
      (label) => existing.get(label) ?? { id: randomUUID(), label }
    );
  });
}

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

// ---- Your words and snippets ----------------------------------------------

/** Replaces the words list; trimmed, de-duplicated (case-insensitive), capped. */
export function setWords(words: string[]): Promise<string[]> {
  return mutate((data) => {
    const seen = new Set<string>();
    data.words = words
      .map((w) => w.trim().slice(0, 60))
      .filter((w) => w && !seen.has(w.toLowerCase()) && seen.add(w.toLowerCase()))
      .slice(0, 300);
    return data.words;
  });
}

/** Adds words that aren't there yet; returns the full list. */
export function addWords(words: string[]): Promise<string[]> {
  return mutate((data) => {
    const have = new Set(data.words.map((w) => w.toLowerCase()));
    for (const raw of words) {
      const w = raw.trim().slice(0, 60);
      if (w && !have.has(w.toLowerCase()) && data.words.length < 300) {
        data.words.push(w);
        have.add(w.toLowerCase());
      }
    }
    return data.words;
  });
}

export function setSnippets(snippets: { id?: string; trigger: string; text: string }[]): Promise<Snippet[]> {
  return mutate((data) => {
    data.snippets = snippets.map((s) => ({ ...s, id: s.id || randomUUID() }));
    return data.snippets;
  });
}
