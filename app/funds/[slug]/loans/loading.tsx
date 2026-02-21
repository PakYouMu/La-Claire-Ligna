import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export default function LoansLoading() {
    return (
        <div className="w-full min-h-[100dvh] flex flex-col pt-16 md:pt-[123px]">
            <div className="w-full flex-1 flex flex-col">
                {/* Adjust translate-y-[-20px] below to move the grid up or down */}
                <div className="w-full my-auto translate-y-[-40px]">
                    <div className="h-full w-full max-w-[90rem] mx-auto p-responsive relative flex flex-col gap-responsive pb-20">
                        <div className="rounded-xl border border-border/50 bg-card min-h-[780px] flex flex-col animate-in fade-in duration-300">
                            <div className="flex flex-col h-full w-full bg-transparent flex-1">

                                {/* Header */}
                                <div className="p-6 flex items-center justify-between border-b border-border/50 shrink-0 h-[88px]">
                                    <div className="space-y-2">
                                        <div className="h-6 w-32 rounded bg-muted/50 animate-pulse" />
                                        <div className="h-4 w-64 rounded bg-muted/30 animate-pulse" style={{ animationDelay: "100ms" }} />
                                    </div>
                                    <div className="h-10 w-28 rounded-md bg-muted/40 animate-pulse" style={{ animationDelay: "200ms" }} />
                                </div>

                                {/* Table Body */}
                                <div className="flex-1 w-full relative">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent border-border/50 h-[50px]">
                                                <TableHead className="w-[200px] pl-6">
                                                    <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
                                                </TableHead>
                                                <TableHead className="text-center hidden md:table-cell">
                                                    <div className="mx-auto h-3 w-16 bg-muted/40 rounded animate-pulse" />
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    <div className="mx-auto h-3 w-16 bg-muted/40 rounded animate-pulse" />
                                                </TableHead>
                                                <TableHead className="text-center hidden md:table-cell">
                                                    <div className="mx-auto h-3 w-16 bg-muted/40 rounded animate-pulse" />
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    <div className="mx-auto h-3 w-20 bg-muted/40 rounded animate-pulse" />
                                                </TableHead>
                                                <TableHead className="text-center w-[150px]">
                                                    <div className="mx-auto h-3 w-12 bg-muted/40 rounded animate-pulse" />
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    <div className="mx-auto h-3 w-8 bg-muted/40 rounded animate-pulse" />
                                                </TableHead>
                                                <TableHead className="text-center pr-6 w-[200px]">
                                                    <div className="mx-auto h-3 w-12 bg-muted/40 rounded animate-pulse" />
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <TableRow
                                                    key={i}
                                                    className="h-[72px] hover:bg-transparent border-b border-border/40 hover:bg-muted/30 border-l-4 border-l-transparent pl-4 animate-pulse"
                                                    style={{ animationDelay: `${300 + i * 50}ms` }}
                                                >
                                                    <TableCell className="pl-6">
                                                        <div className="flex flex-col space-y-2">
                                                            <div className="h-4 w-32 rounded bg-muted/40" />
                                                            <div className="h-3 w-20 rounded bg-muted/30" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center hidden md:table-cell">
                                                        <div className="flex justify-center">
                                                            <div className="h-3.5 w-20 rounded bg-muted/30" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col items-center justify-center space-y-2">
                                                            <div className="h-3.5 w-20 rounded bg-muted/40" />
                                                            <div className="h-2 w-16 rounded bg-muted/30" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center hidden md:table-cell">
                                                        <div className="flex justify-center">
                                                            <div className="h-3.5 w-16 rounded bg-muted/30" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex justify-center">
                                                            <div className="h-6 w-16 rounded bg-muted/40" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col items-center gap-2 w-full">
                                                            <div className="h-3.5 w-16 rounded bg-muted/40" />
                                                            <div className="h-1.5 w-full bg-muted/30 rounded-full" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center align-middle">
                                                        <div className="flex justify-center">
                                                            <div className="h-8 w-8 rounded bg-muted/30" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center pr-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="h-8 w-14 rounded bg-muted/30" />
                                                            <div className="h-8 w-14 rounded bg-muted/30" />
                                                            <div className="h-8 w-14 rounded bg-muted/30" />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination / Footer */}
                                <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/5 mt-auto h-[72px]">
                                    <div className="flex gap-4 hidden md:flex">
                                        <div className="h-3 w-16 rounded bg-muted/30 animate-pulse" />
                                        <div className="h-3 w-20 rounded bg-muted/30 animate-pulse" />
                                        <div className="h-3 w-16 rounded bg-muted/30 animate-pulse" />
                                    </div>
                                    <div className="flex items-center gap-4 ml-auto">
                                        <div className="h-3 w-24 rounded bg-muted/30 animate-pulse" />
                                        <div className="flex gap-2">
                                            <div className="h-8 w-24 rounded bg-muted/30 animate-pulse" />
                                            <div className="h-8 w-20 rounded bg-muted/30 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
