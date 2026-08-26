import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  Inbox,
  LineChart,
  Package,
  Plug,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import aiImage from "@/assets/landing/ai-trained-business.png";
import storeImage from "@/assets/online-store.jpg";
import { useLanguage } from "@/hooks/useLanguage";

type Item = [string, string, string];
const en = {
  problem:
    "The problem isn't getting customers. It's being able to respond to all of them.",
  problemBody:
    "When several messages arrive at the same time, responding to every customer becomes difficult. Questions about prices, products, availability, locations and services are repeated every day. When a customer waits too long, they may simply choose another business.",
  solution:
    "Turn your WhatsApp into an intelligent workspace that works with your team.",
  solutionBody:
    "Muwoyo uses Artificial Intelligence to handle daily customer communication. Your AI Agent can answer questions, recommend products and services, organize customer information, capture leads, register orders and schedule appointments.",
  solutionNote:
    "Automated conversations. Without losing control of your business.",
  solutionBold:
    "Muwoyo doesn't replace your team. It helps your team work better.",
  aiTitle: "An AI that understands your business.",
  aiLead: "Your business provides the knowledge.",
  aiBody:
    "Add products, prices, services, opening hours, business policies and important information. Your AI Agent uses that knowledge to respond with context and according to how your business operates.",
  learn: [
    "Products and prices",
    "Services and availability",
    "Business policies",
    "Opening hours",
    "Payment information",
    "Frequently asked questions",
    "Documents and files",
    "Custom business instructions",
  ],
  howTitle: "From account creation to automated conversations.",
  howBody:
    "Start with 3 days free or 200 credits, configure your business and put your AI Agent to work on WhatsApp.",
  steps: [
    [
      "01",
      "Create your account",
      "Create your Muwoyo account and access your workspace.",
    ],
    [
      "02",
      "Configure your business",
      "Add products, services, working hours and important instructions.",
    ],
    [
      "03",
      "Build your Knowledge Base",
      "Add information manually or upload documents for your AI.",
    ],
    [
      "04",
      "Connect your WhatsApp",
      "Connect your business WhatsApp to Muwoyo.",
    ],
    [
      "05",
      "Activate your AI Agent",
      "Choose what your AI should do and start automating.",
    ],
    [
      "06",
      "Manage everything from one place",
      "Monitor conversations, leads, orders, appointments and team activity.",
    ],
  ],
  featuresTitle: "More than automated replies.",
  featuresBody:
    "Muwoyo brings together the tools your business needs to communicate, sell and organize customer conversations in one place.",
  features: [
    [
      "AI Agent",
      "Answer customer questions and keep conversations active automatically.",
    ],
    [
      "Muwoyo Inbox",
      "View conversations, respond to customers and let your team work together.",
    ],
    [
      "Human Handoff",
      "Take over a conversation when a customer needs human assistance.",
    ],
    ["Products & Catalog", "Manage products, prices and business information."],
    [
      "Orders",
      "Capture, organize and manage orders received through WhatsApp.",
    ],
    [
      "Muwoyo Calendar",
      "Manage appointments, bookings, availability and schedules.",
    ],
    [
      "Contacts & Leads",
      "Organize customer information and sales opportunities.",
    ],
    [
      "Pipeline",
      "Track leads from first contact to qualified opportunity and customer.",
    ],
    [
      "Notifications",
      "Stay informed when customers need attention or appointments are created.",
    ],
    [
      "Analytics",
      "Track messages, AI responses, activity, usage and business performance.",
    ],
  ],
  workspace: "Your workspace is ready from day one.",
  workspaceBody:
    "Muwoyo already includes the core tools your business needs to manage customer communication, leads, orders and appointments. Everything works together by default.",
  integrations: "Connect other tools only when you need them.",
  integrationBody:
    "Muwoyo works as a complete platform on its own. Connect the tools your business already uses to keep information and workflows synchronized.",
  audiences: [
    [
      "Clinics",
      "Manage appointments, common questions and patient communication.",
    ],
    [
      "Online Stores",
      "Present products, answer questions, manage orders and assist customers.",
    ],
    [
      "Service Businesses",
      "Automate information, bookings, quotations and follow-ups.",
    ],
    [
      "Sales Teams",
      "Capture leads, organize opportunities and keep conversations moving.",
    ],
    [
      "Any Business",
      "If your customers use WhatsApp to contact your business, Muwoyo can help.",
    ],
  ],
  pricing: "Start free. Upgrade when you're ready.",
  pricingBody:
    "Try Muwoyo for 3 days and explore how your AI Agent, WhatsApp automation and workspace can work for your business.",
  plans: [
    [
      "STARTER",
      "$29",
      "For small businesses getting started.",
      [
        "1 WhatsApp number",
        "1 AI Agent",
        "1 user",
        "Muwoyo Inbox",
        "Knowledge Base",
        "Contacts, products, orders and calendar",
      ],
    ],
    [
      "GROWTH",
      "$59",
      "For growing businesses and team collaboration.",
      [
        "1 WhatsApp number",
        "Up to 3 team members",
        "Shared Inbox and human handoff",
        "Knowledge Base and OCR",
        "Pipeline, Sheets and analytics",
        "Shopify and WooCommerce",
      ],
    ],
    [
      "PRO",
      "$99",
      "For larger teams and advanced workflows.",
      [
        "Up to 3 WhatsApp numbers",
        "Up to 10 team members",
        "Multiple AI Agents",
        "Advanced automation and OCR",
        "All integrations, API and webhooks",
        "Priority support",
      ],
    ],
  ],
  faqTitle: "Frequently Asked Questions",
  faqs: [
    [
      "Is there a free trial?",
      "Yes. You can try Muwoyo for 3 days before choosing a subscription plan.",
    ],
    [
      "Do I need Google Calendar?",
      "No. Muwoyo includes its own scheduling system. Google Calendar is optional.",
    ],
    [
      "How does the AI learn about my business?",
      "Add products, services, prices, policies, working hours and documents to your Knowledge Base.",
    ],
    [
      "Can I upload documents?",
      "Yes. Muwoyo extracts relevant text from uploaded content for your AI Agent.",
    ],
    [
      "Can my team take over a conversation?",
      "Yes. A team member can take control while the AI pauses for that customer.",
    ],
    [
      "Do I need external integrations?",
      "No. Muwoyo works as a complete platform. Integrations are optional.",
    ],
  ],
};
const pt = {
  ...en,
  problem:
    "O problema não é conseguir clientes. É conseguir responder a todos.",
  problemBody:
    "Quando várias mensagens chegam ao mesmo tempo, responder a cada cliente torna-se difícil. Perguntas sobre preços, produtos, disponibilidade, localização e serviços repetem-se todos os dias. Quando um cliente espera demasiado, pode escolher outra empresa.",
  solution:
    "Transforme o seu WhatsApp num espaço inteligente que trabalha com a sua equipa.",
  solutionBody:
    "A Muwoyo usa Inteligência Artificial para tratar da comunicação diária com os clientes. O seu Agente IA responde a perguntas, recomenda produtos e serviços, organiza informações, capta leads, regista pedidos e agenda atendimentos.",
  solutionNote:
    "Conversas automatizadas. Sem perder o controlo do seu negócio.",
  solutionBold:
    "A Muwoyo não substitui a sua equipa. Ajuda a sua equipa a trabalhar melhor.",
  aiTitle: "Uma IA que entende o seu negócio.",
  aiLead: "A sua empresa fornece o conhecimento.",
  aiBody:
    "Adicione produtos, preços, serviços, horários, políticas e informações importantes. O seu Agente IA usa esse conhecimento para responder com contexto.",
  howTitle: "Da criação da conta às conversas automatizadas.",
  howBody:
    "Comece com 3 dias grátis ou 200 créditos, configure o seu negócio e coloque o Agente IA a trabalhar no WhatsApp.",
  featuresTitle: "Muito mais do que respostas automáticas.",
  featuresBody:
    "A Muwoyo reúne as ferramentas necessárias para comunicar, vender e organizar as conversas num só lugar.",
  workspace: "O seu espaço de trabalho está pronto desde o primeiro dia.",
  workspaceBody:
    "A Muwoyo já inclui as ferramentas essenciais para comunicação, leads, pedidos e agendamentos. Tudo funciona em conjunto por defeito.",
  integrations: "Ligue outras ferramentas apenas quando precisar.",
  integrationBody:
    "A Muwoyo funciona como uma plataforma completa. Ligue as ferramentas que a sua empresa já utiliza para sincronizar informações e fluxos de trabalho.",
  pricing: "Comece grátis. Faça upgrade quando estiver pronto.",
  pricingBody:
    "Experimente a Muwoyo durante 3 dias e descubra como o Agente IA, a automação WhatsApp e o seu espaço de trabalho podem ajudar o seu negócio.",
  faqTitle: "Perguntas frequentes",
  faqs: [
    [
      "Existe um teste gratuito?",
      "Sim. Pode experimentar a Muwoyo durante 3 dias antes de escolher um plano.",
    ],
    [
      "Preciso do Google Calendar?",
      "Não. A Muwoyo inclui o seu próprio sistema de agendamento. Google Calendar é opcional.",
    ],
    [
      "Como a IA aprende sobre o meu negócio?",
      "Adicione produtos, serviços, preços, políticas, horários e documentos à Base de Conhecimento.",
    ],
    [
      "Posso carregar documentos?",
      "Sim. A Muwoyo extrai o texto relevante para o seu Agente IA.",
    ],
    [
      "A minha equipa pode assumir uma conversa?",
      "Sim. Um membro pode assumir a conversa enquanto a IA pausa para esse cliente.",
    ],
    [
      "Preciso de integrações externas?",
      "Não. A Muwoyo funciona como plataforma completa. As integrações são opcionais.",
    ],
  ],
};

