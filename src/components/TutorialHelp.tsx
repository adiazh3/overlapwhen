import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HowItWorksTutorial } from "@/components/HowItWorksTutorial";

export function TutorialHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How it works — open tutorial"
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <CircleHelp className="h-6 w-6" />
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
