async function loadUsers(){
    const reponse = await fetch("api/users")
    const users = await reponse.json()

    const liste = document.getElementById('userList')
    liste.innerHTML = ""
    users.forEach(user => {

        const btn = document.createElement("button")
        const li = document.createElement("li")
        li.textContent = user.nom + " | " + user.prenom + " | "
        btn.textContent = "X" 

        btn.addEventListener("click", async()=>{
            await fetch(`/api/users/${user.id}`,{
                method: "DELETE"
            })
            loadUsers()
        })
        
        li.appendChild(btn)
        liste.appendChild(li)


    })
}
loadUsers()

const form = document.getElementById("userForm")

form.addEventListener("submit", async(event)=>{
    event.preventDefault()
    let nom = document.getElementById("nom").value
    let prenom = document.getElementById("prenom").value

    await fetch("api/users",{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({nom,prenom})
    })
    loadUsers()
    form.reset() 
})


