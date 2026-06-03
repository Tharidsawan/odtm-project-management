import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json([]);
  const data = await prisma.weeklyProgress.findMany({
    where: { projectId },
    orderBy: { weekDate: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const existing = await prisma.weeklyProgress.findFirst({
    where: { projectId: body.projectId, weekDate: new Date(body.weekDate) },
  });
  if (existing) {
    const updated = await prisma.weeklyProgress.update({
      where: { id: existing.id },
      data: { planPct: body.planPct, actualPct: body.actualPct },
    });
    return NextResponse.json(updated);
  }
  const entry = await prisma.weeklyProgress.create({
    data: {
      weekDate: new Date(body.weekDate),
      planPct: body.planPct,
      actualPct: body.actualPct,
      projectId: body.projectId,
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
