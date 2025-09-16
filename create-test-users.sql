-- 🌸 FloresYa - Crear Usuarios de Prueba
-- Script para crear usuarios administrador y cliente para testing

-- Crear usuario ADMINISTRADOR
INSERT INTO public.users (
    email,
    password_hash,
    full_name,
    phone,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'admin@floresya.com',
    crypt('admin', gen_salt('bf')),
    'Administrador FloresYa',
    '+58412123456',
    'admin'::user_role,
    true,
    true,
    NOW(),
    NOW()
);

-- Crear usuario CLIENTE
INSERT INTO public.users (
    email,
    password_hash,
    full_name,
    phone,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'cliente@floresya.com',
    crypt('cliente', gen_salt('bf')),
    'Cliente de Prueba',
    '+58414765432',
    'user'::user_role,
    true,
    true,
    NOW(),
    NOW()
);

-- Verificar que los usuarios se crearon correctamente
SELECT
    id,
    email,
    full_name,
    role,
    is_active,
    email_verified,
    created_at
FROM public.users
WHERE email IN ('admin@floresya.com', 'cliente@floresya.com')
ORDER BY created_at DESC;

-- Información de login para testing
/*
INFORMACIÓN DE ACCESO PARA TESTING:

ADMINISTRADOR:
- Email: admin@floresya.com
- Password: admin
- Rol: admin
- Nombre: Administrador FloresYa

CLIENTE:
- Email: cliente@floresya.com
- Password: cliente
- Rol: user
- Nombre: Cliente de Prueba

Para verificar las contraseñas hasheadas, puedes usar:
SELECT email, password_hash FROM users WHERE email = 'admin@floresya.com';
*/