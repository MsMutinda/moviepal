import { cn } from "@/lib/utils/styles"

describe("Styles Utils", () => {
  describe("cn (className utility)", () => {
    it("should merge class names correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2")
    })

    it("should handle conditional classes", () => {
      const shouldShow = true
      const shouldHide = false
      expect(cn("base", shouldShow && "conditional")).toBe("base conditional")
      expect(cn("base", shouldHide && "conditional")).toBe("base")
    })

    it("should handle undefined and null values", () => {
      expect(cn("base", undefined, null, "valid")).toBe("base valid")
    })

    it("should handle empty strings", () => {
      expect(cn("base", "", "valid")).toBe("base valid")
    })

    it("should handle arrays of classes", () => {
      expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3")
    })

    it("should handle objects with boolean values", () => {
      expect(cn("base", { conditional: true, other: false })).toBe(
        "base conditional",
      )
    })
  })
})
