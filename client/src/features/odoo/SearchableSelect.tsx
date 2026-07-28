import { useEffect, useState, type ReactElement } from 'react'
import type { OdooOption } from './odooApi'

interface SearchableSelectProps {
  id: string
  options: OdooOption[]
  value: number | null
  onChange: (id: number | null) => void
  placeholder: string
  disabled?: boolean
}

/** A text input backed by a <datalist> — the browser filters options as the user types, and typing
 * an exact option name resolves it to that option's id. Typing something that matches nothing clears
 * the selection rather than guessing. */
export function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder,
  disabled
}: SearchableSelectProps): ReactElement {
  const selectedName = options.find((o) => o.id === value)?.name ?? ''
  const [text, setText] = useState(selectedName)

  useEffect(() => {
    setText(selectedName)
  }, [selectedName])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const typed = e.target.value
    setText(typed)
    const match = options.find((o) => o.name === typed)
    onChange(match ? match.id : null)
  }

  return (
    <>
      <input
        list={id}
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      <datalist id={id}>
        {options.map((o) => (
          <option key={o.id} value={o.name} />
        ))}
      </datalist>
    </>
  )
}
