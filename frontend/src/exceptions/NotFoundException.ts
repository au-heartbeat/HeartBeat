export class NotFoundException extends Error {
  constructor(type: string, message: string) {
    super()
    throw new Error(`${type}: ${message}`)
  }
}
