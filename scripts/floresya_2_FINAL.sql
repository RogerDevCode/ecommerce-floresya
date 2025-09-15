-- 🌸 FloresYa 2.0 FINAL Product Images SQL Script
-- CORRECTED VERSION: Fixed is_primary logic to satisfy unique constraint
-- Key Changes: 
--   - Added unique constraint: only ONE primary image per product
--   - Fixed is_primary logic: only image_index=1, size='thumb' is primary
--   - Result: 14 primary images (true), 146 non-primary (false), 160 total

-- Create enum type and corrected table structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'image_size'
  ) THEN
    CREATE TYPE image_size AS ENUM ('thumb', 'small', 'medium', 'large');
  END IF;
END$$;

-- Eliminar la tabla si existe
DROP TABLE IF EXISTS public.product_images;

-- Crear la tabla con las restricciones necesarias
CREATE TABLE public.product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_index INTEGER NOT NULL CHECK (image_index > 0),
    size image_size NOT NULL,
    url TEXT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    mime_type VARCHAR(50) NOT NULL DEFAULT 'image/webp',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, image_index, size)
);

-- Crear índices para mayor rendimiento (correcto uso de IF NOT EXISTS solo en CREATE INDEX desde PostgreSQL 9.5+)
CREATE INDEX IF NOT EXISTS idx_product_images_product_id 
ON public.product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_product_images_primary 
ON public.product_images(product_id, is_primary) 
WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_product_images_size 
ON public.product_images(size);

-- Restricción única para permitir solo una imagen primaria por producto
CREATE UNIQUE INDEX idx_product_images_only_one_primary 
ON public.product_images (product_id) 
WHERE is_primary = true;

