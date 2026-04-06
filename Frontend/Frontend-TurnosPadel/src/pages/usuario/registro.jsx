import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrarUsuario } from '../../api/auth';

const Registro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.nombre || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    if (formData.nombre.length < 2 || formData.nombre.length > 100) {
      setError('El nombre debe tener entre 2 y 100 caracteres');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('El formato del email no es válido');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!/\d/.test(formData.password)) {
      setError('La contraseña debe contener al menos un número');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('La contraseña debe contener al menos una mayúscula');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Enviando datos de registro:', { 
        nombre: formData.nombre, 
        email: formData.email, 
        password: '***' 
      });
      
      const response = await registrarUsuario(formData.nombre, formData.email, formData.password);
      
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        alert('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
        navigate('/login');
      } else {
        setError(response.message || 'Error al registrar usuario');
      }
    } catch (err) {
      console.error('Error completo en registro:', err);
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nombre Completo
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Ingresa tu nombre completo"
            required
            minLength={2}
            maxLength={100}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="ejemplo@correo.com"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Mínimo 6 caracteres, 1 número y 1 mayúscula"
            required
            minLength={6}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Confirmar Contraseña
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Confirma tu contraseña"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {loading ? 'Registrando...' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-700">
            Iniciar Sesión
          </Link>
        </p>
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-600">
        <strong>Requisitos de contraseña:</strong>
        <ul className="list-disc list-inside mt-1">
          <li>Al menos 6 caracteres</li>
          <li>Al menos un número</li>
          <li>Al menos una letra mayúscula</li>
        </ul>
      </div>
    </div>
  );
};

export default Registro;