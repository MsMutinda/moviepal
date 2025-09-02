import "@testing-library/jest-dom"

declare global {
  namespace jest {
    interface MockedFunction<T extends (..._args: unknown[]) => unknown> {
      mockResolvedValue: (_value: ReturnType<T>) => MockedFunction<T>
      mockRejectedValue: (_reason: unknown) => MockedFunction<T>
      mockReturnValue: (_value: ReturnType<T>) => MockedFunction<T>
      mockImplementation: (_fn: T) => MockedFunction<T>
      mockClear: () => MockedFunction<T>
      mockReset: () => MockedFunction<T>
      mockRestore: () => MockedFunction<T>
    }
  }
}

// Extend Jest matchers
declare module "expect" {
  interface Matchers<R> {
    toBeInTheDocument(): R
  }
}

export {}
