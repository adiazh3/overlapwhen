import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-11 w-11 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Keep pickers, segmented controls, and icon tools free of action arrows. */
  decoration?: "arrow" | "none";
}

const actionButtonVariants = cva(
  "group action-button inline-flex shrink-0 items-center justify-between gap-3 rounded-full border font-mono text-xs font-medium uppercase tracking-normal cursor-pointer transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "action-button-solid",
        outline: "action-button-outline",
        ghost: "action-button-outline",
        link: "action-button-outline",
        secondary: "action-button-light",
        destructive: "action-button-destructive",
      },
      size: {
        default: "min-h-11 pl-5 pr-1.5 py-1.5",
        sm: "min-h-11 pl-3 pr-1 py-1 text-xs gap-2",
        lg: "min-h-12 pl-6 pr-2 py-2",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, decoration, children, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isAction = decoration !== "none" && size !== "icon" && props["aria-pressed"] === undefined && props.role !== "option";
    const decorate = (content: React.ReactNode) => (
      <>
        <span className="flex min-w-0 items-center justify-center gap-2 text-center leading-snug">{content}</span>
        <span aria-hidden="true" className={cn("action-button-arrow grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-300 motion-reduce:transition-none", size === "sm" && "size-6")}>
          <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none" />
        </span>
      </>
    );
    let content = children;
    if (isAction) {
      if (asChild && React.isValidElement<{ children?: React.ReactNode }>(children)) {
        content = React.cloneElement(children, {}, decorate(children.props.children));
      } else if (!asChild) {
        content = decorate(children);
      }
    }
    return (
      <Comp className={cn(isAction ? actionButtonVariants({ variant, size }) : buttonVariants({ variant, size }), className)} ref={ref} {...(!asChild && { type })} {...props}>{content}</Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
