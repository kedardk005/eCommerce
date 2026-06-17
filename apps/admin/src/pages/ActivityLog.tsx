import React, { useState, useMemo, useEffect } from 'react'
import { useAdminData } from '../context/AdminDataContext'

export const ActivityLog: React.FC = () => {
  const { activityLogs, activityLogsLoading, activityLogsError, fetchActivityLogs } = useAdminData()

  useEffect(() => {
    fetchActivityLogs()
  }, [])

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedActor, setSelectedActor] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Extract unique actors and action types (entity types) for dropdown lists
  const actors = useMemo(() => {
    const set = new Set<string>()
    activityLogs.forEach(log => set.add(log.actorName))
    return ['All', ...Array.from(set)]
  }, [activityLogs])

  const entityTypes = useMemo(() => {
    const set = new Set<string>()
    activityLogs.forEach(log => set.add(log.entityType))
    return ['All', ...Array.from(set)]
  }, [activityLogs])

  // Client-side filtering logic
  const filteredLogs = useMemo(() => {
    /*
      DEVELOPER COMMENT:
      In production, this audit log will consume a paginated REST API endpoint
      ('/api/admin/activity-logs') driven by database transactions. Sub-admin operational
      actions (such as order updates, inventory changes, ticket responses) and super-owner actions
      (settings modifications, gateway configuration overrides) will register via audit middleware on the backend
      and write to a PostgreSQL database table, allowing search queries to be evaluated server-side.
    */
    return activityLogs.filter(log => {
      // Keyword match
      if (
        searchTerm &&
        !log.actionDescription.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.entityId.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }

      // Actor match
      if (selectedActor !== 'All' && log.actorName !== selectedActor) {
        return false
      }

      // Action type match
      if (selectedType !== 'All' && log.entityType !== selectedType) {
        return false
      }

      // Date match (parsing timestamp string, e.g., '2026-06-15 22:30:15')
      const logDateOnly = log.timestamp.split(' ')[0] // e.g. '2026-06-15'

      if (startDate && logDateOnly < startDate) {
        return false
      }
      if (endDate && logDateOnly > endDate) {
        return false
      }

      return true
    })
  }, [activityLogs, searchTerm, selectedActor, selectedType, startDate, endDate])

  // Clear all filters utility
  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedActor('All')
    setSelectedType('All')
    setStartDate('')
    setEndDate('')
  }

  // Get style badge classes for entity types
  const getEntityTypeBadge = (type: string) => {
    switch (type) {
      case 'Product':
        return 'bg-accent-blue/10 text-accent-blue'
      case 'Order':
        return 'bg-accent-teal/10 text-accent-teal'
      case 'Return':
        return 'bg-primary/10 text-primary'
      case 'Auth':
        return 'bg-primary/20 text-ink'
      case 'Settings':
        return 'bg-bg text-ink-muted border border-border'
      default:
        return 'bg-bg/20 text-ink'
    }
  }

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="border-b border-border pb-3 text-left">
        <h2 className="text-xl font-heading font-extrabold text-ink">System Activity Log</h2>
        <p className="text-[11px] text-ink-muted leading-normal">
          Audit trails monitoring all administrative updates. Visible to both Owners and Sub-Admins.
        </p>
      </div>

      {/* Filter Control Console */}
      <div className="bg-surface border border-border p-4 rounded shadow-sm text-left">
        <h3 className="text-xs font-heading font-bold text-ink mb-3">Audit Query Filters</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase font-heading">Action Keyword</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. Train set, ORD-9023"
              className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Actor Select */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase font-heading">Actor</label>
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer text-ink font-medium"
            >
              {actors.map(actor => (
                <option key={actor} value={actor}>
                  {actor === 'All' ? 'All Administrators' : actor}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Select */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase font-heading">Entity Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer text-ink font-medium"
            >
              {entityTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All Entities' : type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Start */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase font-heading">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
            />
          </div>

          {/* Date End */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase font-heading">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Filters Actions */}
        <div className="flex justify-between items-center mt-4 border-t border-border/60 pt-3">
          <p className="text-[10px] text-ink-muted">
            Showing <strong className="text-ink">{filteredLogs.length}</strong> of {activityLogs.length} audits.
          </p>
          {(searchTerm || selectedActor !== 'All' || selectedType !== 'All' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-primary hover:underline focus:outline-none"
            >
              Clear Active Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-surface border border-border rounded shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Actor</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Action Log Detail</th>
                <th className="px-4 py-2.5">Entity Type</th>
                <th className="px-4 py-2.5 font-mono">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {activityLogsLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                    Loading activity logs...
                  </td>
                </tr>
              ) : activityLogsError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-primary font-medium">
                    <p className="mb-2">Error: {activityLogsError}</p>
                    <button
                      onClick={() => fetchActivityLogs()}
                      className="px-3 py-1 bg-primary text-white text-[10px] rounded hover:bg-primary-hover focus:outline-none"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg transition-colors">
                    <td className="px-4 py-2.5 text-ink-muted font-mono text-[10px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-ink">{log.actorName}</td>
                    <td className="px-4 py-2.5 text-[10px] capitalize text-ink-muted">{log.role === 'super_owner' ? 'Owner' : 'Sub Admin'}</td>
                    <td className="px-4 py-2.5 font-medium">{log.actionDescription}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${getEntityTypeBadge(log.entityType)}`}>
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-ink-muted text-[10px]">{log.entityId}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted italic">
                    No activity logs match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ActivityLog
