import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';
import { inputClasses } from '../../lib/formStyles.ts';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextAreaField({ label, error, hint, id, className, ...props }: TextAreaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const message = error ?? hint;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={inputClasses(Boolean(error), 'mt-1.5 min-h-24 resize-y')}
        {...props}
      />
      {message && (
        <p id={messageId} className={cn('mt-1.5 text-xs', error ? 'text-rose-600' : 'text-slate-500')}>
          {message}
        </p>
      )}
    </div>
  );
}
