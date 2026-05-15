import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { getPrompts, getSessions, getSessionDetail } from '../client'

vi.mock('axios')

describe('getPrompts', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test')
    localStorage.setItem('access_token', 'jwt-token')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('GETs /api/v1/prompts?mode=IMPROMPTU with auth header and returns response data', async () => {
    const payload = [
      { id: 1, text: 'Hello', difficulty: 'easy', category: 'General', mode: 'IMPROMPTU' },
    ]
    axios.get.mockResolvedValue({ data: payload })

    const result = await getPrompts('IMPROMPTU')

    expect(axios.get).toHaveBeenCalledWith(
      'http://api.test/api/v1/prompts',
      expect.objectContaining({
        params: { mode: 'IMPROMPTU' },
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    )
    expect(result).toEqual(payload)
  })

  it('propagates errors', async () => {
    axios.get.mockRejectedValue(new Error('boom'))
    await expect(getPrompts('DEBATE')).rejects.toThrow('boom')
  })
})

describe('getSessions', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test')
    localStorage.setItem('access_token', 'jwt-token')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('GETs /api/v1/sessions with pagination params and returns the content array', async () => {
    const page = {
      content: [
        { id: 1, status: 'DONE', promptText: 'Hello', createdAt: '2026-05-14T10:00:00Z' },
      ],
      totalElements: 1,
      number: 0,
      size: 20,
    }
    axios.get.mockResolvedValue({ data: page })

    const result = await getSessions({ page: 0, size: 20 })

    expect(axios.get).toHaveBeenCalledWith(
      'http://api.test/api/v1/sessions',
      expect.objectContaining({
        params: { page: 0, size: 20, sort: 'createdAt,desc' },
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    )
    expect(result).toEqual(page)
  })

  it('defaults to page 0 size 20 when called with no args', async () => {
    axios.get.mockResolvedValue({ data: { content: [], totalElements: 0 } })
    await getSessions()
    expect(axios.get).toHaveBeenCalledWith(
      'http://api.test/api/v1/sessions',
      expect.objectContaining({
        params: { page: 0, size: 20, sort: 'createdAt,desc' },
      }),
    )
  })
})

describe('getSessionDetail', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test')
    localStorage.setItem('access_token', 'jwt-token')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('GETs /api/v1/sessions/{id} and returns the detail DTO', async () => {
    const detail = {
      id: 42,
      status: 'DONE',
      promptText: 'Explain why error messages matter',
      transcriptText: 'um well',
      wpm: 142,
      fillerWords: { um: 1 },
      scores: { clarity: 80, structure: 75, delivery: 70 },
      bullets: [{ type: 'positive', text: 'Good hook' }],
      createdAt: '2026-05-14T10:00:00Z',
    }
    axios.get.mockResolvedValue({ data: detail })

    const result = await getSessionDetail(42)

    expect(axios.get).toHaveBeenCalledWith(
      'http://api.test/api/v1/sessions/42',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    )
    expect(result).toEqual(detail)
  })
})
