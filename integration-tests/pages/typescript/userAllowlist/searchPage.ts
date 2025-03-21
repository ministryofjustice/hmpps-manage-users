import Page from '../page'
import config from '../../../../backend/config'

export default class SearchPage extends Page {
  constructor() {
    super(`Search the ${config.featureSwitches.manageUserAllowList.environmentLabel} allow list`)
  }
}
