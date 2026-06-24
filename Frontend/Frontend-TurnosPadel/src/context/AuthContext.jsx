import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar si hay un token guardado al cargar la aplicación
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');

        console.log('AuthContext - Datos encontrados en localStorage:', { token, userId, userRole, userName, userEmail });

        if (token && userId && userRole) {
            // Verificar si el token es válido (no es un token temporal de prueba)
            if (token === 'temp-token' || token.startsWith('admin-token-temp') || userId === 'admin-1') {
                console.log('AuthContext - Token temporal detectado, limpiando localStorage');
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
            } else {
                // TODO: En el futuro, validar token con el backend
                console.log('AuthContext - Estableciendo usuario como autenticado');
                setUser({
                    userId: userId,
                    role: userRole,
                    token: token,
                    nombre: userName,
                    email: userEmail
                });
            }
        } else {
            console.log('AuthContext - No hay datos válidos, usuario no autenticado');
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        // Normalizar los datos del usuario para el estado local
        const nombre = userData.user?.nombre || userData.nombre || '';
        const email = userData.user?.email || userData.email || '';

        setUser({
            ...userData,
            nombre,
            email
        });

        localStorage.setItem('token', userData.token);
        localStorage.setItem('userId', userData.userId);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userName', nombre);
        localStorage.setItem('userEmail', email);
    };

    const logout = () => {
        console.log('AuthContext - Ejecutando logout');
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
    };

    const updateUser = (userData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...userData
        }));

        if (userData.nombre !== undefined) {
            localStorage.setItem('userName', userData.nombre);
        }

        if (userData.email !== undefined) {
            localStorage.setItem('userEmail', userData.email);
        }
    };

    const isAuthenticated = () => {
        return !!user;
    };

    const isAdmin = () => {
        return user?.role === 'admin' || user?.role === 'administrador';
    };

    const value = {
        user,
        login,
        logout,
        updateUser,
        isAuthenticated,
        isAdmin,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
