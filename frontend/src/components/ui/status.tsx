// Adapted from 21st.dev (@diceui/status) — two changes from the original:
// 1. swapped the hardcoded Tailwind palette colors (green/orange/blue) for
//    this app's design tokens (success/warning/accent).
// 2. the original colors StatusIndicator via a `**:` arbitrary-variant
//    descendant selector, which is Tailwind v4-only syntax; this project is
//    on Tailwind v3 (where it's silently invalid, leaving the dot
//    invisible). Replaced with plain `currentColor` inheritance instead:
//    the root sets `text-*`, and the indicator's `bg-current` picks it up.
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";
import { cn } from "@/lib/utils";

const statusVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-1 font-medium text-xs transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-muted-foreground",
        success: "border-success/20 bg-success/10 text-success",
        error: "border-destructive/20 bg-destructive/10 text-destructive",
        warning: "border-warning/20 bg-warning/10 text-warning",
        info: "border-accent/20 bg-accent/10 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface StatusProps
  extends VariantProps<typeof statusVariants>, React.ComponentProps<"div"> {
  asChild?: boolean;
}

function Status(props: StatusProps) {
  const { className, variant = "default", asChild, ...rootProps } = props;

  const RootPrimitive = asChild ? Slot : "div";

  return (
    <RootPrimitive
      data-slot="status"
      data-variant={variant}
      {...rootProps}
      className={cn(statusVariants({ variant }), className)}
    />
  );
}

function StatusIndicator(props: React.ComponentProps<"div">) {
  const { className, ...indicatorProps } = props;

  return (
    <div
      data-slot="status-indicator"
      {...indicatorProps}
      className={cn(
        "relative flex size-2 shrink-0 rounded-full bg-current",
        "before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-inherit",
        "after:absolute after:inset-[2px] after:rounded-full after:bg-inherit",
        className,
      )}
    />
  );
}

function StatusLabel(props: React.ComponentProps<"div">) {
  const { className, ...labelProps } = props;

  return (
    <div
      data-slot="status-label"
      {...labelProps}
      className={cn("leading-none", className)}
    />
  );
}

export { Status, StatusIndicator, StatusLabel, statusVariants };
