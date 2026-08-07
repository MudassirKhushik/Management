import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // 1. Wipe old inconsistent rows if any ghost rows remained
    await prisma.user.deleteMany({});
    await prisma.agency.deleteMany({});

    // 2. Encrypt secure temporary access passwords
    const defaultPasswordHash = await bcrypt.hash("Admin@123", 10);

    // 3. Reconstruct your Super Admin Workspace Profile
    const superAdmin = await prisma.user.create({
      data: {
        email: "admin@travelcraft.com",
        passwordHash: defaultPasswordHash,
        isSuperAdmin: true,
      },
    });

    // 4. Create your Primary Operational Agency Account
    const defaultAgency = await prisma.agency.create({
      data: {
        name: "Travel Craft International",
        slug: "travelcraft",
        isActive: true,
        // Establish the linked tenant user record simultaneously
        users: {
          create: {
            email: "agency@travelcraft.com",
            passwordHash: defaultPasswordHash,
            isSuperAdmin: false,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database seed records successfully reconstructed!",
      credentials: {
        superAdmin: "admin@admin.com",
        agencyUser: "travelcraft@agency.com",
        password: "Admin@123"
      }
    });

  } catch (error: any) {
    console.error("Database setup script crashed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
