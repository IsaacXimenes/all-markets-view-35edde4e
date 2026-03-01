

# Plano: Renomear "Supervisor de Loja" para "Gestor de Loja"

## Situacao Atual

O cargo `CARGO-008` esta definido como **"Supervisor de Loja"** e possui **13 colaboradores** vinculados:
Anna Vieira, Bruno Peres, Eilanne Alves, Geane Sousa, Hayanne Santini, Laina Lima, Leonardo Carvalho, Lorranny Rodrigues, Matheus Eduardo, Matheus Holanda, Meline Almeida, Patrycia Souza e Stephanie Sousa.

O nome "Supervisor" aparece em 3 arquivos do codigo.

## Alteracoes

### 1. `src/utils/cadastrosApi.ts`
- Linha 297: Renomear `'Supervisor de Loja'` para `'Gestor de Loja'` no array de cargos padrao

### 2. `src/utils/feedbackApi.ts`
- Linha 143: Trocar `'Supervisor de Loja'` por `'Gestor de Loja'` no array `cargosGestores`
- Linha 148: Trocar `'supervisor'` por `'gestor'` na busca por substring (ja existe busca por 'gestor' na linha 159, entao fica consistente)
- Linha 160: Remover referencia a `'supervisor'` (ja coberta por 'gestor')

### 3. `src/pages/GestaoAdmStoriesValidacao.tsx`
- Linha 268: Trocar placeholder "Observacoes do supervisor..." por "Observacoes do gestor..."

Nenhuma alteracao no banco de dados e necessaria porque o campo `cargo` nas tabelas `colaboradores` e `profiles` armazena apenas o codigo (`CARGO-008`), nao o nome. O nome e resolvido pelo mapeamento no frontend.
