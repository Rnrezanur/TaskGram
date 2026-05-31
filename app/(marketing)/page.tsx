import Link from "next/link";
import { Bell, CalendarClock, Lock, MessageCircle, Repeat, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features: Array<[string, string, LucideIcon]> = [
  ["Telegram-first reminders", "Receive task alerts where you already respond quickly.", MessageCircle],
  ["Recurring schedules", "Daily, weekly, monthly, and custom repeating reminders.", Repeat],
  ["Delivery history", "See pending, sent, failed, cancelled, and retried notifications.", Bell],
  ["Private by design", "RLS, one-time hashed Telegram tokens, and server-only secrets.", ShieldCheck]
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="container flex h-20 items-center justify-between">
        <AppLogo className="text-xl" />
        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="#features">Features</a><a href="#how">How It Works</a><Link href="/login">Login</Link>
          <Button asChild><Link href="/signup">Get Started</Link></Button>
        </div>
      </nav>
      <section className="surface-grid border-y bg-muted/30">
        <div className="container grid min-h-[calc(100vh-5rem)] items-center gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Never miss a task. Get reminded on Telegram.</p>
            <h1 className="text-4xl font-bold tracking-normal sm:text-6xl">Reminders that reach you where you actually check.</h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">TaskGram combines a focused to-do dashboard with secure Telegram reminders, recurrence, snooze, delivery history, and dependable scheduled sending.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href="/signup">Get Started Free</Link></Button>
              <Button asChild size="lg" variant="outline"><a href="#how">See How It Works</a></Button>
            </div>
          </div>
          <Card className="shadow-soft">
            <CardContent className="p-5">
              <div className="rounded-md bg-primary p-4 text-primary-foreground">
                <p className="text-sm opacity-80">Telegram notification</p>
                <h2 className="mt-2 text-xl font-semibold">TaskGram Reminder</h2>
                <p className="mt-3">Submit university assignment</p>
                <p className="mt-2 text-sm opacity-85">Due: 15 June 2026 at 8:00 PM</p>
              </div>
              <div className="mt-5 space-y-3">
                {["Pay tuition invoice", "Review chemistry notes", "Gym session"].map((title, index) => (
                  <div key={title} className="flex items-center justify-between rounded-md border p-3">
                    <span className="font-medium">{title}</span><span className="text-sm text-muted-foreground">{index + 1}:30 PM</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <section id="features" className="container py-20">
        <div className="grid gap-4 md:grid-cols-4">
          {features.map(([title, text, Icon]) => (
            <Card key={title as string}><CardContent className="p-5"><Icon className="h-6 w-6 text-primary" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p></CardContent></Card>
          ))}
        </div>
      </section>
      <section id="how" className="bg-muted/40 py-20">
        <div className="container grid gap-8 md:grid-cols-3">
          {["Create your reminder", "Connect Telegram securely", "Get notified automatically"].map((item, i) => (
            <div key={item} className="rounded-lg border bg-card p-6 shadow-sm"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">{i + 1}</div><h3 className="font-semibold">{item}</h3><p className="mt-2 text-sm text-muted-foreground">TaskGram validates schedules, protects accounts with RLS, and sends reminders through a server-side Telegram bot.</p></div>
          ))}
        </div>
      </section>
      <section className="container grid gap-8 py-20 lg:grid-cols-2">
        <div><CalendarClock className="h-8 w-8 text-primary" /><h2 className="mt-4 text-3xl font-bold">Built for busy days and real deadlines.</h2><p className="mt-4 text-muted-foreground">Snooze, complete, archive, repeat, and review delivery history without losing the audit trail.</p></div>
        <div><Lock className="h-8 w-8 text-primary" /><h2 className="mt-4 text-3xl font-bold">Secure Telegram linking.</h2><p className="mt-4 text-muted-foreground">One-time tokens are hashed, expire in 10 minutes, and the bot token never reaches the browser.</p></div>
      </section>
      <section className="bg-primary py-16 text-primary-foreground"><div className="container flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><h2 className="text-3xl font-bold">Ready to trust your reminders again?</h2><p className="mt-2 opacity-85">Start free, connect Telegram, and let TaskGram handle the nudge.</p></div><Button asChild variant="secondary" size="lg"><Link href="/signup">Get Started Free</Link></Button></div></section>
      <footer className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between"><AppLogo /><p>© 2026 TaskGram. All rights reserved.</p></footer>
    </main>
  );
}
