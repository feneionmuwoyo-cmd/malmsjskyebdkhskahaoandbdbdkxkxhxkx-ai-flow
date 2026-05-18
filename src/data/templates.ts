import type { VslContent } from "@/lib/ai.functions";

export type Template = {
  id: string;
  name: string;
  niche: string;
  description: string;
  accent: string;
  content: VslContent;
};

const base = (
  title: string,
  accent: string,
  data: Omit<VslContent, "style" | "title">,
): VslContent => ({
  title,
  style: { palette: "dark-premium", accentColor: accent },
  vslVideoUrl: "",
  ...data,
});

export const TEMPLATES: Template[] = [
  {
    id: "infoproduct",
    name: "Infoproduto",
    niche: "Cursos e mentorias",
    description: "Estrutura clássica de vendas para curso digital com alta percepção de valor.",
    accent: "#8BC53F",
    content: base("Curso online", "#8BC53F", {
      headline: "O método que já transformou 1.200 pessoas em apenas 60 dias",
      subheadline: "Mesmo que já tenhas tentado de tudo antes e nada funcionou.",
      cta: "Quero começar agora",
      vslScript: [
        "Se chegaste até aqui é porque algo dentro de ti diz que está na altura de mudar.",
        "Nos próximos minutos vou mostrar-te o método exato que já ajudou mais de 1.200 pessoas.",
        "Não é mais uma promessa vazia. É um sistema testado, com casos reais e resultados verificáveis.",
        "Continua a ver até ao fim porque no final tenho uma oferta especial só para quem age hoje.",
      ],
      sections: [
        { type: "problem", heading: "Estás cansado de promessas que não cumprem", body: "Já compraste cursos, leste livros, viste vídeos no YouTube e mesmo assim continuas no mesmo sítio.", bullets: ["Falta de método claro", "Excesso de informação sem aplicação", "Nenhum acompanhamento real"] },
        { type: "solution", heading: "A solução que finalmente faz sentido", body: "Um caminho passo a passo, com acompanhamento próximo e foco em resultado, não em teoria." },
        { type: "benefits", heading: "O que vais conseguir", body: "Resultados práticos desde a primeira semana.", bullets: ["Primeiro resultado em 7 dias", "Acompanhamento por 60 dias", "Comunidade ativa de alunos", "Garantia incondicional"] },
        { type: "offer", heading: "A oferta completa", body: "Tens acesso a tudo com um único pagamento.", bullets: ["Curso completo com 8 módulos", "Templates prontos a usar", "Bónus exclusivos por tempo limitado"] },
        { type: "guarantee", heading: "Garantia de 7 dias", body: "Se em 7 dias não sentires que vale 10x o que pagaste, devolvemos cada cêntimo." },
        { type: "urgency", heading: "Esta oferta termina em breve", body: "O preço atual é só para os primeiros 50 alunos desta turma." },
      ],
      faq: [
        { q: "Quanto tempo demoro a ver resultado?", a: "Os primeiros sinais aparecem na primeira semana, e em 60 dias tens transformação completa." },
        { q: "Funciona mesmo se eu já tentei de tudo?", a: "Sim. O método foi desenhado precisamente para quem já está cansado de tentar." },
        { q: "Tenho garantia?", a: "Sim, 7 dias para experimentar sem risco." },
      ],
      testimonials: [
        { name: "Ana Ribeiro", role: "Aluna", quote: "Em 3 semanas já tinha o resultado que esperava há anos." },
        { name: "João Costa", role: "Aluno", quote: "O melhor investimento que fiz nos últimos 5 anos." },
        { name: "Marta Silva", role: "Aluna", quote: "Estrutura simples, acompanhamento brutal." },
      ],
    }),
  },
  {
    id: "ecommerce",
    name: "Produto físico",
    niche: "E-commerce e dropshipping",
    description: "Página para produto físico com foco em benefício imediato e prova social.",
    accent: "#F97316",
    content: base("Produto físico", "#F97316", {
      headline: "O produto que está a esgotar em Portugal",
      subheadline: "Aprovado por milhares de clientes em todo o país.",
      cta: "Comprar com 50% de desconto",
      vslScript: [
        "Imagina resolver o teu problema em menos de 7 dias, sem complicações.",
        "Foi exatamente isso que centenas de pessoas conseguiram com este produto.",
        "Hoje queremos que tu também experimentes — com uma oferta especial.",
      ],
      sections: [
        { type: "problem", heading: "O incómodo que ninguém quer admitir", body: "Sabemos como é frustrante." },
        { type: "solution", heading: "A solução que faltava no mercado", body: "Desenvolvida com tecnologia que funciona desde o primeiro uso." },
        { type: "benefits", heading: "Porque é diferente de tudo o que já experimentaste", body: "Os clientes adoram porque resolve mesmo.", bullets: ["Resultado em 7 dias", "Material premium", "Entrega rápida em todo o país"] },
        { type: "social-proof", heading: "Mais de 10.000 clientes felizes", body: "Avaliação média 4.9/5 em mais de 2.300 reviews verificadas." },
        { type: "offer", heading: "Promoção desta semana", body: "Aproveita 50% de desconto e portes grátis.", bullets: ["Frete grátis", "Garantia de 30 dias", "Stock limitado"] },
        { type: "urgency", heading: "Stock a esgotar", body: "Restam menos de 100 unidades desta encomenda." },
      ],
      faq: [
        { q: "Quanto tempo demora a entrega?", a: "Entre 2 a 4 dias úteis para todo o país." },
        { q: "Posso devolver?", a: "Sim, tens 30 dias para devolver sem questões." },
        { q: "Como funciona o pagamento?", a: "Multibanco, MB Way, cartão ou Paypal." },
      ],
      testimonials: [
        { name: "Carla Mendes", role: "Cliente verificada", quote: "Chegou em 3 dias e funcionou exatamente como diziam." },
        { name: "Pedro Santos", role: "Cliente verificado", quote: "Não acreditava mas estou impressionado." },
        { name: "Sofia Lima", role: "Cliente verificada", quote: "Já comprei outro para oferecer." },
      ],
    }),
  },
  {
    id: "saas",
    name: "SaaS / Software",
    niche: "Software como serviço",
    description: "Landing page para SaaS com foco em features, prova social e trial grátis.",
    accent: "#3B82F6",
    content: base("SaaS Landing", "#3B82F6", {
      headline: "A plataforma que poupa 10 horas por semana à tua equipa",
      subheadline: "Automatiza o que importa. Concentra-te no que cresce o negócio.",
      cta: "Começar grátis por 14 dias",
      vslScript: [
        "A tua equipa está a perder horas em tarefas que podiam ser automáticas.",
        "Esta plataforma resolve isso em minutos.",
        "Mais de 5.000 empresas já confiam — agora é a tua vez.",
      ],
      sections: [
        { type: "problem", heading: "O caos do trabalho manual", body: "Folhas de cálculo, emails perdidos, processos repetidos." },
        { type: "solution", heading: "Tudo num só sítio", body: "Centraliza, automatiza e analisa em tempo real." },
        { type: "benefits", heading: "Funcionalidades pensadas para escalar", body: "", bullets: ["Automações ilimitadas", "Integrações com 100+ ferramentas", "Relatórios em tempo real", "Suporte humano em português"] },
        { type: "social-proof", heading: "Equipas de topo confiam em nós", body: "De startups a empresas com 500+ colaboradores." },
        { type: "offer", heading: "14 dias grátis, sem cartão", body: "Cancela quando quiseres.", bullets: ["Acesso completo", "Onboarding incluído", "Sem compromisso"] },
        { type: "guarantee", heading: "Garantia de satisfação", body: "Se não fores capaz de poupar 5 horas por semana, devolvemos o pagamento." },
      ],
      faq: [
        { q: "Preciso de cartão para o trial?", a: "Não. Começas em 30 segundos sem cartão." },
        { q: "Quanto tempo demora o setup?", a: "Menos de 10 minutos com a nossa equipa." },
        { q: "Tem integração com X?", a: "Sim, integramos com mais de 100 ferramentas." },
      ],
      testimonials: [
        { name: "Inês Faria", role: "COO", quote: "Poupou-nos uma pessoa a tempo inteiro em 2 meses." },
        { name: "Rui Tavares", role: "Founder", quote: "A melhor decisão de produtividade que tomei este ano." },
        { name: "Mariana Pinto", role: "Head of Ops", quote: "Setup em 20 minutos, ROI na primeira semana." },
      ],
    }),
  },
  {
    id: "consulting",
    name: "Consultoria premium",
    niche: "Serviços B2B high-ticket",
    description: "VSL para venda consultiva de serviço premium com agendamento de call.",
    accent: "#D4AF37",
    content: base("Consultoria premium", "#D4AF37", {
      headline: "Estratégia personalizada para empresas que querem escalar",
      subheadline: "Apenas 5 vagas por mês. Reserva uma call de diagnóstico.",
      cta: "Agendar call de diagnóstico",
      vslScript: [
        "Se a tua empresa está no patamar dos 6 a 7 dígitos e quer dar o próximo salto, este vídeo é para ti.",
        "Trabalho apenas com 5 empresas por mês, com um método validado em mais de 80 projetos.",
        "Reserva a tua call de diagnóstico gratuita — sem compromisso.",
      ],
      sections: [
        { type: "problem", heading: "O teto que muitas empresas batem", body: "Faturas estagnam, equipa cansa, e o dono volta a fazer tudo." },
        { type: "solution", heading: "Diagnóstico antes de qualquer proposta", body: "Cada empresa é única. O plano também tem de ser." },
        { type: "benefits", heading: "O que entrego em 90 dias", body: "", bullets: ["Auditoria estratégica completa", "Plano de crescimento de 12 meses", "Acompanhamento semanal", "Acesso ao meu network"] },
        { type: "social-proof", heading: "Empresas que escalaram comigo", body: "Mais de 80 projetos concluídos em 5 países." },
        { type: "offer", heading: "Call de diagnóstico gratuita", body: "45 minutos para perceber se faz sentido trabalharmos juntos." },
        { type: "urgency", heading: "Apenas 5 vagas por mês", body: "Depois de preenchidas, abre-se nova lista de espera." },
      ],
      faq: [
        { q: "Qual o investimento?", a: "Definido após a call de diagnóstico, conforme escopo." },
        { q: "Para que tipo de empresa?", a: "Empresas entre 500k e 5M de faturação anual." },
        { q: "Como funciona a call?", a: "45 minutos por Zoom, sem qualquer compromisso." },
      ],
      testimonials: [
        { name: "Tiago Almeida", role: "CEO", quote: "Dobrámos o EBITDA em 14 meses." },
        { name: "Helena Reis", role: "Sócia", quote: "Trouxe clareza que andávamos a procurar há 2 anos." },
        { name: "Bruno Matos", role: "Founder", quote: "Diferente de tudo o que já contratei." },
      ],
    }),
  },
];
