"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setDeliverablePostedState } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";

type DeliverablePostedButtonProps = {
  campaignId: string;
  deliverableId: string;
  isPosted: boolean;
};

export function DeliverablePostedButton({ campaignId, deliverableId, isPosted }: DeliverablePostedButtonProps) {
  const router = useRouter();
  const [posted, setPosted] = useState(isPosted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    const nextPosted = !posted;
    // Optimistic UI keeps this common action feeling instant; failures roll the
    // button back and leave the user on the same page.
    setPosted(nextPosted);
    setError(null);

    startTransition(() => {
      void setDeliverablePostedState({
        id: deliverableId,
        campaignId,
        isPosted: nextPosted
      })
        .then(() => {
          router.refresh();
        })
        .catch((caughtError: unknown) => {
          setPosted(!nextPosted);
          setError(caughtError instanceof Error ? caughtError.message : "Could not update status.");
        });
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={posted ? "secondary" : "primary"}
        size="sm"
        onClick={onToggle}
        disabled={isPending}
      >
        {isPending ? "Updating..." : posted ? "Mark pending" : "Mark posted"}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
