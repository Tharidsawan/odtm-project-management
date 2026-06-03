import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      name: body.name,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      progress: body.progress ?? 0,
      color: body.color ?? "blue",
      order: body.order ?? 0,
      projectId: body.projectId,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
