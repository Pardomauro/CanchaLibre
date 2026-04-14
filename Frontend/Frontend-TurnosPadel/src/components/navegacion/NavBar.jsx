import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, isAuthenticated, isAdmin } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const userMenuRef = useRef(null);
    const mobilePanelRef = useRef(null);

    const navItems = useMemo(() => {
        const items = [];
        if (isAdmin()) items.push({ to: '/admin', label: 'Admin' });
        items.push({ to: '/canchas', label: 'Canchas' });
        items.push({ to: '/reservas/historial', label: 'Reservas' });
        return items;
    }, [isAdmin]);

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        if (path === '/canchas') return location.pathname === '/canchas' || location.pathname.startsWith('/canchas/');
        if (path === '/admin') return location.pathname === '/admin' || location.pathname.startsWith('/admin/');
        if (path === '/reservas/historial') return location.pathname.startsWith('/reservas');
        return location.pathname === path;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
    };

    const closeUserMenu = () => {
        setIsUserMenuOpen(false);
    };

    useEffect(() => {
        // Cerrar menús al navegar
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
                setIsUserMenuOpen(false);
            }
        };

        const onPointerDown = (e) => {
            if (!isUserMenuOpen) return;
            const target = e.target;
            const root = userMenuRef.current;
            if (root && target instanceof Node && !root.contains(target)) {
                setIsUserMenuOpen(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('mousedown', onPointerDown);
        window.addEventListener('touchstart', onPointerDown, { passive: true });

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('touchstart', onPointerDown);
        };
    }, [isUserMenuOpen]);

    // No mostrar navbar en las páginas de autenticación
    if (location.pathname === '/login' || location.pathname === '/registro' || location.pathname === '/recuperar-password') {
        return null;
    }

    return (
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-[#588157] to-[#3A5A40] text-white shadow-lg shadow-black/10 backdrop-blur supports-[backdrop-filter]:bg-[#588157]/95 border-b border-white/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center gap-3">
                    {/* Brand */}
                    <Link
                        to="/"
                        className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        aria-label="Ir al inicio"
                    >
                        <img 
                            src="/logoSaaS.png" 
                            alt="Cancha Libre" 
                            className="h-10 w-auto object-contain"
                        />
                        <div className="leading-tight">
                            <div className="text-sm sm:text-base font-semibold tracking-tight">
                                <span className="hidden sm:inline">Cancha Libre</span>
                                <span className="sm:hidden">Cancha Libre</span>
                            </div>
                            <div className="hidden sm:block text-xs text-white/70">Gestión de espacios deportivos</div>
                        </div>
                    </Link>

                    {/* Desktop nav */}
                    {isAuthenticated() && (
                        <div className="hidden md:flex flex-1 items-center justify-center">
                            <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
                                {navItems.map((item) => {
                                    const active = isActive(item.to);
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            aria-current={active ? 'page' : undefined}
                                            className={
                                                `relative px-4 py-2 text-sm font-medium rounded-full transition-colors ` +
                                                (active
                                                    ? 'bg-white/20 text-white'
                                                    : 'text-white/80 hover:text-white hover:bg-white/10')
                                            }
                                        >
                                            {item.label}
                                            {active && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute left-4 right-4 -bottom-0.5 h-0.5 rounded-full bg-white/70"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Right side */}
                    {isAuthenticated() && (
                        <div className="ml-auto hidden md:flex items-center gap-2" ref={userMenuRef}>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={toggleUserMenu}
                                    aria-haspopup="menu"
                                    aria-expanded={isUserMenuOpen}
                                    className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm font-medium text-white/90 ring-1 ring-white/10 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10" aria-hidden="true">👤</span>
                                    <span>{isAdmin() ? 'Administrador' : 'Usuario'}</span>
                                    <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isUserMenuOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl ring-1 ring-black/5 z-50"
                                    >
                                        <div className="px-4 py-3">
                                            <div className="text-xs font-medium text-gray-500">Cuenta</div>
                                            <div className="text-sm font-semibold text-gray-800">
                                                {isAdmin() ? 'Administrador' : 'Usuario'}
                                            </div>
                                        </div>
                                        <div className="h-px bg-gray-100" />
                                        <Link
                                            to="/perfil"
                                            role="menuitem"
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                            onClick={closeUserMenu}
                                        >
                                            <span aria-hidden="true">👤</span>
                                            Mi Perfil
                                        </Link>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                        >
                                            <span aria-hidden="true">🚪</span>
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile menu button */}
                    {isAuthenticated() && (
                        <button
                            type="button"
                            onClick={toggleMobileMenu}
                            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                            aria-expanded={isMobileMenuOpen}
                            className="ml-auto md:hidden inline-flex items-center justify-center rounded-lg bg-white/5 p-2 ring-1 ring-white/10 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile overlay + panel (slide) */}
            {isAuthenticated() && (
                <>
                    {/* Overlay */}
                    <div
                        className={
                            `fixed inset-0 bg-black/50 transition-opacity md:hidden ` +
                            (isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
                        }
                        onClick={closeMobileMenu}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <div
                        ref={mobilePanelRef}
                        className={
                            `fixed top-0 right-0 h-full w-80 max-w-sm md:hidden bg-gradient-to-b from-[#3A5A40] to-[#344E41] text-white shadow-2xl ring-1 ring-white/10 transform transition-transform duration-300 ease-out ` +
                            (isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full')
                        }
                    >
                        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <img 
                                    src="/logoSaaS.png" 
                                    alt="Cancha Libre" 
                                    className="h-9 w-auto object-contain"
                                />
                                <div>
                                    <div className="text-sm font-semibold">Menú</div>
                                    <div className="text-xs text-white/70">Navegación rápida</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeMobileMenu}
                                className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                                aria-label="Cerrar menú"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-4 py-4">
                            <div className="space-y-2">
                                {navItems.map((item) => {
                                    const active = isActive(item.to);
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            aria-current={active ? 'page' : undefined}
                                            className={
                                                `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ring-1 ring-white/10 transition-colors ` +
                                                (active
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-white/5 text-white/85 hover:bg-white/10 hover:text-white')
                                            }
                                            onClick={closeMobileMenu}
                                        >
                                            <span>{item.label}</span>
                                            <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="mt-6 rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                                <div className="text-xs font-medium text-white/70">Sesión</div>
                                <div className="mt-1 text-sm font-semibold">{isAdmin() ? 'Administrador' : 'Usuario'}</div>
                                <div className="mt-4 space-y-2">
                                    <Link
                                        to="/perfil"
                                        className="flex items-center justify-center gap-2 w-full rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2.5 text-sm font-medium transition-colors"
                                        onClick={closeMobileMenu}
                                    >
                                        <span aria-hidden="true">👤</span>
                                        Mi Perfil
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600/90 hover:bg-red-600 px-3 py-2.5 text-sm font-medium transition-colors"
                                    >
                                        <span aria-hidden="true">🚪</span>
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}