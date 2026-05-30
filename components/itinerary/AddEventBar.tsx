'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAddEvent } from '@/hooks/useTrip'
import { useTripStore, type PlaceInfo } from '@/store/tripStore'

interface Props {
  tripId: string
  date: string
  dayIndex: number
}

export function AddEventBar({ tripId, date }: Props) {
  const addEvent = useAddEvent(tripId)
  const storePlaces = useTripStore(s => s.places)
  const placesLoaded = useTripStore(s => s.placesLoaded)
  const [time, setTime] = useState('')
  const [act,  setAct]  = useState('')
  const [sub,  setSub]  = useState('')
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const wrapRef     = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 2, left: rect.left, width: rect.width })
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (wrapRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!showDropdown) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [showDropdown, updatePosition])

  const placesList = Object.values(storePlaces)
  const filtered = act.trim()
    ? placesList.filter(p => p.name.toLowerCase().includes(act.toLowerCase()))
    : placesList

  function selectPlace(place: PlaceInfo) {
    setAct(place.name)
    setShowDropdown(false)
    inputRef.current?.focus()
  }

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
    if (e.key === 'Escape') setShowDropdown(false)
  }

  const dropdown = showDropdown && filtered.length > 0 && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={dropdownRef}
          className="ae-dropdown"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          {filtered.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="ae-dropdown-item"
              onClick={() => selectPlace(p)}
            >
              <img src={p.image} alt="" className="ae-dropdown-img" />
              <div className="ae-dropdown-info">
                <div className="ae-dropdown-name">{p.name}</div>
                <div className="ae-dropdown-type">{p.type}</div>
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )
    : null

  return (
    <div className="add-event-bar">
      <div className="ae-row">
        <input className="ae-input time-inp" type="time" value={time} onChange={e => setTime(e.target.value)} />
        <div className="ae-dropdown-wrap" ref={wrapRef}>
          <input
            ref={inputRef}
            className="ae-input act-inp"
            value={act}
            onChange={e => { setAct(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placesLoaded ? 'Activity / select a place ▾' : 'Loading places...'}
            autoComplete="off"
          />
        </div>
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
      {dropdown}
    </div>
  )
}
