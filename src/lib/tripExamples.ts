export interface TripFormExample {
  id: string
  label: string
  title: string
  description: string
  place: string
  /** HTML date input value: YYYY-MM-DD */
  date: string
}

export const TRIP_FORM_EXAMPLES: TripFormExample[] = [
  {
    id: 'lisbon-tram',
    label: '해 질 무렵 리스본의 트램',
    title: '노을을 따라 달린 리스본의 노란 트램',
    description:
      '포르투갈 리스본의 언덕길을 천천히 오르내리는 노란 트램을 따라 하루를 보냈습니다. 해 질 무렵 따뜻한 햇살이 도시를 황금빛으로 물들이고, 오래된 골목과 전망대에서 바라본 풍경은 여행의 가장 아름다운 순간으로 남았습니다.',
    place: '🇵🇹 Portugal · Lisbon',
    date: '2026-05-12',
  },
  {
    id: 'osaka-night',
    label: '오사카의 밤 거리',
    title: '네온사인 아래, 오사카의 밤을 걷다',
    description:
      '도톤보리와 신사이바시 골목을 천천히 걸으며 오사카의 활기찬 밤을 만났습니다. 반짝이는 간판과 따뜻한 음식 냄새, 거리 공연이 어우러져 도시 전체가 하나의 거대한 무대처럼 느껴졌던 잊지 못할 밤이었습니다.',
    place: '🇯🇵 Japan · Osaka',
    date: '2026-04-21',
  },
  {
    id: 'swiss-market',
    label: '스위스 전통 시장',
    title: '알프스 향기가 머무는 스위스 전통 시장',
    description:
      '아침 햇살이 비추는 광장에서 신선한 치즈와 빵, 계절 꽃으로 가득한 전통 시장을 둘러보았습니다. 현지 사람들의 여유로운 일상과 알프스의 풍경이 어우러져 스위스만의 따뜻한 매력을 느낄 수 있었습니다.',
    place: '🇨🇭 Switzerland · Lucerne',
    date: '2026-06-08',
  },
]

/** "🇵🇹 Portugal · Lisbon" → { country: "Portugal", city: "Lisbon" } */
export function parsePlace(place: string): { country: string; city: string } {
  const cleaned = place.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim()
  const parts = cleaned.split(/\s*[·•|]\s*/).map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { country: parts[0], city: parts.slice(1).join(' · ') }
  }
  return { country: '', city: cleaned || place.trim() }
}
