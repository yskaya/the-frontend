import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-12 w-full min-w-0 rounded-2xl border border-gray-300/70 bg-white/80 px-4 pt-8 pb-4 text-base text-foreground shadow-sm transition-all outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:px-3 file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
        "placeholder:text-gray-400 placeholder:font-light",
        "focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-200",
        "dark:border-white/15 dark:bg-white/8 dark:text-white dark:focus-visible:ring-purple-500/40",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
