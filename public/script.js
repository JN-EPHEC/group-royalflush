async function loadUsers(){
    const reponse = await fetch("api/users")
    const users = await reponse.json()

    const liste = document.getElementById('userList')


    


    users.forEach(user => {


        const li = document.createElement("li")
        li.textContent = user.nom + " " + user.prenom
        liste.appendChild(li)

    })
}
loadUsers()