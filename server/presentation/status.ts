export const enum Status {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  EXPIRED = 'Expired',
  ALL = 'ALL',
}

const statusMap = new Map<StatusKey, Status>([
  ['ACTIVE', Status.ACTIVE],
  ['INACTIVE', Status.INACTIVE],
  ['EXPIRED', Status.EXPIRED],
  ['ALL', Status.ALL],
])

export type StatusKey = keyof typeof Status

export const statusDisplay = (status: StatusKey): string => statusMap.get(status) as string
