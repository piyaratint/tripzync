'use client'

import { useEffect, useState, useRef } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  continent?: string
  countries?: string[]
  cities?: string[]
  places?: string[]
  placesByCity?: Record<string, string[]>
  hotels?: string[]
  destination?: string
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

interface HotelSuggestion { name: string; tier: string; price: string; stars: number }
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
    'Los Angeles':      [{ name:'Andaz West Hollywood',                 tier:'Andaz',     price:'$300+/n', stars:4 },{ name:'Hyatt Regency Los Angeles International Airport', tier:'Regency', price:'$180+/n', stars:4 },{ name:'Grand Hyatt LAX',                  tier:'Grand Hyatt',price:'$200+/n',stars:4 }],
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
function getHotelSuggestions(brands: string[], cities: string[]): { brand: string; city: string; hotels: HotelSuggestion[] }[] {
  const results: { brand: string; city: string; hotels: HotelSuggestion[] }[] = []
  const seen = new Set<string>()

  for (const brand of brands) {
    const db = HOTEL_DB[brand]
    if (!db) continue

    for (const rawCity of cities) {
      if (!rawCity) continue
      // Try exact match first, then fuzzy (handles "Chiang Mai, Thailand" → "Chiang Mai")
      const exact = db[rawCity]
      if (exact?.length) {
        const key2 = `${brand}::${rawCity}`
        if (!seen.has(key2)) { seen.add(key2); results.push({ brand, city: rawCity, hotels: exact.slice(0, 3) }) }
        continue
      }
      // Fuzzy: normalise by stripping commas/country suffix and comparing
      const normalise = (s: string) => s.toLowerCase().split(',')[0].trim()
      const nc = normalise(rawCity)
      const dbKey = Object.keys(db).find(k => {
        const nk = normalise(k)
        return nk === nc || nk.includes(nc) || nc.includes(nk)
      })
      if (dbKey) {
        const key2 = `${brand}::${dbKey}`
        if (!seen.has(key2)) { seen.add(key2); results.push({ brand, city: dbKey, hotels: db[dbKey].slice(0, 3) }) }
      }
    }
  }
  return results
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
  const totalDays = computeTotalDays(data.pendingTrip?.startDate, data.pendingTrip?.endDate)
  const startDate = data.pendingTrip?.startDate || ''

  if (cities.length === 0) {
    const dest = data.destination || data.cities?.[0] || data.countries?.[0] || 'Your Destination'
    const all = data.places || []
    return [{ city: dest, startDay: 1, days: Array.from({ length: totalDays }, (_, d) => ({
      dayNumber: d + 1, date: startDate ? shiftDate(startDate, d) : `Day ${d+1}`,
      places: all.slice(d * 2, d * 2 + 2),
    }))}]
  }

  const totalPlaces = cities.reduce((s, c) => s + placesByCity[c].length, 0)
  const rawDays = cities.map(c => (placesByCity[c].length / totalPlaces) * totalDays)
  const floorDays = rawDays.map(d => Math.max(1, Math.floor(d)))
  const rem = totalDays - floorDays.reduce((s, d) => s + d, 0)
  rawDays.map((d, i) => ({ i, frac: d - Math.floor(d) }))
    .sort((a, b) => b.frac - a.frac).slice(0, rem).forEach(({ i }) => floorDays[i]++)

  const sections: CitySection[] = []
  let gDay = 1, gOff = 0
  cities.forEach((city, idx) => {
    const n = floorDays[idx]
    const cp = placesByCity[city]
    sections.push({ city, startDay: gDay, days: Array.from({ length: n }, (_, d) => ({
      dayNumber: gDay + d, date: startDate ? shiftDate(startDate, gOff + d) : `Day ${gDay+d}`,
      places: cp.slice(d * 2, d * 2 + 2),
    }))})
    gDay += n; gOff += n
  })
  return sections
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
  const [photoMap,    setPhotoMap]    = useState<Record<string, string>>({})
  const [tooltip,     setTooltip]     = useState<Tooltip | null>(null)
  const [addingTo,    setAddingTo]    = useState<{ si: number; di: number } | null>(null)
  const [addVal,      setAddVal]      = useState('')
  const [activeDay,   setActiveDay]   = useState(1)
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    const raw = localStorage.getItem('tripzync_onboarding')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as OnboardingData
      setData(parsed)
      const it = buildItinerary(parsed)
      setItinerary(it)
      if (it.length > 0) setActiveDay(it[0].days[0]?.dayNumber ?? 1)

      const cities = Object.keys(parsed.placesByCity || {})
      if (!cities.length && parsed.destination) cities.push(parsed.destination)
      Promise.all(cities.map(city =>
        fetch(`/api/places?country=${encodeURIComponent(city)}`)
          .then(r => r.json()).then(d => (d.places || []) as {name:string;image:string}[])
          .catch(() => [] as {name:string;image:string}[])
      )).then(results => {
        const map: Record<string, string> = {}
        results.flat().forEach(p => { if (p.name && p.image) map[p.name] = p.image })
        setPhotoMap(map)
      })
    } catch { /* ignore */ }
  }, [])

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
      const sd = data?.pendingTrip?.startDate || ''
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

  // ── Derived values ──────────────────────────────────────────────────────────
  const destination = data?.destination || data?.cities?.[0] || data?.countries?.[0] || 'Your Trip'
  const destWords   = destination.toUpperCase().split(' ')
  const totalDays   = computeTotalDays(data?.pendingTrip?.startDate, data?.pendingTrip?.endDate)
  const year        = data?.pendingTrip?.startDate ? new Date(data.pendingTrip.startDate).getFullYear() : new Date().getFullYear()
  const allDays     = itinerary.flatMap(s => s.days)
  const hotelNames      = (data?.hotels || []).filter(h => h && h !== 'none').map(h => HOTEL_NAMES[h] || h)
  const hotelBrands     = (data?.hotels || []).filter(h => h && h !== 'none')
  const tripCities      = Object.keys(data?.placesByCity || {}).filter(c => (data?.placesByCity?.[c]?.length ?? 0) > 0)
  const suggestCities   = tripCities.length > 0 ? tripCities : (data?.cities || [data?.destination || '']).filter(Boolean)
  // If user selected loyalty brands, show those — otherwise show all 5 brands as a discovery panel
  const allBrands       = ['marriott', 'hilton', 'hyatt', 'ihg', 'accor']
  const brandsToShow    = hotelBrands.length > 0 ? hotelBrands : allBrands
  const hotelSuggestions = getHotelSuggestions(brandsToShow, suggestCities)

  // city for weather — first city or first selected country
  const weatherCity = data?.cities?.[0] || data?.countries?.[0] || destination

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff' }}>

      {/* Nav */}
      <nav className="ob-nav">
        <a href="/" className="ob-nav-logo" style={{ textDecoration: 'none' }}>TRIPZYNC</a>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/plan" className="ob-nav-link">← Back</a>
          <a href="/login" className="ob-nav-link" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Sign In</a>
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

            <div style={{ display:'inline-block', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:3, color:'var(--accent)', textTransform:'uppercase', background:'rgba(64,224,208,.08)', border:'1px solid rgba(64,224,208,.2)', borderRadius:6, padding:'4px 10px', marginBottom:14 }}>
              Guest Mode · Draft
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
              {data?.pendingTrip?.startDate && data?.pendingTrip?.endDate && (
                <div className="meta-item">
                  <span className="meta-label">Dates</span>
                  <span className="meta-val">{fmtDateLabel(data.pendingTrip.startDate)} – {fmtDateLabel(data.pendingTrip.endDate)}</span>
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

          {/* Sign-up CTA */}
          <div style={{ background:'linear-gradient(135deg,rgba(64,224,208,.08),rgba(64,224,208,.03))', border:'1px solid rgba(64,224,208,.2)', borderRadius:12, padding:'18px 20px' }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'#fff', marginBottom:6 }}>Save Your Plan</div>
            <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:'rgba(255,255,255,.7)', marginBottom:14 }}>
              Create a free account to keep this itinerary and access it anywhere.
            </p>
            <a href="/login" style={{ display:'block', textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:3, textTransform:'uppercase', padding:'10px', background:'var(--accent)', color:'var(--bg)', borderRadius:8, textDecoration:'none' }}>
              Sign Up Free →
            </a>
          </div>

          {/* ── HOTEL RECOMMENDATIONS (sidebar, under Save Your Plan) ──────── */}
          {hotelSuggestions.length > 0 && (() => {
            const byBrand: Record<string, { city: string; hotels: HotelSuggestion[] }[]> = {}
            hotelSuggestions.forEach(({ brand, city, hotels }) => {
              if (!byBrand[brand]) byBrand[brand] = []
              byBrand[brand].push({ city, hotels })
            })
            return (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {/* Section label */}
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'rgba(255,255,255,.45)' }}>
                  {hotelBrands.length > 0 ? 'Your Loyalty Hotels' : 'Recommended Hotels'}
                </div>

                {Object.entries(byBrand).map(([brand, cityGroups]) => (
                  <div key={brand} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>

                    {/* Brand header */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                        <img src={BRAND_LOGOS[brand] || ''} alt={HOTEL_NAMES[brand]}
                          style={{ width:28, height:28, objectFit:'contain' }}
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none'
                            const fb = e.currentTarget.nextSibling as HTMLElement
                            if (fb) fb.style.display = 'flex'
                          }} />
                        <span style={{ display:'none', width:28, height:28, alignItems:'center', justifyContent:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:900, color:'#555', letterSpacing:1 }}>
                          {BRAND_INITIALS[brand] || brand[0].toUpperCase()}
                        </span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, letterSpacing:2, textTransform:'uppercase', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {HOTEL_NAMES[brand]}
                        </div>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:1, color:'rgba(255,255,255,.4)', marginTop:2 }}>
                          {cityGroups.reduce((s, g) => s + g.hotels.length, 0)} properties
                        </div>
                      </div>
                      {hotelBrands.includes(brand) && (
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:8, letterSpacing:2, textTransform:'uppercase', color:'#FFC947', background:'rgba(255,201,71,.12)', border:'1px solid rgba(255,201,71,.3)', borderRadius:20, padding:'2px 8px', flexShrink:0 }}>
                          ★ Loyalty
                        </span>
                      )}
                    </div>

                    {/* Hotels per city */}
                    {cityGroups.map(({ city, hotels }) => (
                      <div key={city}>
                        {cityGroups.length > 1 && (
                          <div style={{ padding:'6px 14px 0', fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,.4)' }}>
                            {city}
                          </div>
                        )}
                        {hotels.map((h) => (
                          <div key={h.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderTop:'1px solid var(--border)' }}>
                            {/* Stars square — fixed 36×36, stars wrap inside */}
                            <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,201,71,.08)', border:'1px solid rgba(255,201,71,.25)', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden', padding:2 }}>
                              {Array.from({ length: h.stars }).map((_, i) => (
                                <span key={i} style={{ fontSize:9, lineHeight:1, color:'#FFC947' }}>★</span>
                              ))}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>
                                {h.name}
                              </div>
                              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, letterSpacing:1, textTransform:'uppercase', color:'rgba(255,255,255,.5)', marginTop:3 }}>
                                {h.tier}
                              </div>
                            </div>
                            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'#fff', flexShrink:0, textAlign:'right' }}>
                              {h.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* CTA button */}
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

          {/* Section header */}
          <div className="section-head" style={{ marginTop:0 }}>
            <div className="section-line" />
            <span className="section-label">Trip Schedule</span>
            <div className="section-line" />
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
