import User from './fixtures/user.js'

export function createCustomer(description: string = 'martin', params: any = {}): Promise<User> {
  return User.create({
    email: `${description}@martin-paucot.fr`,
    name: 'Martin Paucot',
    ...params,
  })
}
