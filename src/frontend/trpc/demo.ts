/**
 * 🌸 FloresYa tRPC Demo - Ejemplo de uso
 * ============================================
 * Demostración de cómo usar tRPC en componentes frontend
 * REEMPLAZA el uso del apiClient legacy
 */

import {
  useLogin,
  useRegister,
  useProducts,
  useOccasions,
  saveAuthData,
  clearAuthData,
  isAuthenticated
} from './index.js';

/**
 * EJEMPLO: Login con tRPC (reemplaza apiClient.login)
 */
export async function handleLoginDemo(email: string, password: string) {
  const { login } = useLogin();

  const result = await login(email, password);

  if (result.success) {
    const { token, user } = result.data.data;
    saveAuthData(token, user);
    console.log('✅ Login exitoso con tRPC');
    return { success: true, user };
  } else {
    const errorMessage = !result.success && 'error' in result ? result.error || 'Error desconocido' : 'Error desconocido';
    console.error('❌ Error de login:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * EJEMPLO: Obtener productos con tRPC (reemplaza apiClient.getProducts)
 */
export async function getProductsDemo() {
  const { getProducts } = useProducts();

  const result = await getProducts({
    page: 1,
    limit: 20,
    active: true
  });

  if (result.success) {
    const { products, pagination } = result.data.data;
    console.log('✅ Productos obtenidos con tRPC:', products.length);
    return { products, pagination };
  } else {
    const errorMessage = !result.success && 'error' in result ? result.error || 'Error desconocido' : 'Error desconocido';
    console.error('❌ Error obteniendo productos:', errorMessage);
    return null;
  }
}

/**
 * EJEMPLO: Obtener ocasiones con tRPC (reemplaza apiClient.getOccasions)
 */
export async function getOccasionsDemo() {
  const { getOccasions } = useOccasions();

  const result = await getOccasions();

  if (result.success) {
    const occasions = result.data.data;
    console.log('✅ Ocasiones obtenidas con tRPC:', occasions.length);
    return occasions;
  } else {
    const errorMessage = !result.success && 'error' in result ? result.error || 'Error desconocido' : 'Error desconocido';
    console.error('❌ Error obteniendo ocasiones:', errorMessage);
    return [];
  }
}

/**
 * EJEMPLO: Registro con tRPC (reemplaza apiClient.register)
 */
export async function handleRegisterDemo(userData: {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}) {
  const { register } = useRegister();

  const result = await register(userData);

  if (result.success) {
    const { token, user } = result.data.data;
    saveAuthData(token, user);
    console.log('✅ Registro exitoso con tRPC');
    return { success: true, user };
  } else {
    const errorMessage = !result.success && 'error' in result ? result.error || 'Error desconocido' : 'Error desconocido';
    console.error('❌ Error de registro:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * EJEMPLO: Logout
 */
export function handleLogoutDemo() {
  clearAuthData();
  console.log('✅ Logout completado');
}

/**
 * EJEMPLO: Verificar autenticación
 */
export function checkAuthDemo() {
  return isAuthenticated();
}

// Hacer disponible globalmente para pruebas
if (typeof window !== 'undefined') {
  (window as any).tRPCDemo = {
    handleLogin: handleLoginDemo,
    getProducts: getProductsDemo,
    getOccasions: getOccasionsDemo,
    handleRegister: handleRegisterDemo,
    handleLogout: handleLogoutDemo,
    checkAuth: checkAuthDemo,
  };

  console.log('🚀 tRPC Demo available at window.tRPCDemo');
  console.log('Usage examples:');
  console.log('  await window.tRPCDemo.handleLogin("admin@floresya.com", "password123")');
  console.log('  await window.tRPCDemo.getProducts()');
  console.log('  await window.tRPCDemo.getOccasions()');
}