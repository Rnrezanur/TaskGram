import Script from "next/script";
import { TelegramWorkspace } from "@/components/telegram/telegram-workspace";

export const metadata = {
  title: "TaskGram Workspace"
};

export default function TelegramWorkspacePage() {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <main className="min-h-screen bg-background px-3 py-4 text-foreground">
        <TelegramWorkspace />
      </main>
    </>
  );
}
