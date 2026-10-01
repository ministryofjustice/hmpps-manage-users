export interface MenuTile {
  title: string
  description: string
  href: string
  dataQa: string
}

export class RoleSpecificMenuTile implements MenuTile {
  title: string

  description: string

  href: string

  dataQa: string

  order: number

  roles: string[]

  rolePredicate: (role: string) => boolean

  constructor(
    title: string,
    description: string,
    href: string,
    dataQa: string,
    order: number,
    roles: string[],
    rolePredicate: (role: string) => boolean = role => this.roles.includes(role),
  ) {
    this.title = title
    this.description = description
    this.href = href
    this.dataQa = dataQa
    this.order = order
    this.roles = roles
    this.rolePredicate = rolePredicate
  }
}
