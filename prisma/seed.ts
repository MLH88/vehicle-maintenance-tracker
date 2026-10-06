import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function monthsAgo(months: number, day = 15): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months, day);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  // Clear existing data so the seed is idempotent.
  await prisma.serviceReminder.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.vehicle.deleteMany();

  const civic = await prisma.vehicle.create({
    data: {
      name: "Daily Driver",
      make: "Honda",
      model: "Civic",
      year: 2019,
      currentMileage: 84250,
      maintenanceRecords: {
        create: [
          {
            serviceType: "Oil Change",
            date: monthsAgo(11, 8),
            mileage: 70100,
            cost: 74.99,
            shopName: "Honda of Downtown",
            notes: "0W-20 synthetic, new oil filter.",
          },
          {
            serviceType: "Tire Rotation",
            date: monthsAgo(9, 20),
            mileage: 73400,
            cost: 29.99,
            shopName: "Discount Tire",
          },
          {
            serviceType: "Brake Pads (Front)",
            date: monthsAgo(7, 3),
            mileage: 75900,
            cost: 289.5,
            shopName: "Midas",
            notes: "Front pads replaced, rotors resurfaced.",
          },
          {
            serviceType: "Oil Change",
            date: monthsAgo(5, 12),
            mileage: 78200,
            cost: 79.99,
            shopName: "Honda of Downtown",
          },
          {
            serviceType: "Cabin Air Filter",
            date: monthsAgo(3, 27),
            mileage: 80600,
            cost: 18.49,
            notes: "DIY replacement.",
          },
          {
            serviceType: "Oil Change",
            date: monthsAgo(1, 9),
            mileage: 83500,
            cost: 81.99,
            shopName: "Honda of Downtown",
            notes: "Recommended wiper blades soon.",
          },
        ],
      },
      serviceReminders: {
        create: [
          { serviceType: "Oil Change", intervalKm: 8000, intervalMonths: 6 },
          { serviceType: "Tire Rotation", intervalKm: 10000 },
        ],
      },
    },
  });

  const tacoma = await prisma.vehicle.create({
    data: {
      name: "Weekend Truck",
      make: "Toyota",
      model: "Tacoma",
      year: 2016,
      currentMileage: 142800,
      maintenanceRecords: {
        create: [
          {
            serviceType: "Tire Rotation",
            date: monthsAgo(11, 2),
            mileage: 134500,
            cost: 24.99,
            shopName: "Discount Tire",
          },
          {
            serviceType: "Oil Change",
            date: monthsAgo(10, 18),
            mileage: 135200,
            cost: 89.95,
            shopName: "Jiffy Lube",
          },
          {
            serviceType: "Battery Replacement",
            date: monthsAgo(8, 2),
            mileage: 136900,
            cost: 214.0,
            shopName: "AutoZone",
            notes: "Old battery failed load test in cold weather.",
          },
          {
            serviceType: "Transmission Fluid",
            date: monthsAgo(4, 22),
            mileage: 139700,
            cost: 165.0,
            shopName: "Toyota Service Center",
            notes: "Drain and fill, ATF WS.",
          },
          {
            serviceType: "Oil Change",
            date: monthsAgo(2, 14),
            mileage: 141600,
            cost: 92.5,
            shopName: "Jiffy Lube",
          },
        ],
      },
      serviceReminders: {
        create: [
          { serviceType: "Oil Change", intervalKm: 8000, intervalMonths: 6 },
          { serviceType: "Tire Rotation", intervalKm: 9000 },
          { serviceType: "Coolant Flush", intervalMonths: 24 },
        ],
      },
    },
  });

  console.log(`Seeded vehicles: ${civic.name}, ${tacoma.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