-- Product 1 (4 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(1, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_1_1_2936bd98a01c34ea9a24d536299084682e5800dcc182ff6838b948469d10f626.webp', '2936bd98a01c34ea9a24d536299084682e5800dcc182ff6838b948469d10f626', 'image/webp', true),
(1, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_1_1_76d59fb1ffab75b97d610f295195d6266c6b9bcb875748ffc19b526d4cef3163.webp', '76d59fb1ffab75b97d610f295195d6266c6b9bcb875748ffc19b526d4cef3163', 'image/webp', false),
(1, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_1_1_36804f18956f620cd8e7c7368413ac9e1f051e700fa1cb5f2f66784d43c655df.webp', '36804f18956f620cd8e7c7368413ac9e1f051e700fa1cb5f2f66784d43c655df', 'image/webp', false),
(1, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_1_1_17e2d03c735674d8fd1770a7f042573f6ca5a4bf25d1bad7bfa76b72c9033881.webp', '17e2d03c735674d8fd1770a7f042573f6ca5a4bf25d1bad7bfa76b72c9033881', 'image/webp', false),
(1, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_1_2_121abfe695774fc594f0056334b072a3d17c36f25a4b5abd7c29e3b4853ebe9f.webp', '121abfe695774fc594f0056334b072a3d17c36f25a4b5abd7c29e3b4853ebe9f', 'image/webp', false),
(1, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_1_2_7504e5d30ba2e687648d55d6b87e779657b428e87fa3d4ea3feb25ad120a8651.webp', '7504e5d30ba2e687648d55d6b87e779657b428e87fa3d4ea3feb25ad120a8651', 'image/webp', false),
(1, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_1_2_c6f916367239f90ed029922cff97bba9ea436df25a2d59b09c0b9c6577719cfc.webp', 'c6f916367239f90ed029922cff97bba9ea436df25a2d59b09c0b9c6577719cfc', 'image/webp', false),
(1, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_1_2_90b58d2a3bb547c632b69b932b8fcdf6811362464549b8837ab5aa65b912f88e.webp', '90b58d2a3bb547c632b69b932b8fcdf6811362464549b8837ab5aa65b912f88e', 'image/webp', false),
(1, 3, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_1_3_a151c415a32d9bb2ab5306fd912fc91fd0a57bf51782a4dd13ef18f9a0d01b12.webp', 'a151c415a32d9bb2ab5306fd912fc91fd0a57bf51782a4dd13ef18f9a0d01b12', 'image/webp', false),
(1, 3, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_1_3_52fbe4997911472083dcd981f1b98ed864ae4e138b18a8fc48828af5ed9b06e2.webp', '52fbe4997911472083dcd981f1b98ed864ae4e138b18a8fc48828af5ed9b06e2', 'image/webp', false),
(1, 3, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_1_3_4ba58ceaa61591260d6f2104db956832e3c2c58fc743ba7e3905936afbfedef5.webp', '4ba58ceaa61591260d6f2104db956832e3c2c58fc743ba7e3905936afbfedef5', 'image/webp', false),
(1, 3, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_1_3_65da340aff6eeb1a5e1c16a682bc7c52fc5a877dcadc09033af89fee3e3e8184.webp', '65da340aff6eeb1a5e1c16a682bc7c52fc5a877dcadc09033af89fee3e3e8184', 'image/webp', false),
(1, 4, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_1_4_85b9acb2c86827d6ef9dff962771ed6bec60b8365e3a8559fb40d49cb435ef4e.webp', '85b9acb2c86827d6ef9dff962771ed6bec60b8365e3a8559fb40d49cb435ef4e', 'image/webp', false),
(1, 4, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_1_4_99caa2561439b2481b073c4521b2c3291b0d6cafb625812d6173cec2462a3d8f.webp', '99caa2561439b2481b073c4521b2c3291b0d6cafb625812d6173cec2462a3d8f', 'image/webp', false),
(1, 4, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_1_4_41312e60b2846416d680df06ca072cdf544b49dfeac8fdb09be544cf4b74d9fe.webp', '41312e60b2846416d680df06ca072cdf544b49dfeac8fdb09be544cf4b74d9fe', 'image/webp', false),
(1, 4, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_1_4_ef3d8dd703b989b15baf319626ec0d6c3377f99c6b7032c4d7070f47fa586260.webp', 'ef3d8dd703b989b15baf319626ec0d6c3377f99c6b7032c4d7070f47fa586260', 'image/webp', false);

-- Product 2 (3 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(2, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_2_1_2b2c7b9194319bca9cab16343905d8921fac927f134fa6b685fc7966a27db041.webp', '2b2c7b9194319bca9cab16343905d8921fac927f134fa6b685fc7966a27db041', 'image/webp', true),
(2, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_2_1_da5d332dd4dc197d82b54510415674b8568a026d0a258ca29064365db2a2db5d.webp', 'da5d332dd4dc197d82b54510415674b8568a026d0a258ca29064365db2a2db5d', 'image/webp', false),
(2, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_2_1_ba1098ffbe48cd9e89fd4e4467dcbd667c91827e9034a8d663af66336f11795a.webp', 'ba1098ffbe48cd9e89fd4e4467dcbd667c91827e9034a8d663af66336f11795a', 'image/webp', false),
(2, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_2_1_ac1439cdc3783a9105eec13dac3eeaecea6bff84ac58daf32f2006e044bfacb3.webp', 'ac1439cdc3783a9105eec13dac3eeaecea6bff84ac58daf32f2006e044bfacb3', 'image/webp', false),
(2, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_2_2_6774f76e865f3fe05b7664f78bac5d4ecc76eb14f000bc5892007be29c78c80d.webp', '6774f76e865f3fe05b7664f78bac5d4ecc76eb14f000bc5892007be29c78c80d', 'image/webp', false),
(2, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_2_2_4c089bcd67d7d6961bb232eda290dd6f5e32fba2fd7e83dacd7924502e2f45b9.webp', '4c089bcd67d7d6961bb232eda290dd6f5e32fba2fd7e83dacd7924502e2f45b9', 'image/webp', false),
(2, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_2_2_6b1099b95f71ea23e3dd2b877a4a9d2ee7e32d52f55cb5da78ca6dbcd0333a0f.webp', '6b1099b95f71ea23e3dd2b877a4a9d2ee7e32d52f55cb5da78ca6dbcd0333a0f', 'image/webp', false),
(2, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_2_2_1c2252a79ee507ee099618f91aa0d79353d3758b923fa4adb0ab24d4fa59ea9b.webp', '1c2252a79ee507ee099618f91aa0d79353d3758b923fa4adb0ab24d4fa59ea9b', 'image/webp', false),
(2, 3, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_2_3_a78dea84ccfc929d9d86af0fde12d719c291817b0c8c70198c1831579f4e7b52.webp', 'a78dea84ccfc929d9d86af0fde12d719c291817b0c8c70198c1831579f4e7b52', 'image/webp', false),
(2, 3, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_2_3_f309a553db3f51393052b79ba96ff64a2563bbd9e5bd6c032ea88af82d41838c.webp', 'f309a553db3f51393052b79ba96ff64a2563bbd9e5bd6c032ea88af82d41838c', 'image/webp', false),
(2, 3, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_2_3_ec74fb16f87fe71d5e13e3e52ade42d815a9a84fb49788bfd32b7dd472f2917e.webp', 'ec74fb16f87fe71d5e13e3e52ade42d815a9a84fb49788bfd32b7dd472f2917e', 'image/webp', false),
(2, 3, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_2_3_ec9ce4c3217c4fa5962fe566e6626356582d47ebccb0762fe5a8eeec4f29c859.webp', 'ec9ce4c3217c4fa5962fe566e6626356582d47ebccb0762fe5a8eeec4f29c859', 'image/webp', false);

-- Product 3 (2 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(3, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_3_1_883505ae6858cd9ac95ea81c50d9fa287e4aac7a72afdef291107c39aba80339.webp', '883505ae6858cd9ac95ea81c50d9fa287e4aac7a72afdef291107c39aba80339', 'image/webp', true),
(3, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_3_1_ad2b977382aeba1e01926b43a4efd2f44c1ba863627bb6dafaa03c8b3c9c7ee5.webp', 'ad2b977382aeba1e01926b43a4efd2f44c1ba863627bb6dafaa03c8b3c9c7ee5', 'image/webp', false),
(3, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_3_1_4f063ea1e9f6c6277beab7cf30187998f7a2ca199216e24068081487bcc77de8.webp', '4f063ea1e9f6c6277beab7cf30187998f7a2ca199216e24068081487bcc77de8', 'image/webp', false),
(3, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_3_1_a54078e720522a6433aa98246b29ea1568f9af6bd520351486f4142c53d239cf.webp', 'a54078e720522a6433aa98246b29ea1568f9af6bd520351486f4142c53d239cf', 'image/webp', false),
(3, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_3_2_1833d93b627b5e211c5847130bcb5b3f351f73ef4827307d944808efaa2feb7b.webp', '1833d93b627b5e211c5847130bcb5b3f351f73ef4827307d944808efaa2feb7b', 'image/webp', false),
(3, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_3_2_26ce64bc2a3d6c4aa8a320fa2383405e577a52163df585b8e775487e6888de9a.webp', '26ce64bc2a3d6c4aa8a320fa2383405e577a52163df585b8e775487e6888de9a', 'image/webp', false),
(3, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_3_2_bb67cae0829f02c90483bed65d86321490ea0f9f32d209cc88fbc771b5a3421d.webp', 'bb67cae0829f02c90483bed65d86321490ea0f9f32d209cc88fbc771b5a3421d', 'image/webp', false),
(3, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_3_2_275afc6a8363b280e00a80f85fd338e5e25d6d10be6ffc3a935093eedb6e67bb.webp', '275afc6a8363b280e00a80f85fd338e5e25d6d10be6ffc3a935093eedb6e67bb', 'image/webp', false);

-- Product 4 (3 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(4, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_4_1_ebb8d452480906230b9d07be4530b4897ed9fe804d2fb24963a789899b12c699.webp', 'ebb8d452480906230b9d07be4530b4897ed9fe804d2fb24963a789899b12c699', 'image/webp', true),
(4, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_4_1_6015a9865025338e4918005e2c3bae05d17c33e461b6e5a7c95922c48b439be0.webp', '6015a9865025338e4918005e2c3bae05d17c33e461b6e5a7c95922c48b439be0', 'image/webp', false),
(4, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_4_1_090b640769811144dc33e028c1de5f833d658c69f1de686b26501a7cfb083b86.webp', '090b640769811144dc33e028c1de5f833d658c69f1de686b26501a7cfb083b86', 'image/webp', false),
(4, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_4_1_7b23c0e6c08d32c2650e6018b6962be17aaa638d367acb87f879f1eb080d9b45.webp', '7b23c0e6c08d32c2650e6018b6962be17aaa638d367acb87f879f1eb080d9b45', 'image/webp', false),
(4, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_4_2_98bf88eed757c7557c1b23e33d724342a304c4a104f9adb1ab42a7a3ed38a33d.webp', '98bf88eed757c7557c1b23e33d724342a304c4a104f9adb1ab42a7a3ed38a33d', 'image/webp', false),
(4, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_4_2_fc42beec8f35cafaf394f0e8afce3b92d225bd8258347930be1fb0f78af6d7a2.webp', 'fc42beec8f35cafaf394f0e8afce3b92d225bd8258347930be1fb0f78af6d7a2', 'image/webp', false),
(4, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_4_2_d89368be2cf2834865c13d307663144d2fc2951ed20b6ca69c4fd595b857bd59.webp', 'd89368be2cf2834865c13d307663144d2fc2951ed20b6ca69c4fd595b857bd59', 'image/webp', false),
(4, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_4_2_04eb4768eb6cb84374d23528fb5d5330b3683c850105a2efa17a94cebc4c00e7.webp', '04eb4768eb6cb84374d23528fb5d5330b3683c850105a2efa17a94cebc4c00e7', 'image/webp', false),
(4, 3, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_4_3_343baf888fa6ffa9421984b91e58f168753377b25eec7c887ff57a2416907e17.webp', '343baf888fa6ffa9421984b91e58f168753377b25eec7c887ff57a2416907e17', 'image/webp', false),
(4, 3, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_4_3_9107a2d260fd51b110e5e29115ac5599865874b49caef619fa59d5a4e7c2654f.webp', '9107a2d260fd51b110e5e29115ac5599865874b49caef619fa59d5a4e7c2654f', 'image/webp', false),
(4, 3, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_4_3_2ffa2c17f9675eb7e195991ab5e0f72f61480f0f34facde6fde3b62b6037ec78.webp', '2ffa2c17f9675eb7e195991ab5e0f72f61480f0f34facde6fde3b62b6037ec78', 'image/webp', false),
(4, 3, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_4_3_703f65845872a02e72e1516bbe174f24a8f7ed609afcded31747857ce05ff309.webp', '703f65845872a02e72e1516bbe174f24a8f7ed609afcded31747857ce05ff309', 'image/webp', false);

-- Product 5 (2 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(5, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_5_1_e79dd78c69f512c2646edaffd1dba255efd8ad207c20011f7d9b6d37a7c6a350.webp', 'e79dd78c69f512c2646edaffd1dba255efd8ad207c20011f7d9b6d37a7c6a350', 'image/webp', true),
(5, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_5_1_0aabb489cc0a81b2a4b7f10d1160d4b9a25d7f713dc1e40e556a07c9647e2381.webp', '0aabb489cc0a81b2a4b7f10d1160d4b9a25d7f713dc1e40e556a07c9647e2381', 'image/webp', false),
(5, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_5_1_b83475b1cf7da35e853530c1d5650193bde6a460c8400162e28b74679d4a7086.webp', 'b83475b1cf7da35e853530c1d5650193bde6a460c8400162e28b74679d4a7086', 'image/webp', false),
(5, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_5_1_a94420c5792bf1f5a2447f471b8bb6adfb2500a5ae395bceacd50698a340cc07.webp', 'a94420c5792bf1f5a2447f471b8bb6adfb2500a5ae395bceacd50698a340cc07', 'image/webp', false),
(5, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_5_2_08d8716736e3a17b03a2c65a649050e5ff5f170cc330ee3e265dd8e32ef5de31.webp', '08d8716736e3a17b03a2c65a649050e5ff5f170cc330ee3e265dd8e32ef5de31', 'image/webp', false),
(5, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_5_2_95812a72d016e2e8715756a1da69bf455da9ab8ffa9cc72a1d3c0cba6fc5ebc7.webp', '95812a72d016e2e8715756a1da69bf455da9ab8ffa9cc72a1d3c0cba6fc5ebc7', 'image/webp', false),
(5, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_5_2_eb261efb6cc0c9451a70aaf8f27fd46491588efbc9445630abbeda48ba49735d.webp', 'eb261efb6cc0c9451a70aaf8f27fd46491588efbc9445630abbeda48ba49735d', 'image/webp', false),
(5, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_5_2_735540ce4a1b90812851f0a873c4a0005da6bc3fbba4c6b662cd800387d50855.webp', '735540ce4a1b90812851f0a873c4a0005da6bc3fbba4c6b662cd800387d50855', 'image/webp', false);

-- Product 6 (1 image) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(6, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_6_1_74ca4ea9fd1a81b134f1964534ce8aa3330d11cb2cd97b56ab40d9a12dac80fb.webp', '74ca4ea9fd1a81b134f1964534ce8aa3330d11cb2cd97b56ab40d9a12dac80fb', 'image/webp', true),
(6, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_6_1_0eb9cf038d78f57935b313c1bec77531dc05fe270eae30c9c0b79b67f6d028fa.webp', '0eb9cf038d78f57935b313c1bec77531dc05fe270eae30c9c0b79b67f6d028fa', 'image/webp', false),
(6, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_6_1_d154082d5d4365e86084b0a105b7a31efe5dd32d0de46103946536f8f503457e.webp', 'd154082d5d4365e86084b0a105b7a31efe5dd32d0de46103946536f8f503457e', 'image/webp', false),
(6, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_6_1_28c156112854440297676d63d390f07d6d2823f52d191c7eeacb7f47b8bdd256.webp', '28c156112854440297676d63d390f07d6d2823f52d191c7eeacb7f47b8bdd256', 'image/webp', false);

-- Product 7 (4 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(7, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_7_1_bc51a8756209f5999488a668b80afab08fdba97194d7e786bfdb43016de9f944.webp', 'bc51a8756209f5999488a668b80afab08fdba97194d7e786bfdb43016de9f944', 'image/webp', true),
(7, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_7_1_fb27412304eedaaadf2be171185177ca54ed8297ecf8122f1ff9cbc8922f5ac5.webp', 'fb27412304eedaaadf2be171185177ca54ed8297ecf8122f1ff9cbc8922f5ac5', 'image/webp', false),
(7, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_7_1_ad725efb7ce7669d9064c3ad5cd829c1e572accb44c61d1ef7945145a52e86ae.webp', 'ad725efb7ce7669d9064c3ad5cd829c1e572accb44c61d1ef7945145a52e86ae', 'image/webp', false),
(7, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_7_1_2d109697081bea3d10c57431479648e9c908d9a3fe25fe6092fbfbe5f3e12b43.webp', '2d109697081bea3d10c57431479648e9c908d9a3fe25fe6092fbfbe5f3e12b43', 'image/webp', false),
(7, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_7_2_b92bee7b4d50e5d20eb8a7f7356bce7739cb91eabaa7f4d1990ad4e41dcefe41.webp', 'b92bee7b4d50e5d20eb8a7f7356bce7739cb91eabaa7f4d1990ad4e41dcefe41', 'image/webp', false),
(7, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_7_2_28a699290b8f079e6ef9378fa742393380ad2c19845f0737b198caf01272247b.webp', '28a699290b8f079e6ef9378fa742393380ad2c19845f0737b198caf01272247b', 'image/webp', false),
(7, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_7_2_f4c2047a4cf2f77de76ff8c51447eae5f01f24253abef84521a0f3ee08363e15.webp', 'f4c2047a4cf2f77de76ff8c51447eae5f01f24253abef84521a0f3ee08363e15', 'image/webp', false),
(7, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_7_2_5a31789270fc9364641e5823ae7df6ccdcf78691ecf122875c2fff50418fca38.webp', '5a31789270fc9364641e5823ae7df6ccdcf78691ecf122875c2fff50418fca38', 'image/webp', false),
(7, 3, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_7_3_20db3cca47ad2c72b99a518419b6e95aa096fcf7468deacc5c20ff050d88ac91.webp', '20db3cca47ad2c72b99a518419b6e95aa096fcf7468deacc5c20ff050d88ac91', 'image/webp', false),
(7, 3, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_7_3_f9ce9d53e579444ebac181ddb9ec547480cfc3dc0d18e7cc7ffb8df7337ec2ec.webp', 'f9ce9d53e579444ebac181ddb9ec547480cfc3dc0d18e7cc7ffb8df7337ec2ec', 'image/webp', false),
(7, 3, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_7_3_ad0495372bcc646bc7a524eeea180d3384d98a8d619f2a1e8ab7a2af2e571482.webp', 'ad0495372bcc646bc7a524eeea180d3384d98a8d619f2a1e8ab7a2af2e571482', 'image/webp', false),
(7, 3, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_7_3_f43a3636e3f93d9c15beab832ddb3e1895c896df585732d84f2f55f3f8d5c82f.webp', 'f43a3636e3f93d9c15beab832ddb3e1895c896df585732d84f2f55f3f8d5c82f', 'image/webp', false),
(7, 4, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_7_4_b2225becc4d0f5f342afe8d5941c37857e26a8d471455527963f453f9e16d33b.webp', 'b2225becc4d0f5f342afe8d5941c37857e26a8d471455527963f453f9e16d33b', 'image/webp', false),
(7, 4, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_7_4_587e1ff9ebe91e65d6b8bee6f45645801b15af24e17d9c399ead34d25b414785.webp', '587e1ff9ebe91e65d6b8bee6f45645801b15af24e17d9c399ead34d25b414785', 'image/webp', false),
(7, 4, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_7_4_e10dcb1c5babee8a453f4e2634efbe15182338c6fceb581e229f7dc583d1bc55.webp', 'e10dcb1c5babee8a453f4e2634efbe15182338c6fceb581e229f7dc583d1bc55', 'image/webp', false),
(7, 4, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_7_4_4e4ae2d7a1cf1603aef25657961057884962e30488a74e90b1cf6e840cb23141.webp', '4e4ae2d7a1cf1603aef25657961057884962e30488a74e90b1cf6e840cb23141', 'image/webp', false);

-- Product 8 (1 image) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(8, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_8_1_5e53d9e3ac093ed5e918de80d3c34b8a4fdef65ee114e6979dd708605be27c31.webp', '5e53d9e3ac093ed5e918de80d3c34b8a4fdef65ee114e6979dd708605be27c31', 'image/webp', true),
(8, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_8_1_f0038a4eeae5fddb0b8929787693b1bd8c5f6f6b0440de60bb9b900a01f53afd.webp', 'f0038a4eeae5fddb0b8929787693b1bd8c5f6f6b0440de60bb9b900a01f53afd', 'image/webp', false),
(8, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_8_1_48538198bedad4e2785b2694574a16f3b623a166f2a77a08642a4dbadf020025.webp', '48538198bedad4e2785b2694574a16f3b623a166f2a77a08642a4dbadf020025', 'image/webp', false),
(8, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_8_1_ebb66be7c823ecf934632f192ea47c305238facb61d3213aefb72018ab300606.webp', 'ebb66be7c823ecf934632f192ea47c305238facb61d3213aefb72018ab300606', 'image/webp', false);

-- Product 9 (3 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(9, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_9_1_a3fe393c0efcb6572f0697e20866c74f51b8fed719f01a906afedf6303b4b7e9.webp', 'a3fe393c0efcb6572f0697e20866c74f51b8fed719f01a906afedf6303b4b7e9', 'image/webp', true),
(9, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_9_1_c5ce360f0eeff5c79d7f03b4ed51807efb75c98743f7970fc80b11b8d42bf892.webp', 'c5ce360f0eeff5c79d7f03b4ed51807efb75c98743f7970fc80b11b8d42bf892', 'image/webp', false),
(9, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_9_1_6b917e83ffdea3097d394e2abfdd8375b232956e9a36999654ef554ce77ce86f.webp', '6b917e83ffdea3097d394e2abfdd8375b232956e9a36999654ef554ce77ce86f', 'image/webp', false),
(9, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_9_1_b26cfaed00334261b502e19fb48f40e21db02c5e3550a87a0f07e981047c2662.webp', 'b26cfaed00334261b502e19fb48f40e21db02c5e3550a87a0f07e981047c2662', 'image/webp', false),
(9, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_9_2_d82bd1c7139587ad311851eca27a8338afac21a29a1d1be604575d50d58f75f0.webp', 'd82bd1c7139587ad311851eca27a8338afac21a29a1d1be604575d50d58f75f0', 'image/webp', false),
(9, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_9_2_b8a5e88784ed1e61511bf58b8313d0b24f5644b3efc25d42a5a6f947c42b9db3.webp', 'b8a5e88784ed1e61511bf58b8313d0b24f5644b3efc25d42a5a6f947c42b9db3', 'image/webp', false),
(9, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_9_2_15e5674aa4389874a8918668101b688764c9626caa765e854b3aba95b93656bd.webp', '15e5674aa4389874a8918668101b688764c9626caa765e854b3aba95b93656bd', 'image/webp', false),
(9, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_9_2_31902a6d557687f069c164a929eb43a19275498482f444391c643cd0e5927d1f.webp', '31902a6d557687f069c164a929eb43a19275498482f444391c643cd0e5927d1f', 'image/webp', false),
(9, 3, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_9_3_4cdf72debbe7f49b42c214f526c090f9f88dfbf663c699257017a0437fbf4084.webp', '4cdf72debbe7f49b42c214f526c090f9f88dfbf663c699257017a0437fbf4084', 'image/webp', false),
(9, 3, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_9_3_73dd981824af88db398e6b0f2f0147ce7d364f2c125af7f0f9b9c754863b31cf.webp', '73dd981824af88db398e6b0f2f0147ce7d364f2c125af7f0f9b9c754863b31cf', 'image/webp', false),
(9, 3, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_9_3_61b4941f3c5027cea0ad2afec68e133ff2b0eeda5d980a1b5b87ed10d9a53ca7.webp', '61b4941f3c5027cea0ad2afec68e133ff2b0eeda5d980a1b5b87ed10d9a53ca7', 'image/webp', false),
(9, 3, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_9_3_f99d96a70b4e59beb42964d959d45aa4cd2b74769eb5306576eca2e416d34ccc.webp', 'f99d96a70b4e59beb42964d959d45aa4cd2b74769eb5306576eca2e416d34ccc', 'image/webp', false);

-- Product 10 (4 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(10, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_10_1_585e41429ed395fb6f136ccee513957cc10fc6d5a29f56a1ae73c65444fa899a.webp', '585e41429ed395fb6f136ccee513957cc10fc6d5a29f56a1ae73c65444fa899a', 'image/webp', true),
(10, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_10_1_99159f297848c61420bf7d8435e5936059aa5407884523de8ac26431a25b4033.webp', '99159f297848c61420bf7d8435e5936059aa5407884523de8ac26431a25b4033', 'image/webp', false),
(10, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_10_1_42f1ba1f0377ff55e690110ebd1ea2e39044cd863d51dc9a84fdf4fa9c296343.webp', '42f1ba1f0377ff55e690110ebd1ea2e39044cd863d51dc9a84fdf4fa9c296343', 'image/webp', false),
(10, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_10_1_3b83d695a4dd98e49aff32326fb99214ea2838acd41ffe14fafa866022342729.webp', '3b83d695a4dd98e49aff32326fb99214ea2838acd41ffe14fafa866022342729', 'image/webp', false),
(10, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_10_2_67f25e13f66e72967f840496d2074e176970b7be41790f540940a67e99ab86f0.webp', '67f25e13f66e72967f840496d2074e176970b7be41790f540940a67e99ab86f0', 'image/webp', false),
(10, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_10_2_d5733d3f6ba80a7c21accb8d630f1d5f51d25f371ea0ce3033cf8deafef2f7ad.webp', 'd5733d3f6ba80a7c21accb8d630f1d5f51d25f371ea0ce3033cf8deafef2f7ad', 'image/webp', false),
(10, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_10_2_df9511880025b0507d3262508f9c00d835b39f192379f751717af6ec22f2560f.webp', 'df9511880025b0507d3262508f9c00d835b39f192379f751717af6ec22f2560f', 'image/webp', false),
(10, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_10_2_60428b746ec9a677e4dd7283e37d867602bdfa3fde53c2592c0214f6d1b25368.webp', '60428b746ec9a677e4dd7283e37d867602bdfa3fde53c2592c0214f6d1b25368', 'image/webp', false),
(10, 3, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_10_3_c23c945500041ff7a8009490f2d7ee243cb782df69be006708d5f88464a68cf8.webp', 'c23c945500041ff7a8009490f2d7ee243cb782df69be006708d5f88464a68cf8', 'image/webp', false),
(10, 3, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_10_3_10b32c7c5c380696f3e89d0a243f81d7a25929cab41dc76d2efcfd52092f55b4.webp', '10b32c7c5c380696f3e89d0a243f81d7a25929cab41dc76d2efcfd52092f55b4', 'image/webp', false),
(10, 3, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_10_3_15fd384e233f2231ff57afee9170f2f774598556b07b2ae63c87e1642131bac4.webp', '15fd384e233f2231ff57afee9170f2f774598556b07b2ae63c87e1642131bac4', 'image/webp', false),
(10, 3, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_10_3_0352ce0c3b2326fd0483eced9794053fd28d05869f28dc88ff387285fc8b9a96.webp', '0352ce0c3b2326fd0483eced9794053fd28d05869f28dc88ff387285fc8b9a96', 'image/webp', false),
(10, 4, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_10_4_b0900e63ecb21512838fa6e0df43885b130656e172af8750839c3067acd55cea.webp', 'b0900e63ecb21512838fa6e0df43885b130656e172af8750839c3067acd55cea', 'image/webp', false),
(10, 4, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_10_4_d96c6111a5c2ce699e0a36638ed229598f1cd5009b0caba23d7b9a60ef76da81.webp', 'd96c6111a5c2ce699e0a36638ed229598f1cd5009b0caba23d7b9a60ef76da81', 'image/webp', false),
(10, 4, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_10_4_067848a80370f15337826814b26063f9503ec0bec0e87ce21f959e1ee3c4df48.webp', '067848a80370f15337826814b26063f9503ec0bec0e87ce21f959e1ee3c4df48', 'image/webp', false),
(10, 4, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_10_4_a3442f17209984253dc088a6ad3f2c46bd68bc1560cfdfce2c3794194e458f81.webp', 'a3442f17209984253dc088a6ad3f2c46bd68bc1560cfdfce2c3794194e458f81', 'image/webp', false);

-- Product 11 (4 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(11, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_11_1_99d5373726dca6c08f6af90909eae773b9da3a5a41e3074e3d4a08ca15d733af.webp', '99d5373726dca6c08f6af90909eae773b9da3a5a41e3074e3d4a08ca15d733af', 'image/webp', true),
(11, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_11_1_144eee9c82e7c5db3dd82f196e12b27650ecff5499da2087b6bfce1aa568b03f.webp', '144eee9c82e7c5db3dd82f196e12b27650ecff5499da2087b6bfce1aa568b03f', 'image/webp', false),
(11, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_11_1_63e2e655f07b233d2f2cef7ec21717285cc00511d7ff3e208dd60995215ee1cb.webp', '63e2e655f07b233d2f2cef7ec21717285cc00511d7ff3e208dd60995215ee1cb', 'image/webp', false),
(11, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_11_1_b185482b2084a7e92f67c69046b6d3d4c0cccc911835c3c41e97164d88e93a0f.webp', 'b185482b2084a7e92f67c69046b6d3d4c0cccc911835c3c41e97164d88e93a0f', 'image/webp', false),
(11, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_11_2_aa587f94d38137822f22c26c7f0710a541b06f2a99224334c3de9987ea41595e.webp', 'aa587f94d38137822f22c26c7f0710a541b06f2a99224334c3de9987ea41595e', 'image/webp', false),
(11, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_11_2_e5c1842166e379867945905fc74d1e16e9fa262155a59cf7e542e496cd564734.webp', 'e5c1842166e379867945905fc74d1e16e9fa262155a59cf7e542e496cd564734', 'image/webp', false),
(11, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_11_2_616ba756960e949d99955a507b3e0597d7308284f102c4227060b203e38b37ae.webp', '616ba756960e949d99955a507b3e0597d7308284f102c4227060b203e38b37ae', 'image/webp', false),
(11, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_11_2_3013ec05e7208c7b7cb6a26ddb7079afd9504695e570c65c4f1f8ddccdc030cd.webp', '3013ec05e7208c7b7cb6a26ddb7079afd9504695e570c65c4f1f8ddccdc030cd', 'image/webp', false),
(11, 3, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_11_3_a01f80ce8bf44935ddfff6839ec5e146eea11633a9527afdeaa139b7abcace2e.webp', 'a01f80ce8bf44935ddfff6839ec5e146eea11633a9527afdeaa139b7abcace2e', 'image/webp', false),
(11, 3, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_11_3_d596ebbef9c30811f4732605e6828aacb3f2ef280851fb541127582fb4138714.webp', 'd596ebbef9c30811f4732605e6828aacb3f2ef280851fb541127582fb4138714', 'image/webp', false),
(11, 3, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_11_3_e495cb095eb88bc4df81bf6ad2b5cbc9dcd6c6e48cadda37821160a123199bb7.webp', 'e495cb095eb88bc4df81bf6ad2b5cbc9dcd6c6e48cadda37821160a123199bb7', 'image/webp', false),
(11, 3, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_11_3_56426a418954cfb02df930324bd0dd0900fa2f4d25abb00fe898c32d44d3e05b.webp', '56426a418954cfb02df930324bd0dd0900fa2f4d25abb00fe898c32d44d3e05b', 'image/webp', false),
(11, 4, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_11_4_ffb18671273a8ea5f52e19055f03c753abece4efa311235a75e9a7f22e762d67.webp', 'ffb18671273a8ea5f52e19055f03c753abece4efa311235a75e9a7f22e762d67', 'image/webp', false),
(11, 4, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_11_4_ebda4ee277b7b6c3b830a7645e089e2a0f4595e8b66e2830e0cbdb0c1bc83e8f.webp', 'ebda4ee277b7b6c3b830a7645e089e2a0f4595e8b66e2830e0cbdb0c1bc83e8f', 'image/webp', false),
(11, 4, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_11_4_3d4645849f5545d7f99ce56480fa16a2a6e78b609a0e4595884484a0af8c3c0c.webp', '3d4645849f5545d7f99ce56480fa16a2a6e78b609a0e4595884484a0af8c3c0c', 'image/webp', false),
(11, 4, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_11_4_85f0bdd1c886d81554188836363bfe56d93001bffea11452e0e68560f4111332.webp', '85f0bdd1c886d81554188836363bfe56d93001bffea11452e0e68560f4111332', 'image/webp', false);

-- Product 12 (4 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(12, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_12_1_a98fe3e354a6f4e3d0a82e7e5fa371cf586f26d3bc1bf10bece962a888d81863.webp', 'a98fe3e354a6f4e3d0a82e7e5fa371cf586f26d3bc1bf10bece962a888d81863', 'image/webp', true),
(12, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_12_1_f2680516ceeab398cf9c3b945a79992060a738960b25f09099add094f093c950.webp', 'f2680516ceeab398cf9c3b945a79992060a738960b25f09099add094f093c950', 'image/webp', false),
(12, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_12_1_7ab5441ff75bb42b3321e8c0c10e1032000da2437f4b4e466614194a04060697.webp', '7ab5441ff75bb42b3321e8c0c10e1032000da2437f4b4e466614194a04060697', 'image/webp', false),
(12, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_12_1_956dd99d024b7a395ed612bd65ac976ae7a2615680acc2c3938e2bd1a2d4a78f.webp', '956dd99d024b7a395ed612bd65ac976ae7a2615680acc2c3938e2bd1a2d4a78f', 'image/webp', false),
(12, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_12_2_6200d6ab802260b68e5d1b8601b269e9e1938e39557b261ea6a355d64c4c7895.webp', '6200d6ab802260b68e5d1b8601b269e9e1938e39557b261ea6a355d64c4c7895', 'image/webp', false),
(12, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_12_2_f848cfe021afc02096509d34ca2a57aa149703eb9116c5d3b16efa89fc382f41.webp', 'f848cfe021afc02096509d34ca2a57aa149703eb9116c5d3b16efa89fc382f41', 'image/webp', false),
(12, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_12_2_9187897d1bd73c013c1524fb1fd6f732dfebde2ba68f9530dfa2b2721297e2c8.webp', '9187897d1bd73c013c1524fb1fd6f732dfebde2ba68f9530dfa2b2721297e2c8', 'image/webp', false),
(12, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_12_2_64defb63144bc231795ccfd2ea89f64f292110dface20d389dfdb4e3a5e70341.webp', '64defb63144bc231795ccfd2ea89f64f292110dface20d389dfdb4e3a5e70341', 'image/webp', false),
(12, 3, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_12_3_4b43bab922d3aa031df9adb585bd80fa792505b3d4ffd493d64ce38497bda45e.webp', '4b43bab922d3aa031df9adb585bd80fa792505b3d4ffd493d64ce38497bda45e', 'image/webp', false),
(12, 3, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_12_3_a9d7725d9f9f766eda57510295428f9b78bddb28cd12ce43276cbc71d495d073.webp', 'a9d7725d9f9f766eda57510295428f9b78bddb28cd12ce43276cbc71d495d073', 'image/webp', false),
(12, 3, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_12_3_7856f23533311b8a521aff0d9cd4f11cbbe755487937bed8a821763686308132.webp', '7856f23533311b8a521aff0d9cd4f11cbbe755487937bed8a821763686308132', 'image/webp', false),
(12, 3, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_12_3_e5da83e94b522e11b17d9cc608022520acdcb89a309b8cbec80434629a54de5f.webp', 'e5da83e94b522e11b17d9cc608022520acdcb89a309b8cbec80434629a54de5f', 'image/webp', false),
(12, 4, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_12_4_bd7c96794af9f145f4b0323ff5afce20a85df5385a1e8b9192ef21585143d8e6.webp', 'bd7c96794af9f145f4b0323ff5afce20a85df5385a1e8b9192ef21585143d8e6', 'image/webp', false),
(12, 4, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_12_4_f701db6ec306278e902a2b04134aa6f828b2031872539c5ec7684bf92092bb49.webp', 'f701db6ec306278e902a2b04134aa6f828b2031872539c5ec7684bf92092bb49', 'image/webp', false),
(12, 4, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_12_4_4ff6edcca0e7388a1d0fba467ca7c4d025f98d9c417a9b87c4ee72cd8dccc087.webp', '4ff6edcca0e7388a1d0fba467ca7c4d025f98d9c417a9b87c4ee72cd8dccc087', 'image/webp', false),
(12, 4, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_12_4_ac25c93b8f3d28b22ec5a0af4b5ddea8f44e741206d48abcb871db24484c175c.webp', 'ac25c93b8f3d28b22ec5a0af4b5ddea8f44e741206d48abcb871db24484c175c', 'image/webp', false);

-- Product 13 (4 images) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(13, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_13_1_d843b25b464fb1b27b05a68725cc35ac27575176c71eae1c496784b6c1931e66.webp', 'd843b25b464fb1b27b05a68725cc35ac27575176c71eae1c496784b6c1931e66', 'image/webp', true),
(13, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_13_1_a865b21026f9f0a10d960767f72993331085f725c9bc45d531a1b70775bf99ad.webp', 'a865b21026f9f0a10d960767f72993331085f725c9bc45d531a1b70775bf99ad', 'image/webp', false),
(13, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_13_1_200cadc760dac5bb6beeb2a7c1455c0f8e09d3f7c95eb548ec4967e1c35c27dd.webp', '200cadc760dac5bb6beeb2a7c1455c0f8e09d3f7c95eb548ec4967e1c35c27dd', 'image/webp', false),
(13, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_13_1_0f5d40f67f8d05ff70d6b6dd62bb05ee2d675502d78647152eb86d15b4686b8d.webp', '0f5d40f67f8d05ff70d6b6dd62bb05ee2d675502d78647152eb86d15b4686b8d', 'image/webp', false),
(13, 2, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_13_2_2fb7755422621092f40ff72f934b7ed403a26408ca3e89d50e1e0bc18c74e264.webp', '2fb7755422621092f40ff72f934b7ed403a26408ca3e89d50e1e0bc18c74e264', 'image/webp', false),
(13, 2, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_13_2_d8d9e12e91a2b7bc69db0e7971e2b29551c671abe8232a7205ce83aeb745c2bc.webp', 'd8d9e12e91a2b7bc69db0e7971e2b29551c671abe8232a7205ce83aeb745c2bc', 'image/webp', false),
(13, 2, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_13_2_59f61ef859ea6cd781c55a9bf0787b1319655c2600b08ad0362510e1b2f5a4f6.webp', '59f61ef859ea6cd781c55a9bf0787b1319655c2600b08ad0362510e1b2f5a4f6', 'image/webp', false),
(13, 2, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_13_2_75d29c93f688e53c58702b99cd4f67da767638e3d7badbbfbd27f2e724fe0930.webp', '75d29c93f688e53c58702b99cd4f67da767638e3d7badbbfbd27f2e724fe0930', 'image/webp', false),
(13, 3, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_13_3_34e168ef348f6a738415190a3de57b3a579cf5ed3daca0f4338a6a822f6fc435.webp', '34e168ef348f6a738415190a3de57b3a579cf5ed3daca0f4338a6a822f6fc435', 'image/webp', false),
(13, 3, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_13_3_ce2df7b62cb7b5b3d394e7d137515d8cb158c156f8ed0186b3f9dbd3843a50ea.webp', 'ce2df7b62cb7b5b3d394e7d137515d8cb158c156f8ed0186b3f9dbd3843a50ea', 'image/webp', false),
(13, 3, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_13_3_1f61fb7cd403ee387c98547f4b8e59dd4f9dfbcbef44b9a984529a24fbb9bdbb.webp', '1f61fb7cd403ee387c98547f4b8e59dd4f9dfbcbef44b9a984529a24fbb9bdbb', 'image/webp', false),
(13, 3, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_13_3_5e58f5689aefd64ca1339d5757218869f491efd1ca3419e062e1ca0bf007efa2.webp', '5e58f5689aefd64ca1339d5757218869f491efd1ca3419e062e1ca0bf007efa2', 'image/webp', false),
(13, 4, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_13_4_9ca4eecbe61930a74436468d5ca079466b72a558800dd437d58ec29b88398b3a.webp', '9ca4eecbe61930a74436468d5ca079466b72a558800dd437d58ec29b88398b3a', 'image/webp', false),
(13, 4, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_13_4_58959f1f6fea965e6650a518443ec76d8c8b5ede6ff772e238583f6c3ffcab17.webp', '58959f1f6fea965e6650a518443ec76d8c8b5ede6ff772e238583f6c3ffcab17', 'image/webp', false),
(13, 4, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_13_4_a04a9380d6d80e901f09c9ba74c173f46e30ef5567f3c06a0eb5f5991cf8bec4.webp', 'a04a9380d6d80e901f09c9ba74c173f46e30ef5567f3c06a0eb5f5991cf8bec4', 'image/webp', false),
(13, 4, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_13_4_12ca76f2374b66fe8783434c3a8571f2f61c93c4a4044ae1c2eb169421bba8ef.webp', '12ca76f2374b66fe8783434c3a8571f2f61c93c4a4044ae1c2eb169421bba8ef', 'image/webp', false);

-- Product 14 (1 image) - Only image_index=1 is primary
INSERT INTO public.product_images (product_id, image_index, size, url, file_hash, mime_type, is_primary) VALUES
(14, 1, 'thumb', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/thumb/product_14_1_9946f54da342e708d1b501d947d8f349936c02ebb097d281c1cca51018ff11af.webp', '9946f54da342e708d1b501d947d8f349936c02ebb097d281c1cca51018ff11af', 'image/webp', true),
(14, 1, 'small', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/small/product_14_1_8c0db486b65659a1725af5673fe0bb12a3c2bcb49600736062c9b18fd6fbeff0.webp', '8c0db486b65659a1725af5673fe0bb12a3c2bcb49600736062c9b18fd6fbeff0', 'image/webp', false),
(14, 1, 'medium', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/medium/product_14_1_5be866867a702ef982057dde511a616f4bb8f6710d5a7a110837cc6b09981ab0.webp', '5be866867a702ef982057dde511a616f4bb8f6710d5a7a110837cc6b09981ab0', 'image/webp', false),
(14, 1, 'large', 'https://ywxjbzksaybmcxtsdoxa.supabase.co/storage/v1/object/public/product-images/large/product_14_1_1ebbff6e009fdad38588c522063bd0b0a8c42965a1df26c7f12d9dec4d10f640.webp', '1ebbff6e009fdad38588c522063bd0b0a8c42965a1df26c7f12d9dec4d10f640', 'image/webp', false);

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Verify total record count
SELECT 'Total Records' as check_type, COUNT(*) as count FROM public.product_images;

-- Verify records per product
SELECT 'Records Per Product' as check_type, product_id, COUNT(*) as image_count 
FROM public.product_images 
GROUP BY product_id 
ORDER BY product_id;

-- Verify primary image logic (should be exactly 1 per product for image_index=1 only)
SELECT 'Primary Images Count' as check_type, product_id, 
       COUNT(CASE WHEN is_primary = true THEN 1 END) as primary_count,
       COUNT(CASE WHEN image_index = 1 AND is_primary = true THEN 1 END) as index_1_primary_count,
       COUNT(CASE WHEN image_index > 1 AND is_primary = true THEN 1 END) as index_gt1_primary_count
FROM public.product_images 
GROUP BY product_id 
ORDER BY product_id;

-- Verify size distribution (should be 4 sizes per image_index)
SELECT 'Size Distribution' as check_type, product_id, image_index, 
       COUNT(*) as size_count,
       array_agg(size ORDER BY size) as sizes
FROM public.product_images 
GROUP BY product_id, image_index 
ORDER BY product_id, image_index;

-- Verify is_primary logic consistency
SELECT 'Primary Logic Errors' as check_type, 
       COUNT(CASE WHEN image_index = 1 AND is_primary = false THEN 1 END) as index_1_should_be_primary,
       COUNT(CASE WHEN image_index > 1 AND is_primary = true THEN 1 END) as index_gt1_should_not_be_primary
FROM public.product_images;

-- Verify unique constraints are working
SELECT 'Unique Constraint Check' as check_type, product_id, image_index, size, COUNT(*)
FROM public.product_images 
GROUP BY product_id, image_index, size 
HAVING COUNT(*) > 1;

-- Final summary
SELECT 'FLORESYA 2.0 MIGRATION SUMMARY' as summary,
       COUNT(*) as total_records,
       COUNT(DISTINCT product_id) as total_products,
       COUNT(CASE WHEN is_primary = true THEN 1 END) as primary_images,
       COUNT(DISTINCT file_hash) as unique_hashes
FROM public.product_images;