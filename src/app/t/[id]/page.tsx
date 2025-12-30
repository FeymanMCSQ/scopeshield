// // /src/app/t/[id]/page.tsx
// import { prisma } from '../../../lib/prisma';
// import ApproveButton from './ApproveButton';
// import TicketAssetUpload from './TicketAssetUpload';
// import { cookies } from 'next/headers';

// export default async function TicketPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const { id } = await params;

//   const ticket = await prisma.changeRequest.findUnique({
//     where: { id },
//     include: { client: true },
//   });

//   if (!ticket) {
//     return (
//       <main className="p-8">
//         <h1 className="text-xl font-semibold">Ticket not found</h1>
//       </main>
//     );
//   }

//   const dollars = (ticket.price / 100).toFixed(2);
//   const isApproved = ticket.status === 'approved';

//   // Owner gating (freelancer-only upload)
//   const cookieStore = await cookies();
//   const ssUid = cookieStore.get('ss_uid')?.value;
//   const isOwner = !!ssUid && ssUid === ticket.userId;

//   return (
//     <main className="mx-auto max-w-2xl p-8">
//       <h1 className="text-2xl font-semibold mb-2">Change Request</h1>

//       <p className="text-gray-600 mb-6">Client: {ticket.client.name}</p>

//       <div className="border rounded-lg p-4 mb-4">
//         <p className="text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
//       </div>

//       <p className="text-gray-700">
//         Suggested price: <b>${dollars}</b>
//       </p>

//       <p className="text-sm text-gray-500 mt-2">Status: {ticket.status}</p>

//       {/* Asset render always; upload only for owner */}
//       {ticket.assetUrl && !isOwner ? (
//         <div className="mt-6">
//           <img
//             src={ticket.assetUrl}
//             alt="Ticket attachment"
//             className="max-w-full rounded-lg border"
//           />
//         </div>
//       ) : null}

//       {isOwner ? (
//         <TicketAssetUpload ticketId={ticket.id} initialUrl={ticket.assetUrl} />
//       ) : null}

//       <ApproveButton ticketId={ticket.id} disabled={isApproved} />
//       {isApproved ? (
//         <p className="mt-2 text-sm text-gray-600">Already approved.</p>
//       ) : null}
//     </main>
//   );
// }

// /src/app/t/[id]/page.tsx
import { prisma } from '../../../lib/prisma';
import ApproveButton from './ApproveButton';
import TicketAssetUpload from './TicketAssetUpload';
import { TicketEmbedPreview } from './TicketEmbedPreview';
import { cookies } from 'next/headers';

// Optional but helpful during dev (prevents stale embeds/assets)
export const dynamic = 'force-dynamic';

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

  // Owner gating (freelancer-only upload)
  const cookieStore = await cookies();
  const ssUid = cookieStore.get('ss_uid')?.value;
  const isOwner = !!ssUid && ssUid === ticket.userId;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-2">Change Request</h1>

      <p className="text-gray-600 mb-6">Client: {ticket.client.name}</p>

      {/* Message */}
      <div className="border rounded-lg p-4 mb-4">
        <p className="text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
      </div>

      {/* Auto-embed previews (Figma / Canva) */}
      <TicketEmbedPreview message={ticket.message} />

      {/* Price + status */}
      <p className="text-gray-700 mt-4">
        Suggested price: <b>${dollars}</b>
      </p>

      <p className="text-sm text-gray-500 mt-2">Status: {ticket.status}</p>

      {/* Ticket asset (visible to everyone) */}
      {ticket.assetUrl ? (
        <div className="mt-6">
          <img
            src={ticket.assetUrl}
            alt="Ticket attachment"
            className="max-w-full rounded-lg border"
          />
        </div>
      ) : null}

      {/* Asset upload (owner only) */}
      {isOwner ? (
        <div className="mt-4">
          <TicketAssetUpload
            ticketId={ticket.id}
            initialUrl={ticket.assetUrl}
          />
        </div>
      ) : null}

      {/* Approval */}
      <div className="mt-6">
        <ApproveButton ticketId={ticket.id} disabled={isApproved} />
        {isApproved ? (
          <p className="mt-2 text-sm text-gray-600">Already approved.</p>
        ) : null}
      </div>
    </main>
  );
}
