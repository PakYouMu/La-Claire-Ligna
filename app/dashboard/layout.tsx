export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full relative bg-background">
      {/* NavOverlay removed. Just handle spacing. */}
      
      {/* Content Area - Maintain padding to account for fixed Nav */}
      <div className="relative w-full h-full pt-16 md:pt-24">
        {children}
      </div>
    </div>
  );
}