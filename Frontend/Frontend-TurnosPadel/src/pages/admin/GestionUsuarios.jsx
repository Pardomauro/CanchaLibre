import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { obtenerUsuarios, crearUsuario, eliminarUsuario } from '../../api/usuarios';
import ConfirmDialog from '../../components/accionesCriticas/ConfirmDialog';

const GestionUsuarios = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            setLoading(true);
            const data = await obtenerUsuarios(user?.token);
            setUsuarios(data);
            setError('');
        } catch (err) {
            console.error('Error cargando usuarios:', err);
            if (err?.status === 401) {
                setError('Sesión expirada o no autorizada. Volvé a iniciar sesión.');
                logout();
                navigate('/login', { replace: true });
            } else {
                setError(err?.message || 'Error al cargar los usuarios');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre || !formData.email || !formData.password) {
            alert('Por favor completa todos los campos');
            return;
        }

        if (formData.password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setSubmitting(true);
        try {
            await crearUsuario(formData);

            // Limpiar formulario
            setFormData({ nombre: '', email: '', password: '' });
            setShowCreateForm(false);

            // Recargar usuarios
            await cargarUsuarios();

            alert('Usuario creado exitosamente');
        } catch (err) {
            console.error('Error creando usuario:', err);
            alert(err.message || 'Error al crear el usuario');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEliminar = async (userId, nombreUsuario, emailUsuario) => {
        // Preparar datos para el modal de confirmación
        setUsuarioAEliminar({
            id_usuario: userId,
            nombre: nombreUsuario,
            email: emailUsuario
        });
        setShowConfirmDelete(true);
    };

    const confirmarEliminacion = async () => {
        if (!usuarioAEliminar) return;

        try {
            setShowConfirmDelete(false);
            setEliminando(usuarioAEliminar.id_usuario);

            // Eliminar del sistema
            await eliminarUsuario(usuarioAEliminar.id_usuario);

            // Recargar la lista de usuarios
            await cargarUsuarios();

            alert('Usuario eliminado exitosamente del sistema.');
        } catch (err) {
            console.error('Error eliminando usuario:', err);
            alert(err.message || 'Error al eliminar el usuario. Por favor, intenta de nuevo.');
        } finally {
            setEliminando(null);
            setUsuarioAEliminar(null);
        }
    };

    const cancelarEliminacion = () => {
        setShowConfirmDelete(false);
        setUsuarioAEliminar(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <svg className="animate-spin h-12 w-12 text-[#588157] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-[#3A5A40] font-semibold">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-[#588157] to-[#3A5A40] p-4 rounded-xl shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">
                                    Gestión de Usuarios
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    Administra los usuarios del sistema
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
                                showCreateForm
                                    ? 'bg-gray-500 hover:bg-gray-600 text-white'
                                    : 'bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white'
                            }`}
                        >
                            {showCreateForm ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancelar
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Crear Usuario
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mensaje de error */}
                {error && (
                    <div className="bg-white rounded-2xl shadow-xl p-5 mb-6 border-l-4 border-red-500">
                        <div className="flex items-start gap-3">
                            <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulario de creación */}
                {showCreateForm && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                            <div className="bg-gradient-to-br from-[#588157] to-[#3A5A40] p-3 rounded-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-[#3A5A40]">Crear Nuevo Usuario</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Nombre
                                            <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                        placeholder="Nombre completo"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Email
                                            <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                        placeholder="correo@ejemplo.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Contraseña
                                        <span className="text-red-500">*</span>
                                    </span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                    placeholder="Mínimo 6 caracteres"
                                    minLength="6"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    La contraseña debe tener al menos 6 caracteres
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold shadow-md transition-all duration-200 ${
                                        submitting
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white hover:shadow-lg transform hover:scale-[1.02]'
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Crear Usuario
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista de usuarios */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-[#DAD7CD] to-[#A3B18A] px-6 py-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#3A5A40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="font-bold text-[#3A5A40] text-lg">
                                Usuarios Registrados
                                <span className="ml-2 px-3 py-1 bg-white rounded-full text-sm">
                                    {usuarios.length}
                                </span>
                            </h3>
                        </div>
                    </div>

                    {usuarios.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] rounded-full mb-4">
                                <svg className="w-8 h-8 text-[#3A5A40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium">No hay usuarios registrados</p>
                            <p className="text-gray-400 text-sm mt-1">Crea el primer usuario usando el botón de arriba</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-[#3A5A40] uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                </svg>
                                                ID
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-[#3A5A40] uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Nombre
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-[#3A5A40] uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Email
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-[#3A5A40] uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                </svg>
                                                Acciones
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {usuarios.map((usuario) => (
                                        <tr key={usuario.id_usuario} className="hover:bg-gradient-to-r hover:from-[#DAD7CD]/20 hover:to-[#A3B18A]/20 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] rounded-lg text-sm font-bold text-[#3A5A40]">
                                                    {usuario.id_usuario}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-gradient-to-br from-[#588157] to-[#3A5A40] p-2 rounded-lg">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {usuario.nombre}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <svg className="w-4 h-4 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    {usuario.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleEliminar(usuario.id_usuario, usuario.nombre, usuario.email)}
                                                    disabled={eliminando === usuario.id_usuario}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all duration-200 ${
                                                        eliminando === usuario.id_usuario
                                                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                            : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg transform hover:scale-105'
                                                    }`}
                                                >
                                                    {eliminando === usuario.id_usuario ? (
                                                        <>
                                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Eliminando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Eliminar
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            {/* Modal de Confirmación para Eliminar Usuario */}
            {showConfirmDelete && usuarioAEliminar && (
                <ConfirmDialog
                    isOpen={showConfirmDelete}
                    onConfirm={confirmarEliminacion}
                    onCancel={cancelarEliminacion}
                    title="⚠️ Eliminar Usuario del Sistema"
                    message={
                        <div className="space-y-4">
                            <div className="border-l-4 border-red-500 pl-4">
                                <h4 className="font-semibold text-red-800 mb-3">
                                    ¿Estás seguro de eliminar este usuario del sistema?
                                </h4>

                                {/* Información del usuario */}
                                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                    <h5 className="font-medium text-gray-800 mb-2">Detalles del Usuario:</h5>
                                    <div className="space-y-1 text-sm text-gray-700">
                                        <p><span className="font-medium">ID:</span> {usuarioAEliminar.id_usuario}</p>
                                        <p><span className="font-medium">Nombre:</span> {usuarioAEliminar.nombre}</p>
                                        <p><span className="font-medium">Email:</span> {usuarioAEliminar.email}</p>
                                    </div>
                                </div>

                                {/* Advertencias críticas */}
                                <div className="bg-red-50 p-3 rounded-lg">
                                    <p className="font-medium text-red-800 mb-2">⚠️ Esta acción es IRREVERSIBLE</p>
                                    <ul className="space-y-1 text-sm text-red-700">
                                        <li>• El usuario será eliminado permanentemente del sistema</li>
                                        <li>• Se perderán todos los datos asociados al usuario</li>
                                        <li>• Se cancelarán todas sus reservas futuras automáticamente</li>
                                        <li>• Se conservará el historial de reservas pasadas por auditoría</li>
                                        <li>• El usuario no podrá volver a acceder al sistema</li>
                                        <li>• Se enviará una notificación automática por email</li>
                                        <li>• No se puede deshacer esta operación</li>
                                    </ul>
                                </div>

                                {/* Nota importante */}
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-800">
                                                <span className="font-medium">Nota:</span> Si solo necesitas desactivar temporalmente al usuario,
                                                considera usar la función de "suspensión" en lugar de eliminación permanente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center pt-2">
                                <p className="text-sm font-medium text-gray-800">
                                    Solo los administradores pueden realizar esta acción crítica
                                </p>
                            </div>
                        </div>
                    }
                    confirmText="Sí, Eliminar Usuario Definitivamente"
                    cancelText="Cancelar"
                    type="danger"
                />
            )}
            </div>
        </div>
    );
};

export default GestionUsuarios;