"use client";

import RouteError from "@/components/RouteError";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <RouteError
      error={error}
      retry={retry}
      title="Something broke"
      description="This page hit an unexpected error. Nothing you did caused it. Try again, or head back home."
    />
  );
}
