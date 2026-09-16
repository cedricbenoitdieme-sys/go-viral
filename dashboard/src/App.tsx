import { Route, Routes } from 'react-router-dom'
import { VideoDetailPage } from './pages/VideoDetailPage'
import { VideosPage } from './pages/VideosPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<VideosPage />} />
      <Route path="/videos/:id" element={<VideoDetailPage />} />
    </Routes>
  )
}
