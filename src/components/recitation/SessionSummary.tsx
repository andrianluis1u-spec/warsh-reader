import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MistakePanel } from "./MistakePanel";
import { RotateCcw, Trophy } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accuracy: number;
  wordsRecited: number;
  totalWords: number;
  mistakes: import("@/lib/engine").Mistake[];
  onRestart: () => void;
}

export function SessionSummary({
  open,
  onOpenChange,
  accuracy,
  wordsRecited,
  totalWords,
  mistakes,
  onRestart,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="size-5 text-amber-500" />
            Résumé de la session
          </DialogTitle>
          <DialogDescription>
            Bilan de votre récitation — erreurs horodatées ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-2 text-center">
          <div className="rounded-xl border border-border/60 bg-secondary/50 p-3">
            <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {accuracy}%
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Précision</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-secondary/50 p-3">
            <p className="text-2xl font-bold tabular-nums">
              {wordsRecited}
              <span className="text-sm text-muted-foreground">/{totalWords}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Mots récités</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-secondary/50 p-3">
            <p className="text-2xl font-bold tabular-nums">{mistakes.length}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Erreurs</p>
          </div>
        </div>

        <Progress value={accuracy} className="h-2" />

        <Separator />

        <MistakePanel mistakes={mistakes} />

        <DialogFooter className="gap-2 sm:justify-start">
          <Button onClick={onRestart} className="gap-2">
            <RotateCcw className="size-4" />
            Refaire
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
