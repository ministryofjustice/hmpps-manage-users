import { PageElement } from '../pages/typescript/page'

const getRadio = (label: string): PageElement => cy.contains('label', label).prev()
const getFormField = (fieldName: string): PageElement => {
  const selector = `#${fieldName}`
  return cy.get(selector)
}
const isChecked = (element: PageElement) => element.should('be.checked')
const typeOrClear = (element: PageElement, text?: string) => {
  if (text) element.type(text)
  else element.clear()
}

const verifyFormError = (fieldName: string) => {
  const selector = `#${fieldName}-error`
  cy.get(selector).should('be.visible')
}

const verifyFormValue = (fieldName: string, value: string) => {
  getFormField(fieldName).should('have.value', value)
}

export { getFormField, getRadio, isChecked, typeOrClear, verifyFormError, verifyFormValue }
