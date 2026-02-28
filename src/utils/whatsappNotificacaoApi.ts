// WhatsApp Notification API - Configuração e disparo de notificações de vendas
import { supabase } from "@/integrations/supabase/client";

export interface ConfigWhatsApp {
  habilitado: boolean;
  apiUrl: string;
  token: string;
  destinatario: string;
  modeloMensagem: string;
}

export interface DadosVendaNotificacao {
  id_venda: string;
  loja: string;
  vendedor: string;
  cliente: string;
  valor: string;
  forma_pagamento: string;
}

export const MENSAGEM_PADRAO = `🚀 Nova Venda Registrada!
💰 Valor: R$ {{valor}}
📍 Loja: {{loja}}
👤 Vendedor: {{vendedor}}
🤝 Cliente: {{cliente}}
💳 Pagamento: {{forma_pagamento}}
🔖 ID da Venda: #{{id_venda}}`;

export const CONFIG_PADRAO: ConfigWhatsApp = {
  habilitado: false,
  apiUrl: '',
  token: '',
  destinatario: '',
  modeloMensagem: '',
};

// ── Cache ──
let _configCache: ConfigWhatsApp = { ...CONFIG_PADRAO };
let _configId: string | null = null;
let _cacheLoaded = false;

export const initConfigWhatsAppCache = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('config_whatsapp')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      _configCache = {
        habilitado: data.habilitado ?? false,
        apiUrl: data.api_url ?? '',
        token: data.token ?? '',
        destinatario: data.destinatario ?? '',
        modeloMensagem: data.modelo_mensagem ?? '',
      };
      _configId = data.id;
    }
    _cacheLoaded = true;
  } catch (err) {
    console.error('[WhatsApp] Erro ao carregar config:', err);
    _cacheLoaded = true;
  }
};

export const getConfigWhatsApp = (): ConfigWhatsApp => {
  return { ..._configCache };
};

export const salvarConfigWhatsApp = async (config: ConfigWhatsApp): Promise<void> => {
  const row = {
    habilitado: config.habilitado,
    api_url: config.apiUrl,
    token: config.token,
    destinatario: config.destinatario,
    modelo_mensagem: config.modeloMensagem,
    updated_at: new Date().toISOString(),
  };

  try {
    if (_configId) {
      const { error } = await supabase
        .from('config_whatsapp')
        .update(row)
        .eq('id', _configId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('config_whatsapp')
        .insert(row)
        .select('id')
        .single();
      if (error) throw error;
      _configId = data.id;
    }
    _configCache = { ...config };
  } catch (err) {
    console.error('[WhatsApp] Erro ao salvar config:', err);
  }
};

export const formatarMensagemVenda = (modelo: string, dados: DadosVendaNotificacao): string => {
  return modelo
    .replace(/\{\{id_venda\}\}/g, dados.id_venda)
    .replace(/\{\{loja\}\}/g, dados.loja)
    .replace(/\{\{vendedor\}\}/g, dados.vendedor)
    .replace(/\{\{cliente\}\}/g, dados.cliente)
    .replace(/\{\{valor\}\}/g, dados.valor)
    .replace(/\{\{forma_pagamento\}\}/g, dados.forma_pagamento);
};

export const enviarNotificacaoVenda = async (dadosVenda: DadosVendaNotificacao): Promise<void> => {
  try {
    const config = getConfigWhatsApp();

    if (!config.habilitado) {
      console.log('[WhatsApp] Notificações desabilitadas.');
      return;
    }

    if (!config.apiUrl || !config.destinatario) {
      console.warn('[WhatsApp] Configuração incompleta (URL ou destinatário ausente).');
      return;
    }

    const modelo = config.modeloMensagem?.trim() || MENSAGEM_PADRAO;
    const mensagem = formatarMensagemVenda(modelo, dadosVenda);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.token?.trim()) {
      headers['Authorization'] = `Bearer ${config.token.trim()}`;
    }

    await fetch(config.apiUrl, {
      method: 'POST',
      headers,
      mode: 'no-cors',
      body: JSON.stringify({
        number: config.destinatario,
        text: mensagem,
      }),
    });

    console.log('[WhatsApp] Notificação enviada com sucesso (modo no-cors, resposta opaca).');
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar notificação:', error);
  }
};

export const enviarMensagemTeste = async (): Promise<void> => {
  const dadosTeste: DadosVendaNotificacao = {
    id_venda: 'TESTE-001',
    loja: 'Loja Central',
    vendedor: 'João Silva',
    cliente: 'Maria Oliveira',
    valor: '2.499,90',
    forma_pagamento: 'Cartão de Crédito',
  };

  await enviarNotificacaoVenda(dadosTeste);
};
