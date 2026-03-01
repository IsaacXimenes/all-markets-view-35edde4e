-- Extract loja name from the 'nome' field and populate loja_vinculada
-- Pattern: "Brand - Type - StoreName" -> nome="Brand - Type", loja_vinculada="StoreName"

UPDATE public.maquinas_cartao SET nome = 'Cielo - Elo', loja_vinculada = 'Assistencia' WHERE nome = 'Cielo - Elo - Assistencia';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Elo', loja_vinculada = 'JK' WHERE nome = 'Cielo - Elo - JK';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Elo', loja_vinculada = 'Matriz' WHERE nome = 'Cielo - Elo - Matriz';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Elo', loja_vinculada = 'Online' WHERE nome = 'Cielo - Elo - Online';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Elo', loja_vinculada = 'Shopping Sul' WHERE nome = 'Cielo - Elo - Shopping Sul';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Master', loja_vinculada = 'Assistencia' WHERE nome = 'Cielo - Master - Assistencia';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Master', loja_vinculada = 'JK' WHERE nome = 'Cielo - Master - JK';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Master', loja_vinculada = 'Online' WHERE nome = 'Cielo - Master - Online';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Master', loja_vinculada = 'Shopping Sul' WHERE nome = 'Cielo - Master - Shopping Sul';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Visa', loja_vinculada = 'Assistencia' WHERE nome = 'Cielo - Visa - Assistencia';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Visa', loja_vinculada = 'JK' WHERE nome = 'Cielo - Visa - JK';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Visa', loja_vinculada = 'Online' WHERE nome = 'Cielo - Visa - Online';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Visa', loja_vinculada = 'Shopping Sul' WHERE nome = 'Cielo - Visa - Shopping Sul';
UPDATE public.maquinas_cartao SET nome = 'Cielo - Visa/Master', loja_vinculada = 'Matriz' WHERE nome = 'Cielo - Visa/Master - Matriz';
UPDATE public.maquinas_cartao SET nome = 'Pagbank - Elo', loja_vinculada = 'Shopping Aguas Lindas' WHERE nome = 'Pagbank - Elo - Shopping Aguas Lindas';
UPDATE public.maquinas_cartao SET nome = 'Pagbank - Master', loja_vinculada = 'Shopping Aguas Lindas' WHERE nome = 'Pagbank - Master - Shopping Aguas Lindas';
UPDATE public.maquinas_cartao SET nome = 'Pagbank - Visa', loja_vinculada = 'Shopping Aguas Lindas' WHERE nome = 'Pagbank - Visa - Shopping Aguas Lindas';
UPDATE public.maquinas_cartao SET nome = 'Terceirizada - TODAS', loja_vinculada = 'Todas Unidades' WHERE nome = 'Terceirizada - TODAS - Todas Unidades';