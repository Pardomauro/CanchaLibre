import { useState, useEffect } from 'react';
import { obtenerPerfilUsuario, actualizarUsuario } from '../../api/usuarios';
import { useAuth } from '../../context/AuthContext';

const Perfil = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState({
    nombre: '',
    email: '',
    celular: ''
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
      setProfile({
        nombre: userData?.nombre || '',
        email: userData?.email || '',
        celular: userData?.celular || ''
      });
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
      const usuarioActualizado = await actualizarUsuario(userId, {
        nombre: profile.nombre,
        email: profile.email,
        celular: profile.celular
      });

      setProfile({
        nombre: usuarioActualizado?.nombre || profile.nombre,
        email: usuarioActualizado?.email || profile.email,
        celular: usuarioActualizado?.celular || profile.celular
      });
      updateUser({
        nombre: usuarioActualizado?.nombre || profile.nombre,
        email: usuarioActualizado?.email || profile.email
      });
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#588157] to-[#3A5A40] mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent mb-2">
            Mi Perfil
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Gestiona tu información personal
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Nombre Completo
                </div>
              </label>
              <input
                type="text"
                name="nombre"
                value={profile.nombre}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm sm:text-base transition duration-200 ${
                  !isEditing 
                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
                    : 'bg-white focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent'
                }`}
                placeholder="Tu nombre completo"
              />
            </div>
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Correo Electrónico
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm sm:text-base transition duration-200 ${
                  !isEditing
                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                    : 'bg-white focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent'
                }`}
                placeholder="ejemplo@correo.com"
              />
              <p className="hidden">
                El correo electrónico no puede ser modificado
              </p>
            </div>

            {/* Celular Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11.04 11.04 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                  </svg>
                  Celular
                </div>
              </label>
              <input
                type="tel"
                name="celular"
                value={profile.celular}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm sm:text-base transition duration-200 ${
                  !isEditing
                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                    : 'bg-white focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent'
                }`}
                placeholder="Tu numero de celular"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-200">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#588157] to-[#3A5A40] hover:from-[#3A5A40] hover:to-[#344E41] text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Perfil
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-[#588157] to-[#3A5A40] hover:from-[#3A5A40] hover:to-[#344E41] text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSuccess('');
                      setError('');
                      loadUserProfile();
                    }}
                    className="flex-1 flex justify-center items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#3A5A40] mb-2">
                💡 Información
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Tu información personal está protegida y segura</li>
                <li>• Solo tú puedes ver y editar estos datos</li>
                <li>• El correo es usado para notificaciones importantes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
