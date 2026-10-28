import { useState, useEffect } from 'react';

export type AppRoute = 'store' | 'admin';

function getInitialRoute(): AppRoute {
  if (typeof window === 'undefined') return 'store';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin') {
    return 'admin';
  }
  return 'store';
}

export function navigateTo(route: AppRoute) {
  if (typeof window === 'undefined') return;
  const targetPath = route === 'admin' ? '/admin' : '/';
  if (window.location.pathname !== targetPath) {
    window.history.pushState({ route }, '', targetPath);
  }
  // Dispatch custom event for immediate reactive re-render
  window.dispatchEvent(new Event('app_route_change'));
}

export function useCurrentRoute(): [AppRoute, (route: AppRoute) => void] {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(getInitialRoute());
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('app_route_change', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('app_route_change', handleRouteChange);
    };
  }, []);

  return [currentRoute, navigateTo];
}
