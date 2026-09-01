import VodClient from "@/components/VodClient";

export const dynamic = "force-dynamic";

export default async function VodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VodClient id={id} />;
}
