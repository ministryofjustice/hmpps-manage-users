// This is built and loaded as an independent JS bundle
// (`dist/assets/js/dps-header.[hash].js`), mirroring the real DPS
// architecture where the micro-frontend header's JS is served separately
// from the app's own bundle. Recreates the behaviour of the real DPS
// header's `MenuItem` class (hmpps-connect-dps-components'
// assets/js/header.ts) but scoped to just the account/user dropdown menu
// item, since that is the only part of the DPS header being replicated here.
function setupAccountMenu() {
  const $item = document.querySelector<HTMLLIElement>('.cdps-header__item--user')
  const $button = $item?.querySelector<HTMLAnchorElement>('.cdps-header__link')
  const $menu = document.getElementById('cdps-header__menu--user') as HTMLDivElement | null

  if (!$item || !$button || !$menu) return

  $item.classList.add('cdps-header__item--with-menu')

  $button.setAttribute('role', 'button')
  $button.setAttribute('aria-controls', 'cdps-header__menu--user')
  $button.setAttribute('aria-expanded', 'false')
  $button.setAttribute('href', '#')

  const isOpen = () => $button.getAttribute('aria-expanded') === 'true'

  const open = () => {
    $item.classList.add('cdps-header__item--with-open-menu')
    $button.setAttribute('aria-expanded', 'true')
    $menu.setAttribute('aria-hidden', 'false')
    $menu.removeAttribute('hidden')
  }

  const close = () => {
    $item.classList.remove('cdps-header__item--with-open-menu')
    $button.setAttribute('aria-expanded', 'false')
    $menu.setAttribute('aria-hidden', 'true')
    $menu.setAttribute('hidden', 'hidden')
  }

  let closeTimer: number | null = null

  const closeSoon = () => {
    closeTimer = window.setTimeout(() => close(), 100)
  }

  const cancelCloseSoon = () => {
    if (closeTimer) {
      window.clearTimeout(closeTimer)
      closeTimer = null
    }
  }

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      $button.focus()
    }
  }

  $button.addEventListener('click', event => {
    event.preventDefault()
    if (isOpen()) {
      close()
    } else {
      open()
    }
  })

  $button.addEventListener('focus', cancelCloseSoon)
  $button.addEventListener('blur', closeSoon)
  $menu.querySelectorAll('a').forEach($link => {
    $link.addEventListener('focus', cancelCloseSoon)
    $link.addEventListener('blur', closeSoon)
  })

  $button.addEventListener('keydown', closeOnEscape)
  $menu.addEventListener('keydown', closeOnEscape)
}

setupAccountMenu()
