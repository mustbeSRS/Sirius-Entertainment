import { currentAdmin, contacts } from "@/lib/identity";
import { Recovery } from "@/components/recovery";
import { AdminPanel } from "@/components/admin";
export default async function Page() {
  const admin = await currentAdmin();
  if (!admin) return <Recovery admin />;
  const artists = await contacts(admin);
  return (
    <AdminPanel admin={admin} artists={JSON.parse(JSON.stringify(artists))} />
  );
}
