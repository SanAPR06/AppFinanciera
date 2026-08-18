import { useRef, useState } from 'react';
import { Wallet, PieChart, Repeat, ShieldCheck, ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    icon: Wallet,
    title: 'Todas tus cuentas, un solo lugar',
    description:
      'Banco, efectivo, tarjetas, billeteras digitales — registra el saldo inicial de cada una y mira tu dinero total sin entrar a cada app por separado.',
  },
  {
    icon: PieChart,
    title: 'Entiende en qué se te va la plata',
    description:
      'Cada gasto se agrupa por categoría automáticamente. Un vistazo al mes y sabes si te pasaste en comida o en pagos.',
  },
  {
    icon: Repeat,
    title: 'Lo que se repite, se automatiza',
    description:
      'Sueldo, alquiler, suscripciones — configúralos una vez como recurrentes y se registran solos cada mes.',
  },
  {
    icon: ShieldCheck,
    title: 'Tus datos, en tu control',
    description:
      'Usa la app sin cuenta (todo se guarda en tu dispositivo) o crea una cuenta gratis para respaldar todo en la nube.',
  },
];

export function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const isLast = index === SLIDES.length - 1;

  function goTo(next: number) {
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, next)));
  }

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    setDragX(e.touches[0].clientX - startX.current);
  }

  function handleTouchEnd() {
    if (Math.abs(dragX) > 60) {
      goTo(dragX < 0 ? index + 1 : index - 1);
    }
    setDragX(0);
    startX.current = null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-pure-white dark:bg-off-black-ink">
      <div className="flex justify-end p-4">
        <button
          onClick={onFinish}
          className="text-caption font-medium text-graphite dark:text-smoke hover:text-off-black-ink dark:hover:text-off-white-canvas"
        >
          Saltar
        </button>
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex w-full"
          style={{
            transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
            transition: dragX === 0 ? 'transform 0.3s ease-out' : 'none',
          }}
        >
          {SLIDES.map((slide, i) => {
            const Icon = slide.icon;
            return (
              <div key={i} className="w-full shrink-0 flex flex-col items-center text-center px-4">
                <div className="w-24 h-24 rounded-cards bg-electric-lime flex items-center justify-center mb-8">
                  <Icon size={40} className="text-off-black-ink" />
                </div>
                <h2 className="text-subheading font-medium text-off-black-ink dark:text-off-white-canvas mb-3">
                  {slide.title}
                </h2>
                <p className="text-body-sm text-graphite dark:text-smoke max-w-xs">
                  {slide.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir al paso ${i + 1}`}
            className={`h-2 rounded-pills transition-all ${
              i === index ? 'w-6 bg-electric-lime' : 'w-2 bg-ash dark:bg-graphite/40'
            }`}
          />
        ))}
      </div>

      <div className="px-6 pb-8">
        <button
          onClick={() => (isLast ? onFinish() : goTo(index + 1))}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-buttons bg-electric-lime text-off-black-ink font-medium hover:opacity-90"
        >
          {isLast ? 'Comenzar' : 'Siguiente'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
