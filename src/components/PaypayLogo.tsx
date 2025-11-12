import type { CSSProperties } from "react";
import { cn } from "@/ui/utils";

type PaypayLogoSize = "default" | "sm" | "lg";

interface PaypayLogoProps {
  size?: PaypayLogoSize;
  className?: string;
  whiteClassName?: string;
  purpleClassName?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

const sizeStyle: Record<PaypayLogoSize, CSSProperties | undefined> = {
  default: undefined,
  sm: { fontSize: "27px" },
  lg: { fontSize: "72px" },
};

export function PaypayLogo({
  size = "default",
  className,
  whiteClassName,
  purpleClassName,
  style,
  "data-testid": dataTestId,
}: PaypayLogoProps) {
  return (
    <div
      data-testid={dataTestId}
      className={cn(
        "flex items-center justify-center text-center font-[var(--font-nunito-sans)] font-bold text-[54px] leading-[1] tracking-[-0.03em]",
        className,
      )}
      style={{ ...sizeStyle[size], ...style }}
    >
      <span className={cn("text-white", whiteClassName)}>pay</span>
      <span className={cn("text-[#301C3B]", purpleClassName)}>pay</span>
    </div>
  );
}

