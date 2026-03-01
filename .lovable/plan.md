

# Auto-preencher Loja ao selecionar Colaborador

## Objetivo

Quando um usuario de "Acesso Geral" seleciona um colaborador no campo de responsavel, o campo de loja deve ser preenchido automaticamente com a loja daquele colaborador (considerando rodizio ativo).

## Paginas afetadas

As paginas que possuem **ambos** os campos (colaborador + loja de venda) e onde faz sentido vincular:

| Pagina | Campo Colaborador | Campo Loja | Acao |
|--------|-------------------|------------|------|
| `VendasNova.tsx` | `vendedor` | `lojaVenda` | Auto-preencher loja ao mudar vendedor |
| `VendasAcessorios.tsx` | `vendedor` | `lojaVenda` | Auto-preencher loja ao mudar vendedor |
| `VendasFinalizarDigital.tsx` | `vendedor` | `lojaVenda` | Verificar se aplica o mesmo padrao |

As demais paginas (EstoqueNotaCadastrar, OSMovimentacaoPecas, OSSolicitacoesPecas) possuem campo de responsavel mas **nao** possuem um campo de loja vinculado ao responsavel -- a loja nessas telas tem contexto proprio (nota, peca, OS).

## Solucao

### 1. VendasNova.tsx

Substituir o `onChange={setVendedor}` por uma funcao que:
1. Atualiza o vendedor
2. Busca o colaborador pelo ID via `obterColaboradorById`
3. Verifica rodizio ativo via `obterRodizioAtivoDoColaborador`
4. Atualiza `lojaVenda` com a loja correta

```text
const handleVendedorChange = (colId: string) => {
  setVendedor(colId);
  if (colId) {
    const col = obterColaboradorById(colId);
    if (col) {
      const rodizio = obterRodizioAtivoDoColaborador(col.id);
      setLojaVenda(rodizio ? rodizio.loja_destino_id : col.loja_id);
    }
  }
};
```

Usar `handleVendedorChange` no `onChange` do `AutocompleteColaborador`.

### 2. VendasAcessorios.tsx

Mesma logica aplicada ao campo vendedor, reutilizando o mesmo padrao.

### 3. VendasFinalizarDigital.tsx

Verificar se tem o mesmo padrao de colaborador + loja e aplicar se necessario.

## Arquivos a editar

1. `src/pages/VendasNova.tsx` -- handler de onChange do vendedor
2. `src/pages/VendasAcessorios.tsx` -- handler de onChange do vendedor
3. `src/pages/VendasFinalizarDigital.tsx` -- verificar e aplicar se necessario

## Comportamento esperado

- Usuario de Acesso Geral seleciona um vendedor -> loja atualiza automaticamente
- Se o colaborador estiver em rodizio, usa a loja de destino do rodizio
- O campo de loja continua desabilitado (readonly), apenas reflete a loja do colaborador selecionado
- Para usuarios normais (nao Acesso Geral), nada muda -- loja continua vindo do colaborador logado

