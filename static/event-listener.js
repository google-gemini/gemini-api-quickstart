// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Display file info
function populateFiles(data) {
    const currentFileItem = document.querySelector('.current-file-item');
    const uploadPrompt = document.querySelector('.centered-text');
    
    if (data.has_file && data.file) {
        // Display current file info
        const file = data.file;
        
        // Update file info
        currentFileItem.querySelector('.file-name').textContent = file.filename;
        currentFileItem.querySelector('.file-size').textContent = formatFileSize(file.size);
        currentFileItem.querySelector('.file-time').textContent = file.upload_time;
        
        // Display file item, hide upload prompt
        currentFileItem.style.display = 'flex';
        uploadPrompt.style.display = 'none';
    } else {
        // Display upload prompt when no file
        currentFileItem.style.display = 'none';
        uploadPrompt.style.display = 'block';
    }
}

function refreshFileDisplay() {
    fetch('/get_files')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateFiles(data);
            }
        })
        .catch(error => {
            console.error('Failed to get file info:', error);
        });
}

// Refresh file display when page loads
document.addEventListener('DOMContentLoaded', function() {
    refreshFileDisplay();
});

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

                // Refresh file display
                refreshFileDisplay();
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