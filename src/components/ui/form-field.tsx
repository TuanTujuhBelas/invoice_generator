import type { ComponentProps, ReactNode } from 'react'

export const INPUT_CLASS_NAME =
  'block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'

type FormFieldProps = {
  id: string
  label: string
  errors?: string[]
  hint?: string
  children: (describedBy: string | undefined, invalid: boolean) => ReactNode
}

export function FormField({ id, label, errors, hint, children }: FormFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const invalid = Boolean(errors?.length)
  const describedBy = [hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      {children(describedBy || undefined, invalid)}
      {hint && (
        <p id={hintId} className="text-xs text-zinc-500">
          {hint}
        </p>
      )}
      {invalid && (
        <p id={errorId} className="text-xs text-red-700 dark:text-red-400" aria-live="polite">
          {errors?.join(', ')}
        </p>
      )}
    </div>
  )
}

export function TextInput(props: ComponentProps<'input'>) {
  return <input {...props} className={`${INPUT_CLASS_NAME} ${props.className ?? ''}`} />
}
