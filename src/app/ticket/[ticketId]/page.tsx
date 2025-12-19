import { prisma } from '../../../lib/prisma';

export default async function TicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  const ticket = await prisma.changeRequest.findUnique({
    where: { id: ticketId },
    include: { client: true },
  });

  if (!ticket) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-semibold">Ticket not found</h1>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Change Request</h1>
      <p className="text-gray-600 mb-6">Client: {ticket.client.name}</p>

      <div className="border rounded-lg p-4 mb-4">
        <p className="text-gray-800">{ticket.message}</p>
      </div>

      <p className="text-gray-700">
        Suggested price: <b>${(ticket.price / 100).toFixed(2)}</b>
      </p>

      <p className="text-sm text-gray-500 mt-4">Status: {ticket.status}</p>
    </main>
  );
}
