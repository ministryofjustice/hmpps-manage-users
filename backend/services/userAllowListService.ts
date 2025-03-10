import moment from 'moment'

export interface AllowListUser<DateType> {
  username: string
  email: string
  firstName: string
  lastName: string
  reason: string
  expiry: DateType
}

export enum AccessPeriod {
  Expire = 'expire',
  OneMonth = 'one-month',
  ThreeMonths = 'three-months',
  SixMonths = 'six-months',
  TwelveMonths = 'twelve-months',
  NoRestriction = 'no-restriction',
}

export interface AllowListUserDto extends AllowListUser<Date> {
  createdOn: Date
  lastUpdated: Date
  lastUpdatedBy: string
}

export interface AllowListUserRequest extends AllowListUser<AccessPeriod> {}

export default class AllowListService {
  readonly allowListUsers: AllowListUserDto[] = [
    {
      username: 'FORESTQNW',
      email: 'costas_kesleram@gerald.ihj',
      firstName: 'Yasmin',
      lastName: 'Riggio',
      reason: `${this.getSignedReason('Brilliant subjective instrument lan verification moisture pair.', 'WILLETTE2K')}`,
      expiry: new Date('2024-03-19T04:39:08'),
      createdOn: new Date('2024-03-19T04:39:08'),
      lastUpdated: new Date('2024-03-19T04:39:08'),
      lastUpdatedBy: 'WILLETTE2K',
    },
    {
      username: 'VALYNNJ',
      email: 'shakedra_lassh9@newman.gu',
      firstName: 'Cabrina',
      lastName: 'Collazo',
      reason: `${this.getSignedReason('Preferred feels believed occurring winston bicycle mazda, tide.', 'DEYONNA4')}`,
      expiry: new Date('2025-05-19T04:39:08'),
      createdOn: new Date('2025-03-06T04:39:08'),
      lastUpdated: new Date('2025-03-06T04:39:08'),
      lastUpdatedBy: 'DEYONNA4',
    },
  ]

  public async getAllAllowListUsers(): Promise<AllowListUserDto[]> {
    return this.allowListUsers
  }

  public async getAllowListUser(username: string): Promise<AllowListUserDto> {
    return this.allowListUsers.find((user) => user.username === username)
  }

  public async addAllowListUser(user: AllowListUserRequest, loggedInUser: string): Promise<void> {
    this.allowListUsers.push(this.convertToDto(user, loggedInUser))
  }

  public async updateAllowListUser(
    username: string,
    accessPeriod: string,
    reason: string,
    loggedInUser: string,
  ): Promise<void> {
    const dto = await this.getAllowListUser(username)
    const foundIndex = this.allowListUsers.findIndex((user) => user.username === username)
    this.allowListUsers[foundIndex] = {
      ...dto,
      reason: `${this.getSignedReason(reason, loggedInUser)}\n\n${dto.reason}`,
      expiry: this.getAccessPeriodDate(accessPeriod as AccessPeriod),
      lastUpdated: moment().toDate(),
      lastUpdatedBy: loggedInUser,
    }
  }

  private convertToDto(request: AllowListUserRequest, loggedInUser: string): AllowListUserDto {
    const now = moment().toDate()
    return {
      ...request,
      reason: this.getSignedReason(request.reason, loggedInUser),
      expiry: this.getAccessPeriodDate(request.expiry),
      createdOn: now,
      lastUpdated: now,
      lastUpdatedBy: loggedInUser,
    }
  }

  private getSignedReason(reason: string, loggedInUser: string): string {
    return `Added by [${loggedInUser}] on ${moment().format('D MMMM YYYY')}\n\n${reason}`
  }

  private getAccessPeriodDate(accessPeriod: AccessPeriod): Date {
    switch (accessPeriod) {
      case AccessPeriod.OneMonth:
        return moment().add(1, 'months').toDate()
      case AccessPeriod.ThreeMonths:
        return moment().add(3, 'months').toDate()
      case AccessPeriod.SixMonths:
        return moment().add(6, 'months').toDate()
      case AccessPeriod.TwelveMonths:
        return moment().add(12, 'months').toDate()
      case AccessPeriod.NoRestriction:
        return moment().add(1000, 'years').toDate()
      case AccessPeriod.Expire:
      default:
        // Just return now as it will be instantly expired.
        return moment().toDate()
    }
  }
}
