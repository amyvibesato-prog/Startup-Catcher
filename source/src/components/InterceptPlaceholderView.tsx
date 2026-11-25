import { ArrowLeft, FolderCog, HardDrive, ShieldCheck } from 'lucide-react';

interface InterceptPlaceholderViewProps {
  onBackToLaunch: () => void;
}

const STAGE_TWO_SOURCES = [
  {
    icon: HardDrive,
    title: 'Реєстр Windows (HKCU\\...\\Run)',
    description: 'Пошук записів автозапуску поточного користувача та безпечне перехоплення під контроль утиліти.',
  },
  {
    icon: FolderCog,
    title: 'Папка автозавантаження (Startup)',
    description: 'Виявлення ярликів із shell:startup із можливістю повернути їх у один клік.',
  },
  {
    icon: ShieldCheck,
    title: 'Резервне відновлення',
    description: 'Збереження початкових шляхів і параметрів запуску через локальний адаптер Windows.',
  },
];

export function InterceptPlaceholderView({
  onBackToLaunch,
}: InterceptPlaceholderViewProps) {
  return (
    <section
      aria-label="Перехоплення автозапуску — Етап 2"
      className="flex flex-col"
    >
      <div className="mb-4">
        <p
          className="text-[12px] font-medium"
          style={{ color: 'var(--sc-text-muted)' }}
        >
          Етап 2 · Інтеграція з Windows
        </p>
        <h2
          className="mt-1 text-[17px] font-semibold tracking-[-0.01em]"
          style={{ color: 'var(--sc-text)' }}
        >
          Перехоплення системного автозапуску
        </h2>
        <p
          className="mt-1.5 text-[13px] leading-relaxed"
          style={{ color: 'var(--sc-text-muted)' }}
        >
          На наступному етапі тут з’явиться сканер реальних записів автозапуску Windows, щоб
          переводити програми під керування Startup Catcher без ручного налаштування.
        </p>
      </div>

      <div
        className="divide-y rounded-xl"
        style={{
          backgroundColor: 'var(--sc-row-inactive-bg)',
          border: '1px solid var(--sc-border-subtle)',
          borderColor: 'var(--sc-border-subtle)',
        }}
      >
        {STAGE_TWO_SOURCES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderColor: 'var(--sc-border-subtle)' }}
            >
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: 'var(--sc-accent)' }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p
                  className="text-[13.5px] font-medium"
                  style={{ color: 'var(--sc-text)' }}
                >
                  {item.title}
                </p>
                <p
                  className="mt-0.5 text-[12px] leading-relaxed"
                  style={{ color: 'var(--sc-text-muted)' }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 flex items-center justify-end pt-4"
        style={{ borderTop: '1px solid var(--sc-border-subtle)' }}
      >
        <button
          type="button"
          onClick={onBackToLaunch}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white/60"
          style={{
            backgroundColor: 'var(--sc-control-bg)',
            color: 'var(--sc-text)',
            border: '1px solid var(--sc-border)',
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Повернутися до запуску</span>
        </button>
      </div>
    </section>
  );
}
