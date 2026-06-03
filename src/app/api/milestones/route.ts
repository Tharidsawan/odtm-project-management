import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const milestone = await prisma.milestone.create({
    data: {
      name: body.name,
      description: body.description,
      dueDate: new Date(body.dueDate),
      projectId: body.projectId,
    },
  });
  return NextResponse.json(milestone, { status: 201 });
}
