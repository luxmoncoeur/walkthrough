"use client";

import RouteError from "@/components/RouteError";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <RouteError
      error={error}
      retry={retry}
      title="We couldn't show this tour"
      description="Something went wrong while displaying the tour. Try again, or start over with another repo."
    />
  );
}
