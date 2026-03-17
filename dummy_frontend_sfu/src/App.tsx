import { Route,Routes,BrowserRouter } from 'react-router-dom'
import { Landing } from './Pages/Landing'
import './App.css'

function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
