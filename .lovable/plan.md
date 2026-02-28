
# Migração Completa para Supabase - Fase 1: Expansão do Schema

## Diagnóstico da Situação Atual

Existe uma diferença enorme entre as tabelas Supabase existentes e as interfaces TypeScript do sistema:

| Tabela Supabase | Colunas Atuais | Campos na Interface App | Faltam |
|---|---|---|---|
| `lojas` | 5 | 12 (cnpj, endereco, telefone, cep, cidade, estado, responsavel, horario) | 7+ |
| `colaboradores` | 5 | 15 (cpf, email, telefone, salario, data_admissao, modelo_pagamento...) | 10+ |
| `produtos` | 12 | 30+ (historico_custo, timeline, status_movimentacao, origem_entrada...) | 20+ |
| `vendas` | 8 | 40+ (itens, trade-ins, pagamentos, timeline, garantia_extendida...) | 30+ |
| `ordens_servico` | 11 | 35+ (pecas[], pagamentos[], timeline[], cronometro, evidencias...) | 25+ |
| `garantias` | 9 | 15+ (tratativas, timeline, tipo_garantia, loja_venda...) | 8+ |
| `financeiro` | 9 | Pagamentos + Despesas (2 entidades distintas) | Precisa reestruturar |

Alem disso, faltam tabelas inteiras para: **clientes**, **fornecedores**, **pecas**, **contas_financeiras**, **maquinas_cartao**, **notas_compra**, **acessorios**, **metas**, entre outras (~15 tabelas auxiliares).

---

## Plano de Execução (em 3 Fases)

### FASE 1 - Expandir Schema (esta fase)

Alterar as tabelas existentes e criar as tabelas que faltam para cobrir 100% das interfaces.

#### 1.1 - Alterar tabela `lojas`
Adicionar: `cnpj`, `endereco`, `telefone`, `cep`, `cidade`, `estado`, `responsavel`, `horario_funcionamento`, `status` (varchar, default 'Ativo'), `ativa` (boolean, default true).

#### 1.2 - Alterar tabela `colaboradores`
Adicionar: `cpf`, `email`, `telefone`, `data_admissao`, `data_inativacao`, `data_nascimento`, `modelo_pagamento`, `salario`, `foto`, `status` (varchar, default 'Ativo').

#### 1.3 - Alterar tabela `produtos`
Adicionar: `quantidade` (int, default 1), `condicao`, `pareceres`, `origem_entrada`, `status_nota`, `estoque_conferido`, `assistencia_conferida`, `venda_recomendada`, `historico_custo` (jsonb), `historico_valor_recomendado` (jsonb), `timeline` (jsonb), `custo_assistencia`, `status_movimentacao`, `movimentacao_id`, `status_retirada_pecas`, `retirada_pecas_id`, `loja_atual_id`, `bloqueado_em_venda_id`, `status_emprestimo`, `emprestimo_garantia_id`, `emprestimo_cliente_id`, `emprestimo_cliente_nome`, `emprestimo_os_id`, `emprestimo_data_hora`, `bloqueado_em_troca_garantia_id`, `status_revisao_tecnica`, `lote_revisao_id`, `tag_retorno_assistencia`, `imagem`.

#### 1.4 - Alterar tabela `vendas`
Adicionar: `numero` (int), `hora_venda`, `vendedor_id` (uuid), `cliente_id`, `cliente_cpf`, `cliente_telefone`, `cliente_email`, `cliente_cidade`, `origem_venda`, `local_retirada`, `tipo_retirada`, `taxa_entrega`, `motoboy_id`, `subtotal`, `total_trade_in`, `lucro`, `margem`, `observacoes`, `motivo_cancelamento`, `comissao_vendedor`, `status_atual`, `bloqueado_para_edicao`, `valor_sinal`, `valor_pendente_sinal`, `data_sinal`, `observacao_sinal`, `garantia_extendida` (jsonb), `timeline` (jsonb), `timeline_edicoes` (jsonb).

Criar tabelas auxiliares:
- **`venda_itens`**: id, venda_id, produto_id, produto_nome, imei, categoria, quantidade, valor_recomendado, valor_venda, valor_custo, loja_id
- **`venda_trade_ins`**: id, venda_id, produto_id, modelo, descricao, imei, valor_compra_usado, imei_validado, condicao, tipo_entrega, data_registro, anexos (jsonb)
- **`venda_pagamentos`**: id, venda_id, meio_pagamento, valor, conta_destino, parcelas, valor_parcela, descricao, is_fiado, fiado_data_base, fiado_numero_parcelas, fiado_tipo_recorrencia, fiado_intervalo_dias, taxa_cartao, valor_com_taxa, maquina_id, comprovante, comprovante_nome

