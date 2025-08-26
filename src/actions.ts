"use server"

import prisma from "../lib/prisma"
import { z } from "zod"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

const AccountInput = z.object({
  name: z.string().min(1, "Name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
})

const FEATURE_KEY = "tracked_accounts"

// Add an account to track

export async function addAccount(input: {
  name: string
  accountNumber: string
}) {
  const { name, accountNumber } = AccountInput.parse(input)

  // Get current user (Kinde)
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  if (!user?.id) {
    throw new Error("Not authenticated")
  }

  // Count how many accounts the user already has
  const used = await prisma.account.count({ where: { kindeId: user.id } })

  // Get the allowed max from Kinde entitlement
  let limit: number | null = null
  try {
    limit = await getEntitlementLimit(FEATURE_KEY)
    console.log(`The current entitlement limit for ${FEATURE_KEY} is ${limit}`)
  } catch (e) {
    return {
      ok: false as const,
      code: "ENTITLEMENT_ERROR",
      message:
        "We could not verify your plan entitlements right now. Please try again.",
    }
  }

  // Enforce limit only if we have one
  if (limit != null && used >= limit) {
    return {
      ok: false as const,
      code: "LIMIT_REACHED",
      message: `You’ve reached your tracked accounts limit (${limit}). Remove one or upgrade your plan to add more.`,
      usage: { used, limit },
    }
  }

  try {
    const account = await prisma.account.create({
      data: {
        name,
        accountNumber,
        kindeId: user.id,
      },
    })
    return {
      ok: true as const,
      message: "Account added.",
      account,
      usage: { used: used + 1, limit },
    }
  } catch (e: any) {
    return { ok: false as const, error: "Failed to add account." }
  }
}

// Get all tracked accounts

export async function getAccounts() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  if (!user?.id) {
    throw new Error("Not authenticated")
  }

  return prisma.account.findMany({
    where: { kindeId: user.id },
    select: { id: true, name: true, accountNumber: true },
    orderBy: { name: "asc" },
  })
}

// Delete tracked accounts

export async function deleteAccount({ id }: { id: string }) {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  if (!user?.id) {
    throw new Error("Not authenticated")
  }

  // deleteMany ensures we only delete if it belongs to this user
  const result = await prisma.account.deleteMany({
    where: { id, kindeId: user.id },
  })

  if (result.count === 0) {
    return { ok: false as const, error: "Account not found or not allowed." }
  }
  return { ok: true as const }
}

// Helper: read the tracked_accounts limit from Kinde (Account API)
async function getEntitlementLimit(featureKey: string): Promise<number | null> {
  const { getAccessTokenRaw } = getKindeServerSession()
  const token = await getAccessTokenRaw()
  if (!token) throw new Error("Not authenticated.")

  const base = process.env.KINDE_ISSUER_URL?.replace(/\/+$/, "")
  if (!base) throw new Error("KINDE_ISSUER_URL is not configured.")

  const url = `${base}/account_api/v1/entitlement/${encodeURIComponent(
    featureKey
  )}`
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (res.status === 404) {
    // Feature not found for this user/plan
    return null
  }
  if (!res.ok) {
    let body = ""
    try {
      body = await res.text()
    } catch {}
    throw new Error(`Could not read entitlement (${res.status}). ${body}`)
  }

  // Expected shape (from your spec):
  // {
  //   "data": { "entitlement": {
  //     "feature_key": "tracked_accounts",
  //     "entitlement_limit_max": 10,
  //     ...
  //   } }
  // }
  const json = await res.json()

  const ent = json?.data?.entitlement
  if (!ent || (ent.feature_key && ent.feature_key !== featureKey)) return null

  const raw = ent.entitlement_limit_max ?? null

  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}
