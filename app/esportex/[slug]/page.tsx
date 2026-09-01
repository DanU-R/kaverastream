import EsxPlayerClient from "@/components/EsxPlayerClient";

export const dynamic = "force-dynamic";

export default async function EsxPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EsxPlayerClient slug={slug} />;
}
