import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook para sincronizar estado de abas com parâmetros da URL.
 * Permite navegação de retorno com o botão "Voltar" do navegador.
 * 
 * @param defaultTab - Aba padrão quando não há parâmetro na URL
 * @param paramName - Nome do parâmetro na URL (default: 'tab')
 * @returns [tabAtual, setTab] - Valor atual e função para mudar aba
 */
export function useUrlTabs(defaultTab: string, paramName: string = 'tab') {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Ler aba da URL ou usar default
  const currentTab = searchParams.get(paramName) || defaultTab;
  
  // Atualizar URL ao mudar aba (sem recarregar página)
  const setTab = useCallback((newTab: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (newTab === defaultTab) {
        newParams.delete(paramName); // Remove param se for o default
      } else {
        newParams.set(paramName, newTab);
      }
      return newParams;
    }, { replace: false }); // replace: false para permitir navegação "Voltar"
  }, [setSearchParams, defaultTab, paramName]);
  
  return [currentTab, setTab] as const;
}

export default useUrlTabs;
