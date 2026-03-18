import { error } from "node:console"

export function validateUserRegistration(
    age: number,
    role: "admin" | "user" | "stagiaire",
    email: string,
): boolean {
    // Age > 120 -> erreur
    if (age > 120) {
        throw new Error("Âge invalide")
    }

    // Verification rôle
    if(!["admin","user","stagiaire"].includes(role)){
        throw new Error("Rôle invalide")
    }

    //Email invalide
    if (!email.includes("@") || !email.includes(".")){
        return false
    }
    // âge inférieur à 18
    if (age < 18){
        if (role === "stagiaire"){
            return true
        } else {
        return false
        }
    }
    return true
}