"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_COOKIE, gatePassword, isCorrectPassword, tokenFor } from "@/lib/passwordGate";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { DICTATION_TAGS, RELATIONSHIPS, isOneOf } from "@/lib/writingOptions";
import {
  addIdea,
  cleanPlatformVoices,
  cleanPlatforms,
  cleanStrings,
  cleanTone,
  createFirstPersona,
  createPersonaFrom,
  deleteIdea,
  deletePersona,
  readStore,
  resetStore,
  restoreBackup,
  setActivePersona,
  setContacts,
  addWords,
  setSnippets,
  setTemplates,
  setWords,
  setTopics,
  updatePersona,
  updateSettings,
  type Contact,
  type Snippet,
  type Template,
} from "@/lib/store";

export interface VoiceProfileInput {
  voiceDescription: string;
  toneFormality: number;
  toneHumor: number;
  toneBluntness: number;
  toneWarmth: number;
  emojiDensity: number;
  hashtagTolerance?: number;
  platforms: string[];
  platformVoices: Record<string, string | undefined>;
}

type ActionResult = { ok: true } | { ok: false; error: string };

function cleanVoiceProfile(input: VoiceProfileInput) {
  return {
    voiceDescription:
      typeof input.voiceDescription === "string" && input.voiceDescription.trim()
        ? input.voiceDescription.trim().slice(0, 4000)
        : null,
    toneFormality: cleanTone(input.toneFormality, 50),
    toneHumor: cleanTone(input.toneHumor, 50),
    toneBluntness: cleanTone(input.toneBluntness, 50),
    toneWarmth: cleanTone(input.toneWarmth, 50),
    emojiDensity: cleanTone(input.emojiDensity, 20),
    platforms: cleanPlatforms(input.platforms),
    platformVoices: cleanPlatformVoices(input.platformVoices),
  };
}

/** Last step of onboarding: saves the voice profile, then opens the app. */
export async function completeOnboarding(
  input: VoiceProfileInput & { samplePosts: string[] }
): Promise<ActionResult> {
  const profile = cleanVoiceProfile(input);
  if (profile.platforms.length === 0) {
    return { ok: false, error: "Pick at least one platform first." };
  }

  try {
    await createFirstPersona({
      ...profile,
      hashtagTolerance: cleanTone(input.hashtagTolerance, 20),
      rules: [],
      samplePosts: cleanStrings(input.samplePosts, 30, 4000),
    });
  } catch {
    return { ok: false, error: "Couldn't save your voice to the data file. Check the server log, then try again." };
  }

  redirect("/app");
}

/** Profile page save: one voice's name, description, sliders, platforms and rules, plus topics. */
export async function saveProfile(
  input: VoiceProfileInput & { personaId: string; name: string; rules: string[]; topics: string[] }
): Promise<ActionResult> {
  const { personas } = await readStore();
  if (!personas.some((p) => p.id === input.personaId)) {
    return { ok: false, error: "That voice no longer exists. Reload the page." };
  }
  const name = String(input.name ?? "").trim().slice(0, 40);
  if (!name) return { ok: false, error: "Give this voice a name." };

  const profile = cleanVoiceProfile(input);
  if (profile.platforms.length === 0) {
    return { ok: false, error: "Pick at least one platform." };
  }

  try {
    await updatePersona(input.personaId, {
      ...profile,
      name,
      rules: cleanStrings(input.rules, 50, 300),
    });
    await setTopics(cleanStrings(input.topics, 50, 100));
  } catch {
    return { ok: false, error: "Couldn't save your profile. Try again." };
  }

  return { ok: true };
}

// ---- Voices ---------------------------------------------------------------

/** New voice as a copy of an existing one; the profile page then opens it for editing. */
export async function createVoice(
  sourceId: string,
  name: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const clean = String(name ?? "").trim().slice(0, 40);
  if (!clean) return { ok: false, error: "Give the new voice a name." };
  try {
    const persona = await createPersonaFrom(String(sourceId), clean);
    if (!persona) return { ok: false, error: "The voice to copy no longer exists. Reload the page." };
    return { ok: true, id: persona.id };
  } catch {
    return { ok: false, error: "Couldn't create that voice. Try again." };
  }
}

export async function deleteVoice(id: string): Promise<ActionResult> {
  try {
    if (!(await deletePersona(String(id)))) {
      return { ok: false, error: "You need at least one voice, so the last one can't be deleted." };
    }
  } catch {
    return { ok: false, error: "Couldn't delete that voice. Try again." };
  }
  return { ok: true };
}

/** Remembers the voice last used, so /app and Profile open with it. */
export async function selectVoice(id: string): Promise<ActionResult> {
  try {
    if (!(await setActivePersona(String(id)))) {
      return { ok: false, error: "That voice no longer exists. Reload the page." };
    }
  } catch {
    return { ok: false, error: "Couldn't switch voices. Try again." };
  }
  return { ok: true };
}

// ---- Backups --------------------------------------------------------------

export async function restoreFromBackup(name: string): Promise<ActionResult> {
  try {
    await restoreBackup(String(name));
  } catch {
    return { ok: false, error: "Couldn't restore that backup — the file may be damaged. Your current data is unchanged." };
  }
  return { ok: true };
}

/** Settings "reset everything": wipes the data file back to empty. */
export async function resetAllData(): Promise<ActionResult> {
  try {
    await resetStore();
  } catch {
    return { ok: false, error: "Couldn't reset the data file. Check the server log, then try again." };
  }
  redirect("/onboarding");
}

