

# Nova Aba "Valores de Troca" no Estoque + Atualização de Cadastro de Aparelhos

## Escopo

Duas frentes de trabalho:
1. Criar aba separada no modulo Estoque para gerenciar os Valores Recomendados de Troca (com edicao e logs)
2. Atualizar a listagem de aparelhos no Cadastro, substituindo os iPhones existentes pela lista completa com capacidade de armazenamento

---

## 1. Nova Aba "Valores de Troca" no Modulo Estoque

### O que sera feito
- Criar nova pagina `EstoqueValoresTroca.tsx` com tabela de valores recomendados
- Adicionar aba "Valores de Troca" no `EstoqueLayout.tsx` (carousel de abas)
- Registrar rota `/estoque/valores-troca` no `App.tsx`

### Funcionalidades da pagina
- Tabela com colunas: Modelo, Marca, Condicao (Novo/Semi-novo), Valor Min, Valor Max, Valor Sugerido, Ultima Atualizacao
- Busca por modelo/marca
- Botao "Novo Valor" para cadastrar novo registro
- Botao de editar em cada linha (modal com formulario)
- Botao de excluir com confirmacao
- Exportar CSV

### Sistema de Logs
- Adicionar interface `LogValorTroca` na API (`valoresRecomendadosTrocaApi.ts`) com campos: id, tipo (criacao/edicao/exclusao), modelo, usuario, dataHora, detalhes (campo alterado, valor anterior, valor novo)
- Cada acao de criar, editar ou excluir gera um registro de log
- Exibir historico de logs na pagina via botao "Ver Logs" ou secao expansivel

### Arquivos
- **Novo:** `src/pages/EstoqueValoresTroca.tsx`
- **Editar:** `src/components/layout/EstoqueLayout.tsx` (adicionar aba)
- **Editar:** `src/App.tsx` (adicionar rota)
- **Editar:** `src/utils/valoresRecomendadosTrocaApi.ts` (adicionar funcoes CRUD + logs)

---

## 2. Atualizacao do Cadastro de Aparelhos (iPhones)

### O que sera feito
- Substituir os 20 registros atuais de iPhones (PROD-CAD-001 a PROD-CAD-020) por 108 registros detalhados com modelo + capacidade de armazenamento
- Manter os registros de iPad, MacBook, Watch, AirPods e Acessorios (PROD-CAD-021 a PROD-CAD-040)
- Remover duplicatas, mantendo sempre Marca = "Apple" e Categoria = "iPhone"

### Lista completa (108 registros iPhone)
- iPhone 7 (32/128/256 GB) -- 3 registros
- iPhone 7 Plus (32/128/256 GB) -- 3 registros
- iPhone 8 (64/128/256 GB) -- 3 registros
- iPhone 8 Plus (64/128/256 GB) -- 3 registros
- iPhone X (64/256 GB) -- 2 registros
- iPhone XS (64/256/512 GB) -- 3 registros
- iPhone XS Max (64/256/512 GB) -- 3 registros
- iPhone XR (64/128/256 GB) -- 3 registros
- iPhone 11 (64/128/256 GB) -- 3 registros
- iPhone 11 Pro (64/256/512 GB) -- 3 registros
- iPhone 11 Pro Max (64/256/512 GB) -- 3 registros
- iPhone 12 mini (64/128/256 GB) -- 3 registros
- iPhone 12 (64/128/256 GB) -- 3 registros
- iPhone 12 Pro (128/256/512 GB) -- 3 registros
- iPhone 12 Pro Max (128/256/512 GB) -- 3 registros
- iPhone 13 mini (128/256/512 GB) -- 3 registros
- iPhone 13 (128/256/512 GB) -- 3 registros
- iPhone 13 Pro (128/256/512/1TB) -- 4 registros
- iPhone 13 Pro Max (128/256/512/1TB) -- 4 registros
- iPhone 14 (128/256/512 GB) -- 3 registros
- iPhone 14 Plus (128/256/512 GB) -- 3 registros
- iPhone 14 Pro (128/256/512/1TB) -- 4 registros
- iPhone 14 Pro Max (128/256/512/1TB) -- 4 registros
- iPhone 15 (128/256/512 GB) -- 3 registros
- iPhone 15 Plus (128/256/512 GB) -- 3 registros
- iPhone 15 Pro (128/256/512/1TB) -- 4 registros
- iPhone 15 Pro Max (128/256/512/1TB) -- 4 registros
- iPhone 16 (128/256 GB) -- 2 registros
- iPhone 16 Plus (128/256 GB) -- 2 registros
- iPhone 16 Pro (128/256/512/1TB) -- 4 registros
- iPhone 16 Pro Max (256/512/1TB) -- 3 registros
- iPhone 17 (256/512 GB) -- 2 registros
- iPhone 17 Air (256/512/1TB) -- 3 registros
- iPhone 17 Pro (256/512/1TB) -- 3 registros
- iPhone 17 Pro Max (256/512/1TB/2TB) -- 4 registros

### Arquivo
- **Editar:** `src/utils/cadastrosApi.ts` (substituir array `produtosCadastro` de PROD-CAD-001 a PROD-CAD-020 pelos 108 novos registros, mantendo PROD-CAD-021+ intactos com IDs sequenciais ajustados)

---

## Detalhes Tecnicos

### Ordem de implementacao
1. Atualizar `cadastrosApi.ts` com os 108 iPhones
2. Atualizar `valoresRecomendadosTrocaApi.ts` com CRUD completo e sistema de logs
3. Criar pagina `EstoqueValoresTroca.tsx`
4. Adicionar aba no `EstoqueLayout.tsx`
5. Registrar rota no `App.tsx`

### Padrao de logs
```text
interface LogValorTroca {
  id: string;
  tipo: 'criacao' | 'edicao' | 'exclusao';
  modelo: string;
  usuario: string;
  dataHora: string;
  detalhes: string;
}
```

Cada operacao CRUD registra automaticamente um log com usuario logado (do authStore), data/hora e descricao da alteracao.

