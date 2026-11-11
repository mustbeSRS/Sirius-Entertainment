import { Recovery } from "@/components/recovery";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; purpose?: string }>;
}) {
  const p = await searchParams;
  return <Recovery token={p.token || null} admin={p.purpose === "admin"} />;
}
