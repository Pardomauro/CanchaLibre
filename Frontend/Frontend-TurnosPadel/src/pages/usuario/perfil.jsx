import { useState, useEffect } from 'react';
import { obtenerPerfilUsuario, actualizarUsuario } from '../../api/usuarios';

const Perfil = () => {
  const [profile, setProfile] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userData = await obtenerPerfilUsuario(userId);
      setProfile(userData);
    } catch (err) {
      setError('Error al cargar el perfil');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userId = localStorage.getItem('userId');
      await actualizarUsuario(userId, profile);
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el perfil');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Mi Perfil</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nombre
          </label>
          <input
            type="text"
            name="nombre"
            value={profile.nombre}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
              !isEditing ? 'bg-gray-100' : ''
            }`}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={profile.email}
            disabled
            className="w-full px-3 py-2 border rounded-lg bg-gray-100"
          />
        </div>
        


        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Editar Perfil
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                loadUserProfile(); // Recargar datos originales
              }}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </form>

    </div>
  );
};

export default Perfil;