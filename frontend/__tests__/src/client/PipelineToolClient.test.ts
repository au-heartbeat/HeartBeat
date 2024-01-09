import { setupServer } from 'msw/node'
import { rest } from 'msw'
import each from 'jest-each'
import {
  MOCK_PIPELINE_URL,
  MOCK_PIPELINE_VERIFY_REQUEST_PARAMS,
  VERIFY_ERROR_MESSAGE,
  MOCK_PIPELINE_GET_INFO_URL,
  MOCK_BUILD_KITE_GET_INFO_RESPONSE,
  MOCK_PIPELINE_VERIFY_URL,
} from '../fixtures'
import { pipelineToolClient } from '@src/clients/pipeline/PipelineToolClient'
import { HttpStatusCode } from 'axios'

const server = setupServer(
  rest.post(MOCK_PIPELINE_VERIFY_URL, (req, res, ctx) => {
    return res(ctx.status(HttpStatusCode.NoContent))
  })
)

beforeAll(() => server.listen())
afterAll(() => server.close())

describe('PipelineToolClient', () => {
  describe('verify pipelineTool request', () => {
    it('should isPipelineVerified is true when pipelineTool verify response status 204', async () => {
      const result = await pipelineToolClient.verifyPipelineTool(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)

      expect(result.isPipelineToolVerified).toEqual(true)
    })

    describe('Error cases', () => {
      const errorCases = [
        {
          code: HttpStatusCode.BadRequest,
        },
        {
          code: HttpStatusCode.Unauthorized,
        },
        {
          code: HttpStatusCode.Forbidden,
        },
        {
          code: HttpStatusCode.NotFound,
        },
      ]

      each(errorCases).it(
        'should log error with its corresponding error message when verify endponint returns error',
        async ({ code }) => {
          server.use(rest.post(MOCK_PIPELINE_VERIFY_URL, (req, res, ctx) => res(ctx.status(code))))
          const logSpy = jest.fn()
          console.error = logSpy

          await expect(() =>
            pipelineToolClient.verifyPipelineTool(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)
          ).rejects.toThrow()

          expect(logSpy).toHaveBeenCalledWith('Failed to verify BuildKite token', expect.any(Error))
        }
      )
    })
  })

  describe('Get pipelineTool info request', () => {
    it('should return 200 code and corresponding data when pipelineTool get info returns code 200', async () => {
      server.use(
        rest.post(MOCK_PIPELINE_GET_INFO_URL, (req, res, ctx) =>
          res(ctx.status(HttpStatusCode.Ok), ctx.json(MOCK_BUILD_KITE_GET_INFO_RESPONSE))
        )
      )

      const result = await pipelineToolClient.getPipelineToolInfo(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)

      expect(result.code).toEqual(200)
      expect(result.data).not.toBeNull()
      expect(result.errorTitle).toEqual('')
      expect(result.errorMessage).toEqual('')
    })

    describe('Error cases', () => {
      const errorMessage =
        'Please go back to the previous page and change your pipeline token with correct access permission.'
      const errorCases = [
        {
          code: HttpStatusCode.NoContent,
          errorTitle: 'No pipeline!',
          errorMessage,
        },
        {
          code: HttpStatusCode.BadRequest,
          errorTitle: 'Invalid input!',
          errorMessage,
        },
        {
          code: HttpStatusCode.Unauthorized,
          errorTitle: 'Unauthorized request!',
          errorMessage,
        },
        {
          code: HttpStatusCode.Forbidden,
          errorTitle: 'Forbidden request!',
          errorMessage,
        },
        {
          code: HttpStatusCode.NotFound,
          errorTitle: 'Not found!',
          errorMessage,
        },
      ]

      each(errorCases).it(
        `should return result with code:$code and title:$errorTitle and unify errorMessage when verify endpoint returns code:$code`,
        async ({ code, errorTitle, errorMessage }) => {
          server.use(rest.post(MOCK_PIPELINE_GET_INFO_URL, (req, res, ctx) => res(ctx.status(code))))
          const result = await pipelineToolClient.getPipelineToolInfo(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)

          expect(result.code).toEqual(code)
          expect(result.errorTitle).toEqual(errorTitle)
          expect(result.errorMessage).toEqual(errorMessage)
          expect(result.data).toBeUndefined()
        }
      )

      it('should return "Unknown error" as a last resort when error code didn\'t match the predeifned erorr cases', async () => {
        server.use(rest.post(MOCK_PIPELINE_GET_INFO_URL, (req, res, ctx) => res(ctx.status(503))))
        const result = await pipelineToolClient.getPipelineToolInfo(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)

        expect(result.errorTitle).toEqual('Unknown error')
        expect(result.errorMessage).toEqual(errorMessage)
        expect(result.data).toBeUndefined()
      })
    })
  })
})
