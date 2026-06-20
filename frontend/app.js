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
// LOGIN CHECK
// =====================

let currentUser = JSON.parse(localStorage.getItem("user"));

if (!currentUser) {
    window.location.replace("login.html");
}

// =====================
// LOADER
// =====================

function showLoader(message = "Loading tasks..."){

    let results = document.getElementById("results");

    results.innerHTML = `
        <div class="loader-box">
            <div class="todo-loader"></div>
            <p class="loader-text">${message}</p>
        </div>
    `;
}

// =====================
// PROFILE
// =====================

function loadProfile(){

    document.getElementById(
        "profileFullName"
    ).textContent =
    currentUser.fullName;

    document.getElementById(
        "profileUsername"
    ).textContent =
    "@" + currentUser.username;

    document.getElementById(
        "profileEmail"
    ).textContent =
    currentUser.email;
}

// =====================
// STARTUP
// =====================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProfile();

        let form =
        document.getElementById(
            "taskForm"
        );

        form.addEventListener(
            "submit",
            addTask
        );

        showLoader("Loading your tasks...");
        displayTask();
    }
);

// =====================
// DISPLAY TASKS
// =====================

async function displayTask(){

    showLoader("Loading your tasks...");

    try{

        let res = await fetch(`${API}/${currentUser.id}`);

        let user = await res.json();

        currentUser = user;

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        let todos = user.todos || [];

        accessTask(todos);

    }catch(err){

        console.log("Error: " + err);

        document.getElementById("results").innerHTML = `
            <div class="empty-box d-flex flex-column justify-content-center align-items-center text-center text-white" style="min-height:70vh;">
                <i class="fa-solid fa-triangle-exclamation fa-2x mb-3 text-danger"></i>
                <h4>Unable to load tasks</h4>
                <p class="text-secondary">Please try again.</p>
            </div>
        `;
    }
}

// =====================
// SHOW TASKS
// =====================

function convertToMinutes(timeStr) {
    let [time, modifier] = timeStr.toLowerCase().split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "pm" && hours !== 12) hours += 12;
    if (modifier === "am" && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

function accessTask(arr = [], isSearch = false){

    const results = document.getElementById("results");

    if(!Array.isArray(arr) || arr.length === 0){

        results.innerHTML = `
            <div class="empty-box d-flex flex-column justify-content-center align-items-center text-center text-white" style="min-height:70vh;">
                <i class="fa-solid fa-circle-info fa-2x mb-3"></i>
                <h4>No Tasks Found</h4>
                <p class="text-secondary">
                    ${isSearch ? "No matching tasks." : "No tasks available."}
                </p>
            </div>
        `;
        return;
    }

    let cards = "";

    arr.slice()
    .sort((a, b) => convertToMinutes(a.time) - convertToMinutes(b.time))
    .forEach(item => {

        cards += `
        <div class="task-card">

            <div class="task-info">
                <div class="task-title">
                    <i class="fa-solid fa-check text-success"></i>
                    ${item.task}
                </div>

                <div class="task-time">
                    <i class="fa-solid fa-clock"></i>
                    ${item.time}
                </div>
            </div>

            <div class="task-actions">

                <button class="btn btn-warning btn-xs"
                    onclick="changeTask('${item.id}','${item.task}','${item.time}')">
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button class="btn btn-danger btn-xs"
                    onclick="removeTask('${item.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>

        </div>`;
    });

    results.innerHTML = cards;
}

// =====================
// ADD TASK
// =====================

async function addTask(e){

    e.preventDefault();

    let taskForm = document.forms.taskForm;

    let task = taskForm.task.value.trim();

    let time = taskForm.time.value.trim();

    // VALIDATIONS
    if(task == "" || time == ""){
        alert("Please fill all details.");
        return;
    }

    let taskPattern = /^[A-Za-z0-9\s]{3,50}$/;

    let checkTask = taskPattern.test(task);

    if(checkTask == false){
        alert("Please check your task.");
        return;
    }

    let timePattern = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm)$/i;

    let checkTime = timePattern.test(time);

    if(checkTime == false){
        alert("Enter time like 09:00 am");
        return;
    }

    time = time.toLowerCase();

    showLoader("Adding task...");

    try{

        let res = await fetch(`${API}/${currentUser.id}`);

        let user = await res.json();

        let todos = user.todos || [];

        let duplicate = todos.some(item => {

            return (

                item.task.trim().toLowerCase()

                ===

                task.trim().toLowerCase()

                &&

                item.time.trim().toLowerCase()

                ===

                time.trim().toLowerCase()
            );
        });

        if(duplicate){
            alert("Task already exists");
            taskForm.reset();
            return;
        }

        let newId = 1;

        if(todos.length > 0){
            let ids = todos.map(item => item.id);
            newId = Math.max(...ids) + 1;
        }

        let obj = {
            id : newId,
            task : task,
            time : time
        };

        todos.push(obj);

        let updateRes = await fetch(`${API}/${currentUser.id}`,
            {
                method : "PATCH",
                headers : {
                    "Content-Type":
                    "application/json"
                },
                body : JSON.stringify({
                    todos : todos
                })
            }
        );

        if(!updateRes.ok){
            throw new Error("Failed to add task");
        }

        await displayTask();

        taskForm.reset();

        console.log("Task added successfully");

    }catch(err){
        console.log("Error: " + err);
    }
}

