
INSERT INTO public.contas_financeiras (nome, tipo, loja_vinculada, banco, agencia, conta, cnpj, saldo_inicial, saldo_atual, status, status_maquina, nota_fiscal, habilitada, historico_alteracoes, codigo_legivel)
VALUES
  ('Caixa Matriz', 'Caixa', '6231ea0e-9ff3-4ad6-b822-6f9a8270afa6', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-001'),
  ('Pix Matriz', 'Pix', '6231ea0e-9ff3-4ad6-b822-6f9a8270afa6', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-002'),
  ('Rede Matriz', 'Cartão', '6231ea0e-9ff3-4ad6-b822-6f9a8270afa6', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-003'),
  ('Caixa JK', 'Caixa', '9009b91c-0436-4070-9d30-670b8e6bd68e', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-004'),
  ('Pix JK', 'Pix', '9009b91c-0436-4070-9d30-670b8e6bd68e', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-005'),
  ('Rede JK', 'Cartão', '9009b91c-0436-4070-9d30-670b8e6bd68e', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-006'),
  ('Máquina AL Shopping', 'Cartão', 'b2c6ac94-f08b-4c2e-955f-8a91d658d7d6', '', '', '', '', 0, 0, 'Ativo', 'Terceirizada', false, true, '[]', 'CTA-007'),
  ('Caixa AL Shopping', 'Caixa', 'b2c6ac94-f08b-4c2e-955f-8a91d658d7d6', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-008'),
  ('Pix AL Shopping', 'Pix', 'b2c6ac94-f08b-4c2e-955f-8a91d658d7d6', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-009'),
  ('Máquina Shopping Sul', 'Cartão', '0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad', '', '', '', '', 0, 0, 'Ativo', 'Terceirizada', false, true, '[]', 'CTA-010'),
  ('Caixa Shopping Sul', 'Caixa', '0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-011'),
  ('Pix Shopping Sul', 'Pix', '0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-012'),
  ('Caixa Online', 'Caixa', 'df3995f6-1da1-4661-a68f-20fb548a9468', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-013'),
  ('Pix Online', 'Pix', 'df3995f6-1da1-4661-a68f-20fb548a9468', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-014'),
  ('Rede Online', 'Cartão', 'df3995f6-1da1-4661-a68f-20fb548a9468', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-015'),
  ('Dinheiro', 'Dinheiro - Geral', 'geral-dinheiro', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-020'),
  ('Assistência', 'Outros', 'geral-assistencia', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-021'),
  ('Link Pagamento Online', 'Outros', 'df3995f6-1da1-4661-a68f-20fb548a9468', '', '', '', '', 0, 0, 'Ativo', 'Própria', true, true, '[]', 'CTA-022');
