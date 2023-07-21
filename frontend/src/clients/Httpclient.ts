import axios, { AxiosInstance, HttpStatusCode } from 'axios'
import { BadRequestException } from '@src/exceptions/BadRequestException'
import { UnauthorizedException } from '@src/exceptions/UnauthorizedException'
import { InternalServerException } from '@src/exceptions/InternalServerException'
import { UnknownException } from '@src/exceptions/UnkonwException'
import { NotFoundException } from '@src/exceptions/NotFoundException'
import { ForbiddenException } from '@src/exceptions/ForbiddenException'
import { TimeoutException } from '@src/exceptions/TimeoutException'

export class HttpClient {
  protected httpTimeout = 300000
  protected axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: '/api/v1',
      timeout: this.httpTimeout,
    })
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error) => {
        const { response } = error
        if (response && response.status) {
          const { status, data, statusText } = response
          const errorMessage = data?.hintInfo ?? statusText
          switch (status) {
            case HttpStatusCode.BadRequest:
              throw new BadRequestException(errorMessage)
            case HttpStatusCode.Unauthorized:
              throw new UnauthorizedException(errorMessage)
            // case HttpStatusCode.InternalServerError:
            //   throw new InternalServerException(INTERNAL_SERVER_ERROR_MESSAGE)
            case HttpStatusCode.NotFound:
              throw new NotFoundException(errorMessage)
            case HttpStatusCode.Forbidden:
              throw new ForbiddenException(errorMessage)
            case HttpStatusCode.InternalServerError:
              throw new InternalServerException(errorMessage)
            case HttpStatusCode.ServiceUnavailable:
              throw new TimeoutException(errorMessage)
            default:
              throw error
          }
        } else {
          throw new UnknownException()
        }
      }
    )
  }
}
