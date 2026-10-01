interface CategoryHeading {
  text: string
}

export interface CategoryItem {
  href: string
  text: string
}

export default interface Category {
  heading: CategoryHeading
  items: CategoryItem[]
}
