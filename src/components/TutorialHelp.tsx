import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HowItWorksTutorial } from "@/components/HowItWorksTutorial";
import { Button } from "@/components/ui/button";

/** Compact top-bar trigger that opens the "How it works" slideshow in a modal. */
export function TutorialHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        decoration="none"
        onClick={() => setOpen(true)}
        aria-label="How it works"
        className="eyebrow inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="size-3.5" />
        <span className="hidden sm:inline">How it works</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:max-w-4xl">
          <DialogTitle className="sr-only">How Overlap works</DialogTitle>
          <HowItWorksTutorial onFinish={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
