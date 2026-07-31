import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import QueryPage from './pages/QueryPage'
import DatasourcePage from './pages/DatasourcePage'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <TopBar />
          <Routes>
            <Route path="/" element={<QueryPage />} />
            <Route path="/datasources" element={<DatasourcePage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
