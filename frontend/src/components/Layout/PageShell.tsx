import type { ReactNode } from "react";

type MaxWidth =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "full";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  maxWidth?: MaxWidth;
  padded?: boolean;
  safeArea?: boolean;
}

const maxWidthClassMap: Record<Exclude<MaxWidth, "full">, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
};

export default function PageShell({
  children,
  className,
  maxWidth = "2xl",
  padded = true,
  safeArea = false,
}: PageShellProps) {
  const classes: string[] = ["w-full", "mx-auto"];

  if (maxWidth === "full") {
    classes.push("max-w-full");
  } else {
    classes.push(maxWidthClassMap[maxWidth]);
  }

  if (padded) {
    classes.push("px-4", "sm:px-6", "lg:px-8");
  }

  if (safeArea) {
    classes.push("safe-area-inset");
  }

  if (className) {
    classes.push(className);
  }

  return <div className={classes.join(" ")}>{children}</div>;
}

