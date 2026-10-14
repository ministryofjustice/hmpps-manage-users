import { Router } from 'express'
import { Services } from '../services'

export default function menuRouter({ menuService }: Services): Router {
  const router = Router()

  router.get('/', async (_req, res) => {
    const { userRoles } = res.locals.user
    const message = await menuService.getBannerMessage(res.locals.user.token, userRoles)
    const menuTiles = menuService.getTiles(userRoles)
    return res.render('pages/menu', { message, menuTiles })
  })

  return router
}
