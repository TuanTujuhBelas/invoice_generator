'use client'

import { LoaderCircle, Save } from 'lucide-react'
import { useActionState } from 'react'
import { Button, ButtonLink } from '@/components/ui/button'
import { FormField, INPUT_CLASS_NAME, TextInput } from '@/components/ui/form-field'
import type { ContactFormState } from '../actions'

type ContactFormValues = {
  type: string
  name: string
  email: string
  phone: string
  address: string
  npwp: string
}

type ContactFormProps = {
  action: (state: ContactFormState, formData: FormData) => Promise<ContactFormState>
  initialValues?: Partial<ContactFormValues>
  submitLabel: string
}

const EMPTY_VALUES: ContactFormValues = {
  type: 'client',
  name: '',
  email: '',
  phone: '',
  address: '',
  npwp: '',
}

export function ContactForm({ action, initialValues, submitLabel }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(action, {})
  const values = { ...EMPTY_VALUES, ...initialValues, ...state.values }
  const errors = state.fieldErrors ?? {}

  return (
    <form
      // Remount after each failed submit so React's form reset restores the submitted values.
      key={JSON.stringify(state.values ?? null)}
      action={formAction}
      className="flex max-w-2xl flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      noValidate
    >
      {state.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </p>
      )}

      <FormField id="type" label="Jenis kontak" errors={errors.type}>
        {(describedBy, invalid) => (
          <select
            id="type"
            name="type"
            defaultValue={values.type}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={INPUT_CLASS_NAME}
          >
            <option value="client">Klien</option>
            <option value="sender">Pengirim</option>
          </select>
        )}
      </FormField>

      <FormField id="name" label="Nama" errors={errors.name}>
        {(describedBy, invalid) => (
          <TextInput
            id="name"
            name="name"
            required
            autoComplete="organization"
            defaultValue={values.name}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
          />
        )}
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="email" label="Email" errors={errors.email}>
          {(describedBy, invalid) => (
            <TextInput
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              defaultValue={values.email}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
            />
          )}
        </FormField>

        <FormField id="phone" label="Telepon" errors={errors.phone}>
          {(describedBy, invalid) => (
            <TextInput
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={values.phone}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
            />
          )}
        </FormField>
      </div>

      <FormField id="address" label="Alamat" errors={errors.address}>
        {(describedBy, invalid) => (
          <textarea
            id="address"
            name="address"
            rows={3}
            autoComplete="street-address"
            defaultValue={values.address}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={`${INPUT_CLASS_NAME} py-2`}
          />
        )}
      </FormField>

      <FormField id="npwp" label="NPWP" errors={errors.npwp} hint="15 atau 16 digit. Titik dan strip boleh.">
        {(describedBy, invalid) => (
          <TextInput
            id="npwp"
            name="npwp"
            inputMode="numeric"
            defaultValue={values.npwp}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
          />
        )}
      </FormField>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          {submitLabel}
        </Button>
        <ButtonLink href="/contacts" variant="ghost">
          Batal
        </ButtonLink>
      </div>
    </form>
  )
}
