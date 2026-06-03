import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const member = await prisma.member.create({
    data: {
      name: body.name,
      role: body.role,
      email: body.email,
      parentId: body.parentId ?? null,
      projectId: body.projectId,
    },
  });
  return NextResponse.json(member, { status: 201 });
}
