import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";
import AuthErrorContent from "@/components/error/auth-error-content";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string; error_description?: string }>;
}) {
  const params = await searchParams;

  return (
    <MotionToggleWrapper>
      <AuthErrorContent error={params?.error} errorDescription={params?.error_description} />
    </MotionToggleWrapper>
  );
}