import { Card, CardContent } from "@/components/ui/card";

export function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-8 w-14 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
              <div className="mt-5 h-9 w-40 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
