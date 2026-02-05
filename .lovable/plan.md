
# Plano: Carrossel de Imagens no Quadro do Produto + Lista de Arquivos Separada

## Objetivo

Reorganizar a funcionalidade de imagens temporarias para:
1. Integrar o upload e exibicao em carrossel no quadro "Imagem do Produto" ja existente
2. Criar um quadro separado "Imagens Anexadas" apenas com lista de nomes de arquivos e opcao de download

---

## Nova Arquitetura Visual

```text
+-----------------------------------------------+
|  [Image] Imagem do Produto                    |
+-----------------------------------------------+
|  +---------------------------------------+    |
|  |                                       |    |
|  |   [<]  CARROSSEL DE IMAGENS   [>]    |    |
|  |                                       |    |
|  |   (exibe imagens temporarias ou       |    |
|  |    placeholder se nao houver)         |    |
|  +---------------------------------------+    |
|                                               |
|  [!] Imagens temporarias - serao perdidas...  |
|                                               |
|  [Selecionar Imagens]  [Tirar Foto]           |
|  ou arraste arquivos aqui                     |
|                                               |
|  --- QR Code (permanece igual) ---            |
+-----------------------------------------------+

+-----------------------------------------------+
|  [List] Imagens Anexadas                  (3) |
+-----------------------------------------------+
|  +-------------------------------------------+|
|  | foto1.jpg           1.2 MB    [Download]  ||
|  +-------------------------------------------+|
|  | foto2.png           850 KB    [Download]  ||
|  +-------------------------------------------+|
|  | foto3.jpg           2.1 MB    [Download]  ||
|  +-------------------------------------------+|
+-----------------------------------------------+
```

---

## Etapas de Implementacao

### 1. Modificar o Quadro "Imagem do Produto"

**No arquivo `EstoqueProdutoDetalhes.tsx`:**

Substituir o conteudo atual do Card "Imagem do Produto" (linhas 181-211) para incluir:

**Carrossel de Imagens:**
- Usar o componente `Carousel` do shadcn/ui (ja existe em `src/components/ui/carousel.tsx`)
- Exibir as imagens temporarias como slides
- Se nao houver imagens, mostrar o placeholder atual ("Imagem do produto")
- Botoes de navegacao (setas) aparecem quando ha mais de 1 imagem
- Indicadores de posicao (dots) abaixo do carrossel

**Area de Upload integrada:**
- Manter botoes "Selecionar Imagens" e "Tirar Foto"
- Manter area de drag-and-drop
- Manter alerta de aviso sobre imagens temporarias

**QR Code:**
- Permanece na mesma posicao, abaixo da area de upload

### 2. Criar Novo Componente `ListaImagensAnexadas`

**Novo arquivo: `src/components/estoque/ListaImagensAnexadas.tsx`**

Componente simples que exibe:
- Lista de arquivos em formato de tabela/lista
- Nome do arquivo (truncado se muito longo)
- Tamanho do arquivo formatado (KB/MB)
- Botao de download para cada arquivo
- Botao de remover para cada arquivo

Interface mais compacta que o grid de miniaturas anterior.

### 3. Atualizar `ImagensTemporarias` ou Criar Novos Componentes

**Opcao escolhida: Dividir em componentes menores**

Criar dois novos componentes para melhor separacao de responsabilidades:

1. **`CarrosselImagensProduto`**: Exibe carrossel + area de upload
2. **`ListaImagensAnexadas`**: Exibe lista de arquivos com download

O estado `imagensTemporarias` continua sendo gerenciado pelo componente pai (`EstoqueProdutoDetalhes`).

---

## Detalhes do Carrossel

**Comportamento:**
- Loop desabilitado (para quando chega na ultima imagem)
- Navegacao por setas laterais
- Indicadores de posicao (dots) clicaveis
- Transicao suave entre slides
- Aspect ratio quadrado para manter consistencia

**Estados visuais:**
- Sem imagens: Exibe placeholder cinza com texto "Imagem do produto"
- 1 imagem: Exibe imagem sem setas de navegacao
- 2+ imagens: Exibe imagem com setas e indicadores

---

## Detalhes da Lista de Arquivos

**Colunas/Informacoes:**
- Icone de imagem (pequeno)
- Nome do arquivo (truncado com tooltip)
- Tamanho formatado
- Botao de download
- Botao de remover (X)

**Layout:**
- Lista vertical com separadores
- Compacto para nao ocupar muito espaco

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/estoque/CarrosselImagensProduto.tsx` | Criar (carrossel + upload) |
| `src/components/estoque/ListaImagensAnexadas.tsx` | Criar (lista de arquivos) |
| `src/pages/EstoqueProdutoDetalhes.tsx` | Modificar (integrar novos componentes) |
| `src/components/estoque/ImagensTemporarias.tsx` | Remover ou manter para outros usos |

---

## Codigo do Carrossel (Exemplo)

```text
<Carousel className="w-full">
  <CarouselContent>
    {imagens.length === 0 ? (
      <CarouselItem>
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Imagem do produto</span>
        </div>
      </CarouselItem>
    ) : (
      imagens.map((img) => (
        <CarouselItem key={img.id}>
          <div className="aspect-square relative">
            <img src={img.blobUrl} alt={img.nome} className="w-full h-full object-cover rounded-lg" />
          </div>
        </CarouselItem>
      ))
    )}
  </CarouselContent>
  {imagens.length > 1 && (
    <>
      <CarouselPrevious />
      <CarouselNext />
    </>
  )}
</Carousel>
```

---

## Indicadores de Posicao (Dots)

Adicionar dots clicaveis abaixo do carrossel para indicar qual imagem esta sendo exibida:

```text
<div className="flex justify-center gap-2 mt-2">
  {imagens.map((_, index) => (
    <button
      key={index}
      className={cn(
        "h-2 w-2 rounded-full transition-colors",
        currentIndex === index ? "bg-primary" : "bg-muted-foreground/30"
      )}
      onClick={() => api?.scrollTo(index)}
    />
  ))}
</div>
```

---

## Fluxo de Uso Final

1. Usuario abre detalhes de um produto
2. No quadro "Imagem do Produto", ve o placeholder ou carrossel de imagens
3. Clica em "Selecionar Imagens" ou arrasta arquivos
4. Imagens aparecem no carrossel (navegaveis por setas)
5. Rola a pagina e ve o quadro "Imagens Anexadas" com lista de arquivos
6. Pode baixar qualquer arquivo individualmente
7. Pode remover arquivos da lista
8. Se atualizar/fechar a pagina, imagens sao perdidas

---

## Beneficios da Nova Abordagem

1. **Visualizacao rica**: Carrossel permite ver as imagens em tamanho maior
2. **Organizacao clara**: Separacao entre visualizacao (carrossel) e gestao (lista)
3. **Menos poluicao visual**: Lista compacta ao inves de grid de miniaturas
4. **Consistencia**: Usa o mesmo espaco do "Imagem do Produto" existente
5. **Reutilizacao**: Componentes podem ser usados em outras partes do sistema
