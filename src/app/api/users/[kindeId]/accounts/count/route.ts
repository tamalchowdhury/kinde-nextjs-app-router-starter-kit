import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"

// If you want to force fresh data (no static caching) important for this use case
export const dynamic = "force-dynamic"

const ParamsSchema = z.object({
  kindeId: z.string().min(1, "kindeId is required"),
})

/**
 * GET /api/users/:kindeId/accounts/count
 * Response: { kindeId: string, count: number }
 */
export async function GET(_req: Request, ctx: { params: { kindeId: string } }) {
  try {
    const { kindeId } = ParamsSchema.parse(ctx.params)

    const count = await prisma.account.count({
      where: {
        kindeId,
      },
    })

    return NextResponse.json(
      { kindeId, count },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (err: any) {
    const message =
      err?.issues?.[0]?.message ??
      err?.message ??
      "Failed to get tracked accounts count"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