// =====================
// SEARCH TASK
// =====================

async function getTask(){

    let taskForm = document.forms.taskForm;

    let taskInput = taskForm.task.value.trim().toLowerCase();

    let timeInput = taskForm.time.value.trim().toLowerCase();

    if(taskInput === "" && timeInput === ""){
        alert("Enter task or time");
        return;
    }

    showLoader("Searching tasks...");

    try{

        let res = await fetch(`${API}/${currentUser.id}`);

        let user = await res.json();

        let todos = user.todos || [];

        let filteredData = todos.filter(item => {

            let taskMatch = taskInput
                ? item.task.toLowerCase().includes(taskInput)
                : true;

            let timeMatch = timeInput
                ? item.time.toLowerCase().includes(timeInput)
                : true;

            return taskMatch && timeMatch;
        });

        accessTask(filteredData, true);

        taskForm.reset();

    }catch(err){

        console.log("Error: " + err);

        document.getElementById("results").innerHTML = `
            <div class="empty-box d-flex flex-column justify-content-center align-items-center text-center text-white" style="min-height:70vh;">
                <i class="fa-solid fa-triangle-exclamation fa-2x mb-3 text-danger"></i>
                <h4>Search failed</h4>
                <p class="text-secondary">Please try again.</p>
            </div>
        `;
    }
}

// =====================
// EDIT TASK
// =====================

async function changeTask(id, oldTask, oldTime){

    let newTask = prompt("Enter new task: ", oldTask);

    let newTime = prompt("Enter new time: ",oldTime);

    if(newTask === null && newTime === null){
        return;
    }

    newTask = newTask ? newTask.trim() : "";

    newTime = newTime ? newTime.trim() : "";

    if(newTask === ""){
        newTask = oldTask;
    }

    if(newTime === ""){
        newTime = oldTime;
    }

    let taskPattern = /^[A-Za-z0-9\s]{3,50}$/;

    let checkTask = taskPattern.test(newTask);

    if(checkTask == false){
        alert("Invalid task");
        return;
    }

    let timePattern = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm)$/i;

    let checkTime = timePattern.test(newTime);

    if(checkTime == false){
        alert("Enter time like 09:00 am");
        return;
    }

    newTime = newTime.toLowerCase();

    showLoader("Updating task...");

    try{

        let res = await fetch( `${API}/${currentUser.id}` );

        let user = await res.json();

        let todos = user.todos || [];

        let duplicate = todos.some(item => {

            return (

                item.id != id

                &&

                item.task.trim().toLowerCase()

                ===

                newTask.trim().toLowerCase()

                &&

                item.time.trim().toLowerCase()

                ===

                newTime.trim().toLowerCase()
            );
        });

        if(duplicate){
            alert("Task already exists");
            return;
        }

        let updatedTodos = todos.map(item => {

            if(item.id == id){
                return {
                    ...item,
                    task : newTask,
                    time : newTime
                };
            }
            return item;
        });

        let updateRes = await fetch(`${API}/${currentUser.id}`,
            {
                method : "PATCH",
                headers : {
                    "Content-Type":
                    "application/json"
                },
                body : JSON.stringify({
                    todos :
                    updatedTodos
                })
            }
        );

        if(!updateRes.ok){
            throw new Error("Update failed");
        }

        console.log("Task updated successfully");

        await displayTask();

    }catch(err){
        console.log("Error: " + err);
    }
}

// =====================
// DELETE TASK
// =====================

async function removeTask(id){

    try{

        let confirmDelete = confirm("Want to delete?");

        if(confirmDelete == false){
            return;
        }

        showLoader("Deleting task...");
        
        let res = await fetch(`${API}/${currentUser.id}`);

        let user = await res.json();

        let todos = user.todos || [];

        let updatedTodos = todos.filter(item => {
            return (
                Number(item.id) !== Number(id)
            );
        });

        let updateRes = await fetch(`${API}/${currentUser.id}`,
            {
                method : "PATCH",
                headers : {
                    "Content-Type":
                    "application/json"
                },
                body : JSON.stringify({
                    todos : updatedTodos
                })
            }
        );

        if(!updateRes.ok){
            throw new Error("Delete failed");
        }

        console.log("Task deleted successfully");
        await displayTask();
    }
    catch(err){
        console.log("Error: " + err);
    }
}

// =====================
// LOGOUT
// =====================

function logoutUser(){

    let confirmLogout = confirm("Want to logout?");

    if(confirmLogout == false){
        return;
    }

    localStorage.removeItem("user");
    alert("Logout account successfully");
    window.location.replace("login.html");

}

// =====================
// DELETE ACCOUNT
// =====================

async function deleteAccount(){

    let confirmDelete = confirm("Delete account permanently?");

    if(confirmDelete == false){
        return;
    }

    try{
        let res = await fetch(`${API}/${currentUser.id}`,
            {
                method : "DELETE"
            }
        );

        if(!res.ok){
            throw new Error("Delete failed");
        }

        localStorage.removeItem("user");
        alert("Account deleted successfully");
        window.location.replace("index.html");
    }
    catch(err){
        console.log("Error: " + err);
    }
}