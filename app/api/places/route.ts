import { NextRequest, NextResponse } from 'next/server'

interface Place {
  name: string
  type: string
  image: string
  rank: number
}

// Static curated database — top 10 attractions per city and country
// City entries take precedence over country entries.
// Images: Unsplash CDN (prototype). Replace with own CDN in production.
const PLACES_DB: Record<string, Omit<Place, 'rank'>[]> = {

  // ── JAPAN — cities ──────────────────────────────────────────────────────────
  Tokyo: [
    { name: 'Shibuya Crossing',      type: 'Urban Icon',    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
    { name: 'Senso-ji Temple',       type: 'Temple',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Tokyo Skytree',         type: 'Landmark',      image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80' },
    { name: 'Shinjuku Gyoen',        type: 'Park',          image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'TeamLab Planets',       type: 'Digital Art',   image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'Harajuku Takeshita St', type: 'Shopping',      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80' },
    { name: 'Tsukiji Outer Market',  type: 'Market',        image: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?w=600&q=80' },
    { name: 'Akihabara',             type: 'Electronics',   image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Odaiba',                type: 'Entertainment', image: 'https://images.unsplash.com/photo-1565777415743-87a4e5dcbe56?w=600&q=80' },
    { name: 'Imperial Palace Garden',type: 'Garden',        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
  ],
  Kyoto: [
    { name: 'Fushimi Inari Shrine',  type: 'Shrine',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Arashiyama Bamboo Grove', type: 'Nature',      image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=600&q=80' },
    { name: 'Kinkaku-ji (Golden Pavilion)', type: 'Temple', image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600&q=80' },
    { name: 'Gion District',         type: 'Historical',    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Kiyomizu-dera Temple',  type: 'Temple',        image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Nijo Castle',           type: 'Castle',        image: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=600&q=80' },
    { name: 'Philosopher\'s Path',   type: 'Scenic Walk',   image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=600&q=80' },
    { name: 'Nishiki Market',        type: 'Market',        image: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?w=600&q=80' },
    { name: 'Yasaka Shrine',         type: 'Shrine',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Ryoan-ji Rock Garden',  type: 'Garden',        image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
  ],
  Osaka: [
    { name: 'Dotonbori',             type: 'Entertainment', image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80' },
    { name: 'Osaka Castle',          type: 'Castle',        image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80' },
    { name: 'Universal Studios Japan', type: 'Theme Park',  image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'Kuromon Ichiba Market', type: 'Market',        image: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?w=600&q=80' },
    { name: 'Shinsaibashi Shopping', type: 'Shopping',      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
    { name: 'Shinsekai',             type: 'Historical',    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Tennoji Zoo & Park',    type: 'Park',          image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Namba',                 type: 'Urban',         image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
    { name: 'Sumiyoshi Taisha',      type: 'Shrine',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Kaiyukan Aquarium',     type: 'Aquarium',      image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80' },
  ],
  Hiroshima: [
    { name: 'Peace Memorial Park',   type: 'Memorial',      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Atomic Bomb Dome',      type: 'Memorial',      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Miyajima Island',       type: 'Island',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Itsukushima Shrine',    type: 'Shrine',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Hiroshima Castle',      type: 'Castle',        image: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=600&q=80' },
    { name: 'Shukkeien Garden',      type: 'Garden',        image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Orizuru Tower',         type: 'Landmark',      image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80' },
    { name: 'Hiroshima Peace Museum',type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
  ],
  Nara: [
    { name: 'Nara Deer Park',        type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Todai-ji Temple',       type: 'Temple',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Kasuga Taisha Shrine',  type: 'Shrine',        image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600&q=80' },
    { name: 'Isuien Garden',         type: 'Garden',        image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Naramachi Old Town',    type: 'Historical',    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Mount Yoshino',         type: 'Nature',        image: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=600&q=80' },
  ],
  Sapporo: [
    { name: 'Odori Park & Snow Festival', type: 'Park',     image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Sapporo Beer Museum',   type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Hokkaido Shrine',       type: 'Shrine',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Susukino',              type: 'Entertainment', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
    { name: 'Maruyama Park',         type: 'Park',          image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=600&q=80' },
    { name: 'Shiroi Koibito Park',   type: 'Attraction',    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
  ],
  Fukuoka: [
    { name: 'Ohori Park',            type: 'Park',          image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Fukuoka Castle Ruins',  type: 'Historical',    image: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=600&q=80' },
    { name: 'Dazaifu Tenmangu',      type: 'Shrine',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Canal City Hakata',     type: 'Shopping',      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
    { name: 'Nakasu Yatai (Food Stalls)', type: 'Culinary', image: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?w=600&q=80' },
    { name: 'Yanagawa River Cruise', type: 'Scenic',        image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80' },
  ],

  // ── THAILAND — cities ────────────────────────────────────────────────────────
  Bangkok: [
    { name: 'Grand Palace',          type: 'Palace',        image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Wat Pho',               type: 'Temple',        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { name: 'Chatuchak Weekend Market', type: 'Market',     image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Temple of Dawn (Wat Arun)', type: 'Temple',    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80' },
    { name: 'Chinatown (Yaowarat)',  type: 'Cultural',      image: 'https://images.unsplash.com/photo-1519397374078-1faeb9edf073?w=600&q=80' },
    { name: 'Khao San Road',         type: 'Entertainment', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Jim Thompson House',    type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Floating Markets',      type: 'Market',        image: 'https://images.unsplash.com/photo-1519397374078-1faeb9edf073?w=600&q=80' },
    { name: 'Asiatique Riverfront',  type: 'Shopping',      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Lumpini Park',          type: 'Park',          image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
  ],
  'Chiang Mai': [
    { name: 'Doi Inthanon National Park', type: 'Nature',   image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Elephant Nature Park',  type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80' },
    { name: 'Doi Suthep Temple',     type: 'Temple',        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { name: 'Chiang Mai Old City',   type: 'Historical',    image: 'https://images.unsplash.com/photo-1565470420442-6de72741a68b?w=600&q=80' },
    { name: 'Night Bazaar',          type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'White Temple (Wat Rong)', type: 'Temple',      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80' },
    { name: 'Nimman Road',           type: 'Urban',         image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Thai Cookery School',   type: 'Culinary',      image: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?w=600&q=80' },
  ],
  Phuket: [
    { name: 'Phi Phi Islands',       type: 'Beach',         image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
    { name: 'Big Buddha Phuket',     type: 'Landmark',      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { name: 'Phang Nga Bay',         type: 'Nature',        image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Patong Beach',          type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Old Phuket Town',       type: 'Historical',    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Kata Noi Beach',        type: 'Beach',         image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Tiger Kingdom',         type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80' },
    { name: 'Phuket Fantasea',       type: 'Entertainment', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
  ],
  Krabi: [
    { name: 'Railay Beach',          type: 'Beach',         image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80' },
    { name: 'Four Islands Tour',     type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Tiger Cave Temple',     type: 'Temple',        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { name: 'Thung Teao Forest Park',type: 'Nature',        image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Ao Nang Beach',         type: 'Beach',         image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Kayaking Phang Nga',    type: 'Adventure',     image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
  ],
  Ayutthaya: [
    { name: 'Ayutthaya Historical Park', type: 'Historical', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80' },
    { name: 'Wat Mahathat',          type: 'Temple',        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { name: 'Wat Phra Si Sanphet',   type: 'Temple',        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80' },
    { name: 'Chao Sam Phraya Museum',type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Elephant Kraal',        type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80' },
  ],

  // ── SOUTH KOREA — cities ─────────────────────────────────────────────────────
  Seoul: [
    { name: 'Gyeongbokgung Palace',  type: 'Palace',        image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&q=80' },
    { name: 'Bukchon Hanok Village', type: 'Village',        image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&q=80' },
    { name: 'N Seoul Tower',         type: 'Landmark',       image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80' },
    { name: 'Myeongdong Market',     type: 'Shopping',       image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Hongdae',               type: 'Entertainment',  image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Insadong Street',       type: 'Cultural',       image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Changdeokgung Palace',  type: 'Palace',         image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&q=80' },
    { name: 'Han River Park',        type: 'Park',           image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Lotte World',           type: 'Theme Park',     image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'Dongdaemun Market',     type: 'Market',         image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
  ],
  Busan: [
    { name: 'Haeundae Beach',        type: 'Beach',          image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Gamcheon Culture Village', type: 'Cultural',    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Jagalchi Fish Market',  type: 'Market',         image: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?w=600&q=80' },
    { name: 'Beomeosa Temple',       type: 'Temple',         image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Taejongdae Resort',     type: 'Nature',         image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Gwangalli Beach',       type: 'Beach',          image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Busan Museum of Art',   type: 'Museum',         image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
  ],
  'Jeju': [
    { name: 'Hallasan National Park',type: 'Nature',         image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Seongsan Ilchulbong',   type: 'Volcano',        image: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=600&q=80' },
    { name: 'Manjanggul Lava Tube',  type: 'Nature',         image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80' },
    { name: 'Jeju Haenyeo Museum',   type: 'Museum',         image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Hyeopjae Beach',        type: 'Beach',          image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Jusangjeolli Cliffs',   type: 'Nature',         image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
  ],

  // ── VIETNAM — cities ─────────────────────────────────────────────────────────
  Hanoi: [
    { name: 'Hanoi Old Quarter',     type: 'Historical',    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Hoan Kiem Lake',        type: 'Scenic',        image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80' },
    { name: 'Ho Chi Minh Mausoleum', type: 'Memorial',      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Temple of Literature',  type: 'Historical',    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80' },
    { name: 'Vietnam Museum of Ethnology', type: 'Museum',  image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'St. Joseph\'s Cathedral', type: 'Church',      image: 'https://images.unsplash.com/photo-1520036402932-2b47f0c5a3fc?w=600&q=80' },
    { name: 'Ha Long Bay Day Trip',  type: 'Nature',        image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Tran Quoc Pagoda',      type: 'Temple',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
  ],
  'Ho Chi Minh City': [
    { name: 'War Remnants Museum',   type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Ben Thanh Market',      type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Reunification Palace',  type: 'Historical',    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Notre-Dame Cathedral Saigon', type: 'Church',  image: 'https://images.unsplash.com/photo-1520036402932-2b47f0c5a3fc?w=600&q=80' },
    { name: 'Cu Chi Tunnels',        type: 'Historical',    image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&q=80' },
    { name: 'Bui Vien Walking Street', type: 'Entertainment', image: 'https://images.unsplash.com/photo-1519397374078-1faeb9edf073?w=600&q=80' },
    { name: 'Jade Emperor Pagoda',   type: 'Temple',        image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80' },
    { name: 'Mekong Delta Tour',     type: 'Nature',        image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
  ],
  'Hoi An': [
    { name: 'Hội An Ancient Town',   type: 'Historical',    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80' },
    { name: 'Japanese Covered Bridge', type: 'Landmark',    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'An Bang Beach',         type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'My Son Sanctuary',      type: 'Historical',    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80' },
    { name: 'Lantern-lit Night Market', type: 'Market',     image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Tra Que Vegetable Village', type: 'Cultural',  image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
  ],

  // ── INDONESIA — cities ───────────────────────────────────────────────────────
  Bali: [
    { name: 'Tanah Lot Temple',      type: 'Temple',        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80' },
    { name: 'Ubud Monkey Forest',    type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Tegallalang Rice Terrace', type: 'Nature',     image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80' },
    { name: 'Seminyak Beach',        type: 'Beach',         image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Uluwatu Temple',        type: 'Temple',        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { name: 'Sacred Monkey Forest Ubud', type: 'Wildlife',  image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80' },
    { name: 'Kuta Beach',            type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Mount Batur Sunrise',   type: 'Volcano',       image: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=600&q=80' },
    { name: 'Besakih Mother Temple', type: 'Temple',        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80' },
    { name: 'Nusa Penida Island',    type: 'Island',        image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80' },
  ],

  // ── EUROPE — cities ──────────────────────────────────────────────────────────
  Paris: [
    { name: 'Eiffel Tower',          type: 'Landmark',      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80' },
    { name: 'Louvre Museum',         type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Notre-Dame Cathedral',  type: 'Church',        image: 'https://images.unsplash.com/photo-1520036402932-2b47f0c5a3fc?w=600&q=80' },
    { name: 'Montmartre & Sacré-Coeur', type: 'Neighbourhood', image: 'https://images.unsplash.com/photo-1520036402932-2b47f0c5a3fc?w=600&q=80' },
    { name: 'Palace of Versailles',  type: 'Palace',        image: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600&q=80' },
    { name: 'Musée d\'Orsay',        type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Champs-Élysées',        type: 'Landmark',      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80' },
    { name: 'Le Marais District',    type: 'Neighbourhood', image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&q=80' },
    { name: 'Centre Pompidou',       type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Seine River Cruise',    type: 'Scenic',        image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80' },
  ],
  London: [
    { name: 'Tower of London',       type: 'Historical',    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80' },
    { name: 'Buckingham Palace',     type: 'Palace',        image: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&q=80' },
    { name: 'British Museum',        type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Tower Bridge',          type: 'Landmark',      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80' },
    { name: 'Westminster Abbey',     type: 'Church',        image: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&q=80' },
    { name: 'Covent Garden',         type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Tate Modern',           type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Hyde Park',             type: 'Park',          image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Camden Market',         type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Notting Hill',          type: 'Neighbourhood', image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=600&q=80' },
  ],
  Rome: [
    { name: 'Colosseum',             type: 'Historical',    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80' },
    { name: 'Vatican Museums',       type: 'Museum',        image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&q=80' },
    { name: 'Trevi Fountain',        type: 'Landmark',      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80' },
    { name: 'Roman Forum',           type: 'Historical',    image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&q=80' },
    { name: 'Pantheon',              type: 'Historical',    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80' },
    { name: 'St. Peter\'s Basilica', type: 'Church',        image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&q=80' },
    { name: 'Borghese Gallery',      type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Trastevere',            type: 'Neighbourhood', image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=80' },
    { name: 'Campo de\' Fiori',      type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Spanish Steps',         type: 'Landmark',      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80' },
  ],
  Barcelona: [
    { name: 'Sagrada Família',       type: 'Cathedral',     image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80' },
    { name: 'Park Güell',            type: 'Park',          image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'La Rambla',             type: 'Landmark',      image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80' },
    { name: 'Gothic Quarter',        type: 'Historical',    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80' },
    { name: 'Casa Batlló',           type: 'Architecture',  image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
    { name: 'Barceloneta Beach',     type: 'Beach',         image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Picasso Museum',        type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'La Boqueria Market',    type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Montjuïc Castle',       type: 'Castle',        image: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=600&q=80' },
    { name: 'El Born District',      type: 'Neighbourhood', image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&q=80' },
  ],

  // ── UAE — cities ─────────────────────────────────────────────────────────────
  Dubai: [
    { name: 'Burj Khalifa',          type: 'Skyscraper',    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80' },
    { name: 'Palm Jumeirah',         type: 'Island',        image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&q=80' },
    { name: 'Dubai Mall',            type: 'Shopping',      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Dubai Desert Safari',   type: 'Adventure',     image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&q=80' },
    { name: 'Dubai Frame',           type: 'Landmark',      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80' },
    { name: 'Dubai Creek',           type: 'Historical',    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=600&q=80' },
    { name: 'Miracle Garden',        type: 'Garden',        image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
    { name: 'Jumeirah Mosque',       type: 'Mosque',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Gold Souk',             type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Burj Al Arab',          type: 'Hotel',         image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&q=80' },
  ],
  'Abu Dhabi': [
    { name: 'Sheikh Zayed Mosque',   type: 'Mosque',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Louvre Abu Dhabi',      type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Yas Island',            type: 'Entertainment', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'Ferrari World',         type: 'Theme Park',    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'Corniche Beach',        type: 'Beach',         image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80' },
    { name: 'Emirates Palace',       type: 'Hotel',         image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&q=80' },
  ],

  // ── AMERICAS ─────────────────────────────────────────────────────────────────
  'New York': [
    { name: 'Central Park',          type: 'Park',          image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80' },
    { name: 'Statue of Liberty',     type: 'Landmark',      image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80' },
    { name: 'Times Square',          type: 'Urban Icon',    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80' },
    { name: 'Brooklyn Bridge',       type: 'Landmark',      image: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=600&q=80' },
    { name: 'Metropolitan Museum',   type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'The High Line',         type: 'Park',          image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'MoMA',                  type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Empire State Building', type: 'Landmark',      image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80' },
    { name: 'DUMBO & Brooklyn',      type: 'Neighbourhood', image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=600&q=80' },
    { name: 'One World Observatory', type: 'Landmark',      image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80' },
  ],
  'Los Angeles': [
    { name: 'Hollywood Walk of Fame',type: 'Landmark',      image: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=600&q=80' },
    { name: 'Griffith Observatory', type: 'Landmark',       image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80' },
    { name: 'Venice Beach',          type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'The Getty Museum',      type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'Santa Monica Pier',     type: 'Entertainment', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'Universal Studios Hollywood', type: 'Theme Park', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'Beverly Hills',         type: 'Neighbourhood', image: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=600&q=80' },
    { name: 'LACMA',                 type: 'Museum',        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
  ],

  // ── AUSTRALIA ───────────────────────────────────────────────────────────────
  Sydney: [
    { name: 'Sydney Opera House',    type: 'Landmark',      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Bondi Beach',           type: 'Beach',         image: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=600&q=80' },
    { name: 'Sydney Harbour Bridge', type: 'Landmark',      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
    { name: 'Taronga Zoo',           type: 'Wildlife',      image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80' },
    { name: 'Royal Botanic Garden',  type: 'Garden',        image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80' },
    { name: 'Blue Mountains',        type: 'Nature',        image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80' },
    { name: 'Darling Harbour',       type: 'Entertainment', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80' },
    { name: 'The Rocks',             type: 'Historical',    image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&q=80' },
  ],
  Melbourne: [
    { name: 'Melbourne Laneways',    type: 'Urban',         image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80' },
    { name: 'Great Ocean Road',      type: 'Scenic Drive',  image: 'https://images.unsplash.com/photo-1493707069894-e5dde22a4c50?w=600&q=80' },
    { name: 'Queen Victoria Market', type: 'Market',        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80' },
    { name: 'Melbourne Museum',      type: 'Museum',        image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80' },
    { name: 'St Kilda Beach',        type: 'Beach',         image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
    { name: 'Dandenong Ranges',      type: 'Nature',        image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80' },
    { name: 'National Gallery of Victoria', type: 'Museum', image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80' },
    { name: 'Fitzroy & Collingwood', type: 'Neighbourhood', image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=600&q=80' },
  ],

  // ── COUNTRY-LEVEL FALLBACKS (used when city not found) ───────────────────────
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

// ── Wikipedia image fetcher ───────────────────────────────────────────────────
// Module-level cache: survives across requests within the same warm serverless
// instance. Key = place name (lowercased), value = resolved image URL.
const wikiCache = new Map<string, string>()

async function fetchWikiImage(placeName: string): Promise<string> {
  const key = placeName.toLowerCase()
  if (wikiCache.has(key)) return wikiCache.get(key)!

  const ua = 'TripZync/1.0 (https://tripzync.vercel.app; privacy@tripzync.com)'

  // 1st attempt — direct article lookup by place name
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`
    const res = await fetch(url, { headers: { 'User-Agent': ua }, next: { revalidate: 604800 } })
    if (res.ok) {
      const data = await res.json()
      const img: string = data.thumbnail?.source || data.originalimage?.source || ''
      if (img) { wikiCache.set(key, img); return img }
    }
  } catch { /* fall through */ }

  // 2nd attempt — Wikipedia search API, grab top article, then its image
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(placeName)}&format=json&srlimit=1&origin=*`
    const sRes = await fetch(searchUrl, { headers: { 'User-Agent': ua }, next: { revalidate: 604800 } })
    if (sRes.ok) {
      const sData = await sRes.json()
      const title: string = sData.query?.search?.[0]?.title || ''
      if (title) {
        const imgUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
        const iRes = await fetch(imgUrl, { headers: { 'User-Agent': ua }, next: { revalidate: 604800 } })
        if (iRes.ok) {
          const iData = await iRes.json()
          const img: string = iData.thumbnail?.source || ''
          if (img) { wikiCache.set(key, img); return img }
        }
      }
    }
  } catch { /* fall through */ }

  wikiCache.set(key, '') // cache miss so we don't retry on every request
  return ''
}

// ── Google Places API (server-side only) ─────────────────────────────────────
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

  // Enrich each place with a real Wikipedia photo in parallel.
  // Falls back to the Unsplash URL in PLACES_DB if Wikipedia has no image.
  const places: Place[] = await Promise.all(
    raw.map(async (p, i) => {
      const wikiImg = await fetchWikiImage(p.name)
      return { ...p, image: wikiImg || p.image, rank: i + 1 }
    })
  )

  return NextResponse.json({ places, source: 'wiki' })
}
