import { useState, useEffect } from 'react';
import { obtenerUsuarios, crearUsuario, eliminarUsuario } from '../../api/usuarios';
import ConfirmDialog from '../../components/accionesCriticas/ConfirmDialog';

const GestionUsuarios = () => {
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
            const data = await obtenerUsuarios();
            setUsuarios(data);
            setError('');
        } catch (err) {
            console.error('Error cargando usuarios:', err);
            setError('Error al cargar los usuarios');
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
        return <div className="text-center py-8">Cargando usuarios...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto mt-6 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {showCreateForm ? 'Cancelar' : 'Crear Usuario'}
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Formulario de creación */}
            {showCreateForm && (
                <div className="bg-white border rounded-lg p-6 mb-6 shadow">
                    <h3 className="text-lg font-semibold mb-4">Crear Nuevo Usuario</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Contraseña *
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                minLength="6"
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Mínimo 6 caracteres
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                {submitting ? 'Creando...' : 'Crear Usuario'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de usuarios */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                    <h3 className="font-semibold">Usuarios Registrados ({usuarios.length})</h3>
                </div>
                
                {usuarios.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        No hay usuarios registrados
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {usuarios.map((usuario) => (
                                    <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {usuario.id_usuario}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {usuario.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {usuario.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEliminar(usuario.id_usuario, usuario.nombre, usuario.email)}
                                                disabled={eliminando === usuario.id_usuario}
                                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                    eliminando === usuario.id_usuario 
                                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                                }`}
                                            >
                                                {eliminando === usuario.id_usuario ? '⏳ Eliminando...' : 'Eliminar Usuario'}
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
    );
};

export default GestionUsuarios;