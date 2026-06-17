import React, { useState, useEffect } from 'react'
import { useAdminData } from '../context/AdminDataContext'
import type { AdminStaffAccount } from '../context/AdminDataContext'

const AVAILABLE_PERMISSIONS = [
  { key: 'manage_catalog', label: 'Manage Catalog (Products & Categories)' },
  { key: 'manage_orders', label: 'Manage Orders & Shipments' },
  { key: 'manage_customers', label: 'Manage Customers Profile & Data' },
  { key: 'manage_returns', label: 'Manage Return Approvals & Refunds' },
  { key: 'manage_support', label: 'Manage Support Tickets & Replies' },
  { key: 'manage_cms', label: 'Manage CMS Pages & Storefront content' }
]

export const Accounts: React.FC = () => {
  const {
    staffAccounts,
    accountsLoading,
    fetchStaffAccounts,
    inviteStaff,
    updateStaffAccount
  } = useAdminData()

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isEditPermsModalOpen, setIsEditPermsModalOpen] = useState(false)
  
  // Form Invite Staff
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'sub_admin' | 'super_owner'>('sub_admin')
  const [invitePerms, setInvitePerms] = useState<string[]>([])

  // Edit Staff Permissions
  const [editingStaff, setEditingStaff] = useState<AdminStaffAccount | null>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])

  // Hardening states
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [isTogglingMap, setIsTogglingMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchStaffAccounts()
  }, [])

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Please fill out all required fields')
      return
    }

    setIsInviting(true)
    try {
      await inviteStaff({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        permissions: invitePerms
      })
      setIsInviteModalOpen(false)
      // Reset form
      setInviteName('')
      setInviteEmail('')
      setInviteRole('sub_admin')
      setInvitePerms([])
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send staff member invitation.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleToggleBlock = async (staff: AdminStaffAccount) => {
    const actionWord = staff.isBlocked ? 'unsuspend' : 'suspend'
    if (confirm(`Are you sure you want to ${actionWord} the staff account for "${staff.name}"?`)) {
      setIsTogglingMap(prev => ({ ...prev, [staff.id]: true }))
      setUpdateError(null)
      try {
        await updateStaffAccount(staff.id, {
          isBlocked: !staff.isBlocked
        })
      } catch (err: any) {
        setUpdateError(err.message || `Failed to ${actionWord} account`)
      } finally {
        setIsTogglingMap(prev => ({ ...prev, [staff.id]: false }))
      }
    }
  }

  const openPermsModal = (staff: AdminStaffAccount) => {
    setEditingStaff(staff)
    setEditPerms(staff.permissions)
    setUpdateError(null)
    setIsEditPermsModalOpen(true)
  }

  const handleUpdatePerms = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return

    setIsUpdating(true)
    setUpdateError(null)
    try {
      await updateStaffAccount(editingStaff.id, {
        permissions: editPerms
      })
      setIsEditPermsModalOpen(false)
      setEditingStaff(null)
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update staff permissions.')
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleInvitePermission = (permKey: string) => {
    setInvitePerms(prev =>
      prev.includes(permKey) ? prev.filter(k => k !== permKey) : [...prev, permKey]
    )
  }

  const toggleEditPermission = (permKey: string) => {
    setEditPerms(prev =>
      prev.includes(permKey) ? prev.filter(k => k !== permKey) : [...prev, permKey]
    )
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink">Roles & Accounts</h2>
          <p className="text-[11px] text-ink-muted leading-normal">
            Invite sub-administrators, toggle staff block status, and partition operational access privileges.
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="mt-3 sm:mt-0 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded shadow-xs"
        >
          ➕ Invite Staff Member
        </button>
      </div>

      {updateError && (
        <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
          ⚠️ {updateError}
        </div>
      )}

      {/* Staff List Table */}
      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email Address</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Access Scope (Permissions)</th>
              <th className="px-4 py-2.5 text-center">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {accountsLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted italic">
                  Fetching staff accounts directory...
                </td>
              </tr>
            ) : staffAccounts.length > 0 ? (
              staffAccounts.map((staff) => (
                <tr key={staff.id} className="hover:bg-bg/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink">{staff.name}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">{staff.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      staff.role === 'super_owner' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/30'
                    }`}>
                      {staff.role === 'super_owner' ? 'Super Owner' : 'Sub Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {staff.isBlocked ? (
                      <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-primary text-white border-primary">
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-accent-teal/20 text-accent-teal border-accent-teal/30">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {staff.role === 'super_owner' ? (
                      <span className="text-ink-muted italic">All administrative permissions</span>
                    ) : staff.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {staff.permissions.map(p => (
                          <span key={p} className="text-[9px] bg-bg border border-border px-1.5 py-0.5 rounded font-mono text-ink">
                            {p.replace('manage_', '')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-primary italic">No permissions assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {/* Can only edit if not editing own super_owner account */}
                    {staff.role !== 'super_owner' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openPermsModal(staff)}
                          className="text-[10px] font-bold text-ink-muted hover:text-ink hover:underline focus:outline-none"
                        >
                          Permissions
                        </button>
                        <span className="text-border">|</span>
                        <button
                          onClick={() => handleToggleBlock(staff)}
                          disabled={isTogglingMap[staff.id]}
                          className={`text-[10px] font-bold hover:underline focus:outline-none disabled:opacity-50 ${
                            staff.isBlocked ? 'text-accent-teal' : 'text-primary'
                          }`}
                        >
                          {staff.isBlocked ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-ink-muted italic">Protected</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted italic">
                  No administrative staff members registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL: INVITE STAFF --- */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsInviteModalOpen(false)} />
          <div className="bg-surface border border-border w-full max-w-md rounded-lg shadow-xl overflow-hidden z-10 text-left animate-fade-in-up">
            <div className="bg-secondary py-4 px-5 text-white flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-sm tracking-wide">➕ Invite Staff Member</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-white hover:opacity-85 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
              {inviteError && (
                <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                  ⚠️ {inviteError}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Alexander Smith"
                  className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                  disabled={isInviting}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="alex@toycabin.com"
                  className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono disabled:opacity-50"
                  disabled={isInviting}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Staff Role Type</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer font-semibold disabled:opacity-50"
                  disabled={isInviting}
                >
                  <option value="sub_admin">Sub Admin (Restricted Scope)</option>
                  <option value="super_owner">Super Owner (Full Access Override)</option>
                </select>
              </div>

              {/* Permissions Checklist - Only visible if Sub Admin role selected */}
              {inviteRole === 'sub_admin' && (
                <div className="space-y-2 border-t border-border pt-3">
                  <label className="block text-[10px] font-bold text-ink-muted uppercase">Assign Operations Permissions</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <div key={perm.key} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={`invite-perm-${perm.key}`}
                          checked={invitePerms.includes(perm.key)}
                          onChange={() => toggleInvitePermission(perm.key)}
                          className="mt-0.5 h-3.5 w-3.5 rounded accent-primary cursor-pointer disabled:opacity-50"
                          disabled={isInviting}
                        />
                        <label htmlFor={`invite-perm-${perm.key}`} className="text-xs text-ink cursor-pointer select-none">
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2.5 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  disabled={isInviting}
                  className="bg-bg border border-border text-ink text-xs font-bold px-4 py-2 rounded focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded shadow-xs focus:outline-none disabled:opacity-50"
                >
                  {isInviting ? 'Inviting...' : 'Send Invite Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT PERMISSIONS --- */}
      {isEditPermsModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsEditPermsModalOpen(false)} />
          <div className="bg-surface border border-border w-full max-w-md rounded-lg shadow-xl overflow-hidden z-10 text-left animate-fade-in-up">
            <div className="bg-secondary py-4 px-5 text-white flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-sm tracking-wide">
                🛡️ Permissions: {editingStaff.name}
              </h3>
              <button onClick={() => setIsEditPermsModalOpen(false)} className="text-white hover:opacity-85 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdatePerms} className="p-5 space-y-4">
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Adjust operational permissions checklist for the sub-admin account <strong className="font-mono text-ink">{editingStaff.email}</strong>.
              </p>

              {updateError && (
                <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                  ⚠️ {updateError}
                </div>
              )}

              <div className="space-y-2 border-t border-border pt-3">
                <div className="space-y-2">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <div key={perm.key} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-perm-${perm.key}`}
                        checked={editPerms.includes(perm.key)}
                        onChange={() => toggleEditPermission(perm.key)}
                        className="mt-0.5 h-3.5 w-3.5 rounded accent-primary cursor-pointer disabled:opacity-50"
                        disabled={isUpdating}
                      />
                      <label htmlFor={`edit-perm-${perm.key}`} className="text-xs text-ink cursor-pointer select-none">
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditPermsModalOpen(false)}
                  disabled={isUpdating}
                  className="bg-bg border border-border text-ink text-xs font-bold px-4 py-2 rounded focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded shadow-xs focus:outline-none disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts
