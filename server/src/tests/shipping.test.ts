import { calculateShipping } from "../utils/shipping";

describe("Shipping Calculator - Tests Fonctionnels", () => {

  describe("Catalog & Boundaries", () => {

    const validCases: Array<[number, number, "standard" | "express", number, string]> = [
      // [distance, weight, type, expected, description]

      // Distance limites
      [0, 5, "standard", 10, "Distance 0 km -> prix 10€ (standard)"],
      [50, 5, "standard", 10, "Distance 50 km -> prix 10€ (standard)"],
      [51, 5, "standard", 25, "Distance 51 km -> prix 25€ (standard)"],
      [500, 5, "standard", 25, "Distance 500 km -> prix 25€ (standard)"],
      [501, 5, "standard", 50, "Distance 501 km -> prix 50€ (standard)"],

      // Poids limites
      [10, 10, "standard", 15, "Poids 10 kg -> majoration 50%"],
      [100, 20, "standard", 37.5, "Distance moyenne + poids lourd"],

      // Express
      [10, 5, "express", 20, "Express double le prix"],
      [100, 20, "express", 75, "Express + majoration poids"],
    ];

    test.each(validCases)(
      "%s",
      (distance, weight, type, expected) => {
        expect(calculateShipping(distance, weight, type)).toBe(expected);
      }
    );

  });

  describe("Invalid inputs", () => {

    test("Distance négative", () => {
      expect(() => calculateShipping(-1, 5, "standard"))
        .toThrow("Invalid distance");
    });

    test("Poids nul", () => {
      expect(() => calculateShipping(10, 0, "standard"))
        .toThrow("Invalid weight");
    });

    test("Poids négatif", () => {
      expect(() => calculateShipping(10, -5, "standard"))
        .toThrow("Invalid weight");
    });

    test("Poids > 50 kg", () => {
      expect(() => calculateShipping(10, 51, "standard"))
        .toThrow("Invalid weight");
    });

  });

});