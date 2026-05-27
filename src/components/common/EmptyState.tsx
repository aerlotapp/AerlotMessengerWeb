import { Inbox } from "lucide-react";

export function EmptyState({ title = "Nothing here yet", description }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] p-12 text-center">
      <Inbox className="mb-4 h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
