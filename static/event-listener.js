document.getElementById("file-upload").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const formData = new FormData();
    formData.append("file", file);

    fetch("/upload", {
        method: "POST",
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Update and show the banner
                const banner = document.getElementById("upload-banner");
                banner.textContent = data.message;
                banner.style.display = "block";

                // Hide the banner after 3 seconds
                setTimeout(() => {
                    banner.style.display = "none";
                }, 3000);

                fetch("/get_files")
                    .then((response) => response.json())
                    .then((data) => {
                        populateFiles(data.assistant_files);
                    });
            } else {
                console.error("Upload failed:", data.message);
                // Update and show the banner
                const banner = document.getElementById("upload-banner");
                banner.textContent = data.message;
                banner.style.display = "block";
                banner.style.color = "red";

                // Hide the banner after 3 seconds
                setTimeout(() => {
                    banner.style.display = "none";
                }, 3500);
            }
        })
        .catch((error) => {
            console.error("Error uploading file:", error);
        });
});