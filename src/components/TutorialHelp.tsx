import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HowItWorksTutorial } from "@/components/HowItWorksTutorial";

/** Compact top-bar trigger that opens the "How it works" slideshow in a modal. */
export function TutorialHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How it works"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="size-4" />
        <span className="hidden sm:inline">How it works</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:max-w-4xl">
          <DialogTitle className="sr-only">How Overlap works</DialogTitle>
          <HowItWorksTutorial onFinish={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
