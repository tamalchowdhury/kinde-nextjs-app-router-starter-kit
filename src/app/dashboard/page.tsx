import {
  getAccountsAction,
  addAccountAction,
  deleteAccountAction,
} from "./actions"

import "./dashboard.css"

export default async function Dashboard() {
  const accounts = await getAccountsAction()

  return (
    <div className="dash-container">
      <h2 className="dash-title">Tracked Accounts</h2>

      {accounts.length === 0 ? (
        <p className="empty-text">No accounts yet.</p>
      ) : (
        <ul className="account-list">
          {accounts.map((a) => (
            <li key={a.id} className="account-item">
              <div className="account-meta">
                <div className="account-name">{a.name}</div>
                <div className="account-number">{a.accountNumber}</div>
              </div>

              <form action={deleteAccountAction} className="account-actions">
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="btn btn-danger">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="form-card">
        <h3 className="form-title">Add a new account to track</h3>

        <form action={addAccountAction} className="account-form">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name" className="label">
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                required
                placeholder="Personal"
                className="input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="accountNumber" className="label">
                Account Number
              </label>
              <input
                id="accountNumber"
                type="text"
                name="accountNumber"
                required
                placeholder="001234"
                className="input"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Add
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
