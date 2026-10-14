export interface SelectItem {
  text: string
  value: string
  selected?: boolean
  checked?: boolean
  disabled?: boolean
}

export interface SelectItemWithHint extends SelectItem {
  hint?: {
    text: string
  }
}
