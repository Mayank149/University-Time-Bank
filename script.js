document.addEventListener("DOMContentLoaded", () => {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let requests = JSON.parse(localStorage.getItem("requests")) || [];

    // Registration Form Submit
    document.getElementById("register-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const password = document.getElementById("password").value;
        const hashedPassword = await hashPassword(password); // Hash password before storing

        const userData = {
            name: document.getElementById("name").value,
            age: document.getElementById("age").value,
            gradYear: document.getElementById("graduation-year").value,
            regNo: document.getElementById("reg-no").value,
            mobile: document.getElementById("mobile").value,
            password: hashedPassword, // Store hashed password
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
    document.getElementById("login-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const regNo = document.getElementById("login-reg").value;
        const password = document.getElementById("login-password").value;
        const hashedPassword = await hashPassword(password); // Hash entered password

        const user = users.find(user => user.regNo === regNo && user.password === hashedPassword);

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
        requestContainer.innerHTML = ""; // Clear previous content

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

    // Ensure requests persist when page reloads
    if (document.getElementById("dashboard-panel")) {
        updateDashboard();
    }


    // Post Request Functionality (Using a Form Instead of Prompts)
    document.getElementById("post-request-btn").addEventListener("click", () => {
        document.getElementById("post-request-form").classList.remove("hidden");
    });

    document.getElementById("post-request-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("request-title").value;
        const description = document.getElementById("request-description").value;
        const tcOffered = parseInt(document.getElementById("request-tc").value, 10);

        if (!title || !description || isNaN(tcOffered) || tcOffered <= 0) {
            alert("Please fill in all fields correctly.");
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

        requests.push({ title, description, tcOffered, owner: loggedInUser.regNo });
        localStorage.setItem("requests", JSON.stringify(requests));

        updateDashboard();
        document.getElementById("tc-balance").textContent = `TCs: ${loggedInUser.tc}`;
        alert("Request posted successfully!");
        document.getElementById("post-request-form").classList.add("hidden"); // Hide form after posting
    });

});

// Show Panels
function showPanel(panel) {
    document.querySelectorAll(".panel").forEach(p => {
        p.style.opacity = "0";
        setTimeout(() => p.classList.add("hidden"), 300);
    });

    // Clear form inputs when switching away
    if (panel !== 'register') {
        document.getElementById('register-form').reset();
    }
    if (panel !== 'login') {
        document.getElementById('login-form').reset();
    }

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
    }
    updateDashboard(); // Reload stored requests when logging in
}

// Logout
function logout() {
    localStorage.removeItem("loggedInUser");
    document.querySelector(".card-container").innerHTML = ""; // Clear requests
    showPanel("welcome");
}

// Password Hashing Function
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedInUser) {
        showDashboard(loggedInUser);
    } else {
        showPanel("welcome");
    }
});
