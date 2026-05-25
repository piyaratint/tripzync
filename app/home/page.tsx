'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { saveTrip } from '@/app/actions/trips'
import { TripZyncLogo } from '@/components/TripZyncLogo'

// ── Types ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  continent?: string
  countries?: string[]
  cities?: string[]
  places?: string[]
  placesByCity?: Record<string, string[]>
  hotels?: string[]
  destination?: string
  startDate?: string   // ADD THIS
  endDate?: string     // ADD THIS
  pendingTrip?: { destination?: string; startDate?: string; endDate?: string }
}
interface DayBlock  { dayNumber: number; date: string; places: string[] }
interface CitySection { city: string; days: DayBlock[]; startDay: number }
interface Tooltip   { name: string; image: string; x: number; y: number }

// ── Helpers ──────────────────────────────────────────────────────────────────
const WX_ICONS: Record<number, string> = {0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',51:'🌦',61:'🌧',71:'❄️',80:'🌧',95:'⛈'}
const WX_DESC:  Record<number, string> = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',51:'Drizzle',61:'Rain',71:'Snow',80:'Showers',95:'Thunderstorm'}

const HOTEL_NAMES: Record<string,string> = {
  marriott:'Marriott Bonvoy', hilton:'Hilton Honors', ihg:'IHG One Rewards',
  hyatt:'World of Hyatt', accor:'Accor ALL', none:'No membership',
}

interface HotelSuggestion { name: string; tier: string; price: string; stars: number; travelMins?: number }

// ── Hotel photo lookup ────────────────────────────────────────────────────────
// Specific Unsplash photo IDs for well-known hotels
const HOTEL_PHOTO_MAP: Record<string, string> = {
  // Tokyo
  'JW Marriott Hotel Tokyo':            '1542314831-068cd1dbfeeb',
  'The Ritz-Carlton Tokyo':             '1551882547-ff40c63fe2fa',
  'Sheraton Grande Tokyo Bay':          '1564501049412-61c2a3083791',
  // Kyoto
  'JW Marriott Nijo Castle Kyoto':      '1528360983277-13d401cdc186',
  'Kyoto Marriott Hotel':               '1580977276076-d29f0fba0be1',
  // Osaka
  'W Osaka':                            '1578683010236-d716f9a3f461',
  // Bangkok
  'JW Marriott Bangkok':                '1506665531195-3566af2b4dfa',
  'W Bangkok':                          '1520250497591-112f2f40a3f4',
  // Bali
  'The St. Regis Bali Resort':          '1582719508461-905c673771fd',
  'W Bali – Seminyak':                  '1540541338537-1ba7b176f2a7',
  // Singapore
  'W Singapore – Sentosa Cove':         '1596436889106-be35e843f974',
  'JW Marriott Singapore South Beach':  '1611892440504-42a792e24d32',
  // Dubai
  'JW Marriott Marquis Dubai':          '1519449556851-79ab8f644e99',
  'W Dubai – The Palm':                 '1586611292717-f828b167408c',
  // Paris
  'Le Meurice (Dorchester)':            '1499856871958-5b9357976b82',
  'W Paris – Opéra':                    '1509439581779-6298f75bfd75',
  // London
  'W London':                           '1445019980597-93fa8acb246c',
  'Sheraton Grand London Park Lane':    '1495365222973-f1478e0e01d3',
  // Rome
  'The St. Regis Rome':                 '1531572753322-ad063cecc140',
  // New York
  'The St. Regis New York':             '1560448204-603b3fc33ddc',
  'W New York – Times Square':          '1590490360182-c33d57733427',
  // Maldives
  'St. Regis Maldives Vommuli Resort':  '1573843981267-be1480dfd2ab',
  'W Maldives':                         '1540202404-d0f8d64e4c6e',
  // Seoul
  'JW Marriott Seoul':                  '1541417904-0a30ae1e9bb6',
  // Sydney
  'W Sydney':                           '1523482580672-f109ba8cb9be',
  // Istanbul
  'W Istanbul':                         '1524231757912-21f4fe3a7200',
}

// Tier-based photo pools (used when no specific photo exists)
const TIER_PHOTOS: Record<string, string[]> = {
  'Luxury':  ['1551882547-ff40c63fe2fa','1564501049412-61c2a3083791','1531572753322-ad063cecc140','1611892440504-42a792e24d32'],
  'W Hotels':['1578683010236-d716f9a3f461','1520250497591-112f2f40a3f4','1596436889106-be35e843f974','1586611292717-f828b167408c'],
  'Premium': ['1506665531195-3566af2b4dfa','1528360983277-13d401cdc186','1509439581779-6298f75bfd75','1499856871958-5b9357976b82'],
  'Classic': ['1445019980597-93fa8acb246c','1495365222973-f1478e0e01d3','1542314831-068cd1dbfeeb','1580977276076-d29f0fba0be1'],
  'Select':  ['1590490360182-c33d57733427','1631049307264-da0ec9d70304','1615460549969-36e36b518bc8','1540541338537-1ba7b176f2a7'],
}

function getHotelPhoto(name: string, tier: string): string {
  if (HOTEL_PHOTO_MAP[name]) {
    return `https://images.unsplash.com/photo-${HOTEL_PHOTO_MAP[name]}?auto=format&fit=crop&w=600&h=300&q=80`
  }
  // Deterministic pick from tier pool using name length as seed
  const pool = TIER_PHOTOS[tier] ?? TIER_PHOTOS['Classic']
  const id = pool[name.length % pool.length]
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=300&q=80`
}
type HotelDB = Record<string, Record<string, HotelSuggestion[]>>

const HOTEL_DB: HotelDB = {
  marriott: {
    // ── Japan ────────────────────────────────────────────────────────────────
    Tokyo:              [{ name:'JW Marriott Hotel Tokyo',              tier:'Luxury',    price:'$380+/n', stars:5 },{ name:'The Ritz-Carlton Tokyo',            tier:'Luxury',    price:'$520+/n', stars:5 },{ name:'Sheraton Grande Tokyo Bay',          tier:'Classic',   price:'$180+/n', stars:4 }],
    Kyoto:              [{ name:'JW Marriott Nijo Castle Kyoto',        tier:'Luxury',    price:'$420+/n', stars:5 },{ name:'Four Points by Sheraton Kyoto',      tier:'Select',    price:'$140+/n', stars:4 },{ name:'Kyoto Marriott Hotel',               tier:'Classic',   price:'$200+/n', stars:4 }],
    Osaka:              [{ name:'W Osaka',                              tier:'W Hotels',  price:'$340+/n', stars:5 },{ name:'Sheraton Miyako Hotel Osaka',        tier:'Classic',   price:'$160+/n', stars:4 },{ name:'Courtyard Osaka',                    tier:'Select',    price:'$120+/n', stars:3 }],
    // ── Thailand ─────────────────────────────────────────────────────────────
    Bangkok:            [{ name:'JW Marriott Bangkok',                  tier:'Luxury',    price:'$200+/n', stars:5 },{ name:'W Bangkok',                         tier:'W Hotels',  price:'$220+/n', stars:5 },{ name:'Marriott Marquis Bangkok',           tier:'Premium',   price:'$180+/n', stars:5 }],
    'Chiang Mai':       [{ name:'Le Méridien Chiang Mai',               tier:'Premium',   price:'$90+/n',  stars:5 },{ name:'Renaissance Chiang Mai',            tier:'Premium',   price:'$110+/n', stars:5 },{ name:'Courtyard Chiang Mai',               tier:'Select',    price:'$65+/n',  stars:4 }],
    Phuket:             [{ name:'JW Marriott Khao Lak Resort & Spa',    tier:'Luxury',    price:'$280+/n', stars:5 },{ name:'Le Méridien Phuket Beach Resort',    tier:'Premium',   price:'$220+/n', stars:5 },{ name:'Sheraton Grande Laguna Phuket',      tier:'Classic',   price:'$160+/n', stars:5 }],
    Pattaya:            [{ name:'Marriott Resort & Spa Pattaya',         tier:'Classic',   price:'$120+/n', stars:5 },{ name:'Sheraton Pattaya Resort',            tier:'Classic',   price:'$100+/n', stars:5 },{ name:'Courtyard Pattaya',                  tier:'Select',    price:'$65+/n',  stars:4 }],
    'Koh Samui':        [{ name:'Le Méridien Koh Samui Resort & Spa',   tier:'Premium',   price:'$260+/n', stars:5 },{ name:'The Westin Siray Bay Phuket',        tier:'Premium',   price:'$220+/n', stars:5 },{ name:'Sheraton Samui Resort',              tier:'Classic',   price:'$160+/n', stars:5 }],
    Krabi:              [{ name:'Sheraton Krabi Beach Resort',           tier:'Classic',   price:'$140+/n', stars:5 },{ name:'Four Points by Sheraton Krabi',      tier:'Select',    price:'$90+/n',  stars:4 },{ name:'Courtyard Krabi Ao Nang Beach',       tier:'Select',    price:'$75+/n',  stars:4 }],
    // ── Korea / Indonesia / SE Asia ──────────────────────────────────────────
    Seoul:              [{ name:'JW Marriott Seoul',                    tier:'Luxury',    price:'$280+/n', stars:5 },{ name:'W Seoul',                            tier:'W Hotels',  price:'$300+/n', stars:5 },{ name:'The Westin Chosun Seoul',            tier:'Premium',   price:'$240+/n', stars:5 }],
    Bali:               [{ name:'The St. Regis Bali Resort',            tier:'Luxury',    price:'$380+/n', stars:5 },{ name:'W Bali – Seminyak',                  tier:'W Hotels',  price:'$260+/n', stars:5 },{ name:'Courtyard Bali Seminyak',            tier:'Select',    price:'$120+/n', stars:4 }],
    Singapore:          [{ name:'W Singapore – Sentosa Cove',           tier:'W Hotels',  price:'$340+/n', stars:5 },{ name:'JW Marriott Singapore South Beach',   tier:'Luxury',    price:'$420+/n', stars:5 },{ name:'Four Points by Sheraton Singapore',  tier:'Select',    price:'$160+/n', stars:4 }],
    'Kuala Lumpur':     [{ name:'W Kuala Lumpur',                       tier:'W Hotels',  price:'$180+/n', stars:5 },{ name:'Le Méridien Kuala Lumpur',           tier:'Premium',   price:'$140+/n', stars:5 },{ name:'Sheraton Imperial Kuala Lumpur',      tier:'Classic',   price:'$110+/n', stars:5 }],
    Hanoi:              [{ name:'JW Marriott Hotel Hanoi',              tier:'Luxury',    price:'$180+/n', stars:5 },{ name:'Sheraton Hanoi Hotel',               tier:'Classic',   price:'$120+/n', stars:5 },{ name:'Four Points by Sheraton Hanoi',      tier:'Select',    price:'$80+/n',  stars:4 }],
    'Ho Chi Minh City': [{ name:'JW Marriott Hotel Ho Chi Minh City',   tier:'Luxury',    price:'$200+/n', stars:5 },{ name:'Sheraton Saigon Grand Opera Hotel',  tier:'Classic',   price:'$140+/n', stars:5 },{ name:'Le Méridien Saigon',                 tier:'Premium',   price:'$120+/n', stars:5 }],
    // ── India ────────────────────────────────────────────────────────────────
    Mumbai:             [{ name:'JW Marriott Mumbai Sahar',             tier:'Luxury',    price:'$200+/n', stars:5 },{ name:'Marriott Mumbai',                    tier:'Classic',   price:'$140+/n', stars:5 },{ name:'Sheraton Mumbai Hotel & Towers',     tier:'Classic',   price:'$120+/n', stars:5 }],
    Delhi:              [{ name:'JW Marriott New Delhi Aerocity',       tier:'Luxury',    price:'$220+/n', stars:5 },{ name:'Sheraton New Delhi Hotel',           tier:'Classic',   price:'$140+/n', stars:5 },{ name:'The Westin Gurgaon New Delhi',        tier:'Premium',   price:'$160+/n', stars:5 }],
    Goa:                [{ name:'The Westin Goa',                       tier:'Premium',   price:'$180+/n', stars:5 },{ name:'Marriott Goa',                       tier:'Classic',   price:'$140+/n', stars:5 },{ name:'Sheraton Grand Goa Resort',          tier:'Classic',   price:'$120+/n', stars:5 }],
    Jaipur:             [{ name:'Marriott Jaipur Hotel & Convention',   tier:'Classic',   price:'$100+/n', stars:5 },{ name:'Fairfield by Marriott Jaipur',       tier:'Select',    price:'$60+/n',  stars:3 },{ name:'Courtyard Jaipur',                   tier:'Select',    price:'$70+/n',  stars:4 }],
    // ── Maldives ─────────────────────────────────────────────────────────────
    'Baa Atoll':        [{ name:'St. Regis Maldives Vommuli Resort',    tier:'Luxury',    price:'$1500+/n',stars:5 },{ name:'W Maldives',                         tier:'W Hotels',  price:'$1200+/n',stars:5 },{ name:'Sheraton Maldives Full Moon Resort',  tier:'Classic',   price:'$480+/n', stars:5 }],
    // ── Middle East ──────────────────────────────────────────────────────────
    Dubai:              [{ name:'JW Marriott Marquis Dubai',            tier:'Luxury',    price:'$260+/n', stars:5 },{ name:'W Dubai – The Palm',                 tier:'W Hotels',  price:'$300+/n', stars:5 },{ name:'Sheraton Grand Hotel Dubai',         tier:'Classic',   price:'$180+/n', stars:5 }],
    'Abu Dhabi':        [{ name:'W Abu Dhabi – Yas Island',             tier:'W Hotels',  price:'$220+/n', stars:5 },{ name:'JW Marriott Hotel Abu Dhabi',        tier:'Luxury',    price:'$200+/n', stars:5 },{ name:'Sheraton Abu Dhabi Hotel & Resort',  tier:'Classic',   price:'$140+/n', stars:5 }],
    Istanbul:           [{ name:'W Istanbul',                           tier:'W Hotels',  price:'$280+/n', stars:5 },{ name:'JW Marriott Istanbul Marmara',       tier:'Luxury',    price:'$220+/n', stars:5 },{ name:'Sheraton Istanbul Ataköy',           tier:'Classic',   price:'$160+/n', stars:5 }],
    // ── Europe ───────────────────────────────────────────────────────────────
    Paris:              [{ name:'Le Meurice (Dorchester)',              tier:'Luxury',    price:'$800+/n', stars:5 },{ name:'W Paris – Opéra',                    tier:'W Hotels',  price:'$480+/n', stars:5 },{ name:'Marriott Paris Champs-Élysées',      tier:'Classic',   price:'$320+/n', stars:5 }],
    London:             [{ name:'W London',                             tier:'W Hotels',  price:'$440+/n', stars:5 },{ name:'The Westin London City',             tier:'Premium',   price:'$320+/n', stars:5 },{ name:'Sheraton Grand London Park Lane',     tier:'Classic',   price:'$360+/n', stars:5 }],
    Rome:               [{ name:'The St. Regis Rome',                   tier:'Luxury',    price:'$680+/n', stars:5 },{ name:'The Westin Excelsior Rome',          tier:'Premium',   price:'$420+/n', stars:5 },{ name:'Rome Marriott Grand Hotel Flora',     tier:'Classic',   price:'$280+/n', stars:4 }],
    Florence:           [{ name:'The Westin Excelsior Florence',        tier:'Premium',   price:'$480+/n', stars:5 },{ name:'Hotel Savoy Florence (Autograph)',   tier:'Luxury',    price:'$560+/n', stars:5 },{ name:'Marriott Florence',                  tier:'Classic',   price:'$180+/n', stars:4 }],
    Venice:             [{ name:'Palazzo Venart Luxury Hotel (Autograph)',tier:'Luxury',  price:'$900+/n', stars:5 },{ name:'The Westin Europa & Regina Venice',  tier:'Premium',   price:'$600+/n', stars:5 },{ name:'Marriott Venice',                    tier:'Classic',   price:'$280+/n', stars:4 }],
    Milan:              [{ name:'Sheraton Diana Majestic Milan',         tier:'Classic',   price:'$220+/n', stars:5 },{ name:'Marriott Milan Unico',               tier:'Classic',   price:'$180+/n', stars:5 },{ name:'Courtyard Milan Linate Airport',     tier:'Select',    price:'$120+/n', stars:4 }],
    Barcelona:          [{ name:'W Barcelona',                          tier:'W Hotels',  price:'$460+/n', stars:5 },{ name:'Le Méridien Barcelona',             tier:'Premium',   price:'$320+/n', stars:5 },{ name:'Marriott Barcelona',                 tier:'Classic',   price:'$240+/n', stars:4 }],
    Madrid:             [{ name:'The Westin Palace Madrid',             tier:'Premium',   price:'$360+/n', stars:5 },{ name:'Sheraton Madrid Mirasierra',         tier:'Classic',   price:'$180+/n', stars:5 },{ name:'Marriott Madrid Auditorium',         tier:'Classic',   price:'$140+/n', stars:4 }],
    Lisbon:             [{ name:'Bairro Alto Hotel (Autograph)',         tier:'Luxury',    price:'$340+/n', stars:5 },{ name:'Marriott Lisbon',                    tier:'Classic',   price:'$200+/n', stars:4 },{ name:'Four Points by Sheraton Lisbon',     tier:'Select',    price:'$110+/n', stars:4 }],
    Athens:             [{ name:'The Westin Athens',                    tier:'Premium',   price:'$280+/n', stars:5 },{ name:'Marriott Athens',                    tier:'Classic',   price:'$200+/n', stars:5 },{ name:'Four Points by Sheraton Athens',     tier:'Select',    price:'$120+/n', stars:4 }],
    Amsterdam:          [{ name:'Sheraton Amsterdam Airport',           tier:'Classic',   price:'$200+/n', stars:4 },{ name:'Marriott Amsterdam',                 tier:'Classic',   price:'$260+/n', stars:4 },{ name:'W Amsterdam',                        tier:'W Hotels',  price:'$380+/n', stars:5 }],
    // ── Oceania ──────────────────────────────────────────────────────────────
    Sydney:             [{ name:'W Sydney',                             tier:'W Hotels',  price:'$360+/n', stars:5 },{ name:'Sheraton Grand Sydney Hyde Park',    tier:'Classic',   price:'$260+/n', stars:5 },{ name:'Four Points by Sheraton Sydney',     tier:'Select',    price:'$160+/n', stars:4 }],
    Melbourne:          [{ name:'W Melbourne',                          tier:'W Hotels',  price:'$300+/n', stars:5 },{ name:'Marriott Melbourne',                 tier:'Classic',   price:'$220+/n', stars:5 },{ name:'Sheraton Melbourne Hotel',           tier:'Classic',   price:'$200+/n', stars:5 }],
    // ── Africa ───────────────────────────────────────────────────────────────
    Cairo:              [{ name:'Marriott Mena House Cairo',            tier:'Classic',   price:'$160+/n', stars:5 },{ name:'Sheraton Cairo Hotel & Casino',      tier:'Classic',   price:'$120+/n', stars:5 },{ name:'Le Méridien Cairo Airport',          tier:'Premium',   price:'$100+/n', stars:5 }],
    Marrakech:          [{ name:'Le Méridien N\'Fis Marrakech',         tier:'Premium',   price:'$180+/n', stars:5 },{ name:'Marriott Marrakech',                 tier:'Classic',   price:'$140+/n', stars:5 },{ name:'Four Points by Sheraton Marrakech',  tier:'Select',    price:'$90+/n',  stars:4 }],
    'Cape Town':        [{ name:'The Westin Cape Town',                 tier:'Premium',   price:'$220+/n', stars:5 },{ name:'Marriott Cape Town Crystal Towers',  tier:'Classic',   price:'$120+/n', stars:5 },{ name:'Protea Hotel Cape Town Waterfront',  tier:'Classic',   price:'$100+/n', stars:4 }],
    // ── Americas ─────────────────────────────────────────────────────────────
    'New York':         [{ name:'W New York – Times Square',            tier:'W Hotels',  price:'$380+/n', stars:4 },{ name:'New York Marriott Marquis',          tier:'Classic',   price:'$300+/n', stars:4 },{ name:'The St. Regis New York',             tier:'Luxury',    price:'$820+/n', stars:5 }],
    'Los Angeles':      [{ name:'W Los Angeles – West Beverly Hills',   tier:'W Hotels',  price:'$380+/n', stars:4 },{ name:'Sheraton Grand Los Angeles',         tier:'Classic',   price:'$240+/n', stars:4 },{ name:'The Westin Bonaventure LA',          tier:'Premium',   price:'$220+/n', stars:4 }],
    Miami:              [{ name:'W Miami',                              tier:'W Hotels',  price:'$300+/n', stars:4 },{ name:'Marriott Miami Biscayne Bay',         tier:'Classic',   price:'$200+/n', stars:4 },{ name:'Sheraton Miami Airport Hotel',        tier:'Classic',   price:'$140+/n', stars:4 }],
    'Las Vegas':        [{ name:'Marriott\'s Grand Chateau Las Vegas',  tier:'Classic',   price:'$160+/n', stars:4 },{ name:'Sheraton Las Vegas Hotel',           tier:'Classic',   price:'$100+/n', stars:3 },{ name:'Courtyard Las Vegas Convention Center',tier:'Select', price:'$80+/n',  stars:3 }],
    Chicago:            [{ name:'W Chicago – City Center',              tier:'W Hotels',  price:'$280+/n', stars:4 },{ name:'Marriott Chicago Downtown',          tier:'Classic',   price:'$220+/n', stars:4 },{ name:'Sheraton Grand Chicago Riverwalk',    tier:'Classic',   price:'$200+/n', stars:4 }],
    'San Francisco':    [{ name:'The St. Regis San Francisco',          tier:'Luxury',    price:'$480+/n', stars:5 },{ name:'W San Francisco',                   tier:'W Hotels',  price:'$360+/n', stars:4 },{ name:'Marriott Union Square SF',           tier:'Classic',   price:'$280+/n', stars:4 }],
    'Mexico City':      [{ name:'W Mexico City',                        tier:'W Hotels',  price:'$180+/n', stars:5 },{ name:'Marriott Mexico City Reform',        tier:'Classic',   price:'$140+/n', stars:5 },{ name:'Sheraton Mexico City Maria Isabel',  tier:'Classic',   price:'$160+/n', stars:5 }],
    Cancun:             [{ name:'JW Marriott Cancun Resort & Spa',      tier:'Luxury',    price:'$320+/n', stars:5 },{ name:'Marriott CasaMagna Cancun Resort',   tier:'Classic',   price:'$200+/n', stars:5 },{ name:'Courtyard Cancun Airport',           tier:'Select',    price:'$100+/n', stars:4 }],
  },
  hilton: {
    // ── Japan ────────────────────────────────────────────────────────────────
    Tokyo:              [{ name:'Conrad Tokyo',                         tier:'Luxury',    price:'$360+/n', stars:5 },{ name:'Hilton Tokyo',                       tier:'Classic',   price:'$220+/n', stars:5 },{ name:'DoubleTree by Hilton Tokyo',         tier:'Upper Mid', price:'$140+/n', stars:4 }],
    Kyoto:              [{ name:'DoubleTree by Hilton Kyoto',           tier:'Upper Mid', price:'$130+/n', stars:4 },{ name:'Hilton Kyoto',                       tier:'Classic',   price:'$190+/n', stars:5 },{ name:'Hampton by Hilton Kyoto',            tier:'Midscale',  price:'$80+/n',  stars:3 }],
    Osaka:              [{ name:'Conrad Osaka',                         tier:'Luxury',    price:'$340+/n', stars:5 },{ name:'Hilton Osaka',                       tier:'Classic',   price:'$180+/n', stars:5 },{ name:'DoubleTree Osaka',                   tier:'Upper Mid', price:'$130+/n', stars:4 }],
    // ── Thailand ─────────────────────────────────────────────────────────────
    Bangkok:            [{ name:'Conrad Bangkok',                       tier:'Luxury',    price:'$190+/n', stars:5 },{ name:'Hilton Bangkok Grand Asoke',         tier:'Classic',   price:'$160+/n', stars:5 },{ name:'DoubleTree Bangkok',                 tier:'Upper Mid', price:'$100+/n', stars:4 }],
    Phuket:             [{ name:'Hilton Phuket Arcadia Resort & Spa',   tier:'Classic',   price:'$160+/n', stars:5 },{ name:'DoubleTree by Hilton Phuket Banthai', tier:'Upper Mid', price:'$110+/n', stars:4 },{ name:'Hampton by Hilton Phuket Patong',    tier:'Midscale',  price:'$65+/n',  stars:3 }],
    'Koh Samui':        [{ name:'Conrad Koh Samui',                     tier:'Luxury',    price:'$380+/n', stars:5 },{ name:'Hilton Koh Samui Resort',            tier:'Classic',   price:'$200+/n', stars:5 },{ name:'DoubleTree Koh Samui',               tier:'Upper Mid', price:'$120+/n', stars:4 }],
    Krabi:              [{ name:'DoubleTree by Hilton Krabi Ao Nang',   tier:'Upper Mid', price:'$100+/n', stars:4 },{ name:'Hampton by Hilton Krabi',            tier:'Midscale',  price:'$60+/n',  stars:3 },{ name:'Hilton Krabi Ao Nang Beach Resort',  tier:'Classic',   price:'$130+/n', stars:5 }],
    // ── Korea / SE Asia ──────────────────────────────────────────────────────
    Seoul:              [{ name:'Conrad Seoul',                         tier:'Luxury',    price:'$280+/n', stars:5 },{ name:'Hilton Seoul',                       tier:'Classic',   price:'$220+/n', stars:5 },{ name:'DoubleTree Seoul',                   tier:'Upper Mid', price:'$140+/n', stars:4 }],
    Bali:               [{ name:'Conrad Bali',                          tier:'Luxury',    price:'$260+/n', stars:5 },{ name:'Hilton Bali Resort',                 tier:'Classic',   price:'$180+/n', stars:5 },{ name:'DoubleTree Bali – Legian Beach',     tier:'Upper Mid', price:'$120+/n', stars:4 }],
    Singapore:          [{ name:'Waldorf Astoria Singapore (new)',      tier:'Luxury',    price:'$600+/n', stars:5 },{ name:'Conrad Centennial Singapore',        tier:'Luxury',    price:'$360+/n', stars:5 },{ name:'Hilton Singapore Orchard',           tier:'Classic',   price:'$260+/n', stars:5 }],
    'Kuala Lumpur':     [{ name:'Hilton Kuala Lumpur',                  tier:'Classic',   price:'$140+/n', stars:5 },{ name:'DoubleTree by Hilton KL City Centre', tier:'Upper Mid', price:'$100+/n', stars:4 },{ name:'Hampton by Hilton KL Sentral',       tier:'Midscale',  price:'$65+/n',  stars:3 }],
    Hanoi:              [{ name:'Hilton Hanoi Opera',                   tier:'Classic',   price:'$140+/n', stars:5 },{ name:'DoubleTree by Hilton Hanoi Westlake', tier:'Upper Mid', price:'$90+/n', stars:4 },{ name:'Hampton by Hilton Hanoi',            tier:'Midscale',  price:'$55+/n',  stars:3 }],
    'Ho Chi Minh City': [{ name:'Hilton Saigon',                        tier:'Classic',   price:'$160+/n', stars:5 },{ name:'DoubleTree by Hilton Saigon',        tier:'Upper Mid', price:'$100+/n', stars:4 },{ name:'Hampton by Hilton Ho Chi Minh City', tier:'Midscale',  price:'$60+/n',  stars:3 }],
    // ── India ────────────────────────────────────────────────────────────────
    Mumbai:             [{ name:'Conrad Mumbai',                        tier:'Luxury',    price:'$200+/n', stars:5 },{ name:'Hilton Mumbai International Airport', tier:'Classic',   price:'$120+/n', stars:5 },{ name:'DoubleTree by Hilton Mumbai',        tier:'Upper Mid', price:'$90+/n',  stars:4 }],
    Delhi:              [{ name:'Hilton New Delhi/Janakpuri',           tier:'Classic',   price:'$120+/n', stars:5 },{ name:'DoubleTree by Hilton Delhi',         tier:'Upper Mid', price:'$80+/n',  stars:4 },{ name:'Hampton by Hilton Delhi Aerocity',   tier:'Midscale',  price:'$55+/n',  stars:3 }],
    // ── Middle East ──────────────────────────────────────────────────────────
    Dubai:              [{ name:'Waldorf Astoria Dubai DIFC',           tier:'Luxury',    price:'$380+/n', stars:5 },{ name:'Conrad Dubai',                       tier:'Luxury',    price:'$280+/n', stars:5 },{ name:'Hilton Dubai Al Habtoor City',       tier:'Classic',   price:'$200+/n', stars:5 }],
    'Abu Dhabi':        [{ name:'Conrad Abu Dhabi Etihad Towers',       tier:'Luxury',    price:'$260+/n', stars:5 },{ name:'Hilton Abu Dhabi Yas Island',        tier:'Classic',   price:'$180+/n', stars:5 },{ name:'DoubleTree Abu Dhabi Corniche',      tier:'Upper Mid', price:'$120+/n', stars:4 }],
    Istanbul:           [{ name:'Conrad Istanbul Bosphorus',            tier:'Luxury',    price:'$280+/n', stars:5 },{ name:'Hilton Istanbul Bomonti Hotel & Conf',tier:'Classic',  price:'$180+/n', stars:5 },{ name:'DoubleTree Istanbul Topkapi',        tier:'Upper Mid', price:'$120+/n', stars:4 }],
    // ── Europe ───────────────────────────────────────────────────────────────
    Paris:              [{ name:'Waldorf Astoria Paris',                tier:'Luxury',    price:'$900+/n', stars:5 },{ name:'Conrad Paris',                       tier:'Luxury',    price:'$600+/n', stars:5 },{ name:'Hilton Paris Opéra',                 tier:'Classic',   price:'$350+/n', stars:4 }],
    London:             [{ name:'Waldorf Astoria London Aldwych',       tier:'Luxury',    price:'$700+/n', stars:5 },{ name:'Conrad London St. James',            tier:'Luxury',    price:'$500+/n', stars:5 },{ name:'Hilton London Bankside',             tier:'Classic',   price:'$280+/n', stars:4 }],
    Rome:               [{ name:'Rome Cavalieri Waldorf Astoria',       tier:'Luxury',    price:'$480+/n', stars:5 },{ name:'Hilton Rome Airport',                tier:'Classic',   price:'$160+/n', stars:4 },{ name:'DoubleTree by Hilton Rome Monti',    tier:'Upper Mid', price:'$140+/n', stars:4 }],
    Barcelona:          [{ name:'Hilton Diagonal Mar Barcelona',        tier:'Classic',   price:'$220+/n', stars:4 },{ name:'DoubleTree by Hilton Barcelona',     tier:'Upper Mid', price:'$160+/n', stars:4 },{ name:'Hampton by Hilton Barcelona Centric',tier:'Midscale', price:'$100+/n', stars:3 }],
    Amsterdam:          [{ name:'Hilton Amsterdam Airport Schiphol',    tier:'Classic',   price:'$200+/n', stars:4 },{ name:'DoubleTree by Hilton Amsterdam',     tier:'Upper Mid', price:'$160+/n', stars:4 },{ name:'Hampton by Hilton Amsterdam',        tier:'Midscale',  price:'$100+/n', stars:3 }],
    Lisbon:             [{ name:'Hilton Lisbon',                        tier:'Classic',   price:'$180+/n', stars:5 },{ name:'DoubleTree by Hilton Lisbon',        tier:'Upper Mid', price:'$130+/n', stars:4 },{ name:'Hampton by Hilton Lisbon',           tier:'Midscale',  price:'$90+/n',  stars:3 }],
    // ── Oceania ──────────────────────────────────────────────────────────────
    Sydney:             [{ name:'Hilton Sydney',                        tier:'Classic',   price:'$280+/n', stars:5 },{ name:'Conrad Sydney',                      tier:'Luxury',    price:'$380+/n', stars:5 },{ name:'DoubleTree by Hilton Sydney',        tier:'Upper Mid', price:'$180+/n', stars:4 }],
    Melbourne:          [{ name:'Hilton Melbourne Little Queen Street',  tier:'Classic',   price:'$240+/n', stars:5 },{ name:'DoubleTree by Hilton Melbourne',     tier:'Upper Mid', price:'$160+/n', stars:4 },{ name:'Hampton by Hilton Melbourne',        tier:'Midscale',  price:'$110+/n', stars:3 }],
    // ── Americas ─────────────────────────────────────────────────────────────
    'New York':         [{ name:'Waldorf Astoria New York',             tier:'Luxury',    price:'$900+/n', stars:5 },{ name:'Conrad New York Downtown',           tier:'Luxury',    price:'$500+/n', stars:4 },{ name:'Hilton New York Midtown',            tier:'Classic',   price:'$280+/n', stars:4 }],
    'Los Angeles':      [{ name:'Conrad Los Angeles',                   tier:'Luxury',    price:'$380+/n', stars:5 },{ name:'Hilton Los Angeles Airport',         tier:'Classic',   price:'$180+/n', stars:4 },{ name:'DoubleTree LAX',                     tier:'Upper Mid', price:'$140+/n', stars:4 }],
    Miami:              [{ name:'Conrad Miami',                         tier:'Luxury',    price:'$280+/n', stars:5 },{ name:'Hilton Miami Downtown',              tier:'Classic',   price:'$180+/n', stars:4 },{ name:'DoubleTree Miami Airport',           tier:'Upper Mid', price:'$120+/n', stars:4 }],
    Cancun:             [{ name:'Hilton Cancun Mar Caribe All-Inclusive',tier:'Classic',   price:'$280+/n', stars:5 },{ name:'Hilton Cancun Golf & Spa Resort',    tier:'Classic',   price:'$240+/n', stars:5 },{ name:'Hampton by Hilton Cancun Airport',   tier:'Midscale',  price:'$100+/n', stars:3 }],
  },
  hyatt: {
    // ── Japan ────────────────────────────────────────────────────────────────
    Tokyo:              [{ name:'Park Hyatt Tokyo',                     tier:'Park Hyatt',price:'$520+/n', stars:5 },{ name:'Grand Hyatt Tokyo',                  tier:'Grand Hyatt',price:'$380+/n',stars:5 },{ name:'Hyatt Centric Ginza Tokyo',          tier:'Centric',   price:'$200+/n', stars:4 }],
    Kyoto:              [{ name:'Park Hyatt Kyoto',                     tier:'Park Hyatt',price:'$600+/n', stars:5 },{ name:'Andaz Kyoto Higashiyama',            tier:'Andaz',     price:'$420+/n', stars:5 },{ name:'Hyatt Regency Kyoto',                tier:'Regency',   price:'$220+/n', stars:5 }],
    Osaka:              [{ name:'Grand Hyatt Osaka',                    tier:'Grand Hyatt',price:'$280+/n',stars:5 },{ name:'Hyatt Regency Osaka',                tier:'Regency',   price:'$200+/n', stars:5 },{ name:'Hyatt Centric Namba Osaka',          tier:'Centric',   price:'$140+/n', stars:4 }],
    // ── Thailand ─────────────────────────────────────────────────────────────
    Bangkok:            [{ name:'Park Hyatt Bangkok',                   tier:'Park Hyatt',price:'$260+/n', stars:5 },{ name:'Andaz Bangkok',                      tier:'Andaz',     price:'$200+/n', stars:5 },{ name:'Grand Hyatt Erawan Bangkok',         tier:'Grand Hyatt',price:'$240+/n',stars:5 }],
    Phuket:             [{ name:'Hyatt Regency Phuket Resort',          tier:'Regency',   price:'$180+/n', stars:5 },{ name:'Andaz Phuket',                       tier:'Andaz',     price:'$260+/n', stars:5 },{ name:'Hyatt Place Phuket Patong',          tier:'Place',     price:'$80+/n',  stars:3 }],
    'Koh Samui':        [{ name:'Hyatt Regency Koh Samui',              tier:'Regency',   price:'$220+/n', stars:5 },{ name:'Andaz Koh Samui',                    tier:'Andaz',     price:'$280+/n', stars:5 },{ name:'Hyatt Place Koh Samui',              tier:'Place',     price:'$90+/n',  stars:3 }],
    // ── Korea / SE Asia ──────────────────────────────────────────────────────
    Seoul:              [{ name:'Grand Hyatt Seoul',                    tier:'Grand Hyatt',price:'$260+/n',stars:5 },{ name:'Andaz Seoul Gangnam',                tier:'Andaz',     price:'$240+/n', stars:5 },{ name:'Hyatt Regency Seoul',                tier:'Regency',   price:'$190+/n', stars:5 }],
    Bali:               [{ name:'Andaz Bali',                           tier:'Andaz',     price:'$280+/n', stars:5 },{ name:'Grand Hyatt Bali',                   tier:'Grand Hyatt',price:'$220+/n',stars:5 },{ name:'Hyatt Regency Bali',                 tier:'Regency',   price:'$160+/n', stars:5 }],
    Singapore:          [{ name:'Andaz Singapore',                      tier:'Andaz',     price:'$380+/n', stars:5 },{ name:'Grand Hyatt Singapore',              tier:'Grand Hyatt',price:'$320+/n',stars:5 },{ name:'Hyatt Centric Victoria Singapore',   tier:'Centric',   price:'$200+/n', stars:4 }],
    'Kuala Lumpur':     [{ name:'Grand Hyatt Kuala Lumpur',             tier:'Grand Hyatt',price:'$180+/n',stars:5 },{ name:'Andaz Kuala Lumpur',                 tier:'Andaz',     price:'$220+/n', stars:5 },{ name:'Hyatt Regency Kuala Lumpur',         tier:'Regency',   price:'$140+/n', stars:5 }],
    Hanoi:              [{ name:'Park Hyatt Hanoi',                     tier:'Park Hyatt',price:'$200+/n', stars:5 },{ name:'Hyatt Regency West Hanoi',           tier:'Regency',   price:'$120+/n', stars:5 },{ name:'Hyatt Place Hanoi',                  tier:'Place',     price:'$70+/n',  stars:3 }],
    'Ho Chi Minh City': [{ name:'Park Hyatt Saigon',                    tier:'Park Hyatt',price:'$240+/n', stars:5 },{ name:'Hyatt Regency Saigon',               tier:'Regency',   price:'$160+/n', stars:5 },{ name:'Hyatt Place Ho Chi Minh City',       tier:'Place',     price:'$80+/n',  stars:3 }],
    // ── India ────────────────────────────────────────────────────────────────
    Mumbai:             [{ name:'Grand Hyatt Mumbai',                   tier:'Grand Hyatt',price:'$180+/n',stars:5 },{ name:'Andaz Mumbai',                       tier:'Andaz',     price:'$160+/n', stars:5 },{ name:'Hyatt Regency Mumbai',               tier:'Regency',   price:'$120+/n', stars:5 }],
    Delhi:              [{ name:'Andaz Delhi',                          tier:'Andaz',     price:'$160+/n', stars:5 },{ name:'Hyatt Regency Delhi',                tier:'Regency',   price:'$140+/n', stars:5 },{ name:'Grand Hyatt Delhi',                  tier:'Grand Hyatt',price:'$180+/n',stars:5 }],
    Goa:                [{ name:'Grand Hyatt Goa',                      tier:'Grand Hyatt',price:'$200+/n',stars:5 },{ name:'Andaz Goa',                          tier:'Andaz',     price:'$220+/n', stars:5 },{ name:'Hyatt Regency Goa',                  tier:'Regency',   price:'$160+/n', stars:5 }],
    // ── Middle East ──────────────────────────────────────────────────────────
    Dubai:              [{ name:'Park Hyatt Dubai',                     tier:'Park Hyatt',price:'$300+/n', stars:5 },{ name:'Grand Hyatt Dubai',                  tier:'Grand Hyatt',price:'$220+/n',stars:5 },{ name:'Andaz Dubai The Palm',               tier:'Andaz',     price:'$260+/n', stars:5 }],
    Istanbul:           [{ name:'Park Hyatt Istanbul – Macka Palas',    tier:'Park Hyatt',price:'$320+/n', stars:5 },{ name:'Hyatt Regency Istanbul Atakoy',      tier:'Regency',   price:'$180+/n', stars:5 },{ name:'Hyatt Centric Levent Istanbul',      tier:'Centric',   price:'$120+/n', stars:4 }],
    // ── Europe ───────────────────────────────────────────────────────────────
    Paris:              [{ name:'Park Hyatt Paris-Vendôme',             tier:'Park Hyatt',price:'$950+/n', stars:5 },{ name:'Hyatt Regency Paris Étoile',         tier:'Regency',   price:'$320+/n', stars:4 },{ name:'Andaz Paris – Pigalle',              tier:'Andaz',     price:'$380+/n', stars:5 }],
    London:             [{ name:'Hyatt Regency London – The Churchill',  tier:'Regency',   price:'$360+/n', stars:5 },{ name:'Andaz London Liverpool Street',      tier:'Andaz',     price:'$280+/n', stars:5 },{ name:'Hyatt Place London City East',       tier:'Place',     price:'$160+/n', stars:3 }],
    Barcelona:          [{ name:'Hyatt Regency Barcelona Tower',        tier:'Regency',   price:'$200+/n', stars:5 },{ name:'Andaz Barcelona (Passeig de Gràcia)', tier:'Andaz',    price:'$280+/n', stars:5 },{ name:'Hyatt Centric The Canyons Barcelona', tier:'Centric',  price:'$140+/n', stars:4 }],
    Rome:               [{ name:'Park Hyatt Rome (new)',                tier:'Park Hyatt',price:'$460+/n', stars:5 },{ name:'Hyatt Regency Rome',                 tier:'Regency',   price:'$280+/n', stars:4 },{ name:'Hyatt Centric Rome',                 tier:'Centric',   price:'$200+/n', stars:4 }],
    // ── Oceania ──────────────────────────────────────────────────────────────
    Sydney:             [{ name:'Park Hyatt Sydney',                    tier:'Park Hyatt',price:'$560+/n', stars:5 },{ name:'Hyatt Regency Sydney',               tier:'Regency',   price:'$300+/n', stars:5 },{ name:'Hyatt Centric Sydney',               tier:'Centric',   price:'$200+/n', stars:4 }],
    // ── Americas ─────────────────────────────────────────────────────────────
    'New York':         [{ name:'Park Hyatt New York',                  tier:'Park Hyatt',price:'$740+/n', stars:5 },{ name:'Grand Hyatt New York',               tier:'Grand Hyatt',price:'$280+/n',stars:4 },{ name:'Andaz 5th Avenue',                   tier:'Andaz',     price:'$420+/n', stars:5 }],
    'Los Angeles':      [{ name:'Andaz West Hollywood',                 tier:'Andaz',     price:'$300+/n', stars:4 },{ name:'Hyatt Regency Los Angeles International Airport', tier:'Regency', price:'$180+/n', stars:4 },{ name:'Hyatt Centric Hollywood Los Angeles', tier:'Centric',   price:'$200+/n', stars:4 }],
    Miami:              [{ name:'Andaz Miami Beach',                    tier:'Andaz',     price:'$280+/n', stars:4 },{ name:'Hyatt Regency Miami',                tier:'Regency',   price:'$200+/n', stars:4 },{ name:'Hyatt Centric Midtown Miami',        tier:'Centric',   price:'$160+/n', stars:4 }],
    Chicago:            [{ name:'Hyatt Regency Chicago',                tier:'Regency',   price:'$220+/n', stars:4 },{ name:'Grand Hyatt Chicago',                tier:'Grand Hyatt',price:'$260+/n',stars:4 },{ name:'Andaz Scottsdale Resort (AZ)',        tier:'Andaz',     price:'$200+/n', stars:4 }],
  },
  ihg: {
    // ── Japan ────────────────────────────────────────────────────────────────
    Tokyo:              [{ name:'InterContinental Tokyo Bay',           tier:'InterCont.',price:'$280+/n', stars:5 },{ name:'ANA InterContinental Tokyo',         tier:'InterCont.',price:'$300+/n', stars:5 },{ name:'Kimpton Shinjuku Tokyo',             tier:'Kimpton',   price:'$160+/n', stars:4 }],
    Osaka:              [{ name:'InterContinental Osaka',               tier:'InterCont.',price:'$260+/n', stars:5 },{ name:'Crowne Plaza Osaka',                 tier:'Crowne',    price:'$160+/n', stars:5 },{ name:'Holiday Inn Express Osaka',          tier:'Holiday Inn',price:'$80+/n', stars:3 }],
    // ── Thailand ─────────────────────────────────────────────────────────────
    Bangkok:            [{ name:'InterContinental Bangkok',             tier:'InterCont.',price:'$180+/n', stars:5 },{ name:'Holiday Inn Bangkok Silom',          tier:'Holiday Inn',price:'$80+/n', stars:4 },{ name:'Crowne Plaza Bangkok Lumpini',       tier:'Crowne',    price:'$120+/n', stars:5 }],
    'Chiang Mai':       [{ name:'InterContinental Chiang Mai Mae Ping', tier:'InterCont.',price:'$120+/n', stars:5 },{ name:'Crowne Plaza Chiang Mai',            tier:'Crowne',    price:'$80+/n',  stars:5 },{ name:'Holiday Inn Chiang Mai',             tier:'Holiday Inn',price:'$60+/n', stars:4 }],
    Phuket:             [{ name:'InterContinental Phuket Resort',       tier:'InterCont.',price:'$260+/n', stars:5 },{ name:'Holiday Inn Resort Phuket',          tier:'Holiday Inn',price:'$120+/n',stars:5 },{ name:'Holiday Inn Express Phuket Patong',  tier:'Holiday Inn',price:'$65+/n', stars:3 }],
    Pattaya:            [{ name:'Holiday Inn Pattaya',                  tier:'Holiday Inn',price:'$80+/n', stars:4 },{ name:'Crowne Plaza Pattaya',               tier:'Crowne',    price:'$100+/n', stars:5 },{ name:'Holiday Inn Express Pattaya',        tier:'Holiday Inn',price:'$55+/n', stars:3 }],
    'Koh Samui':        [{ name:'InterContinental Koh Samui Resort',    tier:'InterCont.',price:'$300+/n', stars:5 },{ name:'Holiday Inn Resort Koh Samui',       tier:'Holiday Inn',price:'$140+/n',stars:5 },{ name:'Crowne Plaza Koh Samui',             tier:'Crowne',    price:'$160+/n', stars:5 }],
    Krabi:              [{ name:'Holiday Inn Resort Krabi Ao Nang',     tier:'Holiday Inn',price:'$100+/n',stars:5 },{ name:'Holiday Inn Resort Krabi Phi Phi',   tier:'Holiday Inn',price:'$120+/n',stars:4 },{ name:'Crowne Plaza Krabi',                 tier:'Crowne',    price:'$130+/n', stars:5 }],
    // ── SE Asia ──────────────────────────────────────────────────────────────
    Seoul:              [{ name:'InterContinental Seoul COEX',          tier:'InterCont.',price:'$240+/n', stars:5 },{ name:'Kimpton Seoul',                      tier:'Kimpton',   price:'$200+/n', stars:5 },{ name:'Crowne Plaza Seoul',                 tier:'Crowne',    price:'$160+/n', stars:5 }],
    Singapore:          [{ name:'InterContinental Singapore',           tier:'InterCont.',price:'$280+/n', stars:5 },{ name:'Kimpton Drayton Hotel Singapore',    tier:'Kimpton',   price:'$200+/n', stars:5 },{ name:'Crowne Plaza Changi Airport',        tier:'Crowne',    price:'$220+/n', stars:5 }],
    'Kuala Lumpur':     [{ name:'InterContinental Kuala Lumpur',        tier:'InterCont.',price:'$160+/n', stars:5 },{ name:'Crowne Plaza KL City Centre',        tier:'Crowne',    price:'$120+/n', stars:5 },{ name:'Holiday Inn KL City Centre',         tier:'Holiday Inn',price:'$80+/n', stars:4 }],
    Hanoi:              [{ name:'InterContinental Hanoi Westlake',      tier:'InterCont.',price:'$160+/n', stars:5 },{ name:'Crowne Plaza West Hanoi',            tier:'Crowne',    price:'$120+/n', stars:5 },{ name:'Holiday Inn Hanoi',                  tier:'Holiday Inn',price:'$70+/n', stars:4 }],
    'Ho Chi Minh City': [{ name:'InterContinental Saigon',              tier:'InterCont.',price:'$200+/n', stars:5 },{ name:'Hotel Indigo Saigon (IHG)',          tier:'Indigo',    price:'$140+/n', stars:5 },{ name:'Crowne Plaza Saigon',                tier:'Crowne',    price:'$120+/n', stars:5 }],
    Bali:               [{ name:'InterContinental Bali Resort',         tier:'InterCont.',price:'$280+/n', stars:5 },{ name:'Crowne Plaza Bali',                  tier:'Crowne',    price:'$160+/n', stars:5 },{ name:'Holiday Inn Resort Bali',            tier:'Holiday Inn',price:'$100+/n',stars:4 }],
    // ── India ────────────────────────────────────────────────────────────────
    Mumbai:             [{ name:'InterContinental Marine Drive Mumbai',  tier:'InterCont.',price:'$180+/n', stars:5 },{ name:'Crowne Plaza Mumbai Intl Airport',   tier:'Crowne',    price:'$120+/n', stars:5 },{ name:'Holiday Inn Mumbai',                 tier:'Holiday Inn',price:'$70+/n', stars:4 }],
    Delhi:              [{ name:'InterContinental New Delhi',            tier:'InterCont.',price:'$160+/n', stars:5 },{ name:'Crowne Plaza New Delhi Rohini',      tier:'Crowne',    price:'$100+/n', stars:5 },{ name:'Holiday Inn New Delhi Aerocity',     tier:'Holiday Inn',price:'$70+/n', stars:4 }],
    // ── Middle East ──────────────────────────────────────────────────────────
    Dubai:              [{ name:'InterContinental Dubai Festival City',  tier:'InterCont.',price:'$240+/n', stars:5 },{ name:'Crowne Plaza Dubai Marina',          tier:'Crowne',    price:'$160+/n', stars:5 },{ name:'Holiday Inn Dubai Al Barsha',        tier:'Holiday Inn',price:'$90+/n', stars:4 }],
    Istanbul:           [{ name:'InterContinental Istanbul',             tier:'InterCont.',price:'$220+/n', stars:5 },{ name:'Crowne Plaza Istanbul Old City',     tier:'Crowne',    price:'$140+/n', stars:5 },{ name:'Holiday Inn Istanbul',               tier:'Holiday Inn',price:'$90+/n', stars:4 }],
    // ── Europe ───────────────────────────────────────────────────────────────
    London:             [{ name:'InterContinental London Park Lane',     tier:'InterCont.',price:'$480+/n', stars:5 },{ name:'Kimpton Fitzroy London',             tier:'Kimpton',   price:'$360+/n', stars:5 },{ name:'Crowne Plaza London – Battersea',    tier:'Crowne',    price:'$240+/n', stars:4 }],
    Paris:              [{ name:'InterContinental Paris Le Grand',       tier:'InterCont.',price:'$480+/n', stars:5 },{ name:'Kimpton St Honoré Paris',            tier:'Kimpton',   price:'$380+/n', stars:5 },{ name:'Crowne Plaza Paris Republique',      tier:'Crowne',    price:'$220+/n', stars:4 }],
    Rome:               [{ name:'InterContinental Rome',                 tier:'InterCont.',price:'$320+/n', stars:5 },{ name:'Crowne Plaza Rome – St. Peter\'s',   tier:'Crowne',    price:'$180+/n', stars:5 },{ name:'Holiday Inn Rome Aurelia',           tier:'Holiday Inn',price:'$100+/n',stars:4 }],
    Barcelona:          [{ name:'InterContinental Barcelona',            tier:'InterCont.',price:'$280+/n', stars:5 },{ name:'Hotel Indigo Barcelona (IHG)',        tier:'Indigo',    price:'$200+/n', stars:4 },{ name:'Crowne Plaza Barcelona',             tier:'Crowne',    price:'$180+/n', stars:4 }],
    // ── Oceania ──────────────────────────────────────────────────────────────
    Sydney:             [{ name:'InterContinental Sydney',               tier:'InterCont.',price:'$340+/n', stars:5 },{ name:'Crowne Plaza Darling Harbour Sydney', tier:'Crowne',   price:'$200+/n', stars:5 },{ name:'Holiday Inn Old Sydney',             tier:'Holiday Inn',price:'$140+/n',stars:4 }],
    // ── Americas ─────────────────────────────────────────────────────────────
    'New York':         [{ name:'InterContinental New York Times Square', tier:'InterCont.',price:'$320+/n',stars:4 },{ name:'Kimpton Hotel Theta NYC',            tier:'Kimpton',   price:'$280+/n', stars:4 },{ name:'Crowne Plaza New York Midtown',      tier:'Crowne',    price:'$240+/n', stars:4 }],
    'Los Angeles':      [{ name:'InterContinental Los Angeles Downtown',  tier:'InterCont.',price:'$280+/n',stars:4 },{ name:'Hotel Indigo Los Angeles Downtown',  tier:'Indigo',    price:'$200+/n', stars:4 },{ name:'Crowne Plaza Los Angeles',           tier:'Crowne',    price:'$160+/n', stars:4 }],
    Miami:              [{ name:'InterContinental Miami',                 tier:'InterCont.',price:'$260+/n',stars:4 },{ name:'Kimpton EPIC Hotel Miami',           tier:'Kimpton',   price:'$220+/n', stars:4 },{ name:'Crowne Plaza Miami Airport',         tier:'Crowne',    price:'$140+/n', stars:4 }],
  },
  accor: {
    // ── Japan ────────────────────────────────────────────────────────────────
    Tokyo:              [{ name:'Sofitel Tokyo Daiba',                  tier:'Sofitel',   price:'$220+/n', stars:5 },{ name:'Pullman Tokyo Tamachi',              tier:'Pullman',   price:'$180+/n', stars:5 },{ name:'Novotel Tokyo Shinjuku',             tier:'Novotel',   price:'$120+/n', stars:4 }],
    // ── Thailand ─────────────────────────────────────────────────────────────
    Bangkok:            [{ name:'Sofitel Bangkok Sukhumvit',            tier:'Sofitel',   price:'$160+/n', stars:5 },{ name:'Pullman Bangkok King Power',         tier:'Pullman',   price:'$130+/n', stars:5 },{ name:'Novotel Bangkok Fenix Silom',        tier:'Novotel',   price:'$70+/n',  stars:4 }],
    'Chiang Mai':       [{ name:'Pullman Chiang Mai Raja Orchid',       tier:'Pullman',   price:'$80+/n',  stars:5 },{ name:'Novotel Chiang Mai Nimman',          tier:'Novotel',   price:'$60+/n',  stars:4 },{ name:'ibis Chiang Mai Nimmanhaemin',       tier:'ibis',      price:'$35+/n',  stars:3 }],
    Phuket:             [{ name:'Sofitel Phuket Phokeethra',            tier:'Sofitel',   price:'$200+/n', stars:5 },{ name:'Pullman Phuket Panwa Beach Resort',  tier:'Pullman',   price:'$160+/n', stars:5 },{ name:'Novotel Phuket Surin Beach',         tier:'Novotel',   price:'$90+/n',  stars:4 }],
    Pattaya:            [{ name:'Pullman Pattaya Hotel G',              tier:'Pullman',   price:'$100+/n', stars:5 },{ name:'Novotel Pattaya Rim Phan',           tier:'Novotel',   price:'$60+/n',  stars:4 },{ name:'ibis Pattaya',                       tier:'ibis',      price:'$30+/n',  stars:3 }],
    'Koh Samui':        [{ name:'Sofitel Koh Samui Fisherman\'s Village',tier:'Sofitel',  price:'$260+/n', stars:5 },{ name:'Novotel Samui Resort Chaweng Beach',  tier:'Novotel',  price:'$90+/n',  stars:4 },{ name:'ibis Koh Samui',                     tier:'ibis',      price:'$40+/n',  stars:3 }],
    Krabi:              [{ name:'Novotel Krabi Ao Nang Beach',          tier:'Novotel',   price:'$80+/n',  stars:4 },{ name:'Mercure Krabi Deevana',              tier:'Mercure',   price:'$60+/n',  stars:4 },{ name:'ibis Styles Krabi Ao Nang',          tier:'ibis',      price:'$40+/n',  stars:3 }],
    // ── SE Asia ──────────────────────────────────────────────────────────────
    Bali:               [{ name:'Sofitel Bali Nusa Dua Beach Resort',   tier:'Sofitel',   price:'$220+/n', stars:5 },{ name:'Pullman Bali Legian Beach',          tier:'Pullman',   price:'$140+/n', stars:5 },{ name:'Novotel Bali Nusa Dua',             tier:'Novotel',   price:'$90+/n',  stars:5 }],
    Singapore:          [{ name:'Sofitel Singapore City Centre',        tier:'Sofitel',   price:'$280+/n', stars:5 },{ name:'Pullman Singapore Hill Street',      tier:'Pullman',   price:'$200+/n', stars:5 },{ name:'Novotel Singapore on Stevens',       tier:'Novotel',   price:'$140+/n', stars:4 }],
    'Kuala Lumpur':     [{ name:'Sofitel Kuala Lumpur Damansara',       tier:'Sofitel',   price:'$140+/n', stars:5 },{ name:'Pullman Kuala Lumpur City Centre',   tier:'Pullman',   price:'$120+/n', stars:5 },{ name:'Novotel Kuala Lumpur City Centre',   tier:'Novotel',   price:'$80+/n',  stars:4 }],
    Hanoi:              [{ name:'Sofitel Legend Metropole Hanoi',       tier:'Sofitel',   price:'$280+/n', stars:5 },{ name:'Pullman Hanoi',                      tier:'Pullman',   price:'$100+/n', stars:5 },{ name:'Novotel Hanoi',                      tier:'Novotel',   price:'$70+/n',  stars:4 }],
    'Ho Chi Minh City': [{ name:'Sofitel Saigon Plaza',                 tier:'Sofitel',   price:'$140+/n', stars:5 },{ name:'Pullman Saigon Centre',              tier:'Pullman',   price:'$110+/n', stars:5 },{ name:'Novotel Saigon Centre',              tier:'Novotel',   price:'$70+/n',  stars:4 }],
    // ── India ────────────────────────────────────────────────────────────────
    Mumbai:             [{ name:'Sofitel Mumbai BKC',                   tier:'Sofitel',   price:'$180+/n', stars:5 },{ name:'Novotel Mumbai International Airport', tier:'Novotel', price:'$90+/n',  stars:4 },{ name:'ibis Mumbai Vikhroli',               tier:'ibis',      price:'$40+/n',  stars:3 }],
    Delhi:              [{ name:'Pullman New Delhi Aerocity',           tier:'Pullman',   price:'$120+/n', stars:5 },{ name:'Novotel New Delhi Aerocity',         tier:'Novotel',   price:'$90+/n',  stars:4 },{ name:'ibis New Delhi Aerocity',            tier:'ibis',      price:'$45+/n',  stars:3 }],
    // ── Middle East ──────────────────────────────────────────────────────────
    Dubai:              [{ name:'Sofitel Dubai Jumeirah Beach',         tier:'Sofitel',   price:'$200+/n', stars:5 },{ name:'Pullman Dubai Creek City Centre',    tier:'Pullman',   price:'$140+/n', stars:5 },{ name:'Novotel Dubai Al Barsha',            tier:'Novotel',   price:'$80+/n',  stars:4 }],
    Istanbul:           [{ name:'Sofitel Istanbul Taksim',              tier:'Sofitel',   price:'$200+/n', stars:5 },{ name:'Pullman Istanbul Hotel & Guide',     tier:'Pullman',   price:'$140+/n', stars:5 },{ name:'Novotel Istanbul Zeytinburnu',        tier:'Novotel',   price:'$90+/n',  stars:4 }],
    // ── Europe ───────────────────────────────────────────────────────────────
    Paris:              [{ name:'Sofitel Paris Le Faubourg',            tier:'Sofitel',   price:'$600+/n', stars:5 },{ name:'Pullman Paris Montparnasse',         tier:'Pullman',   price:'$280+/n', stars:4 },{ name:'Novotel Paris Tour Eiffel',          tier:'Novotel',   price:'$220+/n', stars:4 }],
    London:             [{ name:'Sofitel London St James',              tier:'Sofitel',   price:'$480+/n', stars:5 },{ name:'Pullman London St Pancras',          tier:'Pullman',   price:'$280+/n', stars:4 },{ name:'Novotel London City South',          tier:'Novotel',   price:'$180+/n', stars:4 }],
    Rome:               [{ name:'Sofitel Rome Villa Borghese',          tier:'Sofitel',   price:'$380+/n', stars:5 },{ name:'Pullman Rome Ciampino Airport',      tier:'Pullman',   price:'$140+/n', stars:4 },{ name:'Novotel Roma Est',                   tier:'Novotel',   price:'$100+/n', stars:4 }],
    Barcelona:          [{ name:'Sofitel Barcelona Skipper',            tier:'Sofitel',   price:'$280+/n', stars:5 },{ name:'Novotel Barcelona City',             tier:'Novotel',   price:'$160+/n', stars:4 },{ name:'ibis Barcelona Centro',              tier:'ibis',      price:'$80+/n',  stars:2 }],
    Amsterdam:          [{ name:'Sofitel Amsterdam The Grand',          tier:'Sofitel',   price:'$380+/n', stars:5 },{ name:'Pullman Amsterdam Eindhoven',        tier:'Pullman',   price:'$200+/n', stars:4 },{ name:'Novotel Amsterdam',                  tier:'Novotel',   price:'$160+/n', stars:4 }],
    Lisbon:             [{ name:'Sofitel Lisbon Liberdade',             tier:'Sofitel',   price:'$280+/n', stars:5 },{ name:'Novotel Lisbon',                     tier:'Novotel',   price:'$140+/n', stars:4 },{ name:'ibis Lisbon Centro',                 tier:'ibis',      price:'$70+/n',  stars:2 }],
    Athens:             [{ name:'Sofitel Athens Airport',               tier:'Sofitel',   price:'$180+/n', stars:5 },{ name:'Novotel Athens',                     tier:'Novotel',   price:'$120+/n', stars:4 },{ name:'ibis Athens',                        tier:'ibis',      price:'$70+/n',  stars:3 }],
    // ── Oceania ──────────────────────────────────────────────────────────────
    Sydney:             [{ name:'Sofitel Sydney Darling Harbour',       tier:'Sofitel',   price:'$280+/n', stars:5 },{ name:'Novotel Sydney Darling Harbour',     tier:'Novotel',   price:'$180+/n', stars:4 },{ name:'ibis Sydney World Square',           tier:'ibis',      price:'$100+/n', stars:3 }],
    Melbourne:          [{ name:'Sofitel Melbourne on Collins',         tier:'Sofitel',   price:'$260+/n', stars:5 },{ name:'Novotel Melbourne on Collins',       tier:'Novotel',   price:'$160+/n', stars:4 },{ name:'ibis Melbourne City',                tier:'ibis',      price:'$90+/n',  stars:3 }],
    // ── Africa ───────────────────────────────────────────────────────────────
    'Cape Town':        [{ name:'Sofitel Cape Town Cullinan (Autograph)',tier:'Sofitel',  price:'$200+/n', stars:5 },{ name:'Novotel Cape Town',                  tier:'Novotel',   price:'$120+/n', stars:4 },{ name:'ibis Cape Town',                     tier:'ibis',      price:'$60+/n',  stars:3 }],
    Marrakech:          [{ name:'Sofitel Marrakech Palais Imperial',    tier:'Sofitel',   price:'$200+/n', stars:5 },{ name:'Novotel Marrakech',                  tier:'Novotel',   price:'$100+/n', stars:4 },{ name:'ibis Marrakech Centre',              tier:'ibis',      price:'$50+/n',  stars:3 }],
  },
}

// ── City center coordinates [lat, lng] ────────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  Tokyo:[35.6762,139.6503], Osaka:[34.6937,135.5023], Kyoto:[35.0116,135.7681],
  Sapporo:[43.0621,141.3544], Fukuoka:[33.5902,130.4017], Hiroshima:[34.3853,132.4553],
  Nara:[34.6851,135.8048], Yokohama:[35.4437,139.6380],
  Bangkok:[13.7563,100.5018], 'Chiang Mai':[18.7883,98.9853], Phuket:[7.8804,98.3923],
  Pattaya:[12.9236,100.8825], Krabi:[8.0863,98.9063], 'Koh Samui':[9.5120,100.0136],
  Seoul:[37.5665,126.9780], Busan:[35.1796,129.0756], Jeju:[33.4996,126.5312],
  Bali:[-8.4095,115.1889], Jakarta:[-6.2088,106.8456], Singapore:[1.3521,103.8198],
  'Kuala Lumpur':[3.1390,101.6869], Penang:[5.4141,100.3288], Langkawi:[6.3500,99.8000],
  Hanoi:[21.0285,105.8542], 'Ho Chi Minh City':[10.8231,106.6297],
  'Hoi An':[15.8800,108.3380], 'Da Nang':[16.0544,108.2022], 'Halong Bay':[20.9101,107.1839],
  Mumbai:[19.0760,72.8777], Delhi:[28.6139,77.2090], Goa:[15.2993,74.1240], Jaipur:[26.9124,75.7873],
  Agra:[27.1767,78.0081], Varanasi:[25.3176,82.9739], Bangalore:[12.9716,77.5946],
  'Baa Atoll':[5.0000,73.0000],
  Dubai:[25.2048,55.2708], 'Abu Dhabi':[24.4539,54.3773], Istanbul:[41.0082,28.9784],
  Cappadocia:[38.6431,34.8277], Petra:[30.3285,35.4444], Doha:[25.2854,51.5310],
  Paris:[48.8566,2.3522], London:[51.5074,-0.1278], Rome:[41.9028,12.4964],
  Florence:[43.7696,11.2558], Venice:[45.4408,12.3155], Milan:[45.4654,9.1859],
  Barcelona:[41.3851,2.1734], Madrid:[40.4168,-3.7038], Lisbon:[38.7223,-9.1393],
  Athens:[37.9838,23.7275], Amsterdam:[52.3676,4.9041], Prague:[50.0755,14.4378],
  Vienna:[48.2082,16.3738], Budapest:[47.4979,19.0402], Santorini:[36.3932,25.4615],
  Berlin:[52.5200,13.4050], Munich:[48.1351,11.5820], Zurich:[47.3769,8.5417],
  Geneva:[46.2044,6.1432], Copenhagen:[55.6761,12.5683], Stockholm:[59.3293,18.0686],
  Edinburgh:[55.9533,-3.1883],
  Sydney:[-33.8688,151.2093], Melbourne:[-37.8136,144.9631], Brisbane:[-27.4698,153.0251],
  Cairns:[-16.9186,145.7781], 'Gold Coast':[-28.0167,153.4000],
  Auckland:[-36.8509,174.7645], Queenstown:[-45.0312,168.6626],
  Cairo:[30.0444,31.2357], Marrakech:[31.6295,-7.9811], 'Cape Town':[-33.9249,18.4241],
  Nairobi:[-1.2921,36.8219], Zanzibar:[-6.1630,39.2026],
  'New York':[40.7128,-74.0060], 'Los Angeles':[34.0522,-118.2437],
  Miami:[25.7617,-80.1918], 'Las Vegas':[36.1699,-115.1398],
  Chicago:[41.8781,-87.6298], 'San Francisco':[37.7749,-122.4194],
  'Mexico City':[19.4326,-99.1332], Cancun:[21.1619,-86.8515],
  'Rio de Janeiro':[-22.9068,-43.1729], 'Buenos Aires':[-34.6037,-58.3816],
  Lima:[-12.0464,-77.0428], Cusco:[-13.5319,-71.9675],
  Beijing:[39.9042,116.4074], Shanghai:[31.2304,121.4737], 'Hong Kong':[22.3193,114.1694],
  Chengdu:[30.5728,104.0668],
}

// ── Famous attraction coordinates [lat, lng] ──────────────────────────────────
const PLACE_COORDS: Record<string, [number, number]> = {
  // Tokyo
  'Senso-ji Temple':[35.7148,139.7967], 'Tokyo Tower':[35.6586,139.7454],
  'Shibuya Crossing':[35.6595,139.7004], 'Meiji Shrine':[35.6763,139.6993],
  'Tokyo Skytree':[35.7101,139.8107], 'Shinjuku Gyoen':[35.6851,139.7100],
  'Akihabara':[35.7023,139.7746], 'Harajuku':[35.6702,139.7027],
  'Ueno Park':[35.7145,139.7739], 'teamLab Borderless':[35.6221,139.7791],
  // Kyoto
  'Fushimi Inari Shrine':[34.9671,135.7727], 'Kinkaku-ji':[35.0394,135.7292],
  'Arashiyama Bamboo Grove':[35.0117,135.6761], 'Gion District':[35.0038,135.7752],
  "Philosopher's Path":[35.0194,135.7861], 'Nishiki Market':[35.0052,135.7657],
  'Nijo Castle':[35.0142,135.7480], 'Kiyomizu-dera':[34.9948,135.7851],
  // Osaka
  'Osaka Castle':[34.6873,135.5259], 'Dotonbori':[34.6687,135.5013],
  'Universal Studios Japan':[34.6654,135.4323], 'Namba':[34.6686,135.5013],
  // Bangkok
  'Grand Palace':[13.7500,100.4913], 'Wat Pho':[13.7465,100.4930],
  'Wat Arun':[13.7437,100.4888], 'Chatuchak Market':[13.7999,100.5508],
  'Lumphini Park':[13.7313,100.5418], 'Khao San Road':[13.7587,100.4984],
  // Chiang Mai
  'Doi Suthep Temple':[18.8048,98.9214], 'Nimman Road':[18.7969,98.9664],
  'Night Bazaar Chiang Mai':[18.7885,98.9929], 'Old City Chiang Mai':[18.7884,98.9874],
  // Phuket
  'Patong Beach':[7.8966,98.2965], 'Phi Phi Islands':[7.7407,98.7784],
  'Big Buddha Phuket':[7.8276,98.3090], 'Old Town Phuket':[7.8861,98.3920],
  // Krabi
  'Railay Beach':[8.0115,98.8342], 'Krabi Town':[8.0863,98.9063],
  'James Bond Island':[8.2738,98.5003], 'Tiger Cave Temple':[8.1296,98.9547],
  // Seoul
  'Gyeongbokgung Palace':[37.5796,126.9770], 'Namsan Seoul Tower':[37.5512,126.9882],
  'Bukchon Hanok Village':[37.5824,126.9845], 'Hongdae':[37.5563,126.9238],
  'Insadong':[37.5744,126.9844], 'Myeongdong':[37.5636,126.9830],
  // Bali
  'Tanah Lot':[-8.6215,115.0869], 'Ubud Monkey Forest':[-8.5188,115.2589],
  'Kuta Beach':[-8.7215,115.1685], 'Seminyak':[-8.6912,115.1606],
  'Uluwatu Temple':[-8.8291,115.0849], 'Tegallalang Rice Terraces':[-8.4345,115.2788],
  'Nusa Penida':[-8.7275,115.5444], 'Ubud':[-8.5069,115.2625],
  // Singapore
  'Marina Bay Sands':[1.2834,103.8607], 'Gardens by the Bay':[1.2816,103.8636],
  'Sentosa Island':[1.2494,103.8303], 'Chinatown Singapore':[1.2814,103.8444],
  'Universal Studios Singapore':[1.2540,103.8238], 'Orchard Road':[1.3048,103.8318],
  'Clarke Quay':[1.2904,103.8465], 'Little India Singapore':[1.3066,103.8519],
  // India
  'Gateway of India':[18.9220,72.8347], 'Marine Drive':[18.9437,72.8233],
  'Elephanta Caves':[18.9635,72.9315], 'Taj Mahal':[27.1751,78.0421],
  'India Gate':[28.6129,77.2295], 'Qutub Minar':[28.5245,77.1855],
  'Amber Fort':[26.9855,75.8513], 'City Palace Jaipur':[26.9258,75.8237],
  'Hawa Mahal':[26.9239,75.8267],
  // Dubai & Middle East
  'Burj Khalifa':[25.1972,55.2744], 'Dubai Mall':[25.1984,55.2795],
  'Palm Jumeirah':[25.1124,55.1390], 'Dubai Creek':[25.2631,55.3007],
  'Gold Souk Dubai':[25.2697,55.3046], 'Sheikh Zayed Mosque':[24.4120,54.4750],
  'Louvre Abu Dhabi':[24.5338,54.3978], 'Yas Island':[24.4972,54.6086],
  'Hagia Sophia':[41.0086,28.9802], 'Grand Bazaar Istanbul':[41.0106,28.9682],
  'Blue Mosque':[41.0054,28.9769], 'Topkapi Palace':[41.0115,28.9833],
  'Galata Tower':[41.0256,28.9740], 'Bosphorus':[41.0741,29.0457],
  // Paris
  'Eiffel Tower':[48.8584,2.2945], 'Louvre Museum':[48.8606,2.3376],
  'Arc de Triomphe':[48.8738,2.2950], 'Notre-Dame Cathedral':[48.8530,2.3499],
  'Sacré-Cœur':[48.8867,2.3431], 'Palace of Versailles':[48.8049,2.1204],
  'Champs-Élysées':[48.8698,2.3078], 'Musée d\'Orsay':[48.8600,2.3266],
  // London
  'Tower of London':[51.5081,-0.0759], 'Buckingham Palace':[51.5014,-0.1419],
  'Big Ben':[51.5007,-0.1246], 'London Eye':[51.5033,-0.1196],
  'British Museum':[51.5194,-0.1270], "St Paul's Cathedral":[51.5138,-0.0984],
  'Hyde Park':[51.5073,-0.1657], 'Tate Modern':[51.5076,-0.0994],
  // Rome
  'Colosseum':[41.8902,12.4922], 'Vatican City':[41.9029,12.4534],
  'Trevi Fountain':[41.9009,12.4833], 'Roman Forum':[41.8925,12.4853],
  'Spanish Steps Rome':[41.9059,12.4822], 'Pantheon Rome':[41.8986,12.4769],
  'Borghese Gallery':[41.9141,12.4924],
  // Florence
  'Uffizi Gallery':[43.7677,11.2554], 'Florence Cathedral':[43.7731,11.2560],
  'Ponte Vecchio':[43.7681,11.2531], 'Piazzale Michelangelo':[43.7629,11.2645],
  'David Statue':[43.7767,11.2599], 'Boboli Gardens':[43.7647,11.2500],
  // Venice
  'Grand Canal Venice':[45.4388,12.3186], "St Mark's Basilica":[45.4347,12.3389],
  "Doge's Palace":[45.4338,12.3400], 'Rialto Bridge':[45.4380,12.3358],
  // Barcelona
  'Sagrada Familia':[41.4036,2.1744], 'Park Güell':[41.4145,2.1527],
  'Las Ramblas':[41.3808,2.1732], 'Gothic Quarter Barcelona':[41.3833,2.1777],
  'Camp Nou':[41.3809,2.1228], 'Casa Batlló':[41.3916,2.1649],
  // Amsterdam
  'Anne Frank House':[52.3752,4.8840], 'Rijksmuseum':[52.3600,4.8852],
  'Van Gogh Museum':[52.3584,4.8811], 'Amsterdam Canals':[52.3676,4.9041],
  'Keukenhof Gardens':[52.2697,4.5462],
  // Athens
  'Acropolis':[37.9715,23.7267], 'Parthenon':[37.9715,23.7267],
  'Plaka Athens':[37.9742,23.7294], 'Syntagma Square':[37.9754,23.7358],
  // Sydney
  'Sydney Opera House':[-33.8568,151.2153], 'Sydney Harbour Bridge':[-33.8523,151.2108],
  'Bondi Beach':[-33.8915,151.2767], 'Taronga Zoo':[-33.8434,151.2413],
  'Blue Mountains':[-33.7036,150.3024], 'Manly Beach':[-33.7969,151.2869],
  // Melbourne
  'Federation Square Melbourne':[-37.8180,144.9693], 'Great Ocean Road':[-38.6853,143.3905],
  'Queen Victoria Market Melbourne':[-37.8073,144.9568],
  // Cairo
  'Pyramids of Giza':[29.9792,31.1342], 'Sphinx of Giza':[29.9753,31.1376],
  'Egyptian Museum':[30.0478,31.2336], 'Khan el-Khalili':[30.0484,31.2624],
  // Marrakech
  'Djemaa el-Fna':[31.6258,-7.9891], 'Majorelle Garden':[31.6413,-8.0030],
  'Medina of Marrakech':[31.6310,-7.9888], 'Bahia Palace':[31.6214,-7.9836],
  // Cape Town
  'Table Mountain':[-33.9628,18.4098], 'V&A Waterfront':[-33.9066,18.4203],
  'Cape of Good Hope':[-34.3568,18.4734], 'Robben Island':[-33.8069,18.3671],
  // New York
  'Statue of Liberty':[40.6892,-74.0445], 'Central Park':[40.7851,-73.9683],
  'Times Square':[40.7580,-73.9855], 'Brooklyn Bridge':[40.7061,-73.9969],
  'Empire State Building':[40.7484,-73.9967], 'Metropolitan Museum':[40.7794,-73.9632],
  'High Line':[40.7480,-74.0048],
  'Top of The Rock':[40.7593,-73.9787], 'Top of the Rock':[40.7593,-73.9787],
  'One World Trade Center':[40.7127,-74.0134], 'One World Observatory':[40.7127,-74.0134],
  'The Battery':[40.7034,-74.0170], 'Battery Park':[40.7034,-74.0170],
  'The Channel Gardens':[40.7580,-73.9782], 'Rockefeller Center':[40.7587,-73.9787],
  'Door to Nowhere':[40.7580,-73.9855], 'Berlin Wall NYC':[40.7549,-73.9840],
  'Chrysler Building':[40.7516,-73.9755], 'Grand Central Terminal':[40.7527,-73.9772],
  'Fifth Avenue':[40.7549,-73.9840], 'Wall Street':[40.7069,-74.0089],
  'DUMBO':[40.7033,-73.9894], 'Coney Island':[40.5749,-73.9859],
  'The Vessel':[40.7536,-74.0019], 'Hudson Yards':[40.7536,-74.0019],
  'Whitney Museum':[40.7396,-74.0089], 'MoMA':[40.7614,-73.9776],
  'Yankee Stadium':[40.8296,-73.9262], 'Flushing Meadows':[40.7282,-73.8456],
  // Los Angeles
  'Hollywood Sign':[34.1341,-118.3215], 'Santa Monica Pier':[34.0100,-118.4961],
  'Venice Beach':[33.9850,-118.4695], 'Griffith Observatory':[34.1184,-118.3004],
  'Getty Center':[34.0780,-118.4741], 'The Getty Museum':[34.0780,-118.4741], 'The Getty':[34.0780,-118.4741],
  'Universal Studios Hollywood':[34.1381,-118.3534], 'Beverly Hills':[34.0736,-118.4004],
  'LACMA':[34.0639,-118.3592], 'Hollywood Walk of Fame':[34.1016,-118.3267],
  'Rodeo Drive':[34.0672,-118.3997], 'Sunset Strip':[34.0900,-118.3850],
  'The Grove LA':[34.0720,-118.3559], 'Disneyland':[33.8121,-117.9190],
  'Hollywood Bowl':[34.1122,-118.3390], 'Mulholland Drive':[34.1219,-118.4057],
  'Malibu Beach':[34.0259,-118.7798], 'Runyon Canyon':[34.1070,-118.3539],
  'Dodger Stadium':[34.0739,-118.2400], 'Little Tokyo LA':[34.0489,-118.2390],
  'Warner Bros. Studio Tour Hollywood':[34.1488,-118.3388], 'Hollyhock House':[34.1022,-118.2890],
  'Walt Disney Concert Hall':[34.0553,-118.2496], 'The Broad':[34.0544,-118.2504],
  'Grand Central Market':[34.0509,-118.2490], 'Olvera Street':[34.0580,-118.2376],
  'The Last Bookstore':[34.0493,-118.2487], 'Crypto.com Arena':[34.0430,-118.2673],
  'SoFi Stadium':[33.9535,-118.3392], 'Exposition Park':[34.0146,-118.2884],
  // Miami
  'South Beach Miami':[25.7825,-80.1300], 'Art Deco District Miami':[25.7776,-80.1311],
  'Wynwood Walls':[25.8009,-80.1996],
  // Las Vegas
  'Las Vegas Strip':[36.1147,-115.1729], 'Grand Canyon':[36.0544,-112.2401],
  'Hoover Dam':[36.0161,-114.7377], 'Fremont Street':[36.1705,-115.1443],
  // Chicago
  'Millennium Park Chicago':[41.8827,-87.6233], 'Navy Pier Chicago':[41.8917,-87.6086],
  'Art Institute Chicago':[41.8796,-87.6237], 'Willis Tower':[41.8789,-87.6359],
  // San Francisco
  'Golden Gate Bridge':[37.8199,-122.4783], 'Alcatraz Island':[37.8270,-122.4230],
  "Fisherman's Wharf":[37.8080,-122.4177], 'Lombard Street SF':[37.8021,-122.4187],
  // Mexico & Central America
  'Chichen Itza':[20.6843,-88.5678], 'Tulum Ruins':[20.2120,-87.4286],
  'Teotihuacan':[19.6925,-98.8438],
}

// Haversine distance in km
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLon = (b[1] - a[1]) * Math.PI / 180
  const lat1 = a[0] * Math.PI / 180
  const lat2 = b[0] * Math.PI / 180
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2
  return R * 2 * Math.asin(Math.sqrt(h))
}

function centroid(coords: [number, number][]): [number, number] {
  if (!coords.length) return [0, 0]
  return [
    coords.reduce((s, c) => s + c[0], 0) / coords.length,
    coords.reduce((s, c) => s + c[1], 0) / coords.length,
  ]
}

const BRAND_ACCENT: Record<string, string> = {
  marriott:'#B5924C', hilton:'#003087', hyatt:'#7B2D8B', ihg:'#003F87', accor:'#C8102E',
}
// Self-hosted in /public/logos — served from Vercel CDN, always available
const BRAND_LOGOS: Record<string, string> = {
  marriott: '/logos/marriott.svg',
  hilton:   '/logos/hilton.svg',
  ihg:      '/logos/ihg.svg',
  hyatt:    '/logos/hyatt.svg',
  accor:    '/logos/accor.svg',
}
const BRAND_INITIALS: Record<string, string> = {
  marriott:'M', hilton:'H', ihg:'IHG', hyatt:'Hy', accor:'A',
}
const isAirportHotel = (name: string) => /airport|aerocity|aeroport/i.test(name)

function rankHotels(hotels: HotelSuggestion[]): HotelSuggestion[] {
  // City-center hotels first; skip airport hotels when there are 2+ alternatives
  const city = hotels.filter(h => !isAirportHotel(h.name))
  const airport = hotels.filter(h => isAirportHotel(h.name))
  if (city.length >= 2) return city.slice(0, 3)
  return [...city, ...airport].slice(0, 3)
}

function getHotelSuggestions(brands: string[], cities: string[]): { brand: string; city: string; hotels: HotelSuggestion[] }[] {
  const results: { brand: string; city: string; hotels: HotelSuggestion[] }[] = []
  const seen = new Set<string>()

  for (const brand of brands) {
    const db = HOTEL_DB[brand]
    if (!db) continue

    for (const rawCity of cities) {
      if (!rawCity) continue
      const normalise = (s: string) => s.toLowerCase().split(',')[0].trim()
      const nc = normalise(rawCity)

      // Try exact match first, then fuzzy (handles "Chiang Mai, Thailand" → "Chiang Mai")
      const exact = db[rawCity]
      if (exact?.length) {
        const key2 = `${brand}::${rawCity}`
        if (!seen.has(key2)) { seen.add(key2); results.push({ brand, city: rawCity, hotels: rankHotels(exact) }) }
        continue
      }

      // Fuzzy: require meaningful overlap (both strings ≥ 4 chars, full-word match preferred)
      const dbKey = Object.keys(db).find(k => {
        const nk = normalise(k)
        if (nk === nc) return true
        // Only match if the shared part is substantial (≥ 4 chars) to avoid "la" matching "bali"
        if (nc.length >= 4 && nk.includes(nc)) return true
        if (nk.length >= 4 && nc.includes(nk)) return true
        return false
      })
      if (dbKey) {
        const key2 = `${brand}::${dbKey}`
        if (!seen.has(key2)) { seen.add(key2); results.push({ brand, city: dbKey, hotels: rankHotels(db[dbKey]) }) }
      }
    }
  }
  return results
}

function getBudgetHotels(cities: string[]): { city: string; hotels: HotelSuggestion[] }[] {
  return cities.flatMap(rawCity => {
    const found: HotelSuggestion[] = []
    const normalise = (s: string) => s.toLowerCase().split(',')[0].trim()
    const nc = normalise(rawCity)
    for (const brand of Object.keys(HOTEL_DB)) {
      const db = HOTEL_DB[brand]
      const dbKey = Object.keys(db).find(k => {
        const nk = normalise(k)
        return nk === nc || nk.includes(nc) || nc.includes(nk)
      })
      if (dbKey) found.push(...rankHotels(db[dbKey].filter(h => h.stars <= 3)).slice(0, 1))
    }
    return found.length ? [{ city: rawCity, hotels: found.slice(0, 3) }] : []
  })
}

function computeTotalDays(s?: string, e?: string) {
  if (!s || !e) return 7
  return Math.max(1, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1)
}
function shiftDate(dateStr: string, n: number) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtDateLabel(s?: string) {
  if (!s) return ''
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { day:'2-digit', month:'short' }).toUpperCase()
}

function buildItinerary(data: OnboardingData): CitySection[] {
  const placesByCity = data.placesByCity || {}
  const cities = Object.keys(placesByCity).filter(c => placesByCity[c]?.length > 0)
  const startDate = data.startDate || data.pendingTrip?.startDate || ''
  const endDate   = data.endDate   || data.pendingTrip?.endDate   || ''
  const totalDays = computeTotalDays(startDate, endDate)

  if (cities.length === 0) {
    const dest = data.destination || data.cities?.[0] || 'Your Destination'
    const all  = data.places || []
    return [{ city: dest, startDay: 1, days: Array.from({ length: totalDays }, (_, d) => ({
      dayNumber: d + 1, date: startDate ? shiftDate(startDate, d) : `Day ${d+1}`,
      places: all.slice(d * 2, d * 2 + 2),
    }))}]
  }

  const sections: CitySection[] = []
  let globalDay = 1
  let globalOffset = 0

  for (const city of cities) {
    const cityPlaces = placesByCity[city]
    const cityCenter: [number, number] = CITY_COORDS[city] || [0, 0]

    // Attach coords to each place
    const withCoords = cityPlaces.map(name => ({
      name,
      coords: (PLACE_COORDS[name] || cityCenter) as [number, number],
    }))

    // Nearest-neighbour sort from city center
    const ordered: typeof withCoords = []
    const remaining = new Set(withCoords.map((_, i) => i))
    let current: [number, number] = cityCenter
    while (remaining.size > 0) {
      let nearest = -1, nearestDist = Infinity
      for (const i of remaining) {
        const d = haversineKm(current, withCoords[i].coords)
        if (d < nearestDist) { nearestDist = d; nearest = i }
      }
      if (nearest < 0) break
      ordered.push(withCoords[nearest])
      current = withCoords[nearest].coords
      remaining.delete(nearest)
    }

    // Cluster into days: max 2 places per day, ≤ 30 km between stops
    const days: DayBlock[] = []
    let i = 0
    while (i < ordered.length) {
      const dayPlaces = [ordered[i]]; let prev = ordered[i].coords; i++
      if (i < ordered.length && dayPlaces.length < 2) {
        if (haversineKm(prev, ordered[i].coords) <= 30) { dayPlaces.push(ordered[i]); i++ }
      }
      days.push({
        dayNumber: globalDay,
        date: startDate ? shiftDate(startDate, globalOffset) : `Day ${globalDay}`,
        places: dayPlaces.map(p => p.name),
      })
      globalDay++; globalOffset++
    }

    sections.push({ city, startDay: days[0]?.dayNumber ?? globalDay, days })
  }

  return sections
}

// ── MapView — Google Maps with red pins + per-brand hotel logo pins ───────────
function MapView({ placesByCity, photoMap, hotels, brandVisibility }: {
  placesByCity: Record<string, string[]>
  photoMap: Record<string, string>
  hotels: { name: string; city: string; brand: string }[]
  brandVisibility: Record<string, boolean>
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const brandMarkersRef = useRef<Record<string, any[]>>({})
  const stableKey = Object.values(placesByCity).flat().join(',') + Object.keys(photoMap).length + hotels.map(h => h.name).join(',')

  useEffect(() => {
    if (!mapRef.current) return

    // Build place list for lookup
    const allPlaces: { name: string; city: string }[] = []
    for (const [city, places] of Object.entries(placesByCity)) {
      for (const name of places) allPlaces.push({ name, city })
    }
    if (!allPlaces.length) return

    // Fetch coords dynamically — DB cache first, Google fallback
    fetch('/api/place-coords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ places: allPlaces }),
    })
      .then(r => r.json())
      .then(({ coords }: { coords: Record<string, { lat: number; lng: number }> }) => {
        const pins: { name: string; coords: [number, number]; city: string }[] = []
        for (const [city, places] of Object.entries(placesByCity)) {
          const cityCenter: [number, number] = CITY_COORDS[city] || [0, 0]
          for (const name of places) {
            const c = coords[name]
            pins.push({ name, coords: c ? [c.lat, c.lng] : cityCenter, city })
          }
        }
        if (pins.length) renderMap(pins)
      })
      .catch(() => {
        // Fallback to static coords if API fails
        const pins: { name: string; coords: [number, number]; city: string }[] = []
        for (const [city, places] of Object.entries(placesByCity)) {
          const cityCenter: [number, number] = CITY_COORDS[city] || [0, 0]
          for (const name of places) {
            pins.push({ name, coords: (PLACE_COORDS[name] || cityCenter) as [number, number], city })
          }
        }
        if (pins.length) renderMap(pins)
      })

    function renderMap(pins: { name: string; coords: [number, number]; city: string }[]) {

    function initMap(google: any) {
      if (!mapRef.current) return

      // Clear old markers
      markersRef.current.forEach(m => m.setMap(null))
      markersRef.current = []
      Object.values(brandMarkersRef.current).flat().forEach((m: any) => m.setMap(null))
      brandMarkersRef.current = {}

      const avgLat = pins.reduce((s, p) => s + p.coords[0], 0) / pins.length
      const avgLng = pins.reduce((s, p) => s + p.coords[1], 0) / pins.length

      // Strip InfoWindow default chrome
      if (!document.getElementById('gm-iw-style')) {
        const s = document.createElement('style')
        s.id = 'gm-iw-style'
        s.textContent = `.gm-style-iw{padding:0!important;box-shadow:0 2px 12px rgba(0,0,0,.18)!important;border-radius:8px!important}.gm-style-iw-d{overflow:hidden!important;padding:0!important}.gm-style-iw-ch{display:none!important}.gm-ui-hover-effect{display:none!important}.gm-style-iw-tc::after{display:none!important}`
        document.head.appendChild(s)
      }

      if (!mapInstance.current) {
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: avgLat, lng: avgLng },
          zoom: 12,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
      } else {
        mapInstance.current.setCenter({ lat: avgLat, lng: avgLng })
      }

      const hoverWindow = new google.maps.InfoWindow({ disableAutoPan: true })

      // Draw Google Maps-style pin on canvas: red teardrop + dark red inner circle
      const pinCanvas = document.createElement('canvas')
      const W = 28, H = 40
      pinCanvas.width = W; pinCanvas.height = H
      const pc = pinCanvas.getContext('2d')!
      const cx = W / 2, r = W / 2 - 1.5

      pc.beginPath()
      pc.arc(cx, r + 2, r, Math.PI, 0)
      pc.bezierCurveTo(cx + r, r + 2 + r * 0.75, cx + 2.5, H - 4, cx, H - 1)
      pc.bezierCurveTo(cx - 2.5, H - 4, cx - r, r + 2 + r * 0.75, cx - r, r + 2)
      pc.closePath()
      pc.fillStyle = '#E53935'
      pc.fill()
      pc.strokeStyle = '#fff'
      pc.lineWidth = 1.5
      pc.stroke()

      // Dark red inner circle
      pc.beginPath()
      pc.arc(cx, r + 2, r * 0.44, 0, Math.PI * 2)
      pc.fillStyle = '#9B1515'
      pc.fill()

      const pinIconUrl = pinCanvas.toDataURL()

      pins.forEach(pin => {
        const marker = new google.maps.Marker({
          position: { lat: pin.coords[0], lng: pin.coords[1] },
          map: mapInstance.current,
          title: pin.name,
          icon: {
            url: pinIconUrl,
            scaledSize: new google.maps.Size(W, H),
            anchor: new google.maps.Point(cx, H - 1),
          },
        })
        marker.addListener('mouseover', () => {
          const img = photoMap[pin.name]
          const content = `
            <div style="background:#fff;border-radius:8px;overflow:hidden;width:160px">
              ${img ? `<img src="${img}" alt="" style="width:160px;height:100px;object-fit:cover;object-position:center 30%;display:block" />` : ''}
              <div style="padding:6px 8px;font-size:12px;font-weight:700;color:#111">${pin.name}</div>
            </div>`
          hoverWindow.setContent(content)
          hoverWindow.open(mapInstance.current, marker)
        })
        marker.addListener('mouseout', () => hoverWindow.close())
        markersRef.current.push(marker)
      })

      // Hotel markers — per brand, using brand logo icons
      if (hotels.length > 0) {
        const brandGroups: Record<string, typeof hotels> = {}
        hotels.forEach(h => {
          if (!brandGroups[h.brand]) brandGroups[h.brand] = []
          brandGroups[h.brand].push(h)
        })

        function makeBrandIcon(brand: string): Promise<string> {
          return new Promise(resolve => {
            const S = 40
            const cv = document.createElement('canvas')
            cv.width = S; cv.height = S
            const ctx = cv.getContext('2d')!
            const drawCircle = () => {
              ctx.beginPath(); ctx.arc(S/2, S/2, S/2 - 1, 0, Math.PI * 2)
              ctx.fillStyle = '#fff'; ctx.fill()
            }
            const pad = 6
            const logoPath = (BRAND_LOGOS as Record<string,string>)[brand]
            if (logoPath) {
              const img = new Image()
              img.onload = () => { drawCircle(); ctx.drawImage(img, pad, pad, S - pad * 2, S - pad * 2); resolve(cv.toDataURL()) }
              img.onerror = () => { drawCircle(); ctx.fillStyle = '#1565C0'; ctx.font = `bold ${Math.round(S * 0.38)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((BRAND_INITIALS as Record<string,string>)[brand] || brand[0].toUpperCase(), S/2, S/2); resolve(cv.toDataURL()) }
              img.src = logoPath
            } else {
              drawCircle(); ctx.fillStyle = '#1565C0'; ctx.font = `bold ${Math.round(S * 0.38)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(brand[0].toUpperCase(), S/2, S/2); resolve(cv.toDataURL())
            }
          })
        }

        Promise.all([
          fetch('/api/place-coords', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ places: hotels.map(h => ({ name: h.name, city: h.city })) }),
          }).then(r => r.json()),
          Promise.all(Object.keys(brandGroups).map(b => makeBrandIcon(b).then(url => [b, url] as [string, string])))
            .then(entries => Object.fromEntries(entries)),
        ]).then(([{ coords }, iconMap]: [{ coords: Record<string, { lat: number; lng: number }> }, Record<string, string>]) => {
          Object.values(brandMarkersRef.current).flat().forEach(m => m.setMap(null))
          brandMarkersRef.current = {}
          let hotelAdded = false
          for (const [brand, bHotels] of Object.entries(brandGroups)) {
            const visible = brandVisibility[brand] !== false
            const markers: any[] = []
            bHotels.forEach(h => {
              const c = (coords as Record<string, { lat: number; lng: number }>)[h.name]
              if (!c) return
              const hm = new google.maps.Marker({
                position: { lat: c.lat, lng: c.lng },
                map: visible ? mapInstance.current : null,
                title: h.name,
                icon: { url: iconMap[brand], scaledSize: new google.maps.Size(36, 36), anchor: new google.maps.Point(18, 18) },
                zIndex: 10,
              })
              hm.addListener('mouseover', () => {
                hoverWindow.setContent(`<div style="background:#fff;border-radius:8px;overflow:hidden;width:160px"><div style="padding:8px 10px 4px;font-size:12px;font-weight:700;color:#111">${h.name}</div><div style="padding:0 10px 8px;font-size:10px;color:#888">${h.city}</div></div>`)
                hoverWindow.open(mapInstance.current, hm)
              })
              hm.addListener('mouseout', () => hoverWindow.close())
              markers.push(hm)
              mapBounds.extend({ lat: c.lat, lng: c.lng })
              hotelAdded = true
            })
            brandMarkersRef.current[brand] = markers
          }
          if (hotelAdded) mapInstance.current.fitBounds(mapBounds, 48)
        }).catch(() => {})
      }

      const mapBounds = new google.maps.LatLngBounds()
      if (pins.length > 1) {
        pins.forEach(p => mapBounds.extend({ lat: p.coords[0], lng: p.coords[1] }))
        mapInstance.current.fitBounds(mapBounds, 48)
      }
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    if ((window as any).google?.maps) {
      initMap((window as any).google)
    } else if (!document.getElementById('gmaps-script')) {
      const script = document.createElement('script')
      script.id = 'gmaps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
      script.onload = () => initMap((window as any).google)
      document.head.appendChild(script)
    } else {
      // Script already loading — poll until ready
      const interval = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(interval)
          initMap((window as any).google)
        }
      }, 100)
      setTimeout(() => clearInterval(interval), 10000)
    }
    } // close renderMap
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey])

  // Sync brand visibility changes to markers without re-rendering
  useEffect(() => {
    if (!mapInstance.current) return
    for (const [brand, markers] of Object.entries(brandMarkersRef.current)) {
      const visible = brandVisibility[brand] !== false
      markers.forEach(m => m.setMap(visible ? mapInstance.current : null))
    }
  }, [brandVisibility])

  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid var(--border)', height:380, position:'relative' }}>
      <div ref={mapRef} style={{ height:'100%', width:'100%' }} />
    </div>
  )
}

// ── WeatherWidget (self-contained, uses DOM IDs) ──────────────────────────────
function WeatherWidget({ city }: { city: string }) {
  useEffect(() => {
    if (!city) return
    async function load() {
      try {
        const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`).then(r => r.json())
        if (!geo.length) return
        const { lat, lon } = geo[0]
        const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,precipitation_probability,relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=celsius&timezone=auto&forecast_days=7`).then(r => r.json())
        const cur = wx.current
        const el = (id: string) => document.getElementById(id)
        const loc = el('h-wx-loc'); if (loc) loc.textContent = `📍 ${geo[0].display_name.split(',')[0]}`
        const tmp = el('h-wx-tmp'); if (tmp) tmp.textContent = `${Math.round(cur.temperature_2m)}°`
        const cnd = el('h-wx-cnd'); if (cnd) cnd.textContent = WX_DESC[cur.weathercode] ?? 'Fair'
        const pills = el('h-wx-pills')
        if (pills) pills.innerHTML = `<span class="w-pill">Wind ${Math.round(cur.windspeed_10m)} km/h</span><span class="w-pill">Rain ${cur.precipitation_probability ?? '--'}%</span><span class="w-pill">Humid ${cur.relativehumidity_2m}%</span>`
        const today = new Date().toISOString().slice(0,10)
        const days = el('h-wx-days')
        if (days) days.innerHTML = (wx.daily.time ?? []).map((t: string, i: number) => {
          const dn = new Date(t+'T00:00').toLocaleDateString('en',{month:'short',day:'numeric'})
          return `<div class="wx-day${t===today?' today':''}"><div class="wx-day-name">${t===today?'Today':dn}</div><div class="wx-day-icon">${WX_ICONS[wx.daily.weathercode[i]]??'🌡'}</div><div class="wx-day-hi">${Math.round(wx.daily.temperature_2m_max[i])}°</div><div class="wx-day-lo">${Math.round(wx.daily.temperature_2m_min[i])}°</div><div class="wx-day-rain">${wx.daily.precipitation_probability_max[i]??0}%</div></div>`
        }).join('')
      } catch { /* silent */ }
    }
    load()
  }, [city])

  return (
    <div className="weather-full card" style={{ marginBottom: 20 }}>
      <div className="wx-top-row">
        <div className="wx-current">
          <div className="weather-loc" id="h-wx-loc">📍 Loading…</div>
          <div className="weather-temp-big" id="h-wx-tmp">--°</div>
          <div className="weather-cond" id="h-wx-cnd">Fetching weather</div>
          <div className="wx-now-pills" id="h-wx-pills">
            <span className="w-pill">Wind --</span>
            <span className="w-pill">Rain --</span>
            <span className="w-pill">Humid --</span>
          </div>
        </div>
        <div className="wx-forecast">
          <div className="wx-days" id="h-wx-days" />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GuestHomePage() {
  const [data,        setData]        = useState<OnboardingData | null>(null)
  const [itinerary,   setItinerary]   = useState<CitySection[]>([])
  const [photoMap,          setPhotoMap]          = useState<Record<string, string>>({})
  const [hotelPhotoMap,     setHotelPhotoMap]     = useState<Record<string, string>>({})
  const [brandVisibility,       setBrandVisibility]       = useState<Record<string, boolean>>({})
  const [hotelMapsUrls,         setHotelMapsUrls]         = useState<Record<string, string>>({})
  // Results from /api/hotel-search (Google Places nearbySearch — geo-locked to cluster)
  const [googleLoyaltyHotels,   setGoogleLoyaltyHotels]   = useState<{ brand: string; city: string; hotels: HotelSuggestion[] }[]>([])
  const [googleBudgetHotels,    setGoogleBudgetHotels]     = useState<{ city: string; hotels: HotelSuggestion[] }[]>([])
  const [hotelsLoading,         setHotelsLoading]          = useState(false)
  const [hotelSortByPrice,      setHotelSortByPrice]       = useState(false)
  const [tooltip,     setTooltip]     = useState<Tooltip | null>(null)
  const [addingTo,    setAddingTo]    = useState<{ si: number; di: number } | null>(null)
  const [addVal,      setAddVal]      = useState('')
  const [activeDay,   setActiveDay]   = useState(1)
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // Auth + DB state
  const [isLoggedIn,  setIsLoggedIn]  = useState(false)
  const [userName,    setUserName]    = useState<string | null>(null)
  const [tripId,      setTripId]      = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [saveStatus,  setSaveStatus]  = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load place photos
  const loadPhotos = useCallback((od: OnboardingData) => {
    const cities = Object.keys(od.placesByCity || {})
    if (!cities.length && od.destination) cities.push(od.destination)
    Promise.all(cities.map(city =>
      fetch(`/api/places?country=${encodeURIComponent(city)}`)
        .then(r => r.json()).then(d => (d.places || []) as {name:string;image:string}[])
        .catch(() => [] as {name:string;image:string}[])
    )).then(results => {
      const map: Record<string, string> = {}
      results.flat().forEach(p => { if (p.name && p.image) map[p.name] = p.image })
      setPhotoMap(map)
    })
  }, [])

  // Load hotel photos dynamically from Google Places API (cached in DB)
  const loadHotelPhotos = useCallback((hotels: { name: string; city: string }[]) => {
    if (!hotels.length) return
    fetch('/api/hotel-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotels }),
    })
      .then(r => r.json())
      .then(({ photos }: { photos: Record<string, string> }) => {
        // Deduplicate: if two hotels share the same photo URL, discard all but the first
        const seenUrls = new Set<string>()
        const deduped: Record<string, string> = {}
        for (const [name, url] of Object.entries(photos)) {
          if (!seenUrls.has(url)) { seenUrls.add(url); deduped[name] = url }
        }
        setHotelPhotoMap(prev => ({ ...prev, ...deduped }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    async function init() {
      // ── 1. Check auth status and latest trip from DB ──────────────────────
      try {
        const res = await fetch('/api/me/trip')
        const json = await res.json() as {
          loggedIn: boolean
          trip: null | {
            id: string; destination: string; startDate: string; endDate: string;
            tripMeta: OnboardingData | null
          }
          userName: string | null
        }

        if (json.loggedIn) {
          setIsLoggedIn(true)
          setUserName(json.userName)

          if (!json.trip) {
            // Logged in but no trips — show preview if onboarding data exists in
            // localStorage (user just completed onboarding but hasn't saved yet).
            // Only redirect to /plan when there is truly no data to show, and use
            // replace() so this intermediate page doesn't pollute the back-button
            // history stack.
            const localRaw = localStorage.getItem('tripzync_onboarding')
            if (!localRaw) {
              window.location.replace('/plan')
              return
            }
            // Fall through to the localStorage path below so the trip preview
            // renders correctly for the authenticated user.
          } else {
            // Logged in with a saved trip → load from DB
            setTripId(json.trip.id)
            const meta = json.trip.tripMeta ?? {}
            const enriched: OnboardingData = {
              ...meta,
              startDate:   json.trip.startDate,
              endDate:     json.trip.endDate,
              destination: json.trip.destination,
            }
            setData(enriched)
            const it = buildItinerary(enriched)
            setItinerary(it)
            if (it.length > 0) setActiveDay(it[0].days[0]?.dayNumber ?? 1)
            loadPhotos(enriched)
            return
          }
        }
      } catch { /* not logged in or network error — fall through to localStorage */ }

      // ── 2. Guest mode — read from localStorage ────────────────────────────
      const raw = localStorage.getItem('tripzync_onboarding')
      if (!raw) return
      try {
        const parsed = JSON.parse(raw) as OnboardingData
        setData(parsed)
        const it = buildItinerary(parsed)
        setItinerary(it)
        if (it.length > 0) setActiveDay(it[0].days[0]?.dayNumber ?? 1)
        loadPhotos(parsed)
      } catch { /* ignore */ }
    }
    init()
  }, [loadPhotos])

  // ── Edit helpers ────────────────────────────────────────────────────────────
  const removePlace = (si: number, di: number, place: string) =>
    setItinerary(prev => prev.map((sec, s) => s !== si ? sec : {
      ...sec, days: sec.days.map((day, d) => d !== di ? day : {
        ...day, places: day.places.filter(p => p !== place) })
    }))

  const addPlace = (si: number, di: number) => {
    const name = addVal.trim(); if (!name) return
    setItinerary(prev => prev.map((sec, s) => s !== si ? sec : {
      ...sec, days: sec.days.map((day, d) => d !== di ? day : {
        ...day, places: [...day.places, name] })
    }))
    setAddVal(''); setAddingTo(null)
  }

  const removeDay = (si: number, dayNum: number) => {
    const allDays = itinerary.flatMap(s => s.days)
    const idx = allDays.findIndex(d => d.dayNumber === dayNum)
    const next = allDays[idx - 1] ?? allDays[idx + 1]
    if (next) setActiveDay(next.dayNumber)
    setItinerary(prev => prev.map((sec, s) => s !== si ? sec : {
      ...sec, days: sec.days.filter(d => d.dayNumber !== dayNum) }))
  }

  const addDay = (si: number) => {
    setItinerary(prev => prev.map((sec, s) => {
      if (s !== si) return sec
      const last = sec.days[sec.days.length - 1]
      const num = last ? last.dayNumber + 1 : sec.startDay
      const sd = data?.startDate || data?.pendingTrip?.startDate || ''
      const newDay: DayBlock = { dayNumber: num, date: sd ? shiftDate(sd, num - 1) : `Day ${num}`, places: [] }
      return { ...sec, days: [...sec.days, newDay] }
    }))
  }

  const scrollToDay = (dayNum: number) => {
    setActiveDay(dayNum)
    setTimeout(() => {
      dayRefs.current[dayNum]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }

  // ── Save trip to DB ─────────────────────────────────────────────────────────
  const handleSaveTrip = async () => {
    if (!data || saving) return
    setSaving(true)
    setSaveStatus('saving')
    try {
      // Reconstruct placesByCity from the current (possibly edited) itinerary
      const currentPlacesByCity: Record<string, string[]> = {}
      for (const sec of itinerary) {
        currentPlacesByCity[sec.city] = sec.days.flatMap(d => d.places)
      }
      const metaToSave: OnboardingData = { ...data, placesByCity: currentPlacesByCity }
      const result = await saveTrip(tripId, metaToSave, itinerary)
      setTripId(result.tripId)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (e) {
      console.error('Save trip failed:', e)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const itineraryPlacesByCity = itinerary.reduce<Record<string, string[]>>((acc, sec) => {
    const places = sec.days.flatMap(d => d.places).filter(Boolean)
    if (places.length > 0) acc[sec.city] = places
    return acc
  }, {})

  const destination = data?.destination || data?.cities?.[0] || data?.countries?.[0] || 'Your Trip'
  const destWords   = destination.toUpperCase().split(' ')
  const startDateStr = data?.startDate || data?.pendingTrip?.startDate
  const endDateStr   = data?.endDate   || data?.pendingTrip?.endDate
  const totalDays   = computeTotalDays(startDateStr, endDateStr)
  const year        = startDateStr ? new Date(startDateStr).getFullYear() : new Date().getFullYear()
  const allDays     = itinerary.flatMap(s => s.days)
  const hotelNames      = (data?.hotels || []).filter(h => h && h !== 'none').map(h => HOTEL_NAMES[h] || h)
  const hotelBrands     = (data?.hotels || []).filter(h => h && h !== 'none')
  const noMembership    = hotelBrands.length === 0
  const tripCities      = Object.keys(data?.placesByCity || {}).filter(c => (data?.placesByCity?.[c]?.length ?? 0) > 0)
  const suggestCities   = tripCities.length > 0 ? tripCities : (data?.cities || [data?.destination || '']).filter(Boolean)

  // Calculate centroid of selected places for proximity ranking
  const allPlaceCoords = tripCities.flatMap(city =>
    (data?.placesByCity?.[city] || []).map(p =>
      (PLACE_COORDS[p] || CITY_COORDS[city] || [0, 0]) as [number, number]
    )
  )
  const tripCentroid = centroid(allPlaceCoords)

  // Hotels come from /api/hotel-search (Google Places searchNearby) — not the static HOTEL_DB.
  // mapHotels is used only for map pins and uses the already-fetched Google results.
  const mapHotels: { name: string; city: string; brand: string }[] = [
    ...googleLoyaltyHotels.flatMap(({ brand, city, hotels }) =>
      hotels.map(h => ({ name: h.name, city, brand }))
    ),
    ...googleBudgetHotels.flatMap(({ city, hotels }) =>
      hotels.map(h => ({ name: h.name, city, brand: 'budget' }))
    ),
  ]

  // Fetch real nearby hotels from Google Places whenever selected places or brands change.
  // The geo-boundary is enforced at the searchNearby API level — no post-processing filter needed.
  useEffect(() => {
    if (!suggestCities.length) {
      setGoogleLoyaltyHotels([])
      setGoogleBudgetHotels([])
      return
    }

    // Per-city cluster: center = centroid of selected places, radius = spread + 15 km buffer
    const MIN_RADIUS_KM = 20
    const BUFFER_KM = 15
    const clusters = suggestCities.flatMap(city => {
      const cityPlaceCoords = (data?.placesByCity?.[city] || [])
        .map(p => PLACE_COORDS[p] || CITY_COORDS[city])
        .filter(Boolean) as [number, number][]

      const cityCenter: [number, number] | null = cityPlaceCoords.length > 0
        ? centroid(cityPlaceCoords)
        : (CITY_COORDS[city] ?? null)

      if (!cityCenter || (cityCenter[0] === 0 && cityCenter[1] === 0)) return []

      const maxDistKm = cityPlaceCoords.length > 1
        ? Math.max(...cityPlaceCoords.map(c => haversineKm(cityCenter, c)))
        : 0
      const radiusKm = Math.max(MIN_RADIUS_KM, maxDistKm + BUFFER_KM)

      return [{ city, lat: cityCenter[0], lng: cityCenter[1], radiusMeters: radiusKm * 1000 }]
    })

    if (!clusters.length) return

    setHotelsLoading(true)
    fetch('/api/hotel-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clusters, brands: hotelBrands }),
    })
      .then(r => r.json())
      .then(({ loyalty, budget, mapsUrls }: {
        loyalty:  { brand: string; city: string; hotels: HotelSuggestion[] }[]
        budget:   { city: string; hotels: HotelSuggestion[] }[]
        mapsUrls: Record<string, string>
      }) => {
        setGoogleLoyaltyHotels(loyalty)
        // Only surface budget picks when the user has no loyalty programme
        setGoogleBudgetHotels(noMembership ? budget : [])
        setHotelMapsUrls(mapsUrls)

        // Trigger photo fetch for all returned hotels
        const budgetForPhotos = noMembership ? budget : []
        const allHotels = [
          ...loyalty.flatMap(({ city, hotels }) => hotels.map(h => ({ name: h.name, city }))),
          ...budgetForPhotos.flatMap(({ city, hotels }) => hotels.map(h => ({ name: h.name, city }))),
        ]
        if (allHotels.length) loadHotelPhotos(allHotels)
      })
      .catch((err) => {
        console.error('[hotel-search] client fetch error:', err)
        setGoogleLoyaltyHotels([])
        setGoogleBudgetHotels([])
      })
      .finally(() => setHotelsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestCities.join(','), allPlaceCoords.map(c => c.join(',')).join('|'), hotelBrands.join(',')])

  // city for weather — first city or first selected country
  const weatherCity = data?.cities?.[0] || data?.countries?.[0] || destination

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff' }}>

      {/* Nav */}
      <nav className="ob-nav">
        <TripZyncLogo href="/" />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: '.14em', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>
                {userName ?? 'Account'}
              </span>
              <a href="/dashboard" className="ob-nav-link">Dashboard</a>
            </>
          ) : (
            <>
              <a href="/plan" className="ob-nav-link">← Back</a>
              <a href="/login" className="ob-nav-link" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Sign In</a>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      <div className="page-inner" style={{ paddingTop: 64 }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className="sidebar">
          <header className="hero">
            <div className="hero-title-wrap">
              <div className="hero-title">{destWords[0]}</div>
              <div className="hero-title"><em className="em">{destWords.slice(1).join(' ') || String(year)}</em></div>
            </div>

            <div style={{ display:'inline-block', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:3, color: isLoggedIn ? '#3ecf78' : 'var(--accent)', textTransform:'uppercase', background: isLoggedIn ? 'rgba(62,207,120,.08)' : 'rgba(64,224,208,.08)', border: `1px solid ${isLoggedIn ? 'rgba(62,207,120,.25)' : 'rgba(64,224,208,.2)'}`, borderRadius:6, padding:'4px 10px', marginBottom:14 }}>
              {isLoggedIn ? (tripId ? '✓ Saved to Dashboard' : 'Logged In · Unsaved') : 'Guest Mode · Draft'}
            </div>

            <div className="hero-meta">
              <div className="meta-item">
                <span className="meta-label">Destination</span>
                <span className="meta-val">{destination}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-val">{totalDays} Days</span>
              </div>
              {startDateStr && endDateStr && (
                <div className="meta-item">
                  <span className="meta-label">Dates</span>
                  <span className="meta-val">{fmtDateLabel(startDateStr)} – {fmtDateLabel(endDateStr)}</span>
                </div>
              )}
            </div>
          </header>

          {/* City cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {itinerary.map((sec, si) => (
              <div key={sec.city} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', color:'#fff' }}>
                  {sec.city}
                </div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,.5)', marginTop:2 }}>
                  {sec.days.length} {sec.days.length === 1 ? 'day' : 'days'} · Day {sec.startDay}–{sec.startDay + sec.days.length - 1}
                </div>
                <div style={{ display:'flex', gap:6, marginTop:8 }}>
                  <button onClick={() => scrollToDay(sec.days[0]?.dayNumber ?? sec.startDay)}
                    style={{ flex:1, background:'var(--accent)', border:'none', borderRadius:6, padding:'5px 8px', color:'var(--bg)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                    Go →
                  </button>
                  <button onClick={() => addDay(si)}
                    style={{ flex:1, background:'var(--accent)', border:'none', borderRadius:6, padding:'5px 8px', color:'var(--bg)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                    + Day
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sign-up CTA / Dashboard link */}
          {isLoggedIn ? (
            <div style={{ background:'linear-gradient(135deg,rgba(62,207,120,.08),rgba(62,207,120,.03))', border:'1px solid rgba(62,207,120,.2)', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'#fff', marginBottom:6 }}>Your Trips</div>
              <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:'rgba(255,255,255,.7)', marginBottom:14 }}>
                View all your saved trips and plans in the dashboard.
              </p>
              <a href="/dashboard" style={{ display:'block', textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:3, textTransform:'uppercase', padding:'10px', background:'#3ecf78', color:'#0d0d0d', borderRadius:8, textDecoration:'none' }}>
                Go to Dashboard →
              </a>
            </div>
          ) : (
            <div style={{ background:'linear-gradient(135deg,rgba(64,224,208,.08),rgba(64,224,208,.03))', border:'1px solid rgba(64,224,208,.2)', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'#fff', marginBottom:6 }}>Save Your Plan</div>
              <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:'rgba(255,255,255,.7)', marginBottom:14 }}>
                Create a free account to keep this itinerary and access it anywhere.
              </p>
              <a href="/login" style={{ display:'block', textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:3, textTransform:'uppercase', padding:'10px', background:'var(--accent)', color:'var(--bg)', borderRadius:8, textDecoration:'none' }}>
                Sign Up Free →
              </a>
            </div>
          )}

          {/* ── HOTEL RECOMMENDATIONS (sidebar, under Save Your Plan) ──────── */}
          {hotelsLoading && (
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, color:'rgba(255,255,255,.35)', textTransform:'uppercase', textAlign:'center', padding:'12px 0' }}>
              Finding hotels near your route…
            </div>
          )}
          {!hotelsLoading && (googleLoyaltyHotels.length > 0 || googleBudgetHotels.length > 0) && (() => {
            // Sort hotels by travel time (default) or price (toggle)
            const extractPrice = (p: string) => parseInt(p.replace(/[^0-9]/g, '')) || 9999
            const sortHotels = (hotels: HotelSuggestion[]) =>
              [...hotels].sort((a, b) =>
                hotelSortByPrice
                  ? extractPrice(a.price) - extractPrice(b.price)
                  : (a.travelMins ?? 999) - (b.travelMins ?? 999)
              )

            const SortToggle = () => (
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={() => setHotelSortByPrice(false)}
                  style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:1, padding:'3px 9px', borderRadius:20, cursor:'pointer', border:'1px solid', transition:'all .2s',
                    background: !hotelSortByPrice ? 'rgba(64,224,208,.15)' : 'rgba(255,255,255,.05)',
                    borderColor: !hotelSortByPrice ? 'rgba(64,224,208,.4)' : 'rgba(255,255,255,.12)',
                    color: !hotelSortByPrice ? 'var(--accent)' : 'rgba(255,255,255,.3)',
                  }}>⏱ Time</button>
                <button onClick={() => setHotelSortByPrice(true)}
                  style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:1, padding:'3px 9px', borderRadius:20, cursor:'pointer', border:'1px solid', transition:'all .2s',
                    background: hotelSortByPrice ? 'rgba(255,201,71,.15)' : 'rgba(255,255,255,.05)',
                    borderColor: hotelSortByPrice ? 'rgba(255,201,71,.4)' : 'rgba(255,255,255,.12)',
                    color: hotelSortByPrice ? '#FFC947' : 'rgba(255,255,255,.3)',
                  }}>💰 Price</button>
              </div>
            )

            // Show budget picks only when user explicitly has no loyalty programme
            const showBudgetMode = noMembership
            if (showBudgetMode) {
              // Budget picks from Google Places
              return (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'rgba(255,255,255,.45)' }}>
                      Picks Near Your Route
                    </div>
                    <SortToggle />
                  </div>
                  {googleBudgetHotels.map(({ city, hotels }) => {
                    const sorted = sortHotels(hotels)
                    if (!sorted.length) return null
                    return (
                    <div key={city} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                      <div style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,.6)' }}>
                        📍 {city}
                      </div>
                      {sorted.map(h => (
                        <div key={h.name} style={{ borderTop:'1px solid var(--border)' }}>
                          <div style={{ position:'relative', width:'100%', height:100, overflow:'hidden', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f2447 100%)' }}>
                            <img
                              key={hotelPhotoMap[h.name] || 'static'}
                              src={hotelPhotoMap[h.name] || getHotelPhoto(h.name, h.tier)}
                              alt={h.name}
                              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                              onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.opacity='0' }}
                            />
                            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(7,8,15,.85) 0%, transparent 60%)' }} />
                            <div style={{ position:'absolute', bottom:6, right:8, color:'#FFC947', fontSize:9, letterSpacing:1 }}>
                              {'★'.repeat(h.stars)}
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px' }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>{h.name}</div>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, letterSpacing:1, textTransform:'uppercase', color:'rgba(255,255,255,.5)' }}>{h.tier}</span>
                                {h.travelMins !== undefined && (
                                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:'rgba(64,224,208,.8)', background:'rgba(64,224,208,.08)', border:'1px solid rgba(64,224,208,.2)', borderRadius:10, padding:'1px 6px' }}>
                                    ~{h.travelMins} min
                                  </span>
                                )}
                                {hotelMapsUrls[h.name] && (
                                  <a href={hotelMapsUrls[h.name]} target="_blank" rel="noopener noreferrer"
                                    style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:8, letterSpacing:1, textTransform:'uppercase', color:'#4A9EFF', textDecoration:'none', background:'rgba(74,158,255,.1)', border:'1px solid rgba(74,158,255,.25)', borderRadius:10, padding:'1px 6px' }}>
                                    📍 Maps
                                  </a>
                                )}
                              </div>
                            </div>
                            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>{h.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )})}
                </div>
              )
            }
            // Loyalty brand hotels — grouped by brand from Google Places results
            const byBrand: Record<string, { city: string; hotels: HotelSuggestion[] }[]> = {}
            googleLoyaltyHotels.forEach(({ brand, city, hotels }) => {
              if (!byBrand[brand]) byBrand[brand] = []
              byBrand[brand].push({ city, hotels })
            })
            return (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'rgba(255,255,255,.45)' }}>
                    Your Loyalty Hotels
                  </div>
                  <SortToggle />
                </div>
                {Object.entries(byBrand).map(([brand, cityGroups]) => (
                  <div key={brand} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                        <img src={BRAND_LOGOS[brand] || ''} alt={HOTEL_NAMES[brand]}
                          style={{ width:28, height:28, objectFit:'contain' }}
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).style.display='none'
                            const fb = e.currentTarget.nextSibling as HTMLElement
                            if (fb) fb.style.display='flex'
                          }} />
                        <span style={{ display:'none', width:28, height:28, alignItems:'center', justifyContent:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:900, color:'#555', letterSpacing:1 }}>
                          {BRAND_INITIALS[brand] || brand[0].toUpperCase()}
                        </span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, letterSpacing:2, textTransform:'uppercase', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{HOTEL_NAMES[brand]}</div>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:1, color:'rgba(255,255,255,.4)', marginTop:2 }}>{cityGroups.reduce((s,g)=>s+g.hotels.length,0)} properties</div>
                      </div>
                      <button
                        onClick={() => setBrandVisibility(prev => ({ ...prev, [brand]: prev[brand] === false ? true : false }))}
                        style={{
                          display:'flex', alignItems:'center', gap:4, flexShrink:0,
                          background: brandVisibility[brand] !== false ? 'rgba(255,201,71,.12)' : 'rgba(255,255,255,.06)',
                          border: `1px solid ${brandVisibility[brand] !== false ? 'rgba(255,201,71,.3)' : 'rgba(255,255,255,.12)'}`,
                          borderRadius:20, padding:'3px 10px', cursor:'pointer',
                          fontFamily:"'Barlow Condensed',sans-serif", fontSize:8, fontWeight:700,
                          letterSpacing:2, textTransform:'uppercase',
                          color: brandVisibility[brand] !== false ? '#FFC947' : 'rgba(255,255,255,.3)',
                          transition:'all .2s',
                        }}
                      >
                        {brandVisibility[brand] !== false ? 'Show' : 'Hide'}
                      </button>
                    </div>
                    {cityGroups.map(({ city, hotels }) => {
                      const sorted = sortHotels(hotels)
                      if (!sorted.length) return null
                      return (
                      <div key={city}>
                        {cityGroups.length > 1 && (
                          <div style={{ padding:'6px 14px 0', fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,.4)' }}>{city}</div>
                        )}
                        {sorted.map(h => (
                          <div key={h.name} style={{ borderTop:'1px solid var(--border)' }}>
                            <div style={{ position:'relative', width:'100%', height:100, overflow:'hidden', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f2447 100%)' }}>
                              <img
                                key={hotelPhotoMap[h.name] || 'static'}
                                src={hotelPhotoMap[h.name] || getHotelPhoto(h.name, h.tier)}
                                alt={h.name}
                                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                                onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.opacity='0' }}
                              />
                              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(7,8,15,.85) 0%, transparent 60%)' }} />
                              <div style={{ position:'absolute', bottom:6, right:8, color:'#FFC947', fontSize:9, letterSpacing:1 }}>
                                {'★'.repeat(h.stars)}
                              </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px' }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>{h.name}</div>
                                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, letterSpacing:1, textTransform:'uppercase', color:'rgba(255,255,255,.5)' }}>{h.tier}</span>
                                  {h.travelMins !== undefined && (
                                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:'rgba(64,224,208,.8)', background:'rgba(64,224,208,.08)', border:'1px solid rgba(64,224,208,.2)', borderRadius:10, padding:'1px 6px' }}>
                                      ~{h.travelMins} min
                                    </span>
                                  )}
                                  {hotelMapsUrls[h.name] && (
                                    <a href={hotelMapsUrls[h.name]} target="_blank" rel="noopener noreferrer"
                                      style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:8, letterSpacing:1, textTransform:'uppercase', color:'#4A9EFF', textDecoration:'none', background:'rgba(74,158,255,.1)', border:'1px solid rgba(74,158,255,.25)', borderRadius:10, padding:'1px 6px' }}>
                                      📍 Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>{h.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      )
                    })}
                    <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)' }}>
                      <a href="/login" style={{ display:'block', textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', padding:'8px', background:'var(--accent)', color:'var(--bg)', borderRadius:6, textDecoration:'none' }}>
                        Sign In to Book →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

        </aside>

        {/* ── MAIN COLUMN ─────────────────────────────────────────────────── */}
        <main className="main-col">

          {/* Weather */}
          <WeatherWidget city={weatherCity} />

          {/* Section header + Save Trip button */}
          <div className="section-head" style={{ marginTop:0 }}>
            <div className="section-line" />
            <span className="section-label">Trip Schedule</span>
            <div className="section-line" />
            {isLoggedIn && (
              <button
                onClick={handleSaveTrip}
                disabled={saving}
                style={{
                  flexShrink: 0,
                  background: saveStatus === 'saved' ? 'rgba(62,207,120,.15)' : saveStatus === 'error' ? 'rgba(247,110,110,.15)' : 'var(--red)',
                  border: saveStatus === 'saved' ? '1px solid rgba(62,207,120,.4)' : saveStatus === 'error' ? '1px solid rgba(247,110,110,.4)' : 'none',
                  borderRadius: 8,
                  padding: '6px 16px',
                  color: saveStatus === 'saved' ? '#3ecf78' : saveStatus === 'error' ? '#f76e6e' : '#fff',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  transition: 'all .2s',
                }}
              >
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error — retry' : tripId ? 'Update Trip' : 'Save Trip'}
              </button>
            )}
          </div>

          {/* Day tabs — show ~7 at a time, scroll for the rest */}
          <div style={{ overflowX: 'auto', maxWidth: 660, marginBottom: 16, scrollbarWidth: 'thin', scrollbarColor: 'var(--border2) transparent', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <div className="tabs-row" style={{ marginBottom: 0, width: 'max-content', maxWidth: 'none' }}>
              {allDays.map(day => (
                <button key={day.dayNumber}
                  className={`tab-btn${activeDay === day.dayNumber ? ' active' : ''}`}
                  style={{ minWidth: 88 }}
                  onClick={() => scrollToDay(day.dayNumber)}>
                  {day.date}
                </button>
              ))}
            </div>
          </div>

          {/* ── Bounded scrollable itinerary ─────────────────────────────── */}
          {itinerary.length > 0 ? (
            <div style={{ maxHeight:'62vh', overflowY:'auto', overflowX:'hidden', borderRadius:16, border:'1px solid var(--border)', scrollbarWidth:'thin', scrollbarColor:'var(--border2) transparent' }}>
              {itinerary.map((sec, si) => (
                <div key={sec.city}>
                  {/* City header */}
                  <div style={{ position:'sticky', top:0, zIndex:10, display:'flex', alignItems:'baseline', gap:12, padding:'12px 18px 10px', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', color:'#fff' }}>
                      {sec.city}
                    </span>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:3, textTransform:'uppercase', opacity:.7 }}>
                      {sec.days.length} {sec.days.length === 1 ? 'day' : 'days'}
                    </span>
                    <button onClick={() => addDay(si)} style={{ marginLeft:'auto', background:'var(--accent)', border:'none', borderRadius:6, padding:'4px 12px', color:'var(--bg)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                      + Add Day
                    </button>
                  </div>

                  {/* Day rows */}
                  {sec.days.map((day, di) => (
                    <div
                      key={day.dayNumber}
                      ref={el => { dayRefs.current[day.dayNumber] = el }}
                      style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', background: activeDay === day.dayNumber ? 'rgba(64,224,208,.04)' : 'transparent', transition:'background .2s' }}
                    >
                      {/* Day label row */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <div>
                          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, color:'#fff', textTransform:'uppercase' }}>
                            Day {day.dayNumber}
                          </span>
                          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, color:'rgba(255,255,255,.5)', marginLeft:8 }}>
                            {day.date}
                          </span>
                        </div>
                        <button onClick={() => removeDay(si, day.dayNumber)}
                          style={{ background:'none', border:'none', color:'rgba(255,100,100,.6)', cursor:'pointer', fontSize:12, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1, textTransform:'uppercase', padding:'2px 6px' }}>
                          Remove
                        </button>
                      </div>

                      {/* Place chips */}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom: (addingTo?.si === si && addingTo?.di === di) ? 10 : 0 }}>
                        {day.places.length === 0 && !(addingTo?.si === si && addingTo?.di === di) && (
                          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontStyle:'italic', opacity:.5 }}>
                            Free day — explore at your own pace
                          </span>
                        )}
                        {day.places.map(place => (
                          <div key={place}
                            style={{ position:'relative' }}
                            onMouseEnter={e => {
                              const img = photoMap[place]; if (!img) return
                              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              setTooltip({ name: place, image: img, x: r.left + r.width / 2, y: r.top - 10 })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:20, padding:'5px 10px 5px 6px', cursor:'default' }}>
                              {photoMap[place]
                                ? <img src={photoMap[place]} alt="" style={{ width:22, height:22, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'1px solid var(--border2)' }} />
                                : <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--border)', flexShrink:0 }} />
                              }
                              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:600, letterSpacing:.5 }}>{place}</span>
                              <button onClick={() => removePlace(si, di, place)}
                                style={{ background:'none', border:'none', color:'rgba(255,255,255,.5)', cursor:'pointer', fontSize:16, lineHeight:1, padding:'0 0 0 2px', display:'flex', alignItems:'center' }}>
                                ×
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Inline add button at end of chip row */}
                        {!(addingTo?.si === si && addingTo?.di === di) && (
                          <button onClick={() => { setAddingTo({ si, di }); setAddVal('') }}
                            style={{ background:'var(--accent)', border:'none', borderRadius:20, padding:'5px 12px', color:'var(--bg)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                            + Add
                          </button>
                        )}
                      </div>

                      {/* Add place input — inline below chips */}
                      {addingTo?.si === si && addingTo?.di === di && (
                        <div style={{ display:'flex', gap:8, marginTop:8 }}>
                          <input
                            autoFocus
                            value={addVal}
                            onChange={e => setAddVal(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') addPlace(si, di)
                              if (e.key === 'Escape') { setAddingTo(null); setAddVal('') }
                            }}
                            placeholder="Place name…"
                            style={{ flex:1, background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:8, padding:'7px 12px', color:'#fff', fontFamily:"'Rajdhani',sans-serif", fontSize:14, outline:'none' }}
                          />
                          <button onClick={() => addPlace(si, di)}
                            style={{ background:'var(--accent)', border:'none', borderRadius:8, padding:'7px 16px', color:'var(--bg)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                            Add
                          </button>
                          <button onClick={() => { setAddingTo(null); setAddVal('') }}
                            style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:8, padding:'7px 12px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, cursor:'pointer' }}>
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'48px 0', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:'uppercase', opacity:.5 }}>
              No trip data.{' '}
              <a href="/" style={{ color:'var(--accent)', textDecoration:'none' }}>Start planning →</a>
            </div>
          )}

          {/* ── City Map with place pins ─────────────────────────────────────────── */}
          {Object.keys(itineraryPlacesByCity).length > 0 && (
            <>
              <div className="section-head" style={{ marginTop: 28 }}>
                <div className="section-line" />
                <span className="section-label">City Map</span>
                <div className="section-line" />
              </div>
              <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:'rgba(255,255,255,.5)', marginBottom:14, marginTop:-6 }}>
                Pins show your selected places — clustered by location
              </p>
              <MapView placesByCity={itineraryPlacesByCity} photoMap={photoMap} hotels={mapHotels} brandVisibility={brandVisibility} />
            </>
          )}

        </main>
      </div>
      </div>

      {/* Photo tooltip flash card */}
      {tooltip && (
        <div style={{ position:'fixed', left:tooltip.x, top:tooltip.y, transform:'translate(-50%, -100%)', zIndex:9999, pointerEvents:'none', background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:12, overflow:'hidden', width:220, boxShadow:'0 12px 40px rgba(0,0,0,.8)' }}>
          <img src={tooltip.image} alt={tooltip.name} style={{ width:'100%', height:130, objectFit:'cover', display:'block' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
          <div style={{ padding:'8px 12px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>
            {tooltip.name}
          </div>
        </div>
      )}
    </div>
  )
}
