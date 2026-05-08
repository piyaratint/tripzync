import { NextRequest, NextResponse } from 'next/server'

interface Place {
  name: string
  type: string
  image: string
  rank: number
}

// Static curated database — top 10 attractions per country
// Images: Unsplash CDN (prototype). Replace with own CDN in production.
const PLACES_DB: Record<string, Omit<Place, 'rank'>[]> = {
  Japan: [
    { name: 'Senso-ji Temple',       type: 'Temple',        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
    { name: 'Mount Fuji',            type: 'Nature',        image: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=600&q=80' },
    { name: 'Fushimi Inari Shrine',  type: 'Shrine',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Arashiyama Bamboo',     type: 'Nature',        image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=600&q=80' },
    { name: 'Osaka Castle',          type: 'Castle',        image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80' },
    { name: 'Nara Deer Park',        type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'TeamLab Planets',       type: 'Digital Art',   image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'Tokyo Skytree',         type: 'Landmark',      image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80' },
    { name: 'Shibuya Crossing',      type: 'Urban Icon',    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
    { name: 'Hiroshima Peace Park',  type: 'Memorial',      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
  ],
  Thailand: [
    { name: 'Grand Palace',            type: 'Palace',        image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Wat Pho',                 type: 'Temple',        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { name: 'Phi Phi Islands',         type: 'Beach',         image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
    { name: 'White Temple (Wat Rong)', type: 'Temple',        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80' },
    { name: 'Elephant Sanctuary',      type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80' },
    { name: 'Chatuchak Weekend Market',type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Chiang Mai Old City',     type: 'Historical',    image: 'https://images.unsplash.com/photo-1565470420442-6de72741a68b?w=600&q=80' },
    { name: 'Floating Markets',        type: 'Market',        image: 'https://images.unsplash.com/photo-1519397374078-1faeb9edf073?w=600&q=80' },
    { name: 'Ayutthaya Ruins',         type: 'Historical',    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80' },
    { name: 'Railay Beach',            type: 'Beach',         image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80' },
  ],
  France: [
    { name: 'Eiffel Tower',           type: 'Landmark',      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80' },
    { name: 'Louvre Museum',          type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Palace of Versailles',   type: 'Palace',        image: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600&q=80' },
    { name: 'Mont Saint-Michel',      type: 'Historical',    image: 'https://images.unsplash.com/photo-1589519160732-576f165b9aad?w=600&q=80' },
    { name: 'French Riviera',         type: 'Beach',         image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Musée d\'Orsay',         type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Sacré-Coeur',            type: 'Church',        image: 'https://images.unsplash.com/photo-1520036402932-2b47f0c5a3fc?w=600&q=80' },
    { name: 'Loire Valley',           type: 'Nature',        image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&q=80' },
    { name: 'Pont du Gard',           type: 'Historical',    image: 'https://images.unsplash.com/photo-1584652868574-3669a1f66f63?w=600&q=80' },
    { name: 'Dordogne Valley',        type: 'Nature',        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
  ],
  Italy: [
    { name: 'Colosseum',             type: 'Historical',    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80' },
    { name: 'Vatican Museums',        type: 'Museum',        image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&q=80' },
    { name: 'Venice Grand Canal',     type: 'Waterway',      image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&q=80' },
    { name: 'Amalfi Coast',           type: 'Coastal',       image: 'https://images.unsplash.com/photo-1548970522-93571b5f1985?w=600&q=80' },
    { name: 'Tuscany Vineyards',      type: 'Nature',        image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=80' },
    { name: 'Cinque Terre',           type: 'Village',       image: 'https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=600&q=80' },
    { name: 'Pompeii',                type: 'Historical',    image: 'https://images.unsplash.com/photo-1597766353878-4a344de4ce74?w=600&q=80' },
    { name: 'Lake Como',              type: 'Nature',        image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=600&q=80' },
    { name: 'Leaning Tower of Pisa',  type: 'Landmark',      image: 'https://images.unsplash.com/photo-1520637836862-4d197d17c8a4?w=600&q=80' },
    { name: 'Uffizi Gallery',         type: 'Museum',        image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=80' },
  ],
  'United States': [
    { name: 'Grand Canyon',           type: 'Nature',        image: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=600&q=80' },
    { name: 'Yellowstone',            type: 'National Park', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Statue of Liberty',      type: 'Landmark',      image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80' },
    { name: 'Times Square',           type: 'Urban Icon',    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80' },
    { name: 'Yosemite Valley',        type: 'National Park', image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80' },
    { name: 'Las Vegas Strip',        type: 'Entertainment', image: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=600&q=80' },
    { name: 'Niagara Falls',          type: 'Nature',        image: 'https://images.unsplash.com/photo-1489447068241-b3490214e879?w=600&q=80' },
    { name: 'Hawaii Beaches',         type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Golden Gate Bridge',     type: 'Landmark',      image: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=600&q=80' },
    { name: 'New Orleans French Quarter', type: 'Cultural',  image: 'https://images.unsplash.com/photo-1568459877861-8e08e3c5f6c5?w=600&q=80' },
  ],
  Australia: [
    { name: 'Sydney Opera House',     type: 'Landmark',      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Great Barrier Reef',     type: 'Marine',        image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80' },
    { name: 'Uluru (Ayers Rock)',     type: 'Nature',        image: 'https://images.unsplash.com/photo-1529108190281-9a4f620bc2d8?w=600&q=80' },
    { name: 'Bondi Beach',            type: 'Beach',         image: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=600&q=80' },
    { name: 'Great Ocean Road',       type: 'Scenic Drive',  image: 'https://images.unsplash.com/photo-1493707069894-e5dde22a4c50?w=600&q=80' },
    { name: 'Daintree Rainforest',    type: 'Nature',        image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80' },
    { name: 'Melbourne Laneways',     type: 'Urban',         image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
    { name: 'Kakadu National Park',   type: 'National Park', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Whitsunday Islands',     type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Blue Mountains',         type: 'Nature',        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
  ],
  'United Kingdom': [
    { name: 'Tower of London',        type: 'Historical',    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80' },
    { name: 'Stonehenge',             type: 'Historical',    image: 'https://images.unsplash.com/photo-1599833975787-5c143f373c30?w=600&q=80' },
    { name: 'Edinburgh Castle',       type: 'Castle',        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80' },
    { name: 'Buckingham Palace',      type: 'Palace',        image: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&q=80' },
    { name: 'Lake District',          type: 'Nature',        image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
    { name: 'British Museum',         type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Bath Roman Baths',       type: 'Historical',    image: 'https://images.unsplash.com/photo-1599833975787-5c143f373c30?w=600&q=80' },
    { name: 'Cotswolds Villages',     type: 'Village',       image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=600&q=80' },
    { name: 'Giant\'s Causeway',      type: 'Nature',        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Loch Ness',              type: 'Nature',        image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
  ],
  Spain: [
    { name: 'Sagrada Família',        type: 'Cathedral',     image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80' },
    { name: 'Alhambra Palace',        type: 'Palace',        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { name: 'Park Güell',             type: 'Park',          image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Prado Museum',           type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'San Sebastián Beach',    type: 'Beach',         image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Flamenco Show, Seville', type: 'Cultural',      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80' },
    { name: 'Toledo Old City',        type: 'Historical',    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80' },
    { name: 'Ibiza Beaches',          type: 'Beach',         image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
    { name: 'Camino de Santiago',     type: 'Pilgrimage',    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Teide Volcano, Tenerife',type: 'Volcano',       image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
  ],
  UAE: [
    { name: 'Burj Khalifa',           type: 'Skyscraper',    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80' },
    { name: 'Palm Jumeirah',          type: 'Island',        image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&q=80' },
    { name: 'Dubai Mall',             type: 'Shopping',      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Sheikh Zayed Mosque',    type: 'Mosque',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Dubai Desert Safari',    type: 'Adventure',     image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&q=80' },
    { name: 'Dubai Frame',            type: 'Landmark',      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80' },
    { name: 'Al Fahidi Historical Neighbourhood', type: 'Historical', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Louvre Abu Dhabi',       type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Burj Al Arab',           type: 'Hotel',         image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&q=80' },
    { name: 'Dubai Miracle Garden',   type: 'Garden',        image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
  ],
  'South Korea': [
    { name: 'Gyeongbokgung Palace',   type: 'Palace',        image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&q=80' },
    { name: 'Jeju Island',            type: 'Island',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Bukchon Hanok Village',  type: 'Village',       image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&q=80' },
    { name: 'N Seoul Tower',          type: 'Landmark',      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
    { name: 'Myeongdong Market',      type: 'Shopping',      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'DMZ Demilitarized Zone', type: 'Historical',    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Busan Haeundae Beach',   type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Lotte World',            type: 'Theme Park',    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'Insadong Street',        type: 'Cultural',      image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Seoraksan National Park',type: 'Nature',        image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
  ],
  Indonesia: [
    { name: 'Bali Temples',           type: 'Temple',        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80' },
    { name: 'Borobudur Temple',       type: 'Temple',        image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80' },
    { name: 'Komodo Island',          type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80' },
    { name: 'Raja Ampat',             type: 'Marine',        image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80' },
    { name: 'Ubud Monkey Forest',     type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Mount Bromo',            type: 'Volcano',       image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Tanah Lot Temple',       type: 'Temple',        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { name: 'Gili Islands',           type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Prambanan Temple',       type: 'Temple',        image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80' },
    { name: 'Lake Toba',              type: 'Nature',        image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
  ],
  Morocco: [
    { name: 'Marrakech Medina',       type: 'Medina',        image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80' },
    { name: 'Sahara Desert',          type: 'Nature',        image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&q=80' },
    { name: 'Fes El Bali',            type: 'Historical',    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80' },
    { name: 'Chefchaouen Blue City',  type: 'Village',       image: 'https://images.unsplash.com/photo-1548018560-c10a6d2e5b94?w=600&q=80' },
    { name: 'Hassan II Mosque',       type: 'Mosque',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Aït Benhaddou',          type: 'Historical',    image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&q=80' },
    { name: 'Jardin Majorelle',       type: 'Garden',        image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
    { name: 'Atlas Mountains',        type: 'Nature',        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Essaouira',              type: 'Coastal',       image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Dades Valley',           type: 'Nature',        image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
  ],
  Vietnam: [
    { name: 'Ha Long Bay',            type: 'Nature',        image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Hội An Ancient Town',    type: 'Historical',    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80' },
    { name: 'Phong Nha Caves',        type: 'Nature',        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Mỹ Sơn Sanctuary',       type: 'Historical',    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80' },
    { name: 'Hanoi Old Quarter',      type: 'Historical',    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Mekong Delta',           type: 'Nature',        image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Sapa Rice Terraces',     type: 'Nature',        image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Ninh Bình',              type: 'Nature',        image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80' },
    { name: 'Phú Quốc Island',        type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'War Remnants Museum',    type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
  ],
  // Generic fallback used for unlisted countries
  _default: [
    { name: 'Historic City Centre',   type: 'Historical',    image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&q=80' },
    { name: 'National Museum',        type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Local Markets',          type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Main Cathedral / Temple',type: 'Religious',     image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'National Park',          type: 'Nature',        image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Coastal Promenade',      type: 'Coastal',       image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Royal Palace',           type: 'Palace',        image: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&q=80' },
    { name: 'Street Food Quarter',    type: 'Culinary',      image: 'https://images.unsplash.com/photo-1519397374078-1faeb9edf073?w=600&q=80' },
    { name: 'Sunset Viewpoint',       type: 'Scenic',        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Local Craft Village',    type: 'Cultural',      image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
  ],
}

// Attempt Google Places API (server-side only)
async function fetchFromGooglePlaces(country: string): Promise<Place[] | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null

  try {
    const query = encodeURIComponent(`top tourist attractions in ${country}`)
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${key}`
    const res = await fetch(url, { next: { revalidate: 86400 } }) // cache 24h
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results?.length) return null

    return data.results.slice(0, 10).map((r: any, i: number) => {
      let image = `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80`
      if (r.photos?.[0]?.photo_reference) {
        image = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${r.photos[0].photo_reference}&key=${key}`
      }
      return {
        name: r.name,
        type: r.types?.[0]?.replace(/_/g, ' ') ?? 'Attraction',
        image,
        rank: i + 1,
      }
    })
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country')?.trim()
  if (!country) {
    return NextResponse.json({ error: 'country param required' }, { status: 400 })
  }

  // 1. Try Google Places API
  const googlePlaces = await fetchFromGooglePlaces(country)
  if (googlePlaces) {
    return NextResponse.json({ places: googlePlaces, source: 'google' })
  }

  // 2. Curated static DB — normalise country name
  const normalised = Object.keys(PLACES_DB).find(
    k => k.toLowerCase() === country.toLowerCase()
  ) ?? '_default'

  const raw = PLACES_DB[normalised] ?? PLACES_DB['_default']
  const places: Place[] = raw.map((p, i) => ({ ...p, rank: i + 1 }))

  return NextResponse.json({ places, source: 'static' })
}
