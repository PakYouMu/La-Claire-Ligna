"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function LoginForm({
  className,
  textColor = "white",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { textColor?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      toast.success("Successfully logged in");
      router.push("/funds");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <div className="flex flex-col text-center">
        <p
          className="text-xl font-serif"
          style={{ color: textColor }}
        >
          Sign in to manage your workspace
        </p>
      </div>

      <form onSubmit={handleLogin}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label
              htmlFor="email"
              className="font-semibold"
              style={{ color: textColor }}
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
                borderColor: textColor === 'black' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                color: textColor,
              }}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label
                htmlFor="password"
                className="font-semibold"
                style={{ color: textColor }}
              >
                Password
              </Label>
              <Link
                href="/auth/forgot-password"
                className="ml-auto inline-block text-xs font-medium underline-offset-4 hover:underline"
                style={{ color: textColor }}
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border shadow-none focus-visible:ring-1 bg-transparent"
              style={{
                borderColor: textColor === 'black' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                color: textColor,
              }}
            />
          </div>

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

          <Button
            type="submit"
            className="w-full h-11 mt-4 font-bold border-none hover:opacity-90 transition-opacity"
            disabled={isLoading}
            style={{
              backgroundColor: textColor,
              color: textColor === 'black' ? 'white' : 'black',
            }}
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Login</>
            ) : "Login"}
          </Button>
        </div>
        <div
          className="mt-6 text-center text-sm"
          style={{ color: textColor }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="font-bold underline-offset-4 hover:underline"
            style={{ color: textColor }}
          >
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}