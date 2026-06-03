import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const entry = await prisma.weeklyProgress.update({
    where: { id },
    data: { planPct: body.planPct, actualPct: body.actualPct },
  });
  return NextResponse.json(entry);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.weeklyProgress.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
