'use client'

import { useState } from 'react'
import { useAddEvent } from '@/hooks/useTrip'
import { toISO } from '@/lib/utils'

interface Props {
  tripId: string
  date: string
  dayIndex: number
}

export function AddEventBar({ tripId, date }: Props) {
  const addEvent = useAddEvent(tripId)
  const [time, setTime] = useState('')
  const [act,  setAct]  = useState('')
  const [sub,  setSub]  = useState('')
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  function handleAdd() {
    if (!act.trim()) return
    const steps = from || to
      ? [{ label: from && to ? `${from}→${to}` : (from || to), col: 'b-slate' }]
      : [{ label: 'Custom', col: 'b-slate' }]

    addEvent.mutate({
      date,
      time: time || null,
      act: act.trim(),
      sub: sub.trim() || null,
      fromPlace: from.trim() || null,
      toPlace: to.trim() || null,
      steps,
    })
    setTime(''); setAct(''); setSub(''); setFrom(''); setTo('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="add-event-bar">
      <div className="ae-row">
        <input className="ae-input time-inp" type="time" value={time} onChange={e => setTime(e.target.value)} />
        <input className="ae-input act-inp" value={act} onChange={e => setAct(e.target.value)} onKeyDown={handleKeyDown} placeholder="Activity name" />
        <button className="btn-ae" onClick={handleAdd} disabled={addEvent.isPending}>
          {addEvent.isPending ? '...' : '+ Add'}
        </button>
      </div>
      <div className="ae-row">
        <input className="ae-input sub-inp" value={sub} onChange={e => setSub(e.target.value)} placeholder="Note / transport" />
      </div>
      <div className="ae-row">
        <input className="ae-input loc-inp" value={from} onChange={e => setFrom(e.target.value)} placeholder="From" />
        <input className="ae-input loc-inp" value={to} onChange={e => setTo(e.target.value)} placeholder="To" />
      </div>
    </div>
  )
}
