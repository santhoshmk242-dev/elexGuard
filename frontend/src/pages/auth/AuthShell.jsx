import { ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui';

export default function AuthShell({ title, subtitle, children, footer, wide }) {
  return (
    <div className="bg-surface py-10 sm:py-16">
      <div className={`mx-auto w-full px-4 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-soft text-royal"><ShieldCheck size={26} /></div>
          <h1 className="!text-2xl md:!text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        <Card className="p-6">{children}</Card>
        {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
