import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { inputClasses } from '../../lib/formStyles.ts';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Shown in red under the input; also marks the input invalid for screen readers. */
  error?: string;
  /** Helper text shown when there is no error. */
  hint?: string;
  /** Element placed inside the input on the right (e.g. a show-password button). */
  endAdornment?: ReactNode;
}

// Label + input + message, wired together for accessibility
// (htmlFor/id, aria-invalid, aria-describedby).
export function TextField({ label, error, hint, endAdornment, id, className, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={inputClasses(Boolean(error), endAdornment ? 'pr-11' : undefined)}
          {...props}
        />
        {endAdornment && <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{endAdornment}</div>}
      </div>
      {message && (
        <p id={messageId} className={cn('mt-1.5 text-xs', error ? 'text-rose-600' : 'text-slate-500')}>
          {message}
        </p>
      )}
    </div>
  );
}
