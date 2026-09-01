import EventClient from "@/components/EventClient";

export const dynamicParams = true;

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    // params is a Promise in Next 15+; unwrap inside async client wrapper via suspense
    <EventPageInner idPromise={params} />
  );
}

async function EventPageInner({ idPromise }: { idPromise: Promise<{ id: string }> }) {
  const { id } = await idPromise;
  return <EventClient id={id} />;
}
