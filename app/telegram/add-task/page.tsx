import Script from "next/script";
import { TelegramTaskForm } from "@/components/telegram/telegram-task-form";

export const metadata = {
  title: "Add Task - TaskGram"
};

export default function TelegramAddTaskPage() {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <main className="min-h-screen bg-background px-4 py-5 text-foreground">
        <TelegramTaskForm />
      </main>
    </>
  );
}
