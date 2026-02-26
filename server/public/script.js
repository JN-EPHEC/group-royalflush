async function loadUsers() {
  const reponse = await fetch("api/users");
  const users = await reponse.json();

  const liste = document.getElementById('userList');
  liste.innerHTML = "";

  users.forEach(user => {

    const li = document.createElement("li");
    li.textContent = user.nom + " | " + user.prenom + " | ";

    // 🔴 BOUTON DELETE
    const btnDelete = document.createElement("button");
    btnDelete.textContent = "X";

    btnDelete.addEventListener("click", async () => {
      await fetch(`/api/users/${user.id}`, {
        method: "DELETE"
      });
      loadUsers();
    });

    // 🟡 BOUTON UPDATE
    const btnUpdate = document.createElement("button");
    btnUpdate.textContent = "Modifier";

    btnUpdate.addEventListener("click", async () => {
      const newNom = prompt("Nouveau nom :", user.nom);
      const newPrenom = prompt("Nouveau prénom :", user.prenom);

      if (!newNom || !newPrenom) return;

      await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nom: newNom, prenom: newPrenom })
      });

      loadUsers();
    });

    li.appendChild(btnUpdate);
    li.appendChild(btnDelete);
    liste.appendChild(li);
  });
}

loadUsers();

async function updateUser(id, nom, prenom) {
  await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ nom, prenom })
  });

  loadUsers(); // recharge la liste
}

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


