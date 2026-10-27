import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import setupAutocomplete from './autoComplete'
import makeCardsClickable from './card'
import setupFilterToggleButton from './filterToggleButton'
import setupMultiSelect from './multiSelectFilter'
import setupCsvDownload from './csvDownload'

govukFrontend.initAll()
mojFrontend.initAll()
setupAutocomplete()
makeCardsClickable()
setupFilterToggleButton()
setupMultiSelect()
setupCsvDownload()
