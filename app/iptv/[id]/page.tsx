import IptvPlayerClient from "@/components/IptvPlayerClient";

export const dynamic = "force-dynamic";

export default async function IptvPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IptvPlayerClient id={id} />;
}
