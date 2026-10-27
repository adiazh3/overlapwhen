import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  title: string;
  url: string;
  message: string;
  label?: string;
  variant?: ButtonProps["variant"];
};

/** Native phone sharing, with an accessible copy/select fallback on every browser. */
export function SharePoll({ title, url, message, label = "Share poll", variant = "outline" }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const text = `${message}\n${url}`;
  const share = async () => {
    if (!navigator.share) { setOpen(true); return; }
    setBusy(true);
    try {
      await navigator.share({ title, text: message, url });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setOpen(true);
    } finally { setBusy(false); }
  };
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied — ready to send to your group");
    } catch {
      toast.error("Couldn't copy automatically. Select the message below to copy it.");
      document.getElementById("share-message")?.focus();
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant={variant} disabled={busy} onClick={() => void share()}><Share2 /> {label}</Button>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <DialogHeader className="pr-10">
          <DialogTitle>Share with your group</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="share-message">Message</Label>
          <Textarea id="share-message" readOnly value={text} rows={5} onFocus={(event) => event.currentTarget.select()} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void copy(text)}><Copy /> Copy message</Button>
          <Button size="sm" variant="outline" onClick={() => void copy(url)}><Copy /> Copy link only</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}