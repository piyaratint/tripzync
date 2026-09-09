'use client'

import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { useMemo, useState, useEffect } from 'react'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ISO A3 → ISO numeric (used by world-atlas TopoJSON)
const ISO_NUM: Record<string, string> = {
  USA:'840',CAN:'124',MEX:'484',BRA:'076',ARG:'032',COL:'170',CHL:'152',PER:'604',
  ECU:'218',BOL:'068',VEN:'862',CUB:'192',JAM:'388',CRI:'188',PAN:'591',URY:'858',
  PRY:'600',GTM:'320',HND:'340',NIC:'558',SLV:'222',DOM:'214',HTI:'332',TTO:'780',
  GBR:'826',FRA:'250',DEU:'276',ITA:'380',ESP:'724',NLD:'528',CHE:'756',AUT:'040',
  PRT:'620',GRC:'300',NOR:'578',SWE:'752',DNK:'208',POL:'616',CZE:'203',FIN:'246',
  BEL:'056',IRL:'372',HUN:'348',ROU:'642',BGR:'100',HRV:'191',SVK:'703',SVN:'705',
  SRB:'688',RUS:'643',UKR:'804',BLR:'112',LTU:'440',LVA:'428',EST:'233',MDA:'498',
  ALB:'008',MKD:'807',BIH:'070',MNE:'499',LUX:'442',MLT:'470',ISL:'352',CYP:'196',
  ZAF:'710',EGY:'818',MAR:'504',KEN:'404',TZA:'834',NGA:'566',GHA:'288',ETH:'231',
  SEN:'686',RWA:'646',BWA:'072',ZWE:'716',MOZ:'508',MWI:'454',ZMB:'894',UGA:'800',
  TUN:'788',DZA:'012',AGO:'024',CMR:'120',CIV:'384',MLI:'466',BFA:'854',NAM:'516',
  MDG:'450',MUS:'480',ARE:'784',SAU:'682',TUR:'792',IRN:'364',JOR:'400',QAT:'634',
  KWT:'414',ISR:'376',LBN:'422',BHR:'048',OMN:'512',IRQ:'368',GEO:'268',ARM:'051',
  AZE:'031',JPN:'392',CHN:'156',IND:'356',THA:'764',IDN:'360',KOR:'410',VNM:'704',
  MYS:'458',SGP:'702',PHL:'608',KHM:'116',LKA:'144',NPL:'524',MMR:'104',LAO:'418',
  MNG:'496',BTN:'064',MDV:'462',KAZ:'398',UZB:'860',BGD:'050',PAK:'586',
  AUS:'036',NZL:'554',FJI:'242',PNG:'598',
  TJK:'762',KGZ:'417',TKM:'795',AND:'020',MCO:'492',SMR:'674',LIE:'438',GUY:'328',BLZ:'084',BRB:'052',LCA:'662',VCT:'670',GRD:'308',LSO:'426',SWZ:'748',LBY:'434',SDN:'729',SLB:'090',VUT:'548',WSM:'882',TON:'776',PLW:'585',FSM:'583',
}

