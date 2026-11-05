"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [show, setShow] = useState(false);
  const error = state.error ? t.login.errors[state.error] : null;

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">{t.login.password}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            dir="ltr"
            className="h-11 pe-11 text-base"
            aria-invalid={!!error}
            aria-describedby={error ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={show ? t.login.hidePassword : t.login.showPassword}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {error && (
          <p id="password-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? t.login.submitting : t.login.submit}
      </Button>
    </form>
  );
}
