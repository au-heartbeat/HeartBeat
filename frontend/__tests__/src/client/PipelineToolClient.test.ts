import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { MOCK_PIPELINE_URL, MOCK_PIPELINE_VERIFY_REQUEST_PARAMS, VERIFY_ERROR_MESSAGE } from '../fixtures'
import { pipelineToolClient } from '@src/clients/pipeline/PipelineToolClient'
import { AxiosError, HttpStatusCode } from 'axios'

const server = setupServer(
  rest.get(MOCK_PIPELINE_URL, (req, res, ctx) => {
    return res(ctx.status(HttpStatusCode.Ok))
  })
)

describe('verify pipelineTool request', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  it('should isPipelineVerified is true when pipelineTool verify response status 200', async () => {
    const result = await pipelineToolClient.verifyPipelineTool(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)

    expect(result.isPipelineToolVerified).toEqual(true)
  })

  it('should throw error when pipelineTool verify response status 400', async () => {
    server.use(
      rest.get(MOCK_PIPELINE_URL, (req, res, ctx) =>
        res(ctx.status(HttpStatusCode.BadRequest), ctx.json({ hintInfo: VERIFY_ERROR_MESSAGE.BAD_REQUEST }))
      )
    )
    await expect(() => pipelineToolClient.verifyPipelineTool(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)).rejects.toThrow(
      VERIFY_ERROR_MESSAGE.BAD_REQUEST
    )
  })

  it('should throw error when pipelineTool verify response status is 401', async () => {
    server.use(
      rest.get(MOCK_PIPELINE_URL, (req, res, ctx) =>
        res(ctx.status(HttpStatusCode.Unauthorized), ctx.json({ hintInfo: VERIFY_ERROR_MESSAGE.UNAUTHORIZED }))
      )
    )
    await expect(() => pipelineToolClient.verifyPipelineTool(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)).rejects.toThrow(
      VERIFY_ERROR_MESSAGE.UNAUTHORIZED
    )
  })

  it('should throw error when pipelineTool verify response status is 403', async () => {
    server.use(
      rest.get(MOCK_PIPELINE_URL, (req, res, ctx) =>
        res(ctx.status(HttpStatusCode.Forbidden), ctx.json({ hintInfo: VERIFY_ERROR_MESSAGE.PERMISSION_DENIED }))
      )
    )
    await expect(() => pipelineToolClient.verifyPipelineTool(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)).rejects.toThrow(
      VERIFY_ERROR_MESSAGE.PERMISSION_DENIED
    )
  })

  it('should throw error when pipelineTool verify response status 5xx', async () => {
    server.use(rest.get(MOCK_PIPELINE_URL, (req, res, ctx) => res(ctx.status(HttpStatusCode.InternalServerError))))
    await expect(() => pipelineToolClient.verifyPipelineTool(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)).rejects.toThrow(
      AxiosError
    )
  })

  it('should throw error when board verify response status 300', async () => {
    server.use(rest.get(MOCK_PIPELINE_URL, (req, res, ctx) => res(ctx.status(HttpStatusCode.MultipleChoices))))

    await expect(() => pipelineToolClient.verifyPipelineTool(MOCK_PIPELINE_VERIFY_REQUEST_PARAMS)).rejects.toThrow(
      AxiosError
    )
  })
})
