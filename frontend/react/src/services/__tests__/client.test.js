import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { getPrompts } from '../client'

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
