
-- 1. Atribuir códigos PROD-0500 a PROD-0629 para os 130 produtos sem código
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as rn
  FROM produtos
  WHERE codigo IS NULL OR codigo = ''
)
UPDATE produtos p
SET codigo = 'PROD-' || LPAD((499 + n.rn)::text, 4, '0')
FROM numbered n
WHERE p.id = n.id;

-- 2. Padronizar marca "Apple" (lowercase variantes)
UPDATE produtos SET marca = 'Apple' WHERE UPPER(marca) = 'APPLE';
UPDATE produtos SET marca = 'Samsung' WHERE UPPER(marca) = 'SAMSUNG';
UPDATE produtos SET marca = 'Xiaomi' WHERE UPPER(marca) = 'XIAOMI';
UPDATE produtos SET marca = 'Motorola' WHERE UPPER(marca) = 'MOTOROLA';
UPDATE produtos SET marca = 'Realme' WHERE UPPER(marca) = 'REALME';

-- 3. Padronizar cores inconsistentes
UPDATE produtos SET cor = 'Preto' WHERE UPPER(REPLACE(cor, ' ', '')) IN ('PRETO', 'BLACK/PRETO', 'BLACK/PRETO');
UPDATE produtos SET cor = 'Preto' WHERE cor = 'Black / Preto' OR cor = 'BLACK/ PRETO';
UPDATE produtos SET cor = 'Azul' WHERE cor IN ('Blue / Azul', 'BLUE/ AZUL', 'AZUL');
UPDATE produtos SET cor = 'Azul Escuro' WHERE cor IN ('Azul escuro', 'AZUL ESCURO');
UPDATE produtos SET cor = 'Branco' WHERE cor IN ('White / Branco', 'BRANCO');
UPDATE produtos SET cor = 'Rosa' WHERE cor IN ('Pink / Rosa', 'PINK/ ROSA', 'ROSA');
UPDATE produtos SET cor = 'Verde' WHERE cor IN ('Green / Verde', 'VERDE');
UPDATE produtos SET cor = 'Vermelho' WHERE cor IN ('RED', 'VERMELHO');
UPDATE produtos SET cor = 'Roxo' WHERE cor IN ('Roxo / Purple', 'ROXO');
UPDATE produtos SET cor = 'Cinza Espacial' WHERE cor = 'Space Gray / Cinza-espacial';
UPDATE produtos SET cor = 'Azul Pacífico' WHERE cor = 'Pacific Blue / Azul pacifico';
UPDATE produtos SET cor = 'Azul Sierra' WHERE cor = 'Sierra Blue / Azul Sierra';
UPDATE produtos SET cor = 'Verde Alpino' WHERE cor = 'Alpine Green / Verde alpino';
UPDATE produtos SET cor = 'Preto Titanium' WHERE cor = 'PRETO TITANIUM';
UPDATE produtos SET cor = 'Azul Titanium' WHERE cor = 'AZUL TITANIUM';
UPDATE produtos SET cor = 'Branco Titanium' WHERE cor = 'BRANCO TITANIUM';
UPDATE produtos SET cor = 'Natural Titanium' WHERE cor = 'NATURAL TITANIUM';
UPDATE produtos SET cor = 'Desert Titanium' WHERE cor = 'DESERT TITANIUM';
UPDATE produtos SET cor = 'Prata' WHERE cor = 'SILVER/ PRATA' OR cor = 'SILVER';
UPDATE produtos SET cor = 'Dourado' WHERE cor = 'DOURADO';
UPDATE produtos SET cor = 'Cinza' WHERE cor = 'CINZA';
UPDATE produtos SET cor = 'Grafite' WHERE cor = 'GRAFITE';
UPDATE produtos SET cor = 'Lilás' WHERE cor = 'LILAS';
UPDATE produtos SET cor = 'Azul Claro' WHERE cor = 'AZUL CLARO';
UPDATE produtos SET cor = 'Laranja Cósmico' WHERE cor = 'COSMIC ORANGE/ LARANJA';

-- 4. Padronizar modelo: remover espaços extras no final
UPDATE produtos SET modelo = TRIM(modelo) WHERE modelo != TRIM(modelo);

-- 5. Padronizar tipo para Title Case
UPDATE produtos SET tipo = 'Seminovo' WHERE UPPER(tipo) = 'SEMINOVO';
UPDATE produtos SET tipo = 'Novo' WHERE UPPER(tipo) = 'NOVO';
