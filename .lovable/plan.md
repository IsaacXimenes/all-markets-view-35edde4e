
# Importar Base de Acessorios do Excel

## Resumo

Substituir os 5 registros mock atuais pela base completa de 779 acessorios extraidos do arquivo Excel. IDs incrementais no formato `AC-001` ate `AC-779`, com `limiteMinimo: 0` para todos.

## Alteracoes

### Arquivo: `src/pages/CadastrosAcessorios.tsx`

**Dados mock (linhas 20-26):**
- Remover os 5 registros mock existentes
- Inserir os 779 registros do Excel no formato:
  ```text
  { id: 'AC-001', marca: 'GENÉRICO', categoria: 'Acessórios - Geral', produto: 'Adaptador Otg', limiteMinimo: 0 },
  { id: 'AC-002', marca: 'APPLE', categoria: 'Acessórios', produto: 'Airpods 4', limiteMinimo: 0 },
  ...ate...
  { id: 'AC-779', marca: 'JBL', categoria: 'Áudio', produto: 'Xtreme 4', limiteMinimo: 0 },
  ```

**Contador nextId (linha 28):**
- Atualizar de `6` para `780`

**Nenhuma outra alteracao** - a estrutura da tabela, formulario, filtros, exportacao CSV e funcoes auxiliares (`getLimiteMinimo`, `verificarEstoqueBaixo`, etc.) permanecem inalterados.

## Detalhes

| Item | Valor |
|------|-------|
| Total de registros | 779 |
| Formato ID | AC-001 a AC-779 (incremental, 3 digitos) |
| Limite Minimo | 0 para todos (sera preenchido depois) |
| Categorias encontradas | Capas, Carregadores, Peliculas, Audio, Acessorios - Geral, Acessorios - Apple, Games, Relogios, Perifericos, Eletronicos, Acessorios |
| Marcas encontradas | GENERICO, APPLE, JBL, SONY, SAMSUNG, AIWA, AMAZON, CLARO, PHILIPS, STARLINK, XBOX |
| Arquivo editado | `src/pages/CadastrosAcessorios.tsx` |
