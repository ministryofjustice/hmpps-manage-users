import type { DeactivateUserReasonForm } from 'forms'
import validateSync from '../validation/validation'

export default function validate(form: DeactivateUserReasonForm): Array<{ text: string; href: string }> {
  return validateSync(
    form,
    {
      reason: ['required', 'between:2,100'],
    },
    {
      'required.reason': 'Enter the reason',
      'between.reason': 'Enter the reason greater than 2 character but not greater than 100 characters',
    },
  )
}