// ---- Optional password gate (only active when COPYDOGG_PASSWORD is set) ----

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Only same-site paths, so ?next= can't bounce people to another site. */
function safeNextPath(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function unlock(password: string, next: string): Promise<ActionResult> {
  if (!gatePassword()) redirect(safeNextPath(next));

  if (!checkRateLimit(`unlock:${await clientIp()}`, 5, 60_000)) {
    return { ok: false, error: "Too many attempts. Wait a minute and try again." };
  }
  if (!isCorrectPassword(password)) {
    return { ok: false, error: "That's not the password. Check COPYDOGG_PASSWORD in your .env.local." };
  }

  const proto = (await headers()).get("x-forwarded-proto");
  (await cookies()).set(GATE_COOKIE, tokenFor(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    maxAge: THIRTY_DAYS,
    path: "/",
  });
  redirect(safeNextPath(next));
}

export async function lock(): Promise<void> {
  (await cookies()).delete(GATE_COOKIE);
  redirect("/unlock");
}

// ---- Ideas, people, templates, settings -----------------------------------

export async function saveIdea(text: string): Promise<ActionResult> {
  const idea = typeof text === "string" ? text.trim().slice(0, 2000) : "";
  if (!idea) return { ok: false, error: "Type an idea first." };
  try {
    await addIdea(idea);
  } catch {
    return { ok: false, error: "Couldn't save that idea. Try again." };
  }
  return { ok: true };
}

export async function removeIdea(id: string): Promise<ActionResult> {
  try {
    await deleteIdea(String(id));
  } catch {
    return { ok: false, error: "Couldn't delete that idea. Try again." };
  }
  return { ok: true };
}

export async function saveContacts(
  input: { id?: string; name: string; relationship: string; note: string }[]
): Promise<{ ok: true; items: Contact[] } | { ok: false; error: string }> {
  const contacts = (Array.isArray(input) ? input : [])
    .map((c) => ({
      id: typeof c.id === "string" ? c.id : undefined,
      name: String(c.name ?? "").trim().slice(0, 80),
      relationship: isOneOf(RELATIONSHIPS, c.relationship) ? c.relationship : "other",
      note: String(c.note ?? "").trim().slice(0, 300),
    }))
    .filter((c) => c.name)
    .slice(0, 100);
  try {
    return { ok: true, items: await setContacts(contacts) };
  } catch {
    return { ok: false, error: "Couldn't save your people. Try again." };
  }
}

export async function saveTemplates(
  input: { id?: string; name: string; body: string }[]
): Promise<{ ok: true; items: Template[] } | { ok: false; error: string }> {
  const templates = (Array.isArray(input) ? input : [])
    .map((t) => ({
      id: typeof t.id === "string" ? t.id : undefined,
      name: String(t.name ?? "").trim().slice(0, 60),
      body: String(t.body ?? "").trim().slice(0, 3000),
    }))
    .filter((t) => t.name && t.body)
    .slice(0, 50);
  try {
    return { ok: true, items: await setTemplates(templates) };
  } catch {
    return { ok: false, error: "Couldn't save your templates. Try again." };
  }
}

export async function setVoiceInput(enabled: boolean): Promise<ActionResult> {
  try {
    await updateSettings({ voiceInput: enabled === true });
  } catch {
    return { ok: false, error: "Couldn't save that setting. Try again." };
  }
  return { ok: true };
}

// ---- Voice: your words, snippets, dictation language ----------------------

export async function saveWords(
  words: string[]
): Promise<{ ok: true; items: string[] } | { ok: false; error: string }> {
  try {
    return { ok: true, items: await setWords(cleanStrings(words, 300, 60)) };
  } catch {
    return { ok: false, error: "Couldn't save your words. Try again." };
  }
}

/** Adds suggested words (e.g. names spotted in an edit) without touching the rest. */
export async function learnWords(
  words: string[]
): Promise<{ ok: true; items: string[] } | { ok: false; error: string }> {
  try {
    return { ok: true, items: await addWords(cleanStrings(words, 20, 60)) };
  } catch {
    return { ok: false, error: "Couldn't add that. Try again." };
  }
}

export async function saveSnippets(
  input: { id?: string; trigger: string; text: string }[]
): Promise<{ ok: true; items: Snippet[] } | { ok: false; error: string }> {
  const seen = new Set<string>();
  const snippets = (Array.isArray(input) ? input : [])
    .map((s) => ({
      id: typeof s.id === "string" ? s.id : undefined,
      trigger: String(s.trigger ?? "").trim().slice(0, 40),
      text: String(s.text ?? "").trim().slice(0, 3000),
    }))
    .filter((s) => s.trigger && s.text && !seen.has(s.trigger.toLowerCase()) && seen.add(s.trigger.toLowerCase()))
    .slice(0, 50);
  try {
    return { ok: true, items: await setSnippets(snippets) };
  } catch {
    return { ok: false, error: "Couldn't save your snippets. Try again." };
  }
}

export async function setDictationLanguage(tag: string): Promise<ActionResult> {
  if (!isOneOf(DICTATION_TAGS, tag)) return { ok: false, error: "Pick a language from the list." };
  try {
    await updateSettings({ dictationLanguage: tag });
  } catch {
    return { ok: false, error: "Couldn't save that setting. Try again." };
  }
  return { ok: true };
}
