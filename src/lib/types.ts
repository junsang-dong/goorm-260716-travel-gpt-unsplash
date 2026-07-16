export type Mood =
  | 'Calm'
  | 'Adventure'
  | 'Romantic'
  | 'Hiking'
  | 'City'
  | 'Luxury'
  | 'Backpacking'

export interface Trip {
  id: string
  title: string
  country: string
  city: string
  startDate: string
  endDate: string
  coverImageUrl: string | null
  summary: string
  createdAt: string
}

export interface Photo {
  id: string
  tripId: string
  blob: Blob
  thumbnailBlob: Blob
  latitude: number | null
  longitude: number | null
  date: string | null
  camera: string | null
  lens: string | null
  aiCaption: string | null
  createdAt: string
}

export interface Story {
  id: string
  tripId: string
  day: number
  title: string
  content: string
  mood: Mood | string
  heroImageUrl: string | null
  snsSummary: string | null
  hashtags: string[]
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  tripId: string
  name: string
  lat: number
  lng: number
  visitedAt: string | null
  photoId: string | null
}

export interface StoryGenerationResult {
  title: string
  content: string
  mood: Mood | string
  snsSummary: string
  hashtags: string[]
  unsplashKeywords: string
}

export type CreateTripInput = Omit<Trip, 'id' | 'createdAt' | 'coverImageUrl' | 'summary'> & {
  coverImageUrl?: string | null
  summary?: string
}
