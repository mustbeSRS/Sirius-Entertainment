export type Recovery = {
  hash: string;
  email: string;
  purpose: "artist" | "admin";
  expires_at: string;
  used: boolean;
};
export type AdminSession = { hash: string; email: string; expires_at: string };
export type Audit = { email: string; action: string; at: string };