// Country center + scale for zoom-in mode (>2 cities, single country)
// Centers are tuned to the densest city cluster for each country
const COUNTRY_ZOOM: Record<string, { center: [number, number]; scale: number }> = {
  JPN:{ center:[136.5,35],   scale:1600 },  // centred on Honshu (Tokyo/Osaka/Kyoto belt)
  CHN:{ center:[104,35],     scale:480  },
  IND:{ center:[78.9,20.6],  scale:650  },
  THA:{ center:[101,13],     scale:1400 },
  IDN:{ center:[118,-2.5],   scale:650  },
  KOR:{ center:[127.5,36.5], scale:2800 },
  VNM:{ center:[106,16],     scale:1800 },
  MYS:{ center:[109,3.5],    scale:1400 },
  SGP:{ center:[103.8,1.3],  scale:9000 },
  PHL:{ center:[122,12],     scale:1400 },
  KHM:{ center:[104.9,12.5], scale:3500 },
  LKA:{ center:[80.7,7.9],   scale:4000 },
  NPL:{ center:[84,28],      scale:4000 },
  MDV:{ center:[73.5,3.5],   scale:7000 },
  GBR:{ center:[-2,54],      scale:2500 },
  FRA:{ center:[2.5,46.2],   scale:2000 },
  DEU:{ center:[10.4,51.1],  scale:2200 },
  ITA:{ center:[12.6,42.5],  scale:1800 },
  ESP:{ center:[-3.7,40.4],  scale:1800 },
  NLD:{ center:[5.3,52.3],   scale:6000 },
  CHE:{ center:[8.2,46.8],   scale:5500 },
  AUT:{ center:[14.1,47.6],  scale:4000 },
  PRT:{ center:[-8,39.5],    scale:3000 },
  GRC:{ center:[22.5,39.1],  scale:2800 },
  NOR:{ center:[15,65],      scale:900  },
  SWE:{ center:[18,62],      scale:1100 },
  DNK:{ center:[10,56],      scale:4000 },
  POL:{ center:[19.4,52],    scale:2000 },
  CZE:{ center:[15.5,49.8],  scale:4500 },
  IRL:{ center:[-8,53.2],    scale:4000 },
  HUN:{ center:[19,47],      scale:4000 },
  ISL:{ center:[-18.5,65],   scale:2500 },
  USA:{ center:[-97,39],     scale:840  },  // contiguous 48 only — Alaska/Hawaii fall off edges
  CAN:{ center:[-96,60],     scale:340  },
  MEX:{ center:[-102,23.6],  scale:900  },
  BRA:{ center:[-51.9,-14.2],scale:360  },
  ARG:{ center:[-65.2,-35.4],scale:580  },
  COL:{ center:[-74,4],      scale:1400 },
  CHL:{ center:[-70,-35],    scale:650  },
  PER:{ center:[-76,-9],     scale:900  },
  CRI:{ center:[-84,9.9],    scale:5000 },
  CUB:{ center:[-79.5,22],   scale:2800 },
  ZAF:{ center:[25.1,-29],   scale:900  },
  EGY:{ center:[30,26.8],    scale:900  },
  MAR:{ center:[-5.4,31.8],  scale:1500 },
  KEN:{ center:[37.9,0],     scale:1800 },
  TZA:{ center:[34.9,-6],    scale:1500 },
  MUS:{ center:[57.5,-20.2], scale:12000},
  RWA:{ center:[29.9,-1.9],  scale:8000 },
  GHA:{ center:[-1.1,7.9],   scale:2500 },
  ARE:{ center:[54,24],      scale:5000 },
  SAU:{ center:[45,24],      scale:650  },
  TUR:{ center:[35,39],      scale:1200 },
  JOR:{ center:[37,31],      scale:3500 },
  QAT:{ center:[51.2,25.3],  scale:10000},
  ISR:{ center:[34.8,31.5],  scale:6000 },
  OMN:{ center:[57.6,21.5],  scale:1500 },
  GEO:{ center:[43.4,42.3],  scale:5000 },
  AUS:{ center:[134,-25.3],  scale:310  },
  NZL:{ center:[172,-42],    scale:1500 },
  FJI:{ center:[177.5,-18],  scale:5000 },
  ECU:{ center:[-78.5,-1.5], scale:1400 },
  BOL:{ center:[-65,-17], scale:650 },
  VEN:{ center:[-66.5,8], scale:900 },
  JAM:{ center:[-77.3,18.1], scale:4500 },
  PAN:{ center:[-80.2,8.8], scale:2200 },
  URY:{ center:[-56,-32.8], scale:1800 },
  PRY:{ center:[-58,-23.5], scale:1400 },
  GTM:{ center:[-90.3,15], scale:2200 },
  HND:{ center:[-86.8,14.8], scale:1800 },
  NIC:{ center:[-85.3,12.5], scale:2200 },
  SLV:{ center:[-88.9,13.8], scale:4000 },
  DOM:{ center:[-70.2,18.9], scale:2200 },
  HTI:{ center:[-72.5,18.9], scale:2800 },
  TTO:{ center:[-61.3,10.6], scale:4500 },
  GUY:{ center:[-58.9,5], scale:1600 },
  BLZ:{ center:[-88.6,17.2], scale:3200 },
  BRB:{ center:[-59.6,13.1], scale:9000 },
  LCA:{ center:[-60.98,13.9], scale:7000 },
  VCT:{ center:[-61.2,13.2], scale:7000 },
  GRD:{ center:[-61.7,12.1], scale:8000 },
  FIN:{ center:[26,64.5], scale:400 },
  BEL:{ center:[4.6,50.7], scale:3200 },
  ROU:{ center:[25,46], scale:1000 },
  BGR:{ center:[25.3,42.7], scale:1400 },
  HRV:{ center:[16.5,44.7], scale:1600 },
  SVK:{ center:[19.5,48.7], scale:2200 },
  SVN:{ center:[14.8,46], scale:4000 },
  SRB:{ center:[20.8,44.2], scale:1800 },
  RUS:{ center:[60,61], scale:110 },
  UKR:{ center:[31,49], scale:700 },
  BLR:{ center:[28,53.5], scale:1400 },
  LTU:{ center:[23.9,55.3], scale:2200 },
  LVA:{ center:[24.6,56.9], scale:2500 },
  EST:{ center:[25.5,58.7], scale:2500 },
  MDA:{ center:[28.4,47.2], scale:3000 },
  ALB:{ center:[20,41.1], scale:2500 },
  MKD:{ center:[21.7,41.6], scale:3200 },
  BIH:{ center:[17.9,44.2], scale:2500 },
  MNE:{ center:[19.2,42.7], scale:3500 },
  LUX:{ center:[6.13,49.7], scale:7000 },
  MLT:{ center:[14.4,35.9], scale:9000 },
  CYP:{ center:[33.2,35], scale:3200 },
  AND:{ center:[1.55,42.55], scale:9000 },
  MCO:{ center:[7.42,43.74], scale:20000 },
  SMR:{ center:[12.45,43.94], scale:14000 },
  LIE:{ center:[9.55,47.16], scale:9000 },
  NGA:{ center:[8,9.5], scale:450 },
  ETH:{ center:[39.5,8.5], scale:650 },
  SEN:{ center:[-14.5,14.5], scale:1400 },
  BWA:{ center:[24,-22.5], scale:650 },
  ZWE:{ center:[29.5,-19], scale:700 },
  MOZ:{ center:[35,-18], scale:550 },
  MWI:{ center:[34,-13.5], scale:1200 },
  ZMB:{ center:[27.8,-13.5], scale:650 },
  UGA:{ center:[32.3,1.5], scale:1400 },
  TUN:{ center:[9.8,34.5], scale:1200 },
  DZA:{ center:[2.6,28], scale:220 },
  AGO:{ center:[17.8,-12.5], scale:450 },
  CMR:{ center:[12.5,5.5], scale:650 },
  CIV:{ center:[-5.5,7.5], scale:1000 },
  MLI:{ center:[-3,17], scale:400 },
  BFA:{ center:[-1.7,12.3], scale:1600 },
  NAM:{ center:[17.5,-22], scale:650 },
  MDG:{ center:[47,-19], scale:450 },
  LSO:{ center:[28.2,-29.6], scale:3200 },
  SWZ:{ center:[31.4,-26.5], scale:5000 },
  LBY:{ center:[17,26.5], scale:320 },
  SDN:{ center:[30,15.5], scale:400 },
  IRN:{ center:[53,32.5], scale:420 },
  KWT:{ center:[47.7,29.3], scale:5000 },
  LBN:{ center:[35.85,33.9], scale:3500 },
  BHR:{ center:[50.55,26.05], scale:9000 },
  IRQ:{ center:[44,33], scale:450 },
  ARM:{ center:[45,40.1], scale:2800 },
  AZE:{ center:[47.5,40.3], scale:1600 },
  MMR:{ center:[96,20], scale:650 },
  LAO:{ center:[103,18.5], scale:900 },
  MNG:{ center:[103.8,46.9], scale:380 },
  BTN:{ center:[90.4,27.4], scale:3200 },
  KAZ:{ center:[67,48], scale:220 },
  UZB:{ center:[64,41.5], scale:650 },
  BGD:{ center:[90.3,23.7], scale:1300 },
  PAK:{ center:[70,30], scale:420 },
  TJK:{ center:[71,38.8], scale:1000 },
  KGZ:{ center:[74.5,41.5], scale:900 },
  TKM:{ center:[59,39.5], scale:750 },
  PNG:{ center:[147,-6.5], scale:420 },
  SLB:{ center:[160,-9], scale:1600 },
  VUT:{ center:[167.5,-16.5], scale:2200 },
  WSM:{ center:[-172,-13.8], scale:5500 },
  TON:{ center:[-175.2,-21.1], scale:5500 },
  PLW:{ center:[134.5,7.4], scale:6000 },
  FSM:{ center:[157,6.9], scale:1600 },
}

