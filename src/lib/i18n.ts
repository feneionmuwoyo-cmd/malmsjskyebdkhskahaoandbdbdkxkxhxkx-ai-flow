export type Language = "en" | "pt";

const translations: Record<string, string> = {
  "Entrar": "Sign in", "Criar conta": "Create account", "Criar Conta": "Create account",
  "Sair": "Sign out", "Voltar para o site": "Back to website", "Login": "Sign in",
  "Carregando...": "Loading...", "Carregando": "Loading", "Atualizar": "Refresh",
  "Dashboard": "Dashboard", "Painel de Automação": "Automation dashboard",
  "Informações do negócio": "Business information", "Meus contactos": "My contacts",
  "Pedidos": "Orders", "Minha Agenda": "My calendar", "Meus Produtos": "My products",
  "Minha Loja": "My store", "Tutorial": "Tutorial", "Recarregar mensagens": "Top up messages",
  "Transferido para humano": "Human handover", "Ativos": "Active", "Em espera": "Waiting",
  "Total": "Total", "Lista de transferidos": "Handover list", "Nenhum cliente transferido para humano até agora.": "No customers have been handed over yet.",
  "Planos e faturação": "Plans & billing", "Integrações": "Integrations", "Caixa partilhada": "Inbox",
  "Idioma": "Language", "Ligar": "Connect", "Conversations": "Conversations",
  "AI ON": "AI ON", "HUMAN MODE": "HUMAN MODE", "Enviar": "Send", "Fechar": "Close",
  "Aceitar": "Accept", "Cancelar": "Cancel", "Guardar": "Save", "Adicionar": "Add",
  "Descrição": "Description", "Nome completo": "Full name", "Senha": "Password", "Email": "Email",
  "Telefone": "Phone", "Começar teste gratuito": "Start free trial", "Ativar conta": "Activate account",
  "Conectar WhatsApp": "Connect WhatsApp", "Configuração da loja": "Store settings",
  "Nenhum resultado encontrado": "No results found", "Erro": "Error", "Sucesso": "Success",
};

export function translateText(value: string, language: Language) {
  if (language === "pt") return value;
  return translations[value.trim()] || value;
}

export function translateDocument(language: Language) {
  if (typeof document === "undefined" || language === "pt") return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  nodes.forEach((text) => {
    const original = text.textContent || "";
    const translated = translateText(original, language);
    if (translated !== original) text.textContent = translated;
  });
  document.querySelectorAll<HTMLElement>("[placeholder]").forEach((element) => {
    const translated = translateText(element.getAttribute("placeholder") || "", language);
    if (translated) element.setAttribute("placeholder", translated);
  });
}
