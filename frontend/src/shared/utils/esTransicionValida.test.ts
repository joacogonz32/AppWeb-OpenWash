/**
 * Tests for esTransicionValida — FR-028 (máquina de estados de turnos)
 * Ver: data-model.md sección 3, specs/001-gestion-turnos-lavado/spec.md
 */
import { describe, it, expect } from "vitest";
import { esTransicionValida } from "./esTransicionValida";

describe("esTransicionValida", () => {
  describe("Transiciones VÁLIDAS", () => {
    it("confirmado → cancelado es válida", () => {
      expect(esTransicionValida("confirmado", "cancelado")).toBe(true);
    });

    it("confirmado → completado es válida", () => {
      expect(esTransicionValida("confirmado", "completado")).toBe(true);
    });
  });

  describe("Transiciones INVÁLIDAS", () => {
    it("cancelado → cualquier estado es inválido", () => {
      expect(esTransicionValida("cancelado", "confirmado")).toBe(false);
      expect(esTransicionValida("cancelado", "completado")).toBe(false);
    });

    it("completado → cualquier estado es inválido", () => {
      expect(esTransicionValida("completado", "confirmado")).toBe(false);
      expect(esTransicionValida("completado", "cancelado")).toBe(false);
    });

    it("confirmado → confirmado (misma) es inválida", () => {
      expect(esTransicionValida("confirmado", "confirmado")).toBe(false);
    });

    it("estado desconocido → cualquier estado es inválido", () => {
      expect(esTransicionValida("pendiente", "confirmado")).toBe(false);
      expect(esTransicionValida("", "cancelado")).toBe(false);
    });
  });
});
