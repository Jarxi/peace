import { HttpTypes } from "@medusajs/types"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  return (
    <div className="flex flex-col gap-y-2">
      <label htmlFor={`option-${option.id}`} className="text-sm font-medium text-ui-fg-base">
        {title}
      </label>
      <div className="relative" data-testid={dataTestId}>
        <select
          id={`option-${option.id}`}
          value={current || ""}
          onChange={(e) => updateOption(option.id, e.target.value)}
          disabled={disabled}
          className="w-full h-12 px-4 pr-10 text-base border border-ui-border-base rounded-lg bg-ui-bg-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ui-border-interactive disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="option-select"
        >
          <option value="" disabled>
            Select {title}
          </option>
          {filteredOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-ui-fg-muted"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default OptionSelect
