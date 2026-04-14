import { AuthProvider } from './context/AuthContext'
import RutasApp from './components/rutas/RutasApp'
import NavBar from './components/navegacion/NavBar'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <NavBar />
        <main>
          <RutasApp />
        </main>
      </div>
    </AuthProvider>
  )
}

export default App

