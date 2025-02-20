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
            reloadpage();
            showDashboard(user);
            updateDashboard();
        } else {
            alert("Invalid registration number or password.");
        }
    });

    function updateDashboard() {
        const requestContainer = document.querySelector(".card-container");
        requestContainer.innerHTML = ""; // Clear old requests
    
        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        let loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    
        requests.forEach((request, index) => {
            const card = document.createElement("div");
            card.classList.add("card");
            card.innerHTML = `
                <h3>${request.title}</h3>
                <p class="description">${request.description}</p>
                <span class="tc-offer">TCs: ${request.tcOffered}</span>
            `;
    
            // Click event to expand the card
            card.addEventListener("click", () => expandCard(card, request, index));
    
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
        document.getElementById("post-request-form").reset();
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

function deleteRequest(index) {
    if (confirm("Are you sure you want to delete this request?")) {
        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        requests.splice(index, 1); // Remove request
        localStorage.setItem("requests", JSON.stringify(requests));
        reloadpage();
        updateDashboard();
    }
}

function acceptRequest(index) {
    if (confirm("Do you want to accept this request? You won't be able to undo this action.")) {
        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        let loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

        requests[index].acceptedBy = loggedInUser.regNo; // Store the accepting user
        localStorage.setItem("requests", JSON.stringify(requests));
        reloadpage();
        updateDashboard();
    }
}

function completeRequest(index) {
    if (confirm("Are you sure this request is complete? The TCs will be transferred.")) {
        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        let users = JSON.parse(localStorage.getItem("users")) || [];
        let loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

        let request = requests[index];
        let acceptingUser = users.find(user => user.regNo === request.acceptedBy);
        let requestOwner = users.find(user => user.regNo === request.owner);

        if (acceptingUser && requestOwner) {
            // Transfer TCs
            acceptingUser.tc += request.tcOffered;
            // Update users array to reflect new TC balance
            users = users.map(user => 
                user.regNo === acceptingUser.regNo ? acceptingUser : 
                user.regNo === requestOwner.regNo ? requestOwner : user
            );

            // Remove request after completion
            requests.splice(index, 1);

            // Update local storage
            localStorage.setItem("users", JSON.stringify(users));
            localStorage.setItem("requests", JSON.stringify(requests));
            localStorage.setItem("loggedInUser", JSON.stringify(requestOwner)); // Update the owner’s TC balance
            reloadpage();
            updateDashboard();
            alert(`Request completed! ${request.tcOffered} TCs have been transferred to ${acceptingUser.name}.`);
        }
    }
}

// Function to expand the card on click
function expandCard(card, request, index) {
    let loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser) {
        alert("Please log in first.");
        return;
    }

    // Remove existing expanded card
    let existingExpanded = document.querySelector(".card.expanded");
    if (existingExpanded) existingExpanded.remove();

    // Clone and modify card for expansion
    let expandedCard = card.cloneNode(true);
    expandedCard.classList.add("expanded");

    // Ensure full description visibility with text wrapping
    let description = expandedCard.querySelector(".description");
    description.style.display = "block";
    description.style.whiteSpace = "normal"; // Allow text wrapping

    // Create button container
    let buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    // Add buttons based on user role
    if (loggedInUser.regNo === request.owner) {
        let deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.onclick = () => deleteRequest(index); // ✅ Pass index instead of request
        buttonContainer.appendChild(deleteBtn);
    }
    if (loggedInUser.regNo !== request.owner && !request.acceptedBy) {
        let acceptBtn = document.createElement("button");
        acceptBtn.textContent = "Accept";
        acceptBtn.classList.add("accept-btn");
        acceptBtn.onclick = () => acceptRequest(index); // ✅ Pass index
        buttonContainer.appendChild(acceptBtn);
    }
    if (loggedInUser.regNo === request.owner && request.acceptedBy) {
        let completeBtn = document.createElement("button");
        completeBtn.textContent = "Mark as Complete";
        completeBtn.classList.add("complete-btn");
        completeBtn.onclick = () => completeRequest(index); // ✅ Pass index
        buttonContainer.appendChild(completeBtn);
    }

    // Add close button
    let closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.onclick = closeExpandedCard;
    buttonContainer.appendChild(closeBtn);

    // Append buttons below content
    expandedCard.appendChild(buttonContainer);

    // Add a dim background effect
    let dimBackground = document.createElement("div");
    dimBackground.classList.add("dim-background");
    document.body.appendChild(dimBackground);
    dimBackground.style.display = "block";

    document.body.appendChild(expandedCard);

    // Close event on dim background
    dimBackground.addEventListener("click", closeExpandedCard);
}




// Function to close the expanded card
function closeExpandedCard() {
    let expandedCard = document.querySelector(".card.expanded");
    let dimBackground = document.querySelector(".dim-background");

    if (expandedCard) expandedCard.remove();
    if (dimBackground) {
        dimBackground.style.display = "none";
        dimBackground.remove();
    }
}



// Logout
function logout() {
    localStorage.removeItem("loggedInUser");
    showPanel("welcome");
    location.reload(); // Ensures dashboard is cleared properly
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
        updateDashboard();
    } else {
        showPanel("welcome");
    }
});

function hidepostform(){
    document.getElementById('login-form').reset();
    document.getElementById("post-request-form").classList.add("hidden"); 
}
function reloadpage(){
    location.reload();
}