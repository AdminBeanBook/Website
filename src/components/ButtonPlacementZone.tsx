import type { ReactNode } from "react";

type ButtonPlacementZoneProps = {
  placement: string;
  children: ReactNode;
  className?: string;
};

/** Marks a drop target for the website editor button placement tool. */
export function ButtonPlacementZone({
  placement,
  children,
  className,
}: ButtonPlacementZoneProps) {
  return (
    <div
      data-bb-placement={placement}
      data-bb-placement-label={placement}
      className={`min-h-10 min-w-[3rem] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
