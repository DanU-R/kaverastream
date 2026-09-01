import IdPlayerClient from "@/components/IdPlayerClient";

export const dynamic = "force-dynamic";

export default async function IdPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IdPlayerClient id={id} />;
}
