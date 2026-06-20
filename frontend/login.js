// =====================
// API CONFIG
// =====================

const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

const API = isLocal
    ? "http://localhost:3000/users"
    : "https://personal-task-manager-app.onrender.com/users";

// =====================
// REDIRECT IF LOGGED IN
// =====================

let currentUser = JSON.parse(localStorage.getItem("user"));

if (currentUser) {
    window.location.replace("app.html");
}

// =====================
// LOGIN FORM
// =====================

document.addEventListener("DOMContentLoaded", () => {

    let loginForm = document.getElementById("loginForm");

    loginForm.addEventListener(
        "submit",
        loginUser
    );

});

// =====================
// LOGIN USER
// =====================

async function loginUser(e){

    e.preventDefault();

    let form = document.forms.loginForm;

    let emailOrUsername = form.emailOrUsername.value.trim();

    let password = form.password.value.trim();

    if(emailOrUsername === "" || password === ""){
        alert("Please fill all fields.");
        return;
    }

    try{

        let res = await fetch(API);

        let users = await res.json();

        let user = users.find(item => {

            return (
                item.username.toLowerCase() === emailOrUsername.toLowerCase()

                ||

                item.email.toLowerCase() === emailOrUsername.toLowerCase()
            );
        });

        if(!user){
            alert("User not found.");
            return;
        }

        if(user.password !== password){
            alert("Incorrect password.");
            return;
        }

        localStorage.setItem("user", JSON.stringify(user));
        alert("Login Successful.");
        window.location.replace("app.html");

    }catch(err){

        console.log("Login Error:", err);
        alert("Unable to Login.");
    }
}