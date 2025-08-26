"use server"

import prisma from "../lib/prisma"
import { z } from "zod"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

const AccountInput = z.object({
  name: z.string().min(1, "Name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
})

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

  try {
    const account = await prisma.account.create({
      data: {
        name,
        accountNumber,
        kindeId: user.id,
      },
    })
    return { ok: true as const, account }
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
