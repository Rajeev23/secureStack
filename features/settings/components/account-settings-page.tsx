"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/auth/signup-schema";
import { nameSchema } from "@/lib/company/names";
import { useUserStore } from "@/features/auth/stores/user-store";

const profileSchema = z.object({
  name: nameSchema,
});

type ProfileValues = z.infer<typeof profileSchema>;

type AccountUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function AccountSettingsPage() {
  const setUser = useUserStore((state) => state.setUser);
  const [user, setAccountUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiGet<{ user: AccountUser }>("/api/account");
        if (cancelled) return;
        setAccountUser(data.user);
        profileForm.reset({ name: data.user.name });
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Unable to load account.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileForm]);

  const onSaveProfile = async (values: ProfileValues) => {
    try {
      const data = await apiPatch<{ user: AccountUser }>("/api/account", values);
      setAccountUser(data.user);
      setUser(data.user);
      toast.success("Name updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to update name.");
    }
  };

  const onChangePassword = async (values: ChangePasswordValues) => {
    try {
      await apiPost("/api/account/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to update password.");
    }
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Account"
        description="Your name, email, and password for this SecureStack login."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading…
        </div>
      ) : (
        <div className="max-w-lg space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Profile</CardTitle>
              <CardDescription>The dashboard greeting uses your first name.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={profileForm.handleSubmit(onSaveProfile)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="account-name">Name</Label>
                  <Input
                    id="account-name"
                    autoComplete="name"
                    aria-invalid={Boolean(profileForm.formState.errors.name)}
                    {...profileForm.register("name")}
                  />
                  {profileForm.formState.errors.name ? (
                    <p className="text-sm text-destructive" role="alert">
                      {profileForm.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-email">Email</Label>
                  <Input
                    id="account-email"
                    type="email"
                    value={user?.email ?? ""}
                    readOnly
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                </div>
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? "Saving…" : "Save name"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Update password</CardTitle>
              <CardDescription>Enter your current password, then choose a new one.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={passwordForm.handleSubmit(onChangePassword)}
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="current-password"
                      type={showCurrent ? "text" : "password"}
                      autoComplete="current-password"
                      aria-invalid={Boolean(passwordForm.formState.errors.currentPassword)}
                      {...passwordForm.register("currentPassword")}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        size="icon-sm"
                        aria-label={showCurrent ? "Hide password" : "Show password"}
                        onClick={() => setShowCurrent((value) => !value)}
                      >
                        {showCurrent ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {passwordForm.formState.errors.currentPassword ? (
                    <p className="text-sm text-destructive" role="alert">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      autoComplete="new-password"
                      aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
                      {...passwordForm.register("newPassword")}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        size="icon-sm"
                        aria-label={showNew ? "Hide password" : "Show password"}
                        onClick={() => setShowNew((value) => !value)}
                      >
                        {showNew ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {passwordForm.formState.errors.newPassword ? (
                    <p className="text-sm text-destructive" role="alert">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">At least 8 characters.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordForm.formState.errors.confirmPassword)}
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword ? (
                    <p className="text-sm text-destructive" role="alert">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting ? "Updating…" : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
