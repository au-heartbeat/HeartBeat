export class InternalServerException extends Error {
  constructor(type: string, message: string) {
    super()
    throw new Error(`${type}: ${message}`)
  }
}
