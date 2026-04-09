'use client'

import { useState, useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useTripStore } from '@/store/tripStore'
import { useUpdateEvent } from '@/hooks/useTrip'

interface Props { tripId: string }

export function EditEventModal({ tripId }: Props) {
  const { isEditEventOpen, editingEventId, closeEditEvent } = useUIStore()
  const events = useTripStore(s => s.events)
  const updateEvent = useUpdateEvent(tripId)

  const ev = events.find(e => e.id === editingEventId)

  const [act,  setAct]  = useState('')
  const [time, setTime] = useState('')
  const [sub,  setSub]  = useState('')
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  // Populate fields when modal opens
  useEffect(() => {
    if (ev) {
      setAct(ev.act ?? '')
      setTime(ev.time ?? '')
      setSub(ev.sub ?? '')
      setFrom(ev.fromPlace ?? '')
      setTo(ev.toPlace ?? '')
    }
  }, [editingEventId, ev])

  function handleSave() {
    if (!act.trim() || !editingEventId) return
    const steps = from || to
      ? [{ label: from && to ? `${from}→${to}` : (from || to), col: 'b-slate' }]
      : [{ label: 'Custom', col: 'b-slate' }]

    updateEvent.mutate({
      eventId: editingEventId,
      patch: { act: act.trim(), time: time || null, sub: sub.trim() || null, fromPlace: from.trim() || null, toPlace: to.trim() || null, steps },
    })
    closeEditEvent()
  }

  if (!isEditEventOpen) return null

  return (
    <div id="edit-modal" className="open" onClick={e => { if (e.target === e.currentTarget) closeEditEvent() }}>
      <div className="edit-modal-box">
        <div className="edit-modal-title">✎ Edit Activity</div>

        <div className="edit-modal-field">
          <div className="edit-modal-label">Activity Name</div>
          <input className="edit-modal-input" value={act} onChange={e => setAct(e.target.value)} placeholder="Activity name" />
        </div>

        <div className="edit-modal-row">
          <div className="edit-modal-field">
            <div className="edit-modal-label">Time</div>
            <input className="edit-modal-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div className="edit-modal-field">
            <div className="edit-modal-label">Note / Transport</div>
            <input className="edit-modal-input" value={sub} onChange={e => setSub(e.target.value)} placeholder="e.g. by train" />
          </div>
        </div>

        <div className="edit-modal-row">
          <div className="edit-modal-field">
            <div className="edit-modal-label">From</div>
            <input className="edit-modal-input" value={from} onChange={e => setFrom(e.target.value)} placeholder="Origin" />
          </div>
          <div className="edit-modal-field">
            <div className="edit-modal-label">To</div>
            <input className="edit-modal-input" value={to} onChange={e => setTo(e.target.value)} placeholder="Destination" />
          </div>
        </div>

        <div className="edit-modal-btns">
          <button className="btn-cancel-edit" onClick={closeEditEvent}>Cancel</button>
          <button className="btn-save-edit" onClick={handleSave} disabled={updateEvent.isPending}>
            {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
