"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function UpdatePasswordForm({
  className,
  textColor = "white",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { textColor?: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
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
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label 
              htmlFor="password"
              className="font-semibold"
              style={{ color: textColor }}
            >
              New password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="New password"
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
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save new password"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}