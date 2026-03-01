
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_username TEXT;
  v_parts TEXT[];
  v_first_name TEXT;
  v_last_name TEXT;
  v_colab RECORD;
BEGIN
  -- Extract username from email (e.g. joao.santos@thiagoimports.com.br -> joao.santos)
  v_username := SPLIT_PART(NEW.email, '@', 1);
  
  -- Split username into parts (first.last)
  v_parts := string_to_array(v_username, '.');
  v_first_name := v_parts[1];
  v_last_name := CASE WHEN array_length(v_parts, 1) > 1 THEN v_parts[array_length(v_parts, 1)] ELSE NULL END;

  -- Try to find matching colaborador by name parts
  SELECT id, nome, cargo, eh_gestor, eh_vendedor, eh_estoquista
  INTO v_colab
  FROM public.colaboradores
  WHERE ativo = true
    AND v_last_name IS NOT NULL
    AND LOWER(nome) LIKE '%' || LOWER(v_first_name) || '%'
    AND LOWER(nome) LIKE '%' || LOWER(v_last_name) || '%'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_colab IS NOT NULL THEN
    INSERT INTO public.profiles (id, username, nome_completo, colaborador_id, cargo, eh_gestor, eh_vendedor, eh_estoquista, first_login)
    VALUES (
      NEW.id,
      v_username,
      v_colab.nome,
      v_colab.id,
      v_colab.cargo,
      COALESCE(v_colab.eh_gestor, false),
      COALESCE(v_colab.eh_vendedor, false),
      COALESCE(v_colab.eh_estoquista, false),
      true
    );
  ELSE
    INSERT INTO public.profiles (id, username, nome_completo, first_login)
    VALUES (
      NEW.id,
      v_username,
      '',
      true
    );
  END IF;

  RETURN NEW;
END;
$$;
