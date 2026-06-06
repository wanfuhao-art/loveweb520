const imageContainer = document.getElementById('gallery');
let index = 0;
let loading = false;
const batchSize = 10;
const initialBatchCount = 5;
const scrolldistance = 1000;
const TIMEOUT_MS = 10000; // 10 second timeout per image on mobile
let currentImageIndex = 0;
let loadedImages = [];
let leftArrow;
let rightArrow;

function calculateLoveDays() {
    const start = new Date(2024, 1, 17);
    const today = new Date();
    let diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    if (diff < 0) diff = 0;
    document.getElementById('loveDays').textContent = diff;
}

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
            console.log('All images loaded.');
            break;
        }
    }
    loading = false;
}

function loadThumbnail(index) {
    return new Promise((resolve) => {
        const thumbImg = new Image();

        // Set handlers BEFORE setting src to avoid race conditions on mobile
        thumbImg.onload = function () {
            clearTimeout(timer);
            createImageElement(thumbImg, index, resolve);
        };

        thumbImg.onerror = function () {
            // Fallback: try full-size image
            const fallbackImg = new Image();
            fallbackImg.onload = function () {
                clearTimeout(timer);
                createImageElement(fallbackImg, index, resolve);
            };
            fallbackImg.onerror = function () {
                // Both failed
                resolve(null);
            };
            fallbackImg.src = `./images/${index}.jpg`;
        };

        // Timeout guard: prevent hanging on slow mobile networks
        const timer = setTimeout(() => {
            resolve(null);
        }, TIMEOUT_MS);

        thumbImg.src = `./images/thumbs/${index}.jpg`;
    });
}

function createImageElement(img, index, resolve) {
    const imgElement = document.createElement('img');
    imgElement.dataset.large = `./images/${index}.jpg`;
    imgElement.src = img.src;
    imgElement.alt = `Image ${index}`;
    imgElement.setAttribute('data-date', '');
    imgElement.setAttribute('data-index', index);

    try {
        if (typeof EXIF !== 'undefined' && EXIF.getData) {
            EXIF.getData(img, function () {
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
                } catch (e) {}
            });
        }
    } catch (e) {}

    imgElement.addEventListener('click', function () {
        showPopup(imgElement.dataset.large, imgElement.getAttribute('data-date'), index);
    });

    imgElement.style.cursor = 'pointer';
    imgElement.classList.add('thumbnail');

    resolve(imgElement);
}

function showPopup(src, date, index) {
    currentImageIndex = index;
    const popup = document.getElementById('popup');
    const popupImg = document.getElementById('popupImg');
    const imgDate = document.getElementById('imgDate');

    popup.style.display = 'block';
    popupImg.style.display = 'none';
    imgDate.textContent = '';

    const fullImg = new Image();
    fullImg.onload = function () {
        popupImg.src = src;
        popupImg.style.display = 'block';
        imgDate.textContent = date;
    };
    fullImg.onerror = function () {
        imgDate.textContent = 'Load failed';
    };
    fullImg.src = src;

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

function handleScroll() {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (scrollTop + windowHeight >= documentHeight - scrolldistance) {
        loadImages();
    }
}

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
