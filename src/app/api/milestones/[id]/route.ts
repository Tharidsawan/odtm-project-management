import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const milestone = await prisma.milestone.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      dueDate: new Date(body.dueDate),
      completed: body.completed,
    },
  });
  return NextResponse.json(milestone);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.milestone.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
