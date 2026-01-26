import FundsErrorContent from "@/components/error/funds-error-content";
import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";

interface Props {
  searchParams: Promise<{ message?: string }>;
}

export default async function FundsErrorPage({ searchParams }: Props) {
  // Await searchParams (Next.js 15+ requirement)
  const { message } = await searchParams;

  return (
    <MotionToggleWrapper>
      <FundsErrorContent 
        rawError={message ? decodeURIComponent(message) : "Unknown Error"} 
      />
    </MotionToggleWrapper>
  );
}