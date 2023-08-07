document.getElementById("login").addEventListener("click", () => {
    document.getElementById("message").textContent = '';

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    fetch(`/login?user=${username}&pass=${password}`, {redirect: 'follow'}).then(response => {
        console.log("Response Status:", response.status);
        if (response.status >= 400){
            return response.json().then(body => {
                console.log("Error Message:", body);
                document.getElementById("message").textContent = body["error"];
            });
        } else {
            window.location.href = response.url;
        };
    }).catch(error => {
        document.getElementById("message").textContent = "Oops something went wrong...";
        console.log("Something went wrong with fetch:", error);
    });
});