// City → [longitude, latitude]
const CITY_COORDS: Record<string, [number, number]> = {
  // Japan
  'Tokyo':[139.69,35.69],'Osaka':[135.50,34.69],'Kyoto':[135.77,35.01],
  'Sapporo':[141.35,43.06],'Fukuoka':[130.40,33.58],'Hiroshima':[132.46,34.39],
  'Nara':[135.83,34.68],'Yokohama':[139.64,35.44],
  // China
  'Beijing':[116.40,39.90],'Shanghai':[121.47,31.23],'Hong Kong':[114.17,22.32],
  'Chengdu':[104.07,30.67],"Xi'an":[108.93,34.26],'Shenzhen':[114.06,22.55],
  'Guilin':[110.29,25.28],'Hangzhou':[120.15,30.27],
  // India
  'Mumbai':[72.88,19.07],'Delhi':[77.21,28.61],'Jaipur':[75.79,26.90],
  'Agra':[78.00,27.18],'Bangalore':[77.59,12.97],'Goa':[73.83,15.49],
  'Varanasi':[82.97,25.32],'Kolkata':[88.36,22.57],
  // Thailand
  'Bangkok':[100.52,13.76],'Chiang Mai':[98.99,18.78],'Phuket':[98.39,7.89],
  'Pattaya':[100.88,12.93],'Krabi':[98.92,8.09],'Koh Samui':[100.06,9.54],
  'Hua Hin':[99.96,12.57],'Ayutthaya':[100.56,14.35],
  // Indonesia
  'Bali':[115.22,-8.41],'Jakarta':[106.83,-6.21],'Yogyakarta':[110.36,-7.80],
  'Lombok':[116.32,-8.65],'Komodo':[119.48,-8.55],'Raja Ampat':[130.77,-0.52],
  // South Korea
  'Seoul':[126.98,37.57],'Busan':[129.07,35.18],'Jeju':[126.53,33.50],
  'Gyeongju':[129.21,35.85],'Incheon':[126.70,37.46],
  // Vietnam
  'Hanoi':[105.85,21.03],'Ho Chi Minh City':[106.66,10.82],'Hoi An':[108.33,15.88],
  'Da Nang':[108.22,16.07],'Halong Bay':[107.08,20.95],'Hue':[107.60,16.46],
  'Sapa':[103.84,22.34],
  // Malaysia
  'Kuala Lumpur':[101.69,3.14],'Penang':[100.33,5.41],'Langkawi':[99.85,6.35],
  'Kota Kinabalu':[116.07,5.98],'Malacca':[102.25,2.19],
  // Singapore
  'Singapore':[103.82,1.35],
  // Philippines
  'Manila':[120.98,14.60],'Cebu':[123.89,10.32],'Palawan':[119.50,9.84],
  'Boracay':[121.95,11.97],'Siargao':[126.05,9.83],'Davao':[125.61,7.07],
  // Cambodia
  'Phnom Penh':[104.92,11.56],'Siem Reap':[103.86,13.36],
  'Sihanoukville':[103.52,10.62],'Kampot':[104.18,10.61],
  // Sri Lanka
  'Colombo':[79.86,6.92],'Kandy':[80.63,7.29],'Galle':[80.22,6.03],
  'Sigiriya':[80.76,7.95],'Ella':[81.05,6.87],
  // Nepal
  'Kathmandu':[85.32,27.71],'Pokhara':[83.99,28.21],
  'Chitwan':[84.50,27.53],'Lumbini':[83.28,27.49],
  // Maldives
  'Malé':[73.51,4.18],'Maafushi':[73.47,3.93],'Baa Atoll':[72.97,5.03],
  // UK
  'London':[-0.12,51.51],'Edinburgh':[-3.19,55.95],'Manchester':[-2.24,53.48],
  'Liverpool':[-2.99,53.41],'Bath':[-2.36,51.38],'Oxford':[-1.26,51.75],
  'Cambridge':[0.12,52.20],'York':[-1.09,53.96],
  // France
  'Paris':[2.35,48.86],'Nice':[7.26,43.71],'Lyon':[4.83,45.76],
  'Marseille':[5.37,43.30],'Bordeaux':[-0.57,44.84],'Strasbourg':[7.75,48.58],
  'Cannes':[7.02,43.55],'Annecy':[6.13,45.90],
  // Germany
  'Berlin':[13.41,52.52],'Munich':[11.58,48.14],'Hamburg':[9.99,53.55],
  'Cologne':[6.96,50.94],'Frankfurt':[8.68,50.11],'Dresden':[13.74,51.05],
  'Heidelberg':[8.69,49.40],
  // Italy
  'Rome':[12.49,41.89],'Venice':[12.33,45.44],'Florence':[11.25,43.77],
  'Milan':[9.19,45.46],'Naples':[14.27,40.85],'Amalfi':[14.60,40.63],
  'Cinque Terre':[9.68,44.12],'Bologna':[11.34,44.49],'Sicily':[14.27,37.60],
  // Spain
  'Barcelona':[2.17,41.39],'Madrid':[-3.70,40.42],'Seville':[-5.99,37.39],
  'Granada':[-3.60,37.18],'Valencia':[-0.38,39.47],'Malaga':[-4.42,36.72],
  'San Sebastian':[-1.98,43.32],'Ibiza':[1.43,38.91],
  // Netherlands
  'Amsterdam':[4.90,52.37],'Rotterdam':[4.48,51.92],'The Hague':[4.30,52.08],
  'Utrecht':[5.12,52.09],'Delft':[4.36,52.01],
  // Switzerland
  'Zurich':[8.54,47.38],'Geneva':[6.14,46.20],'Interlaken':[7.86,46.68],
  'Lucerne':[8.31,47.05],'Bern':[7.44,46.95],'Zermatt':[7.75,46.02],
  // Austria
  'Vienna':[16.37,48.21],'Salzburg':[13.04,47.80],'Innsbruck':[11.39,47.27],
  'Hallstatt':[13.65,47.56],'Graz':[15.44,47.07],
  // Portugal
  'Lisbon':[-9.14,38.72],'Porto':[-8.61,41.15],'Algarve':[-8.10,37.10],
  'Sintra':[-9.39,38.79],'Madeira':[-16.92,32.65],'Azores':[-28.73,38.72],
  // Greece
  'Athens':[23.73,37.98],'Santorini':[25.43,36.39],'Mykonos':[25.33,37.45],
  'Crete':[24.80,35.24],'Rhodes':[28.22,36.43],'Corfu':[19.92,39.62],
  // Norway
  'Oslo':[10.75,59.91],'Bergen':[5.32,60.39],'Tromsø':[18.96,69.65],
  'Flåm':[7.11,60.86],'Stavanger':[5.73,58.97],
  // Sweden
  'Stockholm':[18.07,59.33],'Gothenburg':[11.97,57.71],
  'Malmö':[13.00,55.60],'Kiruna':[20.23,67.86],
  // Denmark
  'Copenhagen':[12.57,55.68],'Aarhus':[10.21,56.16],'Odense':[10.40,55.40],
  // Poland
  'Warsaw':[21.01,52.23],'Krakow':[19.94,50.06],'Gdansk':[18.65,54.35],
  'Wroclaw':[17.04,51.11],
  // Czech Republic
  'Prague':[14.42,50.08],'Cesky Krumlov':[14.32,48.81],'Brno':[16.61,49.20],
  // Ireland
  'Dublin':[-6.26,53.35],'Galway':[-9.05,53.27],'Cork':[-8.47,51.90],
  'Killarney':[-9.51,52.06],
  // Hungary
  'Budapest':[19.04,47.50],'Eger':[20.37,47.90],'Pécs':[18.23,46.07],
  // Iceland
  'Reykjavik':[-21.93,64.14],'Akureyri':[-18.11,65.68],'Vik':[-18.99,63.42],
  // USA
  'New York':[-74.01,40.71],'Los Angeles':[-118.24,34.05],'Las Vegas':[-115.14,36.17],
  'Miami':[-80.19,25.77],'Orlando':[-81.38,28.54],'Chicago':[-87.63,41.85],'San Francisco':[-122.42,37.77],
  'Hawaii':[-157.82,21.31],'New Orleans':[-90.07,29.95],'Washington DC':[-77.04,38.91],
  'Seattle':[-122.33,47.60],
  // Canada
  'Toronto':[-79.38,43.65],'Vancouver':[-123.12,49.28],'Montreal':[-73.57,45.50],
  'Quebec City':[-71.21,46.81],'Banff':[-115.57,51.18],'Calgary':[-114.07,51.05],
  // Mexico
  'Mexico City':[-99.13,19.43],'Cancun':[-86.85,21.16],
  'Playa del Carmen':[-87.08,20.63],'Guadalajara':[-103.35,20.67],
  'Oaxaca':[-96.72,17.06],'Tulum':[-87.46,20.21],'Los Cabos':[-109.92,22.89],
  // Brazil
  'Rio de Janeiro':[-43.18,-22.91],'São Paulo':[-46.63,-23.55],
  'Salvador':[-38.52,-12.97],'Manaus':[-60.02,-3.10],
  'Florianópolis':[-48.55,-27.59],'Iguazu Falls':[-54.44,-25.69],
  // Argentina
  'Buenos Aires':[-58.40,-34.60],'Patagonia':[-68.52,-43.30],
  'Mendoza':[-68.83,-32.89],'Bariloche':[-71.31,-41.13],'Salta':[-65.41,-24.79],
  // Colombia
  'Bogotá':[-74.08,4.71],'Cartagena':[-75.51,10.40],
  'Medellín':[-75.57,6.25],'Santa Marta':[-74.21,11.24],
  // Chile
  'Santiago':[-70.67,-33.45],'Valparaíso':[-71.63,-33.05],
  'Easter Island':[-109.37,-27.11],'Atacama':[-68.17,-23.65],
  // Peru
  'Lima':[-77.04,-12.05],'Cusco':[-71.97,-13.53],'Machu Picchu':[-72.54,-13.16],
  'Arequipa':[-71.54,-16.41],'Lake Titicaca':[-69.33,-15.84],
  // Costa Rica
  'San José':[-84.09,9.93],'Manuel Antonio':[-84.14,9.39],
  'Arenal':[-84.70,10.46],'Monteverde':[-84.82,10.31],
  // Cuba
  'Havana':[-82.36,23.14],'Varadero':[-81.25,23.16],
  'Trinidad':[-79.98,21.80],'Cienfuegos':[-80.44,22.15],
  // South Africa
  'Cape Town':[18.42,-33.93],'Johannesburg':[28.04,-26.20],'Durban':[31.00,-29.86],
  'Kruger':[31.50,-24.50],'Garden Route':[22.46,-33.98],'Stellenbosch':[18.86,-33.93],
  // Egypt
  'Cairo':[31.25,30.06],'Luxor':[32.64,25.69],'Aswan':[32.90,24.09],
  'Sharm el-Sheikh':[34.13,27.91],'Alexandria':[29.92,31.20],'Hurghada':[33.81,27.26],
  // Morocco
  'Marrakech':[-7.99,31.63],'Fez':[-5.00,34.03],'Casablanca':[-7.59,33.59],
  'Chefchaouen':[-5.26,35.17],'Essaouira':[-9.77,31.51],
  // Kenya
  'Nairobi':[36.82,-1.29],'Maasai Mara':[35.23,-1.51],'Amboseli':[37.26,-2.65],
  'Mombasa':[39.67,-4.05],'Diani':[39.58,-4.27],
  // Tanzania
  'Zanzibar':[39.20,-6.17],'Serengeti':[34.84,-2.33],'Kilimanjaro':[37.35,-3.07],
  'Dar es Salaam':[39.29,-6.79],'Arusha':[36.68,-3.37],
  // Mauritius
  'Port Louis':[57.50,-20.16],'Grand Baie':[57.59,-20.01],'Black River':[57.37,-20.34],
  // Rwanda
  'Kigali':[30.06,-1.94],'Volcanoes NP':[29.51,-1.48],
  // Ghana
  'Accra':[-0.19,5.56],'Cape Coast':[-1.24,5.10],'Kumasi':[-1.62,6.69],
  // UAE
  'Dubai':[55.27,25.20],'Abu Dhabi':[54.37,24.45],'Sharjah':[55.38,25.36],
  // Saudi Arabia
  'Riyadh':[46.72,24.69],'Jeddah':[39.19,21.49],'AlUla':[37.92,26.62],
  // Turkey
  'Istanbul':[28.97,41.02],'Cappadocia':[34.84,38.69],'Antalya':[30.71,36.91],
  'Bodrum':[27.43,37.03],'Ephesus':[27.34,37.94],
  // Jordan
  'Amman':[35.93,31.96],'Petra':[35.44,30.33],'Wadi Rum':[36.60,29.58],
  'Aqaba':[35.00,29.53],'Dead Sea':[35.49,31.52],
  // Qatar
  'Doha':[51.54,25.29],
  // Israel
  'Tel Aviv':[34.78,32.08],'Jerusalem':[35.22,31.77],
  'Haifa':[34.99,32.82],'Eilat':[34.95,29.56],
  // Oman
  'Muscat':[58.59,23.61],'Salalah':[54.09,17.02],'Nizwa':[57.54,22.93],
  // Georgia
  'Tbilisi':[44.83,41.69],'Batumi':[41.64,41.64],
  'Kazbegi':[44.65,42.66],'Sighnaghi':[45.73,41.62],
  // Australia
  'Sydney':[151.21,-33.87],'Melbourne':[144.96,-37.81],'Brisbane':[153.03,-27.47],
  'Perth':[115.86,-31.95],'Cairns':[145.77,-16.92],'Gold Coast':[153.43,-28.00],
  'Adelaide':[138.60,-34.93],'Uluru':[131.03,-25.34],
  // New Zealand
  'Auckland':[174.76,-36.87],'Queenstown':[168.66,-45.03],
  'Christchurch':[172.64,-43.53],'Wellington':[174.78,-41.29],
  'Rotorua':[176.25,-38.14],'Milford Sound':[167.93,-44.67],
  // Fiji
  'Nadi':[177.44,-17.80],'Suva':[178.44,-18.14],
  'Yasawa Islands':[177.53,-17.04],'Coral Coast':[177.78,-18.14],
  // Myanmar
  'Yangon':[96.16,16.87],'Bagan':[94.86,21.17],'Mandalay':[96.09,21.98],'Inle Lake':[96.91,20.59],
  // Laos
  'Vientiane':[102.63,17.97],'Luang Prabang':[102.13,19.89],'Vang Vieng':[102.45,18.92],
  // Mongolia
  'Ulaanbaatar':[106.92,47.92],'Gobi Desert':[104.0,42.5],
  // Bhutan
  'Thimphu':[89.64,27.47],'Paro':[89.42,27.43],'Punakha':[89.87,27.62],
  // Bangladesh
  'Dhaka':[90.41,23.81],'Cox\'s Bazar':[91.98,21.44],'Sylhet':[91.87,24.9],
  // Pakistan
  'Karachi':[67.01,24.86],'Lahore':[74.36,31.55],'Islamabad':[73.04,33.72],'Hunza Valley':[74.65,36.32],
  // Kazakhstan
  'Almaty':[76.95,43.24],'Astana':[71.43,51.18],
  // Uzbekistan
  'Samarkand':[66.97,39.65],'Tashkent':[69.24,41.3],'Bukhara':[64.42,39.77],
  // Tajikistan
  'Dushanbe':[68.78,38.56],'Pamir Highway':[72.0,38.3],
  // Kyrgyzstan
  'Bishkek':[74.6,42.87],'Issyk-Kul':[77.0,42.4],
  // Turkmenistan
  'Ashgabat':[58.38,37.95],'Darvaza Gas Crater':[58.44,40.25],
  // Finland
  'Helsinki':[24.94,60.17],'Rovaniemi':[25.72,66.5],'Turku':[22.27,60.45],'Lapland':[27.0,67.5],
  // Belgium
  'Brussels':[4.35,50.85],'Bruges':[3.22,51.21],'Ghent':[3.72,51.05],'Antwerp':[4.4,51.22],
  // Romania
  'Bucharest':[26.1,44.43],'Brasov':[25.59,45.65],'Sibiu':[24.15,45.79],'Transylvania':[24.5,46.5],
  // Bulgaria
  'Sofia':[23.32,42.7],'Plovdiv':[24.75,42.14],'Varna':[27.91,43.21],'Veliko Tarnovo':[25.63,43.08],
  // Croatia
  'Dubrovnik':[18.11,42.65],'Split':[16.44,43.51],'Zagreb':[15.98,45.81],'Hvar':[16.44,43.17],'Plitvice Lakes':[15.6,44.86],
  // Slovakia
  'Bratislava':[17.11,48.15],'Košice':[21.24,48.72],'High Tatras':[20.0,49.15],
  // Slovenia
  'Ljubljana':[14.51,46.06],'Lake Bled':[14.11,46.36],'Piran':[13.57,45.53],
  // Serbia
  'Belgrade':[20.46,44.79],'Novi Sad':[19.85,45.27],
  // Russia
  'Moscow':[37.62,55.75],'Saint Petersburg':[30.31,59.93],'Kazan':[49.11,55.8],'Sochi':[39.73,43.6],
  // Ukraine
  'Kyiv':[30.52,50.45],'Lviv':[24.03,49.84],'Odesa':[30.72,46.48],
  // Lithuania
  'Vilnius':[25.28,54.69],'Kaunas':[23.9,54.9],'Klaipėda':[21.14,55.71],
  // Latvia
  'Riga':[24.11,56.95],'Jurmala':[23.77,56.97],
  // Estonia
  'Tallinn':[24.75,59.44],'Tartu':[26.72,58.38],
  // Luxembourg
  'Luxembourg City':[6.13,49.61],
  // Malta
  'Valletta':[14.51,35.9],'Gozo':[14.24,36.05],'Sliema':[14.5,35.91],
  // Cyprus
  'Larnaca':[33.62,34.92],'Paphos':[32.41,34.78],'Nicosia':[33.36,35.17],'Ayia Napa':[34.0,34.99],
  // Belarus
  'Minsk':[27.57,53.9],'Brest':[23.68,52.1],
  // Moldova
  'Chișinău':[28.86,47.01],'Orheiul Vechi':[28.98,47.36],
  // Albania
  'Tirana':[19.82,41.33],'Saranda':[20.0,39.87],'Berat':[19.95,40.7],
  // North Macedonia
  'Skopje':[21.43,42.0],'Ohrid':[20.8,41.12],
  // Bosnia and Herzegovina
  'Sarajevo':[18.41,43.86],'Mostar':[17.81,43.34],
  // Montenegro
  'Kotor':[18.77,42.42],'Budva':[18.84,42.29],'Podgorica':[19.26,42.44],
  // Microstates
  'Andorra la Vella':[1.52,42.51],'Monte Carlo':[7.42,43.74],'San Marino City':[12.45,43.94],'Vaduz':[9.52,47.14],
  // Ecuador
  'Quito':[-78.47,-0.23],'Guayaquil':[-79.9,-2.19],'Cuenca':[-79.0,-2.9],'Galápagos Islands':[-90.5,-0.75],'Baños':[-78.42,-1.4],
  // Bolivia
  'La Paz':[-68.15,-16.5],'Uyuni Salt Flats':[-67.49,-20.13],'Sucre':[-65.26,-19.03],'Santa Cruz':[-63.18,-17.78],'Potosí':[-65.75,-19.59],
  // Venezuela
  'Caracas':[-66.9,10.49],'Los Roques':[-66.67,11.85],'Mérida':[-71.14,8.6],'Canaima':[-62.55,6.24],
  // Jamaica
  'Kingston':[-76.79,17.97],'Montego Bay':[-77.92,18.47],'Negril':[-78.35,18.27],'Ocho Rios':[-77.1,18.41],
  // Panama
  'Panama City':[-79.52,8.98],'Bocas del Toro':[-82.24,9.34],'San Blas Islands':[-78.9,9.55],'Boquete':[-82.44,8.78],
  // Uruguay
  'Montevideo':[-56.19,-34.9],'Punta del Este':[-54.95,-34.97],'Colonia del Sacramento':[-57.84,-34.47],
  // Paraguay
  'Asunción':[-57.63,-25.3],'Ciudad del Este':[-54.61,-25.51],'Encarnación':[-55.87,-27.34],
  // Guatemala
  'Antigua':[-90.73,14.56],'Guatemala City':[-90.52,14.63],'Lake Atitlán':[-91.2,14.7],'Tikal':[-89.62,17.22],
  // Honduras
  'Roatán':[-86.53,16.32],'Tegucigalpa':[-87.19,14.1],'Copán':[-89.14,14.85],'Utila':[-86.9,16.1],
  // Nicaragua
  'Managua':[-86.27,12.15],'San Juan del Sur':[-86.53,11.25],'Ometepe Island':[-85.6,11.53],
  // El Salvador
  'San Salvador':[-89.2,13.69],'El Tunco':[-89.42,13.49],'Santa Ana':[-89.56,13.99],'Suchitoto':[-89.03,13.94],
  // Dominican Republic
  'Punta Cana':[-68.4,18.58],'Santo Domingo':[-69.93,18.49],'Puerto Plata':[-70.69,19.79],'Samaná':[-69.33,19.2],
  // Haiti
  'Port-au-Prince':[-72.34,18.59],'Cap-Haïtien':[-72.2,19.76],'Jacmel':[-72.53,18.23],
  // Trinidad and Tobago
  'Port of Spain':[-61.52,10.66],'Tobago':[-60.68,11.25],
  // Guyana
  'Georgetown':[-58.16,6.8],'Kaieteur Falls':[-59.49,5.17],
  // Belize
  'Belize City':[-88.19,17.5],'Ambergris Caye':[-87.97,17.92],'Caye Caulker':[-88.02,17.74],'San Ignacio':[-89.07,17.16],
  // Caribbean microstates
  'Bridgetown':[-59.61,13.1],'Castries':[-60.99,14.01],'Soufrière':[-61.06,13.86],
  'Kingstown':[-61.23,13.16],'Bequia':[-61.25,13.0],
  'St. George\'s':[-61.75,12.06],'Grand Anse':[-61.76,12.02],
  // Nigeria
  'Lagos':[3.38,6.52],'Abuja':[7.49,9.08],'Port Harcourt':[7.01,4.82],
  // Ethiopia
  'Addis Ababa':[38.75,9.03],'Lalibela':[39.04,12.03],'Gondar':[37.47,12.6],
  // Senegal
  'Dakar':[-17.45,14.72],'Saint-Louis':[-16.49,16.03],'Gorée Island':[-17.4,14.67],
  // Botswana
  'Gaborone':[25.91,-24.66],'Okavango Delta':[22.9,-19.3],'Chobe':[24.6,-18.6],
  // Zimbabwe
  'Victoria Falls':[25.86,-17.93],'Harare':[31.05,-17.83],'Hwange':[26.48,-18.63],
  // Uganda
  'Kampala':[32.58,0.35],'Bwindi':[29.63,-1.05],'Jinja':[33.2,0.44],
  // Tunisia
  'Tunis':[10.18,36.81],'Sousse':[10.64,35.83],'Djerba':[10.86,33.81],'Sidi Bou Said':[10.35,36.87],
  // Algeria
  'Algiers':[3.06,36.75],'Oran':[-0.63,35.7],'Constantine':[6.61,36.37],
  // Mozambique
  'Maputo':[32.59,-25.97],'Bazaruto Archipelago':[35.47,-21.65],
  // Namibia
  'Windhoek':[17.08,-22.56],'Sossusvlei':[15.35,-24.73],'Etosha':[16.33,-18.83],
  // Madagascar
  'Antananarivo':[47.52,-18.88],'Nosy Be':[48.26,-13.32],
  // Malawi
  'Lilongwe':[33.78,-13.96],'Lake Malawi':[34.5,-12.3],
  // Zambia
  'Lusaka':[28.32,-15.39],'Livingstone':[25.85,-17.85],'South Luangwa':[31.7,-13.1],
  // Libya
  'Tripoli':[13.19,32.89],'Benghazi':[20.08,32.12],
  // Sudan / Angola
  'Khartoum':[32.53,15.59],'Luanda':[13.23,-8.84],
  // Cameroon
  'Yaoundé':[11.52,3.85],'Douala':[9.71,4.05],
  // Côte d'Ivoire
  'Abidjan':[-4.03,5.36],'Yamoussoukro':[-5.28,6.82],
  // Mali
  'Bamako':[-8.0,12.65],'Timbuktu':[-3.0,16.77],
  // Burkina Faso / Lesotho / Eswatini
  'Ouagadougou':[-1.52,12.37],'Maseru':[27.48,-29.32],
  'Mbabane':[31.14,-26.32],'Ezulwini Valley':[31.25,-26.45],
  // Iran
  'Tehran':[51.39,35.69],'Isfahan':[51.68,32.65],'Shiraz':[52.54,29.61],'Yazd':[54.37,31.9],
  // Kuwait
  'Kuwait City':[47.98,29.38],
  // Lebanon
  'Beirut':[35.5,33.89],'Byblos':[35.65,34.12],'Baalbek':[36.21,34.01],
  // Bahrain
  'Manama':[50.59,26.23],
  // Iraq
  'Baghdad':[44.37,33.31],'Erbil':[44.01,36.19],
  // Armenia
  'Yerevan':[44.51,40.18],'Lake Sevan':[45.0,40.4],
  // Azerbaijan
  'Baku':[49.87,40.41],'Gabala':[47.85,40.98],
  // Papua New Guinea
  'Port Moresby':[147.18,-9.48],'Tufi':[149.32,-9.08],
  // Pacific islands
  'Honiara':[159.95,-9.43],'Port Vila':[168.32,-17.73],'Apia':[-171.76,-13.83],
  'Nukuʻalofa':[-175.2,-21.14],'Koror':[134.48,7.34],'Pohnpei':[158.22,6.92],'Chuuk':[151.85,7.45],
}

