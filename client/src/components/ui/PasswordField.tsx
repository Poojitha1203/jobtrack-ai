import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextField } from './TextField.tsx';

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, 'type' | 'endAdornment'>;

// Password input with a show/hide toggle.
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-brand-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      }
    />
  );
}
