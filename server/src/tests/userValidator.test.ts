import { validateUserRegistration } from "../utils/userValidator"

describe("User Registration Validator", ()=>{
    test("utilisateur valide", ()=>{
        expect(validateUserRegistration(25,"user","jreiozar@gmail.com")).toBe(true)
    })
    test("admin valide", ()=>{
        expect(validateUserRegistration(25,"admin","jreiozar@gmail.com")).toBe(true)
    })
    test("âge invalide", () => {
        expect(() => validateUserRegistration(130, "user", "jreiozar@gmail.com"))
        .toThrow("Âge invalide");
    });
    test("rôle invalide", () => {
        expect(() => validateUserRegistration(25, "prof" as any, "jreiozar@gmail.com"))
        .toThrow("Rôle invalide");
    });
    test("rejette si pas '@' et pas de '.' ", ()=>{
        expect(validateUserRegistration(25,"user","jreiozargmail.com")).toBe(false)
    })
    test("rejette si quand '.'", ()=>{
        expect(validateUserRegistration(25,"user","jreiozar@gmailcom")).toBe(false)
    })
    test("mineur refusé", ()=>{
        expect(validateUserRegistration(15,"user","jreiozar@gmail.com")).toBe(false)
    })
    test("mineur STAGIAIRE accepeté", ()=>{
        expect(validateUserRegistration(15,"stagiaire","jreiozar@gmail.com")).toBe(true)
    })
})