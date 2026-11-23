import { useId, useRef, useState, type DragEvent } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { TextField } from '../ui/TextField.tsx';
import { Alert } from '../ui/Alert.tsx';
import { useAuth } from '../../hooks/useAuth.ts';
import { MAX_RESUME_BYTES, uploadResume, type UploadStep } from '../../services/resumes.ts';
import { cn } from '../../lib/cn.ts';
import type { Resume } from '../../types/resume.ts';

const STEP_LABELS: Record<UploadStep, string> = {
  reading: 'Reading text from the PDF…',
  uploading: 'Uploading file…',
  saving: 'Saving…',
};

const isPdf = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

export function ResumeUploader({ onUploaded }: { onUploaded: (resume: Resume) => void }) {
  const { user } = useAuth();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<UploadStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!isPdf(picked)) return setError('Please choose a PDF file.');
    if (picked.size > MAX_RESUME_BYTES) return setError('That file is larger than 5 MB.');
    setFile(picked);
    setTitle(picked.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 150));
  };

  const reset = () => {
    setFile(null);
    setTitle('');
    setStep(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  };

  const upload = async () => {
    if (!file || !user) return;
    if (!title.trim()) return setError('Give this resume a title.');
    setError(null);
    try {
      const resume = await uploadResume(file, title.trim(), user.id, setStep);
      reset();
      onUploaded(resume);
    } catch (err) {
      setStep(null);
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      {!file ? (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50',
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <FileUp className="size-6" aria-hidden="true" />
          </span>
          <span className="mt-3 text-sm font-medium text-slate-900">
            Drop a PDF here or <span className="text-brand-600">browse</span>
          </span>
          <span className="mt-1 text-xs text-slate-500">PDF only · up to 5 MB · text is read in your browser</span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
        </label>
      ) : (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="truncate text-sm text-slate-600">
            <span className="font-medium text-slate-900">{file.name}</span> · {(file.size / 1024).toFixed(0)} KB
          </p>
          <TextField
            label="Title"
            value={title}
            maxLength={150}
            disabled={step !== null}
            onChange={(e) => setTitle(e.target.value)}
            hint="e.g. “Frontend — React focus” so you can tell versions apart"
          />
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            {step && (
              <p className="flex items-center gap-2 text-sm text-slate-500 sm:mr-auto" role="status">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {STEP_LABELS[step]}
              </p>
            )}
            <Button variant="secondary" onClick={reset} disabled={step !== null}>
              Cancel
            </Button>
            <Button onClick={() => void upload()} loading={step !== null}>
              Upload resume
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
