

# Plano: Corrigir erro "Erro ao migrar aparelho para Produtos Pendentes"

## Causa Raiz

O bug esta na funcao `addProdutoPendente` em `src/utils/osApi.ts` (linhas 617-624).

O fluxo atual e:

1. `generateProductId()` gera um novo ID (ex: `PROD-0100`)
2. Internamente, `generateProductId` **registra** esse ID no Set `registeredProductIds` (linha 34 do `idManager.ts`)
3. Logo em seguida, `addProdutoPendente` chama `isProductIdRegistered(newId)` para validar
4. Como o ID **ja foi registrado** no passo 2, a verificacao retorna `true`
5. O sistema lanca um `throw new Error("Erro de rastreabilidade - ID duplicado detectado")`
6. O `catch` em `migrarParaProdutosPendentes` captura o erro e retorna `null`
7. A pagina exibe o toast "Erro ao migrar aparelho para Produtos Pendentes"

Em resumo: a funcao `generateProductId` ja registra o ID, tornando a verificacao subsequente sempre verdadeira, o que causa o erro em 100% dos casos.

## Correcao

### Arquivo: `src/utils/osApi.ts`

Remover a verificacao redundante `isProductIdRegistered` nas linhas 620-624, pois `generateProductId` ja garante unicidade internamente (usa um loop `do/while` para evitar colisoes e registra o ID antes de retornar).

O trecho:

```
const newId = generateProductId();

if (isProductIdRegistered(newId)) {
  console.error(`Erro de rastreabilidade – ID duplicado detectado: ${newId}`);
  throw new Error(`Erro de rastreabilidade – ID duplicado detectado: ${newId}`);
}
```

Deve ser simplificado para:

```
const newId = generateProductId();
```

A funcao `generateProductId` ja garante que o ID e unico e ja o registra no Set centralizado, tornando a verificacao posterior desnecessaria e, na verdade, destrutiva.

## Impacto

- Corrige o erro de migracao para todos os trade-ins na Base de Trocas
- Corrige tambem qualquer outra chamada a `addProdutoPendente` que esteja falhando pela mesma razao (ex: cadastro de produtos via Nota de Entrada)
- Nenhum efeito colateral, pois a unicidade continua garantida pelo `generateProductId`
