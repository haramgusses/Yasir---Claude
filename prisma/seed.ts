import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.scan.deleteMany();
  await prisma.document.deleteMany();
  await prisma.order.deleteMany();

  const order = await prisma.order.create({
    data: {
      orderRef: "ORD-2024-00142",
      recipient: "Apex Logistics Ltd",
      shipmentType: "International",
      notes: "Handle with care. Temperature-sensitive goods. Contact recipient 2 hours before delivery.",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdBy: "seed_user",
      docs: {
        create: [
          {
            name: "commercial_invoice_ORD-2024-00142.pdf",
            size: 245760,
            mimeType: "application/pdf",
            extension: "pdf",
            docType: "Invoice",
            fileUrl: "https://utfs.io/f/demo-invoice.pdf",
          },
          {
            name: "packing_list_ORD-2024-00142.pdf",
            size: 102400,
            mimeType: "application/pdf",
            extension: "pdf",
            docType: "Packing List",
            fileUrl: "https://utfs.io/f/demo-packing-list.pdf",
          },
        ],
      },
    },
    include: { docs: true },
  });

  await prisma.scan.createMany({
    data: [
      {
        orderId: order.id,
        scannedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        ipAddress: "82.34.118.220",
      },
      {
        orderId: order.id,
        scannedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36",
        ipAddress: "94.197.22.41",
      },
    ],
  });

  console.log(`✓ Created demo order: ${order.orderRef} (token: ${order.token})`);
  console.log(`  └─ ${order.docs.length} documents, 2 scan events`);
  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
