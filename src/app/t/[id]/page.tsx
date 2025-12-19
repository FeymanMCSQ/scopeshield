import { prisma } from '../../../lib/prisma';
import ApproveButton from './ApproveButton';

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await prisma.changeRequest.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!ticket) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-semibold">Ticket not found</h1>
      </main>
    );
  }

  const dollars = (ticket.price / 100).toFixed(2);
  const isApproved = ticket.status === 'approved';

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-2">Change Request</h1>

      <p className="text-gray-600 mb-6">Client: {ticket.client.name}</p>

      <div className="border rounded-lg p-4 mb-4">
        <p className="text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
      </div>

      <p className="text-gray-700">
        Suggested price: <b>${dollars}</b>
      </p>

      <p className="text-sm text-gray-500 mt-2">Status: {ticket.status}</p>

      <ApproveButton ticketId={ticket.id} disabled={isApproved} />
      {isApproved ? (
        <p className="mt-2 text-sm text-gray-600">Already approved.</p>
      ) : null}
    </main>
  );
}
