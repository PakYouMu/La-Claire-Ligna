"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm({
  className,
  textColor = "white",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { textColor?: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {success ? (
        <>
          <div className="flex flex-col text-center mb-4">
            <p 
              className="text-xl font-serif mb-2"
              style={{ color: textColor }}
            >
              Check Your Email
            </p>
            <p 
              className="text-sm"
              style={{ color: textColor, opacity: 0.8 }}
            >
              Password reset instructions sent
            </p>
          </div>
          <p 
            className="text-sm text-center"
            style={{ color: textColor, opacity: 0.7 }}
          >
            If you registered using your email and password, you will receive
            a password reset email.
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col text-center mb-4">
            <p 
              className="text-xl font-serif mb-2"
              style={{ color: textColor }}
            >
              Reset Your Password
            </p>
            <p 
              className="text-sm"
              style={{ color: textColor, opacity: 0.8 }}
            >
              Type in your email and we&apos;ll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleForgotPassword}>
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset email"
                )}
              </Button>
            </div>
            <div 
              className="mt-6 text-center text-sm"
              style={{ color: textColor }}
            >
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-bold underline-offset-4 hover:underline"
                style={{ color: textColor }}
              >
                Login
              </Link>
            </div>
          </form>
        </>
      )}
    </div>
  );
}