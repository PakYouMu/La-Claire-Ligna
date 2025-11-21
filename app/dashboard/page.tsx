import { getUserRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { getWalletBalance, getLoanStats } from "@/app/actions/wallet";

// 1. Import the Client Component Wrapper we just made
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";

// 2. Import the Server Components (The heavy tables)
import { ActiveLoansTable } from "@/components/dashboard/active-loans-table";
import { BorrowerList } from "@/components/dashboard/borrower-list";

export default async function DashboardPage() {
  // A. Security Check
  const role = await getUserRole();
  if (!role) redirect("/auth/login");

  // B. Data Fetching (Server-Side)
  const [balance, stats] = await Promise.all([
    getWalletBalance(),
    getLoanStats()
  ]);

  // C. Render
  // We pass the Server Components (<ActiveLoansTable />) as props to the Client Component.
  // This pattern makes your app extremely fast because the JS for the table logic
  // stays on the server, while the Bento animations run on the client.
  return (
    <DashboardGrid
      role={role}
      balance={balance}
      stats={stats}
      loansTable={<ActiveLoansTable />}
      borrowerList={<BorrowerList />}
    />
  );
}