import { AlertTriangle } from "lucide-react";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/10 p-10 text-center">
      <AlertTriangle className="mb-4 h-10 w-10 text-destructive" />
      <p className="text-sm text-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Try again
        </button>
      )}
    </div>
  );
}
