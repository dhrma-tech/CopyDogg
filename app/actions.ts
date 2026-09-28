"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_COOKIE, gatePassword, isCorrectPassword, tokenFor } from "@/lib/passwordGate";
import { RELATIONSHIPS, isOneOf } from "@/lib/writingOptions";
import {
  addIdea,
  cleanPlatformVoices,
  cleanPlatforms,
  cleanStrings,
  cleanTone,
  deleteIdea,
  getPersona,
  resetStore,
  savePersona,
  setContacts,
  setTemplates,
  setTopics,
  updatePersona,
  updateSettings,
  type Contact,
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
    await savePersona({
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

/** Profile page save: voice, sliders, platforms, rules and topics. */
export async function saveProfile(
  input: VoiceProfileInput & { rules: string[]; topics: string[] }
): Promise<ActionResult> {
  if (!(await getPersona())) {
    return { ok: false, error: "No voice profile yet. Set one up first." };
  }

  const profile = cleanVoiceProfile(input);
  if (profile.platforms.length === 0) {
    return { ok: false, error: "Pick at least one platform." };
  }

  try {
    await updatePersona({
      ...profile,
      rules: cleanStrings(input.rules, 50, 300),
    });
    await setTopics(cleanStrings(input.topics, 50, 100));
  } catch {
    return { ok: false, error: "Couldn't save your profile. Try again." };
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
