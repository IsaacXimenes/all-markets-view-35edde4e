
-- Etapa 1: Adicionar coluna codigo na tabela acessorios
ALTER TABLE acessorios ADD COLUMN IF NOT EXISTS codigo TEXT;

-- Etapa 2a: Normalizar modelos dos produtos para Title Case
-- Função auxiliar para Title Case com regras especiais
CREATE OR REPLACE FUNCTION pg_temp.title_case_modelo(input TEXT) RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  word TEXT;
  words TEXT[];
  i INT;
BEGIN
  IF input IS NULL OR input = '' THEN RETURN input; END IF;
  
  -- Limpar espaços duplos e hífens problemáticos
  input := regexp_replace(input, '\s+', ' ', 'g');
  input := regexp_replace(input, '\s*-\s*', ' ', 'g');
  input := trim(input);
  
  -- Corrigir typos conhecidos
  input := regexp_replace(input, 'IPHOINE', 'IPHONE', 'gi');
  
  words := string_to_array(input, ' ');
  
  FOR i IN 1..array_length(words, 1) LOOP
    word := words[i];
    
    -- Palavras especiais Apple
    IF upper(word) = 'IPHONE' THEN word := 'iPhone';
    ELSIF upper(word) = 'IPAD' THEN word := 'iPad';
    ELSIF upper(word) = 'AIRPODS' THEN word := 'AirPods';
    ELSIF upper(word) = 'MACBOOK' THEN word := 'MacBook';
    -- Siglas técnicas (manter uppercase)
    ELSIF upper(word) ~ '^[0-9]*GB$' THEN word := upper(word);
    ELSIF upper(word) ~ '^[0-9]*TB$' THEN word := upper(word);
    ELSIF upper(word) ~ '^[0-9]*RAM$' THEN word := upper(word);
    ELSIF upper(word) IN ('5G', '4G', 'LTE', 'NFC', 'OTG', 'HDMI', 'USB-C', 'USBC', 'TYPEC') THEN word := upper(word);
    -- Variantes de produto (manter uppercase)
    ELSIF upper(word) IN ('PRO', 'MAX', 'PLUS', 'MINI', 'SE', 'XR', 'XS', 'ULTRA') THEN word := upper(word);
    -- Marcas/siglas conhecidas
    ELSIF upper(word) IN ('JBL', 'PS5', 'PS4', 'PS3', 'TWS', 'LED', 'LCD', 'HD', 'FHD', 'QHD') THEN word := upper(word);
    ELSIF upper(word) IN ('USB', 'AUX', 'MFI', 'PD', 'QC') THEN word := upper(word);
    -- Números puros
    ELSIF word ~ '^[0-9]+$' THEN word := word;
    -- Padrão com número+letra (ex: "A06", "S24", "14S")
    ELSIF word ~ '^[A-Za-z]?[0-9]+[A-Za-z]*$' THEN word := upper(word);
    -- Demais palavras: Title Case
    ELSE word := upper(substring(word from 1 for 1)) || lower(substring(word from 2));
    END IF;
    
    IF i = 1 THEN result := word;
    ELSE result := result || ' ' || word;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Aplicar Title Case nos modelos dos produtos
UPDATE produtos SET modelo = pg_temp.title_case_modelo(modelo) WHERE modelo IS NOT NULL;

-- Aplicar Title Case nas marcas dos produtos
UPDATE produtos SET marca = pg_temp.title_case_modelo(marca) WHERE marca IS NOT NULL;

-- Etapa 2b: Atribuir codigos faltantes em produtos_pendentes_os
DO $$
DECLARE
  max_num INT;
  rec RECORD;
  counter INT;
BEGIN
  -- Encontrar o maior número de código existente em ambas as tabelas
  SELECT COALESCE(MAX(
    CASE WHEN codigo ~ '^PROD-[0-9]+$' THEN substring(codigo from 6)::INT ELSE 0 END
  ), 0) INTO max_num
  FROM (
    SELECT codigo FROM produtos WHERE codigo IS NOT NULL
    UNION ALL
    SELECT codigo FROM produtos_pendentes_os WHERE codigo IS NOT NULL
  ) all_codes;
  
  counter := max_num + 1;
  
  FOR rec IN 
    SELECT id FROM produtos_pendentes_os 
    WHERE codigo IS NULL OR codigo = '' 
    ORDER BY created_at ASC
  LOOP
    UPDATE produtos_pendentes_os SET codigo = 'PROD-' || lpad(counter::TEXT, 4, '0') WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Etapa 2c: Normalizar nomes dos acessórios para Title Case
UPDATE acessorios SET nome = pg_temp.title_case_modelo(nome) WHERE nome IS NOT NULL;

-- Gerar codigos AC-XXXX para acessórios
DO $$
DECLARE
  rec RECORD;
  counter INT := 1;
BEGIN
  FOR rec IN 
    SELECT id FROM acessorios ORDER BY created_at ASC NULLS LAST, id ASC
  LOOP
    UPDATE acessorios SET codigo = 'AC-' || lpad(counter::TEXT, 4, '0') WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;