const iconMap = [
  Bot,
  Inbox,
  UsersRound,
  Package,
  ShoppingBag,
  CalendarDays,
  UsersRound,
  LineChart,
  BellIcon,
  LineChart,
];
function BellIcon() {
  return <Plug className="h-5 w-5" />;
}

export default function LandingContent() {
  const { language } = useLanguage();
  const c = language === "pt" ? pt : en;
  const capabilities = c.features;
  return (
    <>
      <section className="bg-white px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">The problem</p>
          <h2 className="section-title">{c.problem}</h2>
          <p className="section-copy">{c.problemBody}</p>
        </div>
      </section>
      <section className="bg-[#eaf7ef] px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">The solution</p>
          <h2 className="section-title">{c.solution}</h2>
          <p className="section-copy">{c.solutionBody}</p>
          <div className="mt-8 border-l-2 border-emerald-400 pl-5 font-semibold text-slate-900">
            {c.solutionNote}
            <p className="mt-2 text-emerald-700">{c.solutionBold}</p>
          </div>
        </div>
      </section>
      <section
        id="funcionalidades"
        className="bg-[#f8faf9] px-6 py-20 lg:py-28"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <img
              src={aiImage}
              alt="Muwoyo AI Knowledge Base"
              className="w-full rounded-2xl border border-[#e6ece9] bg-white shadow-sm"
            />
          </motion.div>
          <div>
            <p className="eyebrow">Artificial Intelligence</p>
            <h2 className="section-title text-4xl">{c.aiTitle}</h2>
            <p className="mt-3 text-xl font-semibold text-emerald-700">
              {c.aiLead}
            </p>
            <p className="section-copy">{c.aiBody}</p>
            <ul className="mt-6 grid gap-3 text-slate-600 sm:grid-cols-2">
              {c.learn.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section id="como-funciona" className="bg-[#eaf7ef] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">How it works</p>
          <h2 className="section-title">{c.howTitle}</h2>
          <p className="section-copy">{c.howBody}</p>
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {c.steps.map(([number, title, description]) => (
              <div key={number} className="border-t border-[#b8ddc5] pt-5">
                <span className="font-bold text-emerald-700">{number}</span>
                <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
          <Link
            to="/criar-conta"
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            {language === "pt"
              ? "Começar teste gratuito de 3 dias"
              : "Start Your 3-Day Free Trial"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <section className="bg-white px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Features</p>
          <h2 className="section-title">{c.featuresTitle}</h2>
          <p className="section-copy">{c.featuresBody}</p>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {capabilities.map(([title, description], index) => {
              const Icon = iconMap[index];
              return (
                <div
                  key={title}
                  className="flex items-start gap-4 border-t border-slate-200 pt-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Icon />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="bg-[#eaf7ef] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Everything in one place</p>
          <h2 className="section-title">{c.workspace}</h2>
          <p className="section-copy">{c.workspaceBody}</p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "AI Agent",
              "Muwoyo Inbox",
              "Contacts & Leads",
              "Products",
              "Orders",
              "Muwoyo Calendar",
              "Muwoyo Sheets",
              "Analytics",
            ].map((item) => (
              <div
                key={item}
                className="border-b border-[#b8ddc5] pb-4 font-semibold text-slate-900"
              >
                {item}
                <p className="mt-1 text-sm font-normal text-slate-600">
                  {language === "pt"
                    ? "Funciona em conjunto por defeito."
                    : "Works together by default."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Integrations</p>
            <h2 className="section-title text-4xl">{c.integrations}</h2>
            <p className="section-copy">{c.integrationBody}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Shopify", "https://cdn.simpleicons.org/shopify/95BF47"],
                ["WooCommerce", "https://cdn.simpleicons.org/woocommerce/96588A"],
                ["HubSpot", "https://cdn.simpleicons.org/hubspot/FF7A59"],
                ["Google Calendar", "https://cdn.simpleicons.org/googlecalendar/4285F4"],
              ].map(([name, logo]) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 font-semibold"
                  >
                    <img src={logo} alt={`${name} logo`} className="h-6 w-6 object-contain" />
                    {name}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[#f8faf9] px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <img src={storeImage} alt="Muwoyo online store" className="w-full rounded-2xl border border-slate-200" />
          <div>
            <p className="eyebrow">{language === "pt" ? "Muwoyo Store" : "Muwoyo Store"}</p>
            <h2 className="section-title text-4xl">{language === "pt" ? "Um espaço completo para a sua loja online." : "A complete workspace for your online store."}</h2>
            <p className="section-copy">{language === "pt" ? "Gira produtos, pedidos e conversas com clientes num só lugar. A sua loja, a Inbox e o Agente IA trabalham em conjunto desde o primeiro dia." : "Manage products, orders and customer conversations in one place. Your store, Inbox and AI Agent work together from day one."}</p>
          </div>
        </div>
      </section>
      <section className="bg-[#f8faf9] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Who is Muwoyo for?</p>
          <h2 className="section-title text-4xl">
            Built for businesses that sell and support customers on WhatsApp.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {c.audiences.map(([title, description]) => (
              <div key={title} className="border-t border-slate-200 pt-5">
                <UsersRound className="h-5 w-5 text-emerald-600" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="precos" className="bg-[#eaf7ef] px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Pricing</p>
          <h2 className="section-title">{c.pricing}</h2>
          <p className="section-copy">{c.pricingBody}</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {c.plans.map(([name, price, description, features], index) => (
              <div
                key={name}
                className={`rounded-2xl border bg-white p-7 ${index === 1 ? "border-emerald-500 shadow-lg" : "border-slate-200"}`}
              >
                {index === 1 && (
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">
                    Most Popular
                  </p>
                )}
                <h3 className="text-lg font-bold">{name}</h3>
                <p className="mt-3 text-4xl font-extrabold">
                  {price}
                  <small className="text-sm font-normal text-slate-500">
                    {" "}
                    / month
                  </small>
                </p>
                <p className="mt-3 min-h-10 text-sm text-slate-600">
                  {description}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/criar-conta"
                  className="mt-7 inline-flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
                >
                  {language === "pt"
                    ? "Começar teste de 3 dias"
                    : "Start 3-Day Free Trial"}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 font-semibold text-emerald-700">
            {language === "pt"
              ? "Sem taxas de configuração. Preço mensal simples."
              : "No setup fees. Simple monthly pricing."}
          </p>
        </div>
      </section>
      <section id="faq" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="eyebrow">FAQ</p>
          <h2 className="section-title">{c.faqTitle}</h2>
          <p className="section-copy">
            Everything you need to know about Muwoyo.
          </p>
          <div className="mt-10 divide-y divide-slate-200">
            {c.faqs.map(([question, answer]) => (
              <details key={question} className="py-5">
                <summary className="cursor-pointer font-semibold text-slate-900">
                  {question}
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#eaf7ef] px-6 py-20 text-center lg:py-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="section-title">
            {language === "pt"
              ? "O seu próximo cliente não deveria esperar pela sua resposta."
              : "Your next customer shouldn't have to wait for your reply."}
          </h2>
          <p className="section-copy mx-auto">
            {language === "pt"
              ? "Crie a sua conta, configure o seu negócio e veja como o Agente IA pode ajudar."
              : "Create your account, configure your business and see how an AI Agent can help automate your customer conversations."}
          </p>
          <Link
            to="/criar-conta"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 font-bold text-white hover:bg-emerald-700"
          >
            {language === "pt"
              ? "Começar teste gratuito"
              : "Start Your 3-Day Free Trial"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
