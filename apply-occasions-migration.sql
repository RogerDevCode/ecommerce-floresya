-- Apply occasions slug migration to Supabase
-- This SQL should be executed in the Supabase SQL editor

-- Add slug column to occasions table and populate with values
-- PostgreSQL compatible version

-- Step 1: Add the slug column to the existing table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'occasions'
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE public.occasions ADD COLUMN slug character varying;
    END IF;
END $$;

-- Step 2: Add unique constraint to slug column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'occasions'
        AND constraint_name = 'occasions_slug_unique'
    ) THEN
        ALTER TABLE public.occasions ADD CONSTRAINT occasions_slug_unique UNIQUE (slug);
    END IF;
END $$;

-- Step 3: Update existing occasions with appropriate slugs
UPDATE public.occasions
SET slug = CASE
  WHEN name = 'Sin ocasión específica' THEN 'sin-ocasion-especifica'
  WHEN name = 'Cumpleaños' THEN 'cumpleanos'
  WHEN name = 'Aniversario' THEN 'aniversario'
  WHEN name = 'San Valentín' THEN 'san-valentin'
  WHEN name = 'Día de la Madre' THEN 'dia-de-la-madre'
  WHEN name = 'Día del Padre' THEN 'dia-del-padre'
  WHEN name = 'Graduación' THEN 'graduacion'
  WHEN name = 'Condolencias' THEN 'condolencias'
  ELSE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '-'), 'á', 'a'), 'é', 'e'), 'í', 'i'))
END
WHERE slug IS NULL OR slug = '';

-- Step 4: Make slug column NOT NULL (after populating data)
ALTER TABLE public.occasions
ALTER COLUMN slug SET NOT NULL;

-- Step 5: Verify the update
SELECT id, name, slug, type, is_active
FROM public.occasions
ORDER BY display_order;