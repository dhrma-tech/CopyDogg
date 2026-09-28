import path from "node:path";
import { connection } from "next/server";
import { BACKUP_DIR, DATA_FILE, listBackups, readStore } from "@/lib/store";
import { isDemoMode } from "@/lib/demoMode";
import SettingsPanel from "./SettingsPanel";

/** "data/copydogg.json" rather than a long absolute path, when it's inside the project. */
function shortPath(p: string) {
  const rel = path.relative(process.cwd(), p);
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel) ? rel : p;
}

export default async function SettingsPage() {
  await connection(); // reads the data file, so render per request
  const [{ generations, settings }, backups] = await Promise.all([readStore(), listBackups()]);

  return (
    <main className="flex flex-1 justify-center px-4 pb-12 sm:px-6">
      <SettingsPanel
        generationCount={generations.length}
        savedCount={generations.filter((g) => g.saved).length}
        dataFile={shortPath(DATA_FILE)}
        demoMode={isDemoMode}
        passwordEnabled={!!process.env.COPYDOGG_PASSWORD}
        voiceInput={settings.voiceInput}
        backups={backups}
        backupFolder={shortPath(BACKUP_DIR)}
      />
    </main>
  );
}
