"use client";

import { useId, useRef } from "react";

import { Button } from "@/components/ui/button";

type FormAction = NonNullable<React.ComponentProps<"form">["action"]>;

export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  action,
  danger = false
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  action: FormAction;
  danger?: boolean;
}): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {triggerLabel}
      </Button>
      <dialog
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="ds-dialog"
        ref={dialogRef}
      >
        <div className="ds-dialog-body">
          <div>
            <p className="section-kicker">Confirmation required</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <p id={descriptionId}>{description}</p>
          <div className="ds-dialog-actions">
            <Button
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Cancel
            </Button>
            <form action={action}>
              <Button variant={danger ? "danger" : "primary"} type="submit">
                {confirmLabel}
              </Button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
