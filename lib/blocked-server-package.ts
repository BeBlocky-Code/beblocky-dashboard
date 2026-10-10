throw new Error(
  "mongoose and mongodb are server-only and must not be imported from client code. Use @/lib/object-id for ids.",
);
