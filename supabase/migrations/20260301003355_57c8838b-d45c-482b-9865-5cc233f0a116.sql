-- Vincular os 3 profiles restantes manualmente
UPDATE profiles SET colaborador_id = '787d89f4-5775-49ef-b527-5399940a11f1',
  eh_gestor = true, eh_vendedor = false, eh_estoquista = false
WHERE id = '7a122689-4c74-4ad7-80d9-e940a8a187cd';

UPDATE profiles SET colaborador_id = '8189ba8d-0b6c-40af-be80-71826b78ecd6',
  eh_gestor = true, eh_vendedor = false, eh_estoquista = false
WHERE id = 'aa658f77-909a-4801-a378-7654c211cd36';

UPDATE profiles SET colaborador_id = '3bd31839-e332-4776-8c3f-3f37f5ae0170',
  eh_gestor = true, eh_vendedor = false, eh_estoquista = false
WHERE id = '5932b6bf-1753-465c-a70a-d8d11aa93095';