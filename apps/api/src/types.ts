export type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
};

export type Variables = {
  ownerId: string | null;
  authType: "session" | "apikey" | null;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
