import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { HomePage } from '@/routes/HomePage'
import { TripDetailPage } from '@/routes/TripDetailPage'
import { StoryEditorPage } from '@/routes/StoryEditorPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
          <Route
            path="/trips/:tripId/story/:day"
            element={<StoryEditorPage />}
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
