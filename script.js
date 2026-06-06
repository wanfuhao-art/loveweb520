const imageContainer = document.getElementById('gallery');
let index = 0;
let loading = false;
const batchSize = 10; // The number of images loaded per batch
const initialBatchCount = 5; // The number of batches initially loaded
const scrolldistance = 1000; // The distance from the bottom of the page to start loading more images
let currentImageIndex = 0;
let loadedImages = [];
let leftArrow;
let rightArrow;

// Calculate the number of days since the start date
function calculateLoveDays() {
    //相恋日期 2024-02-17
    const start = new Date(2024,1,17);
    const today = new Date();
    let diff = Math.floor((today - start) / (1000*60*60*24));
    if(diff < 0) diff = 0;
    document.getElementById('loveDays').textContent = diff;
}

// Load images in batches when the user scrolls to the bottom of the page
async function loadImages(batchCount = 1) {
    if (loading) return;
    loading = true;

    for (let b = 0; b < batchCount; b++) {
        const batchPromises = [];
        for (let i = 0; i < batchSize; i++) {
            batchPromises.push(loadThumbnail(index));
            index++;
        }
        const results = await Promise.all(batchPromises);

        results.forEach((img) => {
            if (img) imageContainer.appendChild(img);
        });

        const loadMore = results.some((img) => img);

        if (!loadMore) {
            window.removeEventListener('scroll', handleScroll);
            console.log('All images have been loaded and displayed.');
            break;
        }
    }
    loading = false;
}

// Load a thumbnail image and create an image element
function loadThumbnail(index) {
    return new Promise((resolve) => {
        const thumbImg = new Image();
        thumbImg.src = `./images/thumbs/${index}.jpg`;

        thumbImg.onload = function () {
            createImageElement(thumbImg, index, resolve);
        };

        // If the thumbnail image fails to load, try loading the full-size image
        thumbImg.onerror = function () {
            thumbImg.src = `./images/${index}.jpg`;
            thumbImg.onload = function () {
                createImageElement(thumbImg, index, resolve);
            };
            thumbImg.onerror = function () {
                resolve(null);
            };
        };

        function createImageElement(thumbImg, index, resolve) {
            const imgElement = document.createElement('img');
            imgElement.dataset.large = `./images/${index}.jpg`;
            imgElement.src = thumbImg.src;
            imgElement.alt = `Image ${index}`;
            imgElement.setAttribute('data-date', '');
            imgElement.setAttribute('data-index', index);

            // EXIF data is optional; wrap in try-catch so failures don't block image display
            try {
                if (typeof EXIF !== 'undefined' && EXIF.getData) {
                    EXIF.getData(thumbImg, function () {
                        try {
                            let exifDate = EXIF.getTag(this, 'DateTimeOriginal');
                            if (exifDate) {
                                exifDate = exifDate.replace(/^(\d{4}):(\d{2}):(\d{2}).*$/, '$1.$2.$3');
                            } else {
                                exifDate = '';
                            }
                            imgElement.setAttribute('data-date', exifDate);
                            loadedImages[index] = {
                                src: imgElement.dataset.large,
                                date: exifDate,
                            };
                        } catch (e) {
                            // EXIF callback failed, date stays empty
                        }
                    });
                }
            } catch (e) {
                // EXIF not available or failed; images still load fine
            }

            imgElement.addEventListener('click', function () {
                showPopup(imgElement.dataset.large, imgElement.getAttribute('data-date'), index);
            });

            imgElement.style.cursor = 'pointer';
            imgElement.classList.add('thumbnail');

            resolve(imgElement);
        }
    });
}

// Display a popup with the full-size image
function showPopup(src, date, index) {
    currentImageIndex = index;
    const popup = document.getElementById('popup');
    const popupImg = document.getElementById('popupImg');
    const imgDate = document.getElementById('imgDate');

    popup.style.display = 'block';

    popupImg.style.display = 'none';
    imgDate.textContent = '';

    const fullImg = new Image();
    fullImg.src = src;

    fullImg.onload = function () {
        popupImg.src = src;
        popupImg.style.display = 'block';
        imgDate.textContent = date;
    };

    fullImg.onerror = function () {
        imgDate.textContent = 'Load failed';
    };

    leftArrow.style.display = 'flex';
    rightArrow.style.display = 'flex';

    if (currentImageIndex > 0) {
        leftArrow.classList.remove('disabled');
    } else {
        leftArrow.classList.add('disabled');
    }

    if (loadedImages[currentImageIndex + 1]) {
        rightArrow.classList.remove('disabled');
    } else {
        rightArrow.classList.add('disabled');
    }
}

// Close the popup
function closePopup() {
    const popup = document.getElementById('popup');
    const popupImg = document.getElementById('popupImg');
    const imgDate = document.getElementById('imgDate');
    popup.style.display = 'none';
    popupImg.src = '';
    imgDate.textContent = '';

    leftArrow.style.display = 'none';
    rightArrow.style.display = 'none';
}

// Load the previous image
function handleScroll() {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= documentHeight - scrolldistance) {
        loadImages();
    }
}

// Show the previous image in the popup (when the left arrow is clicked)
function showPreviousImage() {
    const prevIndex = currentImageIndex - 1;
    if (prevIndex >= 0) {
        if (loadedImages[prevIndex]) {
            currentImageIndex = prevIndex;
            const imgData = loadedImages[prevIndex];
            showPopup(imgData.src, imgData.date, prevIndex);
        } else {
            leftArrow.classList.add('disabled');
        }
    }
}

// Show the next image in the popup (when the right arrow is clicked)
function showNextImage() {
    const nextIndex = currentImageIndex + 1;
    if (loadedImages[nextIndex]) {
        currentImageIndex = nextIndex;
        const imgData = loadedImages[nextIndex];
        showPopup(imgData.src, imgData.date, nextIndex);
    } else {
        rightArrow.classList.add('disabled');
    }
}

// Keyboard navigation for the popup
window.addEventListener('keydown', function (event) {
    const popup = document.getElementById('popup');
    if (popup.style.display === 'block') {
        if (event.key === 'ArrowLeft') {
            showPreviousImage();
        } else if (event.key === 'ArrowRight') {
            showNextImage();
        } else if (event.key === 'Escape') {
            closePopup();
        }
    }
});

// Load the initial images and set up event listeners
window.onload = function () {
    calculateLoveDays();

    loadImages(initialBatchCount).then(() => {
        window.addEventListener('scroll', handleScroll);
    });

    document.getElementById('closeBtn').addEventListener('click', closePopup);

    leftArrow = document.getElementById('leftArrow');
    rightArrow = document.getElementById('rightArrow');

    leftArrow.addEventListener('click', showPreviousImage);
    rightArrow.addEventListener('click', showNextImage);

    leftArrow.style.display = 'none';
    rightArrow.style.display = 'none';
};
