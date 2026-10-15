import config from '../config'

const isEnabled = (): boolean => config.featureSwitches.manageUserAllowList.enabled
const environmentLabel = (): string => config.featureSwitches.manageUserAllowList.environmentLabel
const pageSize = (): number => config.featureSwitches.manageUserAllowList.pageSize
const downloadLimit = (): number => config.featureSwitches.manageUserAllowList.downloadLimit
const title = (): string => `Search the ${config.featureSwitches.manageUserAllowList.environmentLabel} allow list`

const helpers = {
  isEnabled,
  environmentLabel,
  pageSize,
  downloadLimit,
  title,
}

export default helpers
