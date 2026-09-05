import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // 1. Encrypt secure temporary access passwords
    const defaultPasswordHash = await bcrypt.hash("Admin@123", 10);

    // 2. Safely create or update the Super Admin without deleting anything else
    const superAdmin = await prisma.user.upsert({
      where: { email: "admin@travelcraft.com" },
      update: {}, // If it exists, do nothing
      create: {
        email: "admin@travelcraft.com",
        passwordHash: defaultPasswordHash,
        isSuperAdmin: true,
      },
    });

    // 3. Check if the agency already exists before creating it
    let defaultAgency = await prisma.agency.findUnique({
      where: { slug: "travelcraft" },
    });

    if (!defaultAgency) {
      defaultAgency = await prisma.agency.create({
        data: {
          name: "Travel Craft International",
          slug: "travelcraft",
          isActive: true,
          users: {
            create: {
              email: "agency@travelcraft.com",
              passwordHash: defaultPasswordHash,
              isSuperAdmin: false,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database seed missing records safely checked/reconstructed without wiping existing data!",
      credentials: {
        superAdmin: "admin@travelcraft.com", 
        agencyUser: "agency@travelcraft.com", 
        password: "Admin@123"
      }
    });

  } catch (error: any) {
    console.error("Database setup script crashed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
