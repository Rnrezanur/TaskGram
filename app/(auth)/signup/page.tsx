import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { ActionForm } from "@/components/forms/action-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/lib/actions/auth";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-lg shadow-soft">
        <CardHeader>
          <AppLogo />
          <CardTitle>Create your TaskGram account</CardTitle>
          <CardDescription>Start receiving reliable Telegram reminders in a few minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={signupAction} submitLabel="Get Started Free">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" name="fullName" required autoComplete="name" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required autoComplete="new-password" /></div>
              <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" name="confirmPassword" type="password" required /></div>
            </div>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input name="terms" type="checkbox" required className="mt-1" />
              I agree to the TaskGram terms and privacy policy.
            </label>
          </ActionForm>
          <p className="mt-4 text-sm text-muted-foreground">Already have an account? <Link className="font-medium text-primary" href="/login">Log in</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}
