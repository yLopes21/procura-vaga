import { describe, it, expect } from "vitest";
import { COURSES, subareaOptions } from "./courseOptions";

describe("courseOptions (deriva opções de curso/área da taxonomia)", () => {
  it("COURSES lista cursos com value + label legível", () => {
    const admin = COURSES.find((c) => c.value === "administracao");
    expect(admin?.label).toBe("Administração");
    expect(COURSES.length).toBeGreaterThanOrEqual(10);
  });

  it("subareaOptions(administracao) traz as áreas com label legível, na ordem do JSON", () => {
    const subs = subareaOptions("administracao");
    expect(subs.map((s) => s.value)).toEqual(["financeiro", "marketing", "rh", "comercial", "operacoes"]);
    expect(subs.find((s) => s.value === "rh")?.label).toBe("Recursos Humanos");
  });

  it("curso sem subárea ou inexistente → lista vazia", () => {
    expect(subareaOptions("direito")).toEqual([]);
    expect(subareaOptions("inexistente")).toEqual([]);
  });
});
