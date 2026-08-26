import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import heroPolo from "@/assets/landing/hero-polo.png";
import heroTshirt from "@/assets/landing/hero-tshirt.jpg";
import heroShirt from "@/assets/landing/hero-shirt.jpg";
import heroJacket from "@/assets/landing/hero-jacket.jpg";

type Message = { text: string; from: "customer" | "ai"; image?: string };
const english: Message[] = [
  { from: "customer", text: "Hi! Do you still have the white polo?" },
  {
    from: "ai",
    text: "Hi! Yes, the White Premium Polo is available. What size are you looking for?",
  },
  { from: "customer", text: "Medium. Can you send me some photos?" },
  {
    from: "ai",
    text: "Of course! Here are some available options in size Medium:",
  },
  { from: "ai", text: "White Premium Polo", image: heroPolo },
  { from: "ai", text: "Blue Casual T-Shirt", image: heroTshirt },
  { from: "ai", text: "Grey Formal Shirt", image: heroShirt },
  { from: "ai", text: "Black Streetwear Jacket", image: heroJacket },
  {
    from: "customer",
    text: "I like the first two. Do you offer a discount for 3 items?",
  },
  {
    from: "ai",
    text: "Yes! Buy 3 or more items and get 10% off your total order.",
  },
];
const portuguese: Message[] = [
  { from: "customer", text: "Olá! Ainda têm a polo branca?" },
  {
    from: "ai",
    text: "Olá! Sim, a Polo Premium Branca está disponível. Que tamanho procura?",
  },
  { from: "customer", text: "Médio. Pode enviar algumas fotos?" },
  {
    from: "ai",
    text: "Claro! Aqui estão algumas opções disponíveis no tamanho médio:",
  },
  { from: "ai", text: "Polo Premium Branca", image: heroPolo },
  { from: "ai", text: "T-shirt Casual Azul", image: heroTshirt },
  { from: "ai", text: "Camisa Formal Cinza", image: heroShirt },
  { from: "ai", text: "Jaqueta Streetwear Preta", image: heroJacket },
  {
    from: "customer",
    text: "Gostei das duas primeiras. Há desconto para 3 peças?",
  },
  {
    from: "ai",
    text: "Sim! Com 3 ou mais peças recebe 10% de desconto no total.",
  },
];

export default function HeroSection() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPortuguese = language === "pt";
  const copy = isPortuguese
    ? {
        title:
          "Transforme o seu WhatsApp num espaço inteligente para o seu negócio",
        body: "Atenda clientes, apresente produtos, qualifique leads, registe pedidos e agende atendimentos, mesmo quando a sua equipa está ocupada.",
        trial: "Começar teste gratuito de 3 dias",
        how: "Ver como funciona",
        features: [
          "Respostas em segundos",
          "Produtos e serviços",
          "Disponível 24/7",
          "IA treinada para o seu negócio",
        ],
      }
    : {
        title: "Automate your business conversations and sales on WhatsApp",
        body: "Turn your WhatsApp into an intelligent workspace that can answer customers, recommend products, qualify leads, manage orders, schedule appointments and keep conversations moving, even when your team is busy.",
        trial: "Start 3-Day Free Trial",
        how: "See How It Works",
        features: [
          "Replies in seconds",
          "Products and services",
          "Available 24/7",
          "AI trained for your business",
        ],
      };
  const sequence = isPortuguese ? portuguese : english;

  useEffect(() => {
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      const message = sequence[index];
      if (!message) return;
      setTyping(message.from === "ai");
      timer = setTimeout(
        () => {
          setTyping(false);
          setMessages((current) => [...current, message]);
          index += 1;
          timer = setTimeout(
            index >= sequence.length
              ? () => {
                  setMessages([]);
                  index = 0;
                  next();
                }
              : next,
            index >= sequence.length ? 2600 : 900,
          );
        },
        message.from === "ai" ? 1200 : 700,
      );
    };
    setMessages([]);
    next();
    return () => clearTimeout(timer);
  }, [language]);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-white pb-20 pt-24 sm:pt-28 lg:pt-24"
    >
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-[120px]" />
      <div className="container mx-auto grid items-start gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div className="space-y-7 animate-fade-up lg:mt-4">
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            {copy.title}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
            {copy.body}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {copy.features.map((feature, index) => {
              const Icon = [Zap, ShieldCheck, Clock3, Sparkles][index];
              return (
                <div
                  key={feature}
                  className="flex items-center gap-3 text-sm font-medium text-slate-600"
                >
                  <Icon className="h-5 w-5 shrink-0 text-emerald-500" />
                  {feature}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              className="h-12 rounded-xl bg-emerald-500 px-6 text-base font-bold text-white hover:bg-emerald-600"
              asChild
            >
              <Link to="/criar-conta">
                {copy.trial}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl border-emerald-500 px-6 text-base font-bold text-emerald-600 hover:bg-emerald-50"
              onClick={() =>
                document
                  .getElementById("como-funciona")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {copy.how}
            </Button>
          </div>
        </div>
        <div className="relative -mt-6 flex justify-center lg:-mt-10 lg:justify-end">
          <div className="relative w-full max-w-[520px]">
            <img
              src="/muwoyo-chat.png"
              alt="Muwoyo WhatsApp conversation workspace"
              className="block h-auto w-full drop-shadow-2xl"
            />
            <div
              ref={containerRef}
              className="absolute left-[18%] top-[22%] flex h-[52%] w-[64%] flex-col gap-1 overflow-hidden px-2 pt-2"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.text}-${index}`}
                  className={`max-w-[75%] px-3 py-2 text-[10px] leading-snug shadow-sm ${message.from === "customer" ? "self-end rounded-lg bg-[#d9fdd3]" : "self-start rounded-lg bg-white"}`}
                >
                  {message.text}
                  {message.image && (
                    <img
                      src={message.image}
                      alt={message.text}
                      className="mt-2 h-24 w-full rounded-md object-cover"
                    />
                  )}
                  <div className="mt-1 text-right text-[7px] text-slate-400">
                    12:45
                  </div>
                </div>
              ))}
              {typing && (
                <div className="ml-1 flex w-14 gap-1 rounded-lg bg-white px-3 py-2">
                  <i className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <i className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <i className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
