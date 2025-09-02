require("@testing-library/jest-dom")

/* eslint-env jest, node, browser */

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return "/"
  },
}))

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    constructor(url, init = {}) {
      this.url = url
      this.headers = new Headers(init.headers)
      this.method = init.method || "GET"
      this.body = init.body
    }

    async json() {
      return JSON.parse(this.body || "{}")
    }
  },
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      json: () => Promise.resolve(data),
      status: init.status || 200,
      headers: new Headers(init.headers),
    })),
  },
}))

// Mock environment variables
process.env.NODE_ENV = "test"
process.env.TMDB_API_KEY = "test-api-key"
process.env.TMDB_BASE_URL = "https://api.themoviedb.org/3"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"

// Global test utilities
global.fetch = jest.fn()

// Mock Response for MSW
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || "OK"
    this.headers = new Headers(init.headers)
    this.ok = this.status >= 200 && this.status < 300
  }

  json() {
    return Promise.resolve(JSON.parse(this.body))
  }

  text() {
    return Promise.resolve(this.body)
  }

  clone() {
    return new Response(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    })
  }
}

// Mock TextEncoder for MSW
global.TextEncoder = class TextEncoder {
  encode(input) {
    return new Uint8Array(Buffer.from(input, "utf8"))
  }
}

global.TextDecoder = class TextDecoder {
  decode(input) {
    return Buffer.from(input).toString("utf8")
  }
}

// Mock TransformStream for MSW
global.TransformStream = class TransformStream {
  constructor() {
    this.readable = new ReadableStream()
    this.writable = new WritableStream()
  }
}

// Mock ReadableStream for MSW
global.ReadableStream = class ReadableStream {
  constructor() {
    this.locked = false
  }

  getReader() {
    return {
      read: () => Promise.resolve({ done: true, value: undefined }),
      releaseLock: () => {},
    }
  }
}

// Mock WritableStream for MSW
global.WritableStream = class WritableStream {
  constructor() {
    this.locked = false
  }

  getWriter() {
    return {
      write: () => Promise.resolve(),
      close: () => Promise.resolve(),
      releaseLock: () => {},
    }
  }
}

// Mock BroadcastChannel for MSW
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name
  }

  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

// Mock Request for MSW
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === "string" ? input : input.url
    this.method = init.method || "GET"
    this.headers = new Headers(init.headers)
    this.body = init.body
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
