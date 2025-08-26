import { addAccount, getAccounts, deleteAccount } from "@/actions"
import { revalidatePath } from "next/cache"

export default async function Dashboard() {
  async function addAction(formData: FormData) {
    "use server"

    const result = await addAccount({
      name: String(formData.get("name") || ""),
      accountNumber: String(formData.get("accountNumber") || ""),
    })

    if (result.ok) {
      revalidatePath("/dashboard")
    }
  }

  const accounts = await getAccounts()

  // Inline server action to adapt FormData -> placeholder delete
  async function deleteAction(formData: FormData) {
    "use server"
    const id = String(formData.get("id") || "")
    const res = await deleteAccount({ id })
    // Revalidate this page so the deleted row disappears
    revalidatePath("/dashboard")
    return res
  }

  return (
    <div className="container">
      <h2>Tracked Accounts</h2>

      {accounts.length === 0 ? (
        <p className="text-sm text-neutral-600">No accounts yet.</p>
      ) : (
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between border rounded px-3 py-2"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{a.name}</div>
                <div className="text-sm text-neutral-600 truncate">
                  {/* Show only the number if you prefer */}
                  {a.accountNumber}
                </div>
              </div>

              <form action={deleteAction}>
                <input type="hidden" name="id" value={a.id} />
                <button
                  type="submit"
                  className="text-red-600 text-sm underline"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h3>Add a new account to track</h3>

        <form action={addAction}>
          <label htmlFor="name">Name:</label>
          <input type="text" name="name" required placeholder="Personal" />
          <br />
          <label htmlFor="account">Account Number:</label>
          <input
            type="text"
            name="accountNumber"
            required
            placeholder="001234"
          />
          <br />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  )
}
