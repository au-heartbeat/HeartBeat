import { HttpClient } from '@src/clients/Httpclient'
import { VerifySourceControlReq } from '@src/models/request/sourceControlReq'

export class SourceControlClient extends HttpClient {
  isSourceControlVerify = false
  response = {}

  getVerifySourceControl = async (params: VerifySourceControlReq) => {
    try {
      const result = await this.axiosInstance.get('/source-control', { params: { ...params } })
      this.handleSourceControlVerifySucceed(result.data)
    } catch (e) {
      this.isSourceControlVerify = false
      throw e
    }
    return {
      response: this.response,
      isSourceControlVerify: this.isSourceControlVerify,
    }
  }

  handleSourceControlVerifySucceed = (res: object) => {
    this.isSourceControlVerify = true
    this.response = res
  }
}

export const sourceControlClient = new SourceControlClient()
