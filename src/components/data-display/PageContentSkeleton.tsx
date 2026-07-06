import { Skeleton } from "@/components/ui/skeleton";

export function PageContentSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando página">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-12 w-full max-w-xl rounded-lg" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
