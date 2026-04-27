import { Sparkles, TrendingDown, ShieldCheck, HelpCircle } from 'lucide-react';

const actions = [
  { icon: Sparkles, label: 'Melhores produtos', message: 'Quais são os produtos mais confiáveis disponíveis agora?' },
  { icon: TrendingDown, label: 'Menores preços', message: 'Me mostre os produtos com os melhores preços e boa confiabilidade.' },
  { icon: ShieldCheck, label: 'Score alto', message: 'Quais produtos têm score de confiabilidade acima de 90?' },
  { icon: HelpCircle, label: 'Como funciona', message: 'Como funciona o Score de Confiabilidade PriceHunt?' },
];

export default function QuickActions({ onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.message)}
          className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:bg-secondary hover:border-primary/20 transition-all text-left group"
        >
          <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <action.icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}