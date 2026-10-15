import { Check } from 'lucide-react'
export const STEPS = ['Origen', 'Destino', 'Pago']

export default function Stepper({ step, onGo }) {
  return (
    <ol className="flex items-start" aria-label="Pasos">
      {STEPS.map((label, i) => {
        const done = i < step
        const current = i === step
        return (
          <li key={label} className="flex flex-1 items-start last:flex-none">
            <button
              type="button"
              disabled={!done}
              onClick={() => onGo(i)}
              aria-current={current ? 'step' : undefined}
              className="group flex flex-col items-center gap-1.5 disabled:cursor-default"
            >
              <span className={`relative grid size-10 place-items-center rounded-full text-[15px] font-bold transition ${current ? 'bg-brand text-white' : done ? 'bg-brand-100 text-brand group-hover:bg-brand group-hover:text-white' : 'border-2 border-line bg-white text-muted'}`}>
                {done ? <Check className="size-5" strokeWidth={3} /> : i + 1}
                {current && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-accent" />}
              </span>
              <span className={`text-sm ${current ? 'font-bold text-ink' : done ? 'text-brand' : 'text-muted'}`}>{label}</span>
            </button>
            {i < STEPS.length - 1 && <span className={`mx-2 mt-5 h-0.5 flex-1 rounded ${done ? 'bg-brand' : 'bg-line'}`} />}
          </li>
        )
      })}
    </ol>
  )
}