// Base projection scale — ZoomableGroup multiplies on top of this
const BASE_SCALE = 140

interface WorldMapProps {
  selectedISOs: string[]
  selectedCities: string[]
}

export function WorldMap({ selectedISOs, selectedCities }: WorldMapProps) {
  // Detect light theme for adaptive map colors
  const [isLight, setIsLight] = useState(false)
  useEffect(() => {
    const check = () => setIsLight(document.body.classList.contains('t-arctic'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  const selectedNums = useMemo(
    () => new Set(selectedISOs.map(iso => ISO_NUM[iso]).filter(Boolean)),
    [selectedISOs]
  )

  // ── Zoom/pan state ────────────────────────────────────────────────────────
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 15])
  const [mapZoom,   setMapZoom]   = useState(1)
  const [isDragging, setIsDragging] = useState(false)

  // Show pins as soon as any city is selected
  const showDots  = selectedCities.length > 0
  // Zoom to country as soon as first city is picked (single country only)
  // Multi-country: stay on world view so all countries are visible
  const singleISO  = selectedISOs.length === 1
  const zoomConfig = singleISO ? COUNTRY_ZOOM[selectedISOs[0]] ?? null : null

  // When selected country changes, fly to it (or reset to world view)
  useEffect(() => {
    if (zoomConfig) {
      setMapCenter(zoomConfig.center)
      setMapZoom(Math.round(zoomConfig.scale / BASE_SCALE))
    } else {
      setMapCenter([0, 15])
      setMapZoom(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedISOs.join(',')])

  const handleZoomIn  = () => setMapZoom(z => Math.min(z * 1.6, 40))
  const handleZoomOut = () => setMapZoom(z => Math.max(z / 1.6, 1))
  const handleReset   = () => { setMapCenter([0, 15]); setMapZoom(1) }

  // Label: show dots in zoomed mode OR when user has zoomed in manually
  const isZoomedIn = mapZoom > 3
  const showLabels = isZoomedIn && showDots

  // Dot size inversely scales so pins stay readable at any zoom
  const dotR = isZoomedIn ? Math.max(3, 6 / Math.sqrt(mapZoom / 8)) : 3.5

  const statusLabel = selectedCities.length > 0
    ? `${selectedISOs.length} countr${selectedISOs.length > 1 ? 'ies' : 'y'} · ${selectedCities.length} cit${selectedCities.length > 1 ? 'ies' : 'y'}`
    : null

  return (
    <div style={{
      width: '100%',
      height: 400,
      background: isLight ? '#F3F4F6' : 'rgba(7,10,25,0.95)',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(64,224,208,0.18)',
      boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0,0,0,0.5)',
      position: 'relative',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
    }}>

      {/* ── Status label ── */}
      {statusLabel && (
        <div style={{
          position: 'absolute', top: 12, left: 16, zIndex: 10,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--accent)', opacity: 0.8,
          background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(7,10,25,0.85)',
          padding: '4px 8px', borderRadius: 6,
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none',
        }}>
          {statusLabel}
        </div>
      )}

      {/* ── Zoom controls ── */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {[
          { label: '+', title: 'Zoom in',    onClick: handleZoomIn  },
          { label: '−', title: 'Zoom out',   onClick: handleZoomOut },
          { label: '⊙', title: 'Reset view', onClick: handleReset   },
        ].map(({ label, title, onClick }) => (
          <button
            key={label}
            title={title}
            onClick={onClick}
            style={{
              width: 32, height: 32,
              background: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(7,10,25,0.90)',
              border: '1px solid rgba(64,224,208,0.30)',
              borderRadius: 8,
              color: 'var(--accent)',
              fontSize: label === '⊙' ? 16 : 20,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(64,224,208,0.15)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(7,10,25,0.90)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(64,224,208,0.30)'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Scroll hint (shown only on world view) ── */}
      {mapZoom === 1 && (
        <div style={{
          position: 'absolute', bottom: 14, left: 16, zIndex: 10,
          fontFamily: "'Space Mono', monospace",
          fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: isLight ? 'rgba(107,114,128,0.5)' : 'rgba(255,255,255,0.22)',
          pointerEvents: 'none',
        }}>
          scroll to zoom · drag to pan
        </div>
      )}

      {/* ── Map ── */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: BASE_SCALE, center: [0, 15] }}
        width={800}
        height={400}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ZoomableGroup
          center={mapCenter}
          zoom={mapZoom}
          minZoom={1}
          maxZoom={40}
          onMoveStart={() => setIsDragging(true)}
          onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => {
            setIsDragging(false)
            setMapCenter(coordinates)
            setMapZoom(zoom)
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const isSelected = selectedNums.has(String(geo.id))
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isSelected
                      ? 'rgba(64,224,208,0.32)'
                      : isLight ? '#D1D5DB' : '#0B1830'
                    }
                    stroke={isSelected
                      ? '#40E0D0'
                      : isLight ? '#E5E7EB' : '#162540'
                    }
                    strokeWidth={isSelected ? 1.0 / mapZoom : 0.4 / mapZoom}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: isSelected
                        ? 'rgba(64,224,208,0.45)'
                        : isLight ? '#C5CAD1' : '#12203a'
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>

          {/* City dots */}
          {showDots && selectedCities.map(city => {
            const coords = CITY_COORDS[city]
            if (!coords) return null
            return (
              <Marker key={city} coordinates={coords}>
                <circle
                  r={dotR / mapZoom}
                  fill="#FFC947"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={1.2 / mapZoom}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,201,71,0.9))' }}
                />
                {showLabels && (
                  <text
                    textAnchor="middle"
                    y={-9 / mapZoom}
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 10 / mapZoom,
                      fontWeight: 700,
                      fill: '#ffffff',
                      pointerEvents: 'none',
                    }}
                  >
                    {city}
                  </text>
                )}
              </Marker>
            )
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
