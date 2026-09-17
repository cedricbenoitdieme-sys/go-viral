import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { VideoDetailPage } from './pages/VideoDetailPage'
import { VideosPage } from './pages/VideosPage'

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<VideosPage />} />
        <Route path="/videos/:id" element={<VideoDetailPage />} />
      </Routes>
    </Layout>
  )
}
