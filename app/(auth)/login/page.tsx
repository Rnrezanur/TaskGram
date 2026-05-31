import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <AppLogo />
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Log in to manage reminders and Telegram notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={loginAction} submitLabel="Log in">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required autoComplete="current-password" /></div>
          </ActionForm>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Button asChild variant="link" className="px-0"><Link href="/forgot-password">Forgot password?</Link></Button>
            <Button asChild variant="link" className="px-0"><Link href="/signup">Create account</Link></Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
