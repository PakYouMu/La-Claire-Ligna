"use client";

import { MoreVertical } from "lucide-react";
import { EditLoanModal } from "../dashboard/modals/edit-loan-modal";
import { PaymentDialog } from "../dashboard/modals/payment-dialog";
import { DeleteLoanModal } from "../dashboard/modals/delete-loan-modal";
import { VoidLoanModal } from "./void-loan-modal";
import { EnrichedLoan } from "./active-loans-client";

interface ActionMenuProps {
    loan: EnrichedLoan;
}

export function ActionMenu({ loan }: ActionMenuProps) {
    const btnId = `btn-${loan.id}`;
    const menuId = `menu-${loan.id}`;
    const anchorName = `--anchor-${loan.id}`;

    return (
        <div className="flex items-center justify-center relative">
            <button
                type="button"
                id={btnId}
                popoverTarget={menuId}
                style={{ anchorName: anchorName } as React.CSSProperties}
                className="p-2 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Actions"
            >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            <div
                id={menuId}
                popover="auto"
                style={{ positionAnchor: anchorName } as React.CSSProperties}
                className="css-anchor-menu"
            >
                <EditLoanModal loan={loan} />
                <PaymentDialog
                    loanId={loan.id}
                    borrowerName={`${loan.first_name} ${loan.last_name}`}
                    amortization={loan.amortization_per_payday}
                    balance={loan.remaining_balance}
                />
                {!loan.is_void && <VoidLoanModal loan={loan} />}
                <DeleteLoanModal loan={loan} />
            </div>
        </div>
    );
}
