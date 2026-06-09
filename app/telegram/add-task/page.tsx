import { redirect } from "next/navigation";

export const metadata = {
  title: "Add Task - TaskGram"
};

export default function TelegramAddTaskPage() {
  redirect("/telegram/workspace");
}
