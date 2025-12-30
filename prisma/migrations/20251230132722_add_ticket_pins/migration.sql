-- CreateTable
CREATE TABLE "TicketPin" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketPin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketPin_ticketId_idx" ON "TicketPin"("ticketId");

-- AddForeignKey
ALTER TABLE "TicketPin" ADD CONSTRAINT "TicketPin_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
