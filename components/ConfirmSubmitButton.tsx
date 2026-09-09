"use client";

import type { ReactNode, MouseEvent } from "react";

export default function ConfirmSubmitButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) {
      e.preventDefault();
    }
  }

  return (
    <button type="submit" className={className} onClick={handleClick}>
      {children}
    </button>
  );
}
