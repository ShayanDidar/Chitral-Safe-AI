import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard page container — leaves room for the mobile bottom navigation. */
export function Page({ children, className, narrow }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-8",
        narrow ? "max-w-3xl" : "max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
