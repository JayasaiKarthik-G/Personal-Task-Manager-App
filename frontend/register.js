// =====================
// API CONFIG
// =====================

const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

const API = isLocal
    ? "http://localhost:3000/users"
    : "https://your-render-url.onrender.com/users";

// =====================
// REDIRECT IF LOGGED IN
// =====================

let currentUser = JSON.parse(localStorage.getItem("user"));

if(currentUser){
    window.location.replace("app.html");
}

// =====================
// REGISTER FORM
// =====================

document.addEventListener("DOMContentLoaded", () => {

    let registerForm = document.getElementById("registerForm");

    registerForm.addEventListener(
        "submit",
        registerUser
    );
});

// =====================
// REGISTER USER
// =====================

async function registerUser(e){

    e.preventDefault();

    let form = document.forms.regForm;

    let fullName = form.fullName.value.trim();

    let username = form.username.value.trim();

    let email = form.email.value.trim();

    let password = form.password.value.trim();

    let confirmPassword = form.confirmPassword.value.trim();

    // =====================
    // EMPTY VALIDATION
    // =====================

    if(
        fullName === "" ||
        username === "" ||
        email === "" ||
        password === "" ||
        confirmPassword === ""
    ){
        alert("Please fill all fields.");
        return;
    }

    // =====================
    // FULL NAME
    // =====================

    let fullNamePattern = /^[A-Za-z\s]{3,50}$/;

    let checkFullName = fullNamePattern.test(fullName);

    if(checkFullName === false){
        alert("Full Name should contain atleast 3 letters.");
        return;
    }

    // =====================
    // USERNAME
    // =====================

    let usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;

    let checkUsername = usernamePattern.test(username);

    if(checkUsername === false){
        alert("Username should be 3-20 characters.");
        return;
    }

    // =====================
    // EMAIL
    // =====================

    let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let checkEmail = emailPattern.test(email);

    if(checkEmail === false){
        alert("Invalid Email Address.");
        return;
    }

    // =====================
    // PASSWORD
    // =====================

    let passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W)[A-Za-z\d@#$%^&*!]{8,20}$/;
    
    let checkPassword = passwordPattern.test(password);

    if(checkPassword === false){
        alert(
            "Password must contain uppercase, lowercase, number and special character. Length 8-20."
        );
        return;
    } 

    // =====================
    // CONFIRM PASSWORD
    // =====================

    if(password !== confirmPassword){
        alert("Passwords do not match.");
        return;
    }

    // =====================
    // DUPLICATE CHECK
    // =====================

    let users = [];
    try{

        let res = await fetch(API);

        users = await res.json();

        let duplicateUsername = users.some(user => {
            return (
                user.username.toLowerCase() === username.toLowerCase()
            );
        });

        if(duplicateUsername){
            alert("Username already exists.");
            return;
        }

        let duplicateEmail = users.some(user => {
            return (
                user.email.toLowerCase() === email.toLowerCase()
            );
        });

        if(duplicateEmail){
            alert("Email already exists.");
            return;
        }
    }catch(err){
        console.log("Duplicate Check Error:",err);
        return;
    }

    // =====================
    // USER OBJECT
    // =====================

    let obj = {
        fullName : fullName,
        username : username.toLowerCase(),
        email : email,
        password : password,
        todos : []
    };

    // =====================
    // SAVE USER
    // =====================

    try{

        let res = await fetch(API,{
            method : "POST",
            headers : {
                "Content-Type":"application/json"
            },
            body : JSON.stringify(obj)
        });

        if(!res.ok){
            throw new Error("Failed to Register.");
        }

        let data = await res.json();
        console.log(data);
        alert("Registration Successful.");
        window.location.replace("login.html");
    }
    catch(err){
        console.log("Registration Error:", err);
        alert("Unable to Register.");
    }
}