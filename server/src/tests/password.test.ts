import { validatePassword } from "../utils/password";
describe("Password Validator - White Box Testing", () => {
    // Test initial pour initialiser le rapport de couverture
    // Ce test ne couvre que la première ligne de la fonction (Branch 1)
    it("devrait rejeter un mot de passe vide", () => {
        const result = validatePassword("", 25);
        expect(result).toBe(false);
    });
    // branch 2
    test("rejette un mot de passe trop court", ()=>{
        expect(validatePassword("Ab1!",25)).toBe(false)
    })
    // branch 3
    test("rejette un mot de passe trop long", ()=>{
        expect(validatePassword("Ab1!485454raezraez!48484e8razere",25)).toBe(false) 
    })
    //branch 4
    test("enfant: rejette si pas de minuscule", ()=>{
        expect(validatePassword("YFGBYUH!",10)).toBe(false) 
    })
    test("enfant: accepte si au moins une minuscule", ()=>{
        expect(validatePassword("azerraze",10)).toBe(true) 
    })
    //branch 5
    test("adultes: rejette si pas de majuscule", ()=>{
        expect(validatePassword("abrrrr11111!!!!",25)).toBe(false) 
    })
    test("adultes: rejette si pas de minuscule", ()=>{
        expect(validatePassword("ABDD545451!!!",25)).toBe(false) 
    })
    test("adultes: rejette si pas de chiffre", ()=>{
        expect(validatePassword("AUdjnhjdnjb!",25)).toBe(false) 
    })
    // branch 6
    test("adulte: rejette si pas de caractère spécial", ()=>{
        expect(validatePassword("Ab14854ere",25)).toBe(false) 
    })
     test("adulte: accepte mot de passe valide", ()=>{
        expect(validatePassword("Abcdef12345!!",25)).toBe(true) 
    })
    // âge limite adulte
    test("adulte : accepte à 12 ans avec mot de passe valide", () => {
        expect(validatePassword("Abc123!!", 12)).toBe(true);
    });
    // branch 7
    test("senior: rejette si pas de chiffre et pas de majuscule", ()=>{
        expect(validatePassword("ijfifhdu",70)).toBe(false) 
    })
    // branch final
    test("senior: accepte avec une majuscule", ()=>{
        expect(validatePassword("Abceeef!!!!",70)).toBe(true) 
    })
     test("senior: accepte avec un chiffre", ()=>{
        expect(validatePassword("abceefd1!",70)).toBe(true) 
    })
    
});
