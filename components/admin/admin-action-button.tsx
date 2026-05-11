"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function AdminActionButton({ doneLabel = "Done", children, onClick, ...props }: ButtonProps & { doneLabel?: string }) {
  const [done, setDone] = useState(false);

  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? doneLabel : children}
    </Button>
  );
}
