document.getElementById("create").addEventListener("click", () => {
    document.getElementById("message").textContent = '';

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let reEnter = document.getElementById("re-enter").value;

    fetch("/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({user: username, pass: password, re: reEnter}),
    }).then(response => {
        console.log("Response Status:", response.status);
        if (response.status >= 400){
            return response.json().then(body => {
                console.log("Error Message:", body["error"]);
                document.getElementById("message").textContent = body["error"];
            });
        } else {
            return response.json().then(body => {
                console.log("Response Body:", body["success"]);
                document.getElementById("message").textContent = body["success"];
            });
        };
    }).catch(error => {
        document.getElementById("message").textContent = "Oops something went wrong...";
        console.log("Something went wrong with fetch:", error);
    });
});