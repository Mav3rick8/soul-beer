import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
  }
}

export function toResponse(e: unknown) {
  if (e instanceof AppError) {
    return NextResponse.json({ error: e.code }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}
