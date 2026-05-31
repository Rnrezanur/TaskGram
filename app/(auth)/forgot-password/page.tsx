import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { ActionForm } from "@/components/forms/action-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <AppLogo />
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your email and Supabase Auth will send a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={forgotPasswordAction} submitLabel="Send reset email">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          </ActionForm>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary">Back to login</Link>
        </CardContent>
      </Card>
    </main>
  );
}
