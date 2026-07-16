import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CreateTripInput, Location, Photo, Story, Trip } from './types'

interface TravelDB extends DBSchema {
  trips: {
    key: string
    value: Trip
    indexes: { 'by-created': string }
  }
  photos: {
    key: string
    value: Photo
    indexes: { 'by-trip': string }
  }
  stories: {
    key: string
    value: Story
    indexes: { 'by-trip': string; 'by-trip-day': [string, number] }
  }
  locations: {
    key: string
    value: Location
    indexes: { 'by-trip': string }
  }
}

const DB_NAME = 'ai-travel-story-writer'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<TravelDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<TravelDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const trips = db.createObjectStore('trips', { keyPath: 'id' })
        trips.createIndex('by-created', 'createdAt')

        const photos = db.createObjectStore('photos', { keyPath: 'id' })
        photos.createIndex('by-trip', 'tripId')

        const stories = db.createObjectStore('stories', { keyPath: 'id' })
        stories.createIndex('by-trip', 'tripId')
        stories.createIndex('by-trip-day', ['tripId', 'day'])

        const locations = db.createObjectStore('locations', { keyPath: 'id' })
        locations.createIndex('by-trip', 'tripId')
      },
    })
  }
  return dbPromise
}

function uid() {
  return crypto.randomUUID()
}

export async function listTrips(): Promise<Trip[]> {
  const db = await getDb()
  const trips = await db.getAllFromIndex('trips', 'by-created')
  return trips.reverse()
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  const db = await getDb()
  return db.get('trips', id)
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const db = await getDb()
  const trip: Trip = {
    id: uid(),
    title: input.title,
    country: input.country,
    city: input.city,
    startDate: input.startDate,
    endDate: input.endDate,
    coverImageUrl: input.coverImageUrl ?? null,
    summary: input.summary ?? '',
    createdAt: new Date().toISOString(),
  }
  await db.put('trips', trip)
  return trip
}

export async function updateTrip(
  id: string,
  patch: Partial<Omit<Trip, 'id' | 'createdAt'>>,
): Promise<Trip | undefined> {
  const db = await getDb()
  const existing = await db.get('trips', id)
  if (!existing) return undefined
  const next = { ...existing, ...patch }
  await db.put('trips', next)
  return next
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['trips', 'photos', 'stories', 'locations'], 'readwrite')
  await tx.objectStore('trips').delete(id)
  const photos = await tx.objectStore('photos').index('by-trip').getAllKeys(id)
  await Promise.all(photos.map((k) => tx.objectStore('photos').delete(k)))
  const stories = await tx.objectStore('stories').index('by-trip').getAllKeys(id)
  await Promise.all(stories.map((k) => tx.objectStore('stories').delete(k)))
  const locations = await tx.objectStore('locations').index('by-trip').getAllKeys(id)
  await Promise.all(locations.map((k) => tx.objectStore('locations').delete(k)))
  await tx.done
}

export async function listPhotos(tripId: string): Promise<Photo[]> {
  const db = await getDb()
  const photos = await db.getAllFromIndex('photos', 'by-trip', tripId)
  return photos.sort((a, b) => {
    const da = a.date ?? a.createdAt
    const db_ = b.date ?? b.createdAt
    return da.localeCompare(db_)
  })
}

export async function addPhoto(
  photo: Omit<Photo, 'id' | 'createdAt'>,
): Promise<Photo> {
  const db = await getDb()
  const record: Photo = {
    ...photo,
    id: uid(),
    createdAt: new Date().toISOString(),
  }
  await db.put('photos', record)
  return record
}

export async function updatePhoto(
  id: string,
  patch: Partial<Omit<Photo, 'id' | 'tripId' | 'blob' | 'thumbnailBlob' | 'createdAt'>>,
): Promise<Photo | undefined> {
  const db = await getDb()
  const existing = await db.get('photos', id)
  if (!existing) return undefined
  const next = { ...existing, ...patch }
  await db.put('photos', next)
  return next
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('photos', id)
}

export async function listStories(tripId: string): Promise<Story[]> {
  const db = await getDb()
  const stories = await db.getAllFromIndex('stories', 'by-trip', tripId)
  return stories.sort((a, b) => a.day - b.day)
}

export async function getStoryByDay(
  tripId: string,
  day: number,
): Promise<Story | undefined> {
  const db = await getDb()
  return db.getFromIndex('stories', 'by-trip-day', [tripId, day])
}

export async function upsertStory(
  input: Omit<Story, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<Story> {
  const db = await getDb()
  const existing = input.id
    ? await db.get('stories', input.id)
    : await db.getFromIndex('stories', 'by-trip-day', [input.tripId, input.day])

  const now = new Date().toISOString()
  const story: Story = {
    id: existing?.id ?? uid(),
    tripId: input.tripId,
    day: input.day,
    title: input.title,
    content: input.content,
    mood: input.mood,
    heroImageUrl: input.heroImageUrl,
    snsSummary: input.snsSummary,
    hashtags: input.hashtags,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await db.put('stories', story)
  return story
}

export async function listLocations(tripId: string): Promise<Location[]> {
  const db = await getDb()
  return db.getAllFromIndex('locations', 'by-trip', tripId)
}

export async function addLocation(
  input: Omit<Location, 'id'>,
): Promise<Location> {
  const db = await getDb()
  const location: Location = { ...input, id: uid() }
  await db.put('locations', location)
  return location
}

export async function clearLocationsForTrip(tripId: string): Promise<void> {
  const db = await getDb()
  const keys = await db.getAllKeysFromIndex('locations', 'by-trip', tripId)
  const tx = db.transaction('locations', 'readwrite')
  await Promise.all(keys.map((k) => tx.store.delete(k)))
  await tx.done
}
