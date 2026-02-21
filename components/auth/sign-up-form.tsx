"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export function SignUpForm({
  className,
  textColor,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { textColor?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      toast.success("Successfully signed up! Please check your email and log in.");
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Use textColor if provided, otherwise default to white
  const finalTextColor = textColor || "white";

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {/* Header */}
      <div className="flex flex-col text-center mb-4">
        <p
          className="text-xl font-serif"
          style={{ color: finalTextColor }}
        >
          Join La Clair Ligña
        </p>
      </div>

      <form onSubmit={handleSignUp}>
        <div className="flex flex-col gap-4">

          {/* Email Input */}
          <div className="grid gap-2">
            <Label
              htmlFor="email"
              className="font-semibold"
              style={{ color: finalTextColor }}
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border shadow-none focus-visible:ring-1 bg-transparent"
              style={{
                borderColor: finalTextColor === 'black' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                color: finalTextColor,
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="password"
              className="font-semibold"
              style={{ color: finalTextColor }}
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border shadow-none focus-visible:ring-1 bg-transparent"
              style={{
                borderColor: finalTextColor === 'black' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                color: finalTextColor,
              }}
            />
          </div>

          {/* Repeat Password Input */}
          <div className="grid gap-2">
            <Label
              htmlFor="repeat-password"
              className="font-semibold"
              style={{ color: finalTextColor }}
            >
              Repeat Password
            </Label>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="h-11 border shadow-none focus-visible:ring-1 bg-transparent"
              style={{
                borderColor: finalTextColor === 'black' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                color: finalTextColor,
              }}
            />
          </div>

          {/* Error Box */}
          {error && (
            <div
              className="text-sm p-3 rounded-md font-bold"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.15)',
                color: '#ff0000',
                border: '1px solid rgba(255, 0, 0, 0.4)',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11 mt-4 font-bold border-none hover:opacity-90 transition-opacity"
            disabled={isLoading}
            style={{
              backgroundColor: finalTextColor,
              color: finalTextColor === 'black' ? 'white' : 'black',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-sm" style={{ color: finalTextColor }}>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-bold underline-offset-4 hover:underline"
            style={{ color: finalTextColor }}
          >
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}