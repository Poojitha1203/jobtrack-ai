import { ExternalLink, FileText, Pencil, ScanText, Star, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import { formatDateTime } from '../../lib/format.ts';
import { countWords } from '../../lib/pdfText.ts';
import type { Resume } from '../../types/resume.ts';

interface ResumeCardProps {
  resume: Resume;
  onView: (resume: Resume) => void;
  onShowText: (resume: Resume) => void;
  onMakeDefault: (resume: Resume) => void;
  onRename: (resume: Resume) => void;
  onDelete: (resume: Resume) => void;
}

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

export function ResumeCard({ resume, onView, onShowText, onMakeDefault, onRename, onDelete }: ResumeCardProps) {
  const words = countWords(resume.extractedText);
  const iconButton = buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-8' });

  return (
    <li className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">{resume.title}</h3>
            {resume.isDefault && (
              <Badge tone="brand">
                <Star className="size-3 fill-current" aria-hidden="true" /> Default
              </Badge>
            )}
          </div>
          <p className="truncate text-sm text-slate-500">{resume.fileName}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['Size', formatSize(resume.fileSize)],
          ['Words', words ? words.toLocaleString() : '—'],
          ['Used in', `${resume.applicationCount} app${resume.applicationCount === 1 ? '' : 's'}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 px-2 py-2">
            <dt className="text-[11px] text-slate-500">{label}</dt>
            <dd className="text-sm font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      {words === 0 && (
        <p className="mt-3 text-xs text-amber-700">
          No text found — this may be a scanned PDF. Job matching needs a text-based PDF.
        </p>
      )}

      <p className="mt-3 mb-4 text-xs text-slate-400">Uploaded {formatDateTime(resume.createdAt)}</p>

      <div className="mt-auto flex items-center gap-1 border-t border-slate-100 pt-3">
        <Button variant="secondary" size="sm" onClick={() => onView(resume)}>
          <ExternalLink className="size-4" aria-hidden="true" /> View
        </Button>
        <button type="button" className={iconButton} onClick={() => onShowText(resume)} aria-label={`Show extracted text of ${resume.title}`}>
          <ScanText className="size-4" aria-hidden="true" />
        </button>
        {!resume.isDefault && (
          <button type="button" className={iconButton} onClick={() => onMakeDefault(resume)} aria-label={`Make ${resume.title} the default resume`}>
            <Star className="size-4" aria-hidden="true" />
          </button>
        )}
        <button type="button" className={iconButton} onClick={() => onRename(resume)} aria-label={`Rename ${resume.title}`}>
          <Pencil className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'ml-auto size-8 hover:bg-rose-50 hover:text-rose-600' })}
          onClick={() => onDelete(resume)}
          aria-label={`Delete ${resume.title}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
