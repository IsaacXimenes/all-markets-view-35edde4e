
# Plano - Manter posicao do carrossel ao clicar em uma aba

## Problema

Quando o usuario rola o carrossel para encontrar uma aba e clica nela, a pagina atualiza e o componente remonta, fazendo o scroll voltar para a posicao inicial (esquerda). O usuario precisa rolar novamente para ver a aba que acabou de selecionar.

## Solucao

Adicionar um `useEffect` que, apos a renderizacao, faz scroll automatico ate a aba ativa (a que corresponde a rota atual). Assim, ao navegar para uma aba que esta mais a direita, o carrossel se posiciona automaticamente para exibi-la.

## Alteracao

### Arquivo: `src/components/layout/CarouselTabsNavigation.tsx`

- Adicionar uma `ref` em cada link ativo para identificar o elemento DOM da aba selecionada.
- Adicionar um `useEffect` que escuta mudancas em `location.pathname` e chama `scrollIntoView` no elemento da aba ativa, centralizando-a no carrossel de forma suave.
- Isso garante que, ao clicar em qualquer aba (mesmo fora da area visivel), o carrossel se ajusta para mostrar a aba clicada sem que o usuario precise rolar manualmente novamente.

## Detalhes Tecnicos

```text
useEffect(() => {
  activeTabRef -> scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}, [location.pathname])
```

Nenhum outro arquivo sera alterado. O Sidebar permanece intacto.