#### 1.5 - Alterar tabela `ordens_servico`
Adicionar: `setor`, `descricao`, `valor_total`, `custo_total`, `origem_os`, `venda_id`, `garantia_id`, `produto_id`, `valor_produto_origem`, `modelo_aparelho`, `imei_aparelho`, `proxima_atuacao`, `valor_custo_tecnico`, `valor_venda_tecnico`, `valor_servico`, `fotos_entrada` (jsonb), `resumo_conclusao`, `observacao_origem`, `recusada_tecnico`, `motivo_recusa_tecnico`, `conclusao_servico`, `cronometro` (jsonb), `evidencias` (jsonb), `timeline` (jsonb).

Criar tabelas auxiliares:
- **`os_pecas`**: id, os_id, peca, peca_estoque_id, imei, valor, percentual, valor_total, servico_terceirizado, descricao_terceirizado, fornecedor_id, unidade_servico, peca_no_estoque, peca_de_fornecedor, status_aprovacao, motivo_rejeicao, conta_origem_pagamento, data_pagamento, data_recebimento, origem_servico, origem_peca, valor_custo_real
- **`os_pagamentos`**: id, os_id, meio, valor, parcelas, comprovante, comprovante_nome, conta_destino

#### 1.6 - Alterar tabela `garantias`
Adicionar: `venda_id_ref`, `item_venda_id`, `tipo_garantia`, `meses_garantia`, `loja_venda`, `vendedor_id`, `cliente_id`, `cliente_nome`, `cliente_telefone`, `cliente_email`, `tratativas` (jsonb), `timeline_garantia` (jsonb).

#### 1.7 - Criar tabelas novas

- **`clientes`**: id, nome, cpf, telefone, data_nascimento, email, cep, endereco, numero, bairro, cidade, estado, status, origem_cliente, ids_compras (jsonb), tipo_cliente, tipo_pessoa, created_at
- **`fornecedores`**: id, nome, cnpj, endereco, responsavel, telefone, status, ultima_compra, created_at
- **`contas_financeiras`**: id, nome, tipo, loja_vinculada, banco, agencia, conta, cnpj, saldo_inicial, saldo_atual, status, ultimo_movimento, status_maquina, nota_fiscal, habilitada, historico_alteracoes (jsonb), created_at
- **`maquinas_cartao`**: id, nome, cnpj_vinculado, conta_origem, status, percentual_maquina, taxas (jsonb), parcelamentos (jsonb), created_at
- **`pecas`**: id, descricao, loja_id, modelo, valor_custo, valor_recomendado, quantidade, data_entrada, origem, nota_compra_id, lote_consignacao_id, status, status_movimentacao, movimentacao_peca_id, fornecedor_id, created_at
- **`notas_compra`**: id, data, numero_nota, fornecedor, valor_total, status, origem, status_urgencia, produtos (jsonb), pagamento (jsonb), timeline (jsonb), ... (demais campos como jsonb para simplificar)
- **`despesas`**: id, tipo, data, descricao, valor, competencia, conta, observacoes, loja_id, status, categoria, data_vencimento, data_pagamento, recorrente, periodicidade, pago_por, comprovante, documento, created_at
- **`pagamentos_financeiros`**: id, data, descricao, valor, meio_pagamento, conta, loja, status, created_at
- **`metas_lojas`**: id, loja_id, mes, ano, meta_faturamento, meta_acessorios, meta_garantia, meta_assistencia, created_at, ultima_atualizacao
- **`movimentacoes_pecas`**: id, peca_id, tipo, quantidade, data, os_id, descricao, created_at
- **`acessorios`**: id, nome, categoria, marca, valor_custo, valor_venda, quantidade, loja_id, status, created_at

---

### FASE 2 - Migrar Código (próxima iteração)

Refatorar cada arquivo `*Api.ts` para usar `supabase.from('tabela')` em vez de arrays em memória/localStorage. Converter funções síncronas para `async/await`. Atualizar todos os componentes React para usar React Query (`useQuery`/`useMutation`).

### FASE 3 - Seed e RLS (após migração)

Inserir dados iniciais nas tabelas, configurar RLS policies e remover todo código de mock/localStorage.

---

## Próximo Passo Imediato

Executar as migrations SQL da Fase 1 para expandir o schema. Serão executadas em lotes para não exceder limites de tamanho. Estimativa: 3-4 migrations SQL.

**Importante**: Nenhum código TypeScript será alterado nesta fase. Apenas o banco de dados será preparado.
