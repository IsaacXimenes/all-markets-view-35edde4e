// Sistema centralizado de geração e validação de IDs de produtos
// Garante unicidade e persistência de IDs em todo o sistema

// Contador global de IDs - começa após os IDs existentes nos mocks
let globalProductIdCounter = 100;

// Registro central de todos os IDs de produtos no sistema
const registeredProductIds = new Set<string>();

// Inicializa o registro com IDs existentes
export const initializeProductIds = (existingIds: string[]) => {
  existingIds.forEach(id => registeredProductIds.add(id));
  
  // Encontra o maior número usado e atualiza o contador
  existingIds.forEach(id => {
    const match = id.match(/PROD-(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= globalProductIdCounter) {
        globalProductIdCounter = num + 1;
      }
    }
  });
};

// Gera um novo ID único de produto
export const generateProductId = (): string => {
  let newId: string;
  do {
    newId = `PROD-${String(globalProductIdCounter).padStart(4, '0')}`;
    globalProductIdCounter++;
  } while (registeredProductIds.has(newId));
  
  registeredProductIds.add(newId);
  return newId;
};

// Registra um ID existente (para migração ou importação)
export const registerProductId = (id: string): boolean => {
  if (registeredProductIds.has(id)) {
    console.warn(`[ID MANAGER] ID duplicado detectado: ${id}`);
    return false;
  }
  registeredProductIds.add(id);
  
  // Atualiza o contador se necessário
  const match = id.match(/PROD-(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num >= globalProductIdCounter) {
      globalProductIdCounter = num + 1;
    }
  }
  
  return true;
};

// Verifica se um ID já está registrado
export const isProductIdRegistered = (id: string): boolean => {
  return registeredProductIds.has(id);
};

// Valida se um ID tem o formato correto
export const isValidProductIdFormat = (id: string): boolean => {
  return /^PROD-\d{4}$/.test(id);
};

// Remove um ID do registro (apenas para casos extremos)
export const unregisterProductId = (id: string): void => {
  registeredProductIds.delete(id);
};

// Retorna todos os IDs registrados (para debugging)
export const getAllRegisteredIds = (): string[] => {
  return Array.from(registeredProductIds);
};

// Valida integridade dos IDs (detecta duplicatas entre listas)
export const validateProductIdIntegrity = (
  lists: { name: string; ids: string[] }[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const allIds = new Map<string, string[]>();
  
  lists.forEach(list => {
    list.ids.forEach(id => {
      if (!allIds.has(id)) {
        allIds.set(id, []);
      }
      allIds.get(id)!.push(list.name);
    });
  });
  
  allIds.forEach((locations, id) => {
    if (locations.length > 1) {
      errors.push(`Erro de rastreabilidade – ID duplicado detectado: ${id} encontrado em: ${locations.join(', ')}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};
