import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Address } from '../context/AuthContext'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'

export const Profile: React.FC = () => {
  const { user, addresses, addAddress, removeAddress, updateAddress, login, authFetch } = useAuth()

  // 1. Personal Info Forms state
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [infoSuccess, setInfoSuccess] = useState('')
  const [isInfoSubmitting, setIsInfoSubmitting] = useState(false)
  const [infoError, setInfoError] = useState<string | null>(null)

  // 2. Change Password Form state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // 3. Address form state
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [addrPhone, setAddrPhone] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)

  // 4. Notification Preferences state
  const [emailPref, setEmailPref] = useState(true)
  const [smsPref, setSmsPref] = useState(true)
  const [whatsAppPref, setWhatsAppPref] = useState(false)
  const [prefSuccess, setPrefSuccess] = useState('')
  const [isPrefSubmitting, setIsPrefSubmitting] = useState(false)
  const [prefError, setPrefError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profileRes = await authFetch('/api/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setName(profileData.name || '')
          setEmail(profileData.email || '')
          setPhone(profileData.phone || '')
          if (profileData.name !== user?.name || profileData.email !== user?.email) {
            login({ id: profileData.id, name: profileData.name, email: profileData.email, role: profileData.role })
          }
        }
        
        const prefsRes = await authFetch('/api/profile/notifications')
        if (prefsRes.ok) {
          const prefsData = await prefsRes.json()
          setEmailPref(!!prefsData.email)
          setSmsPref(!!prefsData.sms)
          setWhatsAppPref(!!prefsData.whatsapp)
        }
      } catch (err) {
        console.error('[Profile] Failed to load profile and preferences:', err)
      }
    }
    loadProfileData()
  }, [])

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfoError(null)
    setInfoSuccess('')
    if (!name) {
      setInfoError('Please fill out Name.')
      return
    }
    setIsInfoSubmitting(true)
    try {
      const res = await authFetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update profile details.')
      }
      const data = await res.json()
      login({ id: data.id, name: data.name, email: data.email, role: data.role })
      setInfoSuccess('Profile details updated successfully!')
      setTimeout(() => setInfoSuccess(''), 4000)
    } catch (err: any) {
      setInfoError(err.message || 'Failed to update profile details.')
    } finally {
      setIsInfoSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess('')
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill out all password fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match!')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.')
      return
    }
    setIsPasswordSubmitting(true)
    try {
      const res = await authFetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update password.')
      }
      setPasswordSuccess('Password changed successfully!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(''), 4000)
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.')
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddressError(null)
    if (!line1 || !city || !state || !pincode || !addrPhone) {
      setAddressError('Please fill out all address fields.')
      return
    }

    setIsAddressSubmitting(true)
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, {
          line1,
          line2,
          city,
          state,
          pincode,
          phone: addrPhone,
          isDefault
        })
      } else {
        await addAddress({
          line1,
          line2,
          city,
          state,
          pincode,
          phone: addrPhone,
          isDefault
        })
      }

      // Reset Address form
      setLine1('')
      setLine2('')
      setCity('')
      setState('')
      setPincode('')
      setAddrPhone('')
      setIsDefault(false)
      setEditingAddressId(null)
      setShowAddressForm(false)
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address to backend.')
    } finally {
      setIsAddressSubmitting(false)
    }
  }

  const handleEditAddress = (addr: Address) => {
    setAddressError(null)
    setEditingAddressId(addr.id)
    setLine1(addr.line1)
    setLine2(addr.line2 || '')
    setCity(addr.city)
    setState(addr.state)
    setPincode(addr.pincode)
    setAddrPhone(addr.phone)
    setIsDefault(addr.isDefault)
    setShowAddressForm(true)
  }

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPrefError(null)
    setPrefSuccess('')
    setIsPrefSubmitting(true)
    try {
      const res = await authFetch('/api/profile/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailPref,
          sms: smsPref,
          whatsapp: whatsAppPref
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save preferences.')
      }
      setPrefSuccess('Notification preferences updated successfully!')
      setTimeout(() => setPrefSuccess(''), 4000)
    } catch (err: any) {
      setPrefError(err.message || 'Failed to save preferences.')
    } finally {
      setIsPrefSubmitting(false)
    }
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">User Panel</span>
        <h1 className="text-3xl sm:text-4xl font-heading text-ink tracking-tight mb-1 select-none font-bold">My Account</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Manage your profile details, shipping addresses, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-left">
        {/* Left column: Quick Links */}
        <div className="card-workshop p-5 bg-surface border-b-[3px] border-primary shadow-xs space-y-4 font-heading text-sm text-ink font-bold select-none">
          <span className="text-[10px] text-ink-muted font-heading uppercase tracking-wider block mb-2 border-b border-border/40 pb-2">Sections</span>
          <a href="#personal-info" className="block p-2 rounded hover:bg-bg transition border-l-2 border-transparent hover:border-primary pl-2">
            Personal Details
          </a>
          <a href="#address-book" className="block p-2 rounded hover:bg-bg transition border-l-2 border-transparent hover:border-primary pl-2">
            Address Book
          </a>
          <a href="#change-password" className="block p-2 rounded hover:bg-bg transition border-l-2 border-transparent hover:border-primary pl-2">
            Security & Password
          </a>
          <a href="#notifications" className="block p-2 rounded hover:bg-bg transition border-l-2 border-transparent hover:border-primary pl-2">
            Notification Settings
          </a>
        </div>

        {/* Right column: Form details */}
        <div className="md:col-span-2 space-y-8">
          
          {/* 1. PERSONAL INFORMATION */}
          <section id="personal-info" className="card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs space-y-4">
            <h3 className="text-lg font-heading text-ink font-bold border-b border-border/40 pb-2">Personal Details</h3>
            
            {infoSuccess && (
              <div className="p-3 bg-accent-teal/10 border border-accent-teal/30 text-accent-teal text-xs font-body font-semibold rounded-md">
                {infoSuccess}
              </div>
            )}
            {infoError && (
              <div className="p-3 bg-primary/10 border border-primary/25 text-primary text-xs font-body font-semibold rounded-md">
                ⚠️ {infoError}
              </div>
            )}

            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold text-ink mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    disabled={isInfoSubmitting}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-workshop disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold text-ink mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={isInfoSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-workshop disabled:opacity-50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-heading font-bold text-ink mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    disabled={isInfoSubmitting}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-workshop disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isInfoSubmitting}
                className="btn-primary bg-secondary hover:bg-primary-hover text-white font-heading font-bold text-xs px-5 py-2.5 rounded shadow-xs flex items-center space-x-1.5"
              >
                {isInfoSubmitting && <span className="animate-spin mr-1">⌛</span>}
                <span>Save Details</span>
              </button>
            </form>
          </section>

          {/* 2. ADDRESS BOOK */}
          <section id="address-book" className="card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <h3 className="text-lg font-heading text-ink font-bold">Address Book</h3>
              <button
                onClick={() => {
                  setEditingAddressId(null)
                  setLine1('')
                  setLine2('')
                  setCity('')
                  setState('')
                  setPincode('')
                  setAddrPhone('')
                  setIsDefault(false)
                  setShowAddressForm(!showAddressForm)
                }}
                className="text-xs font-heading font-bold text-accent-blue hover:underline"
              >
                {showAddressForm ? 'Cancel' : '+ Add Address'}
              </button>
            </div>

            {showAddressForm ? (
              <form onSubmit={handleAddressSubmit} className="space-y-4 pt-1">
                {addressError && (
                  <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                    ⚠️ {addressError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">Address Line 1</label>
                    <input
                      type="text"
                      required
                      disabled={isAddressSubmitting}
                      placeholder="e.g. 123 Forest Lane"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">Address Line 2</label>
                    <input
                      type="text"
                      disabled={isAddressSubmitting}
                      placeholder="e.g. Apartment, Suite, Landmark"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">City</label>
                    <input
                      type="text"
                      required
                      disabled={isAddressSubmitting}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">State</label>
                    <input
                      type="text"
                      required
                      disabled={isAddressSubmitting}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      disabled={isAddressSubmitting}
                      placeholder="97401"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      disabled={isAddressSubmitting}
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="profileIsDefault"
                    disabled={isAddressSubmitting}
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-ink-muted focus:ring-primary disabled:opacity-50"
                  />
                  <label htmlFor="profileIsDefault" className="text-xs font-body text-ink font-semibold cursor-pointer select-none">
                    Set as default shipping address
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isAddressSubmitting}
                  className="btn-primary bg-accent-blue hover:bg-accent-blue/90 disabled:bg-border disabled:text-ink-muted text-white font-heading font-bold text-xs px-5 py-2.5 rounded shadow-xs flex items-center justify-center space-x-1.5"
                >
                  {isAddressSubmitting && <span className="animate-spin mr-1">⌛</span>}
                  <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
                </button>
              </form>
            ) : (
              <div className="space-y-4 pt-1">
                {addresses.map((addr) => (
                  <div key={addr.id} className="card-workshop p-4 border-b-[2px] border-border/60 bg-bg/10 flex justify-between items-start shadow-xs">
                    <div className="text-xs sm:text-sm font-body text-ink space-y-1 text-left leading-relaxed">
                      <p className="font-heading font-bold text-sm text-ink flex items-center gap-1.5">
                        <span>Address</span>
                        {addr.isDefault && <BadgeTag text="default" variant="green" className="scale-75 origin-left" />}
                      </p>
                      <p>{addr.line1}</p>
                      {addr.line2 && <p>{addr.line2}</p>}
                      <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-ink-muted font-bold mt-1.5 border-t border-border/20 pt-1">Phone: {addr.phone}</p>
                    </div>

                    <div className="flex gap-3 text-xs font-heading font-bold select-none">
                      <button
                        onClick={() => handleEditAddress(addr)}
                        className="text-accent-blue hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeAddress(addr.id)}
                        className="text-primary hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. CHANGE PASSWORD */}
          <section id="change-password" className="card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs space-y-4">
            <h3 className="text-lg font-heading text-ink font-bold border-b border-border/40 pb-2">Change Password</h3>

            {passwordSuccess && (
              <div className="p-3 bg-accent-teal/10 border border-accent-teal/30 text-accent-teal text-xs font-body font-semibold rounded-md">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-3 bg-primary/10 border border-primary/25 text-primary text-xs font-body font-semibold rounded-md">
                ⚠️ {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-heading font-bold text-ink mb-1">Old Password</label>
                  <input
                    type="password"
                    required
                    disabled={isPasswordSubmitting}
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="input-workshop disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold text-ink mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    disabled={isPasswordSubmitting}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-workshop disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold text-ink mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    disabled={isPasswordSubmitting}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-workshop disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPasswordSubmitting}
                className="btn-primary bg-secondary hover:bg-primary-hover text-white font-heading font-bold text-xs px-5 py-2.5 rounded shadow-xs flex items-center justify-center space-x-1.5"
              >
                {isPasswordSubmitting && <span className="animate-spin mr-1">⌛</span>}
                <span>Change Password</span>
              </button>
            </form>
          </section>

          {/* 4. NOTIFICATION PREFERENCES */}
          <section id="notifications" className="card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs space-y-4">
            <h3 className="text-lg font-heading text-ink font-bold border-b border-border/40 pb-2">Notification Preferences</h3>

            {prefSuccess && (
              <div className="p-3 bg-accent-teal/10 border border-accent-teal/30 text-accent-teal text-xs font-body font-semibold rounded-md">
                {prefSuccess}
              </div>
            )}
            {prefError && (
              <div className="p-3 bg-primary/10 border border-primary/25 text-primary text-xs font-body font-semibold rounded-md">
                ⚠️ {prefError}
              </div>
            )}

            <form onSubmit={handleNotificationSubmit} className="space-y-4">
              <p className="text-xs sm:text-sm text-ink-muted font-body leading-relaxed">
                Choose the channels where you would like to receive order alerts, invoices, and support updates.
              </p>

              <div className="space-y-3 font-body text-sm text-ink select-none">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isPrefSubmitting}
                    checked={emailPref}
                    onChange={(e) => setEmailPref(e.target.checked)}
                    className="rounded text-ink-muted focus:ring-primary mt-1 disabled:opacity-50"
                  />
                  <span>Email Alerts (order confirmations, invoices, support updates)</span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isPrefSubmitting}
                    checked={smsPref}
                    onChange={(e) => setSmsPref(e.target.checked)}
                    className="rounded text-ink-muted focus:ring-primary mt-1 disabled:opacity-50"
                  />
                  <span>SMS Notifications (OTP codes, dispatch text updates)</span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isPrefSubmitting}
                    checked={whatsAppPref}
                    onChange={(e) => setWhatsAppPref(e.target.checked)}
                    className="rounded text-ink-muted focus:ring-primary mt-1 disabled:opacity-50"
                  />
                  <span>WhatsApp Updates (real-time order tracking alerts)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isPrefSubmitting}
                className="btn-primary bg-secondary hover:bg-primary-hover text-white font-heading font-bold text-xs px-5 py-2.5 rounded shadow-xs flex items-center justify-center space-x-1.5"
              >
                {isPrefSubmitting && <span className="animate-spin mr-1">⌛</span>}
                <span>Save Preferences</span>
              </button>
            </form>
          </section>

        </div>
      </div>
    </PageContainer>
  )
}

export default Profile
