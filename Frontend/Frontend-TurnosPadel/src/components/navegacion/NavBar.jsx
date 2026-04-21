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
        <>
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-[#588157] via-[#3A5A40] to-[#344E41] text-white shadow-xl shadow-black/20 backdrop-blur-md supports-[backdrop-filter]:bg-[#588157]/95 border-b border-[#DAD7CD]/20">
            <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3">
                    {/* Brand */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 sm:gap-3 rounded-lg px-2 py-1 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAD7CD]/50"
                        aria-label="Ir al inicio"
                    >
                        <img 
                            src="/logoSaaS.png" 
                            alt="Cancha Libre" 
                            className="h-8 sm:h-10 w-auto object-contain"
                        />
                        <div className="leading-tight">
                            <div className="text-sm sm:text-base font-bold tracking-tight text-white">
                                Cancha Libre
                            </div>
                            <div className="hidden md:block text-xs text-[#DAD7CD]/90 font-medium">Gestión de espacios deportivos</div>
                        </div>
                    </Link>

                    {/* Desktop nav */}
                    {isAuthenticated() && (
                        <div className="hidden md:flex flex-1 items-center justify-center">
                            <div className="flex items-center gap-1 rounded-full bg-[#344E41]/50 p-1.5 ring-1 ring-[#DAD7CD]/20 shadow-inner">
                                {navItems.map((item) => {
                                    const active = isActive(item.to);
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            aria-current={active ? 'page' : undefined}
                                            className={
                                                `relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ` +
                                                (active
                                                    ? 'bg-[#DAD7CD] text-[#3A5A40] shadow-md'
                                                    : 'text-[#DAD7CD]/90 hover:text-white hover:bg-white/15')
                                            }
                                        >
                                            {item.label}
                                            {active && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute left-4 right-4 -bottom-0.5 h-0.5 rounded-full bg-[#3A5A40]"
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
                                    className="flex items-center gap-2 rounded-full bg-[#344E41]/60 px-3 py-2 text-sm font-semibold text-[#DAD7CD] ring-1 ring-[#DAD7CD]/30 hover:bg-[#344E41] hover:text-white hover:ring-[#DAD7CD]/50 transition-all duration-200 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAD7CD]/50"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DAD7CD]/20 ring-1 ring-[#DAD7CD]/30" aria-hidden="true">👤</span>
                                    <span>{isAdmin() ? 'Administrador' : 'Usuario'}</span>
                                    <svg className="w-4 h-4 text-[#DAD7CD]/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isUserMenuOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-[#588157]/20 z-50"
                                    >
                                        <div className="px-4 py-3 bg-gradient-to-r from-[#DAD7CD]/40 to-[#A3B18A]/40">
                                            <div className="text-xs font-semibold text-[#588157]/70">Cuenta</div>
                                            <div className="text-sm font-bold text-[#3A5A40]">
                                                {isAdmin() ? 'Administrador' : 'Usuario'}
                                            </div>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-[#588157]/20 to-[#A3B18A]/20" />
                                        <Link
                                            to="/perfil"
                                            role="menuitem"
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#3A5A40] hover:bg-[#DAD7CD]/30 hover:text-[#588157] focus:bg-[#DAD7CD]/30 focus:outline-none transition-colors"
                                            onClick={closeUserMenu}
                                        >
                                            <span aria-hidden="true">👤</span>
                                            Mi Perfil
                                        </Link>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-rose-50 hover:text-red-700 focus:bg-rose-50 focus:outline-none transition-colors"
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
                            className="ml-auto md:hidden inline-flex items-center justify-center rounded-lg bg-[#344E41]/60 p-2 ring-1 ring-[#DAD7CD]/30 hover:bg-[#344E41] hover:ring-[#DAD7CD]/50 transition-all duration-200 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAD7CD]/50"
                        >
                            <svg className="w-6 h-6 text-[#DAD7CD]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={2.5}>
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </nav>

            {/* Mobile overlay + panel (slide) - Outside nav for proper z-index */}
            {isAuthenticated() && (
                <>
                    {/* Overlay */}
                    <div
                        className={
                            `fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ` +
                            (isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
                        }
                        onClick={closeMobileMenu}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <div
                        ref={mobilePanelRef}
                        className={
                            `fixed top-0 right-0 h-full w-[85vw] max-w-sm z-[70] md:hidden bg-gradient-to-br from-[#588157] via-[#3A5A40] to-[#344E41] text-white shadow-2xl ring-1 ring-[#DAD7CD]/20 transform transition-transform duration-300 ease-out overflow-y-auto ` +
                            (isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full')
                        }
                    >
                        <div className="flex items-center justify-between px-4 h-14 sm:h-16 border-b border-[#DAD7CD]/20 bg-gradient-to-r from-[#344E41] to-[#3A5A40] sticky top-0 z-20">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <img 
                                    src="/logoSaaS.png" 
                                    alt="Cancha Libre" 
                                    className="h-8 sm:h-9 w-auto object-contain"
                                />
                                <div>
                                    <div className="text-sm font-bold text-[#DAD7CD]">Menú</div>
                                    <div className="text-xs text-[#DAD7CD]/80 font-medium">Navegación rápida</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeMobileMenu}
                                className="rounded-lg bg-[#DAD7CD]/10 p-2 ring-1 ring-[#DAD7CD]/30 hover:bg-[#DAD7CD]/20 hover:ring-[#DAD7CD]/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAD7CD]/50"
                                aria-label="Cerrar menú"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#DAD7CD]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-3 sm:px-4 py-4 sm:py-5">
                            <div className="space-y-2">
                                {navItems.map((item) => {
                                    const active = isActive(item.to);
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            aria-current={active ? 'page' : undefined}
                                            className={
                                                `flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl text-sm font-semibold ring-1 transition-all duration-200 ` +
                                                (active
                                                    ? 'bg-[#DAD7CD] text-[#3A5A40] ring-[#DAD7CD]/30 shadow-lg'
                                                    : 'bg-[#344E41]/40 text-[#DAD7CD]/90 ring-[#DAD7CD]/10 hover:bg-[#344E41] hover:text-white hover:ring-[#DAD7CD]/30 hover:shadow-md')
                                            }
                                            onClick={closeMobileMenu}
                                        >
                                            <span>{item.label}</span>
                                            <svg className={`w-4 h-4 ${active ? 'text-[#3A5A40]' : 'text-[#DAD7CD]/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="mt-5 sm:mt-6 rounded-xl bg-gradient-to-br from-[#344E41]/60 to-[#344E41]/40 ring-1 ring-[#DAD7CD]/20 p-3 sm:p-4 shadow-lg">
                                <div className="text-xs font-bold text-[#DAD7CD]/70 uppercase tracking-wider">Sesión Activa</div>
                                <div className="mt-1 text-sm font-bold text-[#DAD7CD] flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-[#A3B18A] shadow-lg"></span>
                                    {isAdmin() ? 'Administrador' : 'Usuario'}
                                </div>
                                <div className="mt-4 space-y-2">
                                    <Link
                                        to="/perfil"
                                        className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#DAD7CD]/20 hover:bg-[#DAD7CD]/30 border border-[#DAD7CD]/30 hover:border-[#DAD7CD]/50 px-3 py-2.5 text-sm font-semibold text-[#DAD7CD] hover:text-white transition-all duration-200 shadow-md hover:shadow-lg"
                                        onClick={closeMobileMenu}
                                    >
                                        <span aria-hidden="true">👤</span>
                                        Mi Perfil
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-3 py-2.5 text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg"
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
        </>
    );
}