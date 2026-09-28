import { connection } from "next/server";
import { BACKUP_DIR, DATA_FILE, listBackups, readStore } from "@/lib/store";
import { isDemoMode } from "@/lib/demoMode";
import AppHeader from "@/components/AppHeader";
import SettingsPanel from "./SettingsPanel";

export default async function SettingsPage() {
  await connection(); // reads the data file, so render per request
  const [{ generations, settings }, backups] = await Promise.all([readStore(), listBackups()]);

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 justify-center px-6 pb-12">
        <SettingsPanel
          generationCount={generations.length}
          savedCount={generations.filter((g) => g.saved).length}
          dataFile={DATA_FILE}
          demoMode={isDemoMode}
          passwordEnabled={!!process.env.COPYDOGG_PASSWORD}
          voiceInput={settings.voiceInput}
          backups={backups}
          backupFolder={BACKUP_DIR}
        />
      </main>
    </>
  );
}
