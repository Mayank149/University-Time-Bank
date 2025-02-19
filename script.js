document.addEventListener("DOMContentLoaded", () => {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let requests = JSON.parse(localStorage.getItem("requests")) || [];

    // Registration Form Submit
    document.getElementById("register-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const userData = {
            name: document.getElementById("name").value,
            age: document.getElementById("age").value,
            gradYear: document.getElementById("graduation-year").value,
            stream: document.getElementById("stream").value,
            course: document.getElementById("course").value,
            regNo: document.getElementById("reg-no").value,
            mobile: document.getElementById("mobile").value,
            password: document.getElementById("password").value,
            tc: 5 // Start with 5 TCs
        };

        if (users.some(user => user.regNo === userData.regNo)) {
            alert("User with this registration number already exists.");
            return;
        }

        users.push(userData);
        localStorage.setItem("users", JSON.stringify(users));

        alert("Registration successful! You now have 5 TCs.");
        showPanel("login");
    });

    // Login Form Submit
    document.getElementById("login-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const regNo = document.getElementById("login-reg").value;
        const password = document.getElementById("login-password").value;

        const user = users.find(user => user.regNo === regNo && user.password === password);

        if (user) {
            alert(`Welcome, ${user.name}!`);
            localStorage.setItem("loggedInUser", JSON.stringify(user)); 
            showDashboard(user);
        } else {
            alert("Invalid registration number or password.");
        }
    });

    function updateDashboard() {
        const requestContainer = document.querySelector(".card-container");
        requestContainer.innerHTML = ""; // Clear previous requests
        requests.forEach(request => {
            const card = document.createElement("div");
            card.classList.add("card");
            card.innerHTML = `
                <h3>${request.title}</h3>
                <p class="description">${request.description}</p>
                <span class="tc-offer">TCs: ${request.tcOffered}</span>
            `;
            requestContainer.appendChild(card);
        });
    }

    // Post Request Functionality
    document.getElementById("post-request-btn").addEventListener("click", () => {
        const title = prompt("Enter Request Title:");
        if (!title) return;

        const description = prompt("Enter Request Description:");
        if (!description) return;

        const tcOffered = parseInt(prompt("Enter TCs Offered:"), 10);
        if (isNaN(tcOffered) || tcOffered <= 0) {
            alert("Invalid TC amount.");
            return;
        }

        let loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        if (!loggedInUser) {
            alert("Please log in first.");
            return;
        }

        if (loggedInUser.tc < tcOffered) {
            alert("Not enough TCs.");
            return;
        }

        // Deduct TCs and save request
        loggedInUser.tc -= tcOffered;
        localStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));
        users = users.map(user => user.regNo === loggedInUser.regNo ? loggedInUser : user);
        localStorage.setItem("users", JSON.stringify(users));

        requests.push({ title, description, tcOffered });
        localStorage.setItem("requests", JSON.stringify(requests));

        updateDashboard();
        alert("Request posted successfully!");
    });

});

// Show Panels
function showPanel(panel) {
    document.querySelectorAll(".panel").forEach(p => {
        p.style.opacity = "0";
        setTimeout(() => p.classList.add("hidden"), 300);
    });

    setTimeout(() => {
        document.getElementById(`${panel}-panel`).classList.remove("hidden");
        document.getElementById(`${panel}-panel`).style.opacity = "1";
    }, 350);
}

// Show Dashboard
function showDashboard(user) {
    localStorage.setItem("loggedInUser", JSON.stringify(user));

    showPanel("dashboard");
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedInUser) {
        document.getElementById("user-name").textContent = `Welcome, ${loggedInUser.name}`;
        document.getElementById("tc-balance").textContent = `TCs: ${loggedInUser.tc}`;
    };
    
}

// Logout
function logout() {
    localStorage.removeItem("loggedInUser");
    showPanel("welcome");
}


document.addEventListener("DOMContentLoaded", () => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedInUser) {
        showDashboard(loggedInUser);
    } else {
        showPanel("welcome");
    }
});
