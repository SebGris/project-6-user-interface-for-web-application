const API_URLS = {
    TITLES_URL: 'http://localhost:8000/api/v1/titles/',
    GENRES_URL: 'http://localhost:8000/api/v1/genres/',
};

// Fonction générique pour effectuer une requête API
async function fetchData(url) {
    let response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
    }
    return response.json();
}

// Fonction pour mettre à jour le contenu de la modale
function updateModalContent(movie) {
    let modal = document.getElementById('movie-modal');
    let movieTitle = movie.original_title || movie.title;
    let worldwide_gross_income = movie.worldwide_gross_income 
        ? `$${(movie.worldwide_gross_income / 1_000_000).toFixed(1)}m` 
        : 'non renseigné';
    let modalElements = {
        '.modal-title h2': movieTitle,
        '#year-genre': `${movie.year} - ${movie.genres.join(', ')}`,
        '#rating-duration': `PG-${movie.rated} - ${movie.duration} minutes (${movie.countries.join(' / ')})`,
        '#score': `Score IMDB: ${movie.imdb_score}/10`,
        '#box-office': `Recettes au box-office: ${worldwide_gross_income}`,
        '#directors': movie.directors.join(', '),
        '.modal-synopsis .movie-synopsis': movie.description,
        '.modal-actors .actors-list': movie.actors.join(', ')
    };

    for (let [selector, textContent] of Object.entries(modalElements)) {
        modal.querySelector(selector).textContent = textContent;
    }

    let poster = modal.querySelector('.modal-poster img');
    poster.src = movie.image_url;
    poster.alt = `Affiche du film ${movieTitle}`;
}

// Fonction pour afficher ou cacher la modale
function toggleModal(display, movie = null) {
    let modal = document.getElementById('movie-modal');
    if (display && movie) {
        updateModalContent(movie); // Appel à la nouvelle fonction
    }
    modal.style.display = display ? 'flex' : 'none';
}

// Fonction pour configurer les événements de la modale
function setupModalEvents() {
    let modal = document.getElementById('movie-modal');
    let closeModalButton = document.querySelector('.modal-x-close');
    let closeButton = document.querySelector('.close-button');

    closeModalButton.addEventListener('click', () => toggleModal(false));
    closeButton.addEventListener('click', () => toggleModal(false));

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            toggleModal(false);
        }
    });
}

// Fonction pour charger le meilleur film
async function loadBestMovie(url) {
    try {
        let { results } = await fetchData(url);
        if (!results || results.length === 0) {
            throw new Error("Aucun film trouvé.");
        }
        let movie = await fetchData(`${API_URLS.TITLES_URL}${results[0].id}`);
        let movieTitle = movie.original_title || movie.title;
        let bestMovieElement = document.querySelector('#best-movie');
        bestMovieElement.querySelector('.movie-poster').src = movie.image_url;
        bestMovieElement.querySelector('.movie-poster').alt = `Affiche du film ${movieTitle}`;
        bestMovieElement.querySelector('.movie-details h3').textContent = movieTitle;
        bestMovieElement.querySelector('.movie-synopsis').textContent = movie.description;
        bestMovieElement.querySelector('.best-details-button').addEventListener('click', () => toggleModal(true, movie));
    } catch (error) {
        console.error('Erreur lors du chargement du meilleur film :', error);
    }
}

// Nouvelle fonction pour gérer l'affichage des films
function updateMovieDisplay(movies, visibleCount, showAll) {
    movies.forEach((movie, index) => {
        movie.style.display = showAll || index < visibleCount ? 'block' : 'none';
    });
}

// Nouvelle fonction pour configurer les événements des boutons "Voir plus" et "Voir moins"
function setupVisibilityButtons(containerSelector, movies, visibleCount) {
    let container = document.querySelector(containerSelector);
    let seeMoreButton = container.querySelector('.see-more-button');
    let seeLessButton = container.querySelector('.see-less-button');

    seeMoreButton.addEventListener('click', () => {
        updateMovieDisplay(movies, visibleCount, true); // Affiche tous les films
        seeMoreButton.style.display = 'none';
        seeLessButton.style.display = 'block';
    });

    seeLessButton.addEventListener('click', () => {
        updateMovieDisplay(movies, visibleCount, false); // Affiche uniquement les films visibles
        seeMoreButton.style.display = 'block';
        seeLessButton.style.display = 'none';
    });
}

// Fonction pour gérer l'affichage des films en fonction de la taille de l'écran
function updateMovieVisibility(containerSelector) {
    let container = document.querySelector(containerSelector);
    let movies = container.querySelectorAll('.movie-item');
    let seeMoreButton = container.querySelector('.see-more-button');
    let seeLessButton = container.querySelector('.see-less-button');

    let isTablet = window.matchMedia('(max-width: 768px)').matches;
    let isMobile = window.matchMedia('(max-width: 480px)').matches;

    let visibleCount = movies.length;
    if (isMobile) {
        visibleCount = 2;
    } else if (isTablet) {
        visibleCount = 4;
    }

    movies.forEach((movie, index) => {
        movie.style.display = index < visibleCount ? 'block' : 'none';
    });

    // Met à jour l'état des boutons
    if (movies.length > visibleCount) {
        seeMoreButton.style.display = 'block';
        seeLessButton.style.display = 'none';
    } else {
        seeMoreButton.style.display = 'none';
        seeLessButton.style.display = 'none';
    }

    setupVisibilityButtons(containerSelector, movies, visibleCount);
}

// Fonction pour récupérer les films les mieux notés
async function fetchTopRatedMovies(genre) {
    let baseUrls = [`${API_URLS.TITLES_URL}?sort_by=-imdb_score`, `${API_URLS.TITLES_URL}?page=2&sort_by=-imdb_score`];
    let urls = genre ? baseUrls.map(url => `${url}&genre=${genre}`) : baseUrls;

    try {
        let results = (await Promise.all(urls.map(fetchData)))
            .flatMap(data => data.results)
            .slice(0, 6);
        return results;
    } catch (error) {
        console.error('Erreur lors de la récupération des films les mieux notés :', error);
        return [];
    }
}

// Fonction pour créer les éléments DOM des films
function createMovieElements(movies, containerSelector) {
    let container = document.querySelector(containerSelector);
    let movieGrid = container.querySelector('.movie-grid');
    movieGrid.textContent = ''; // Efface le contenu existant

    movies.forEach(movie => {
        let movieItem = document.createElement('div');
        movieItem.className = 'movie-item';

        let img = document.createElement('img');
        img.src = movie.image_url;
        img.alt = `Affiche du film ${movie.original_title || movie.title}`;
        img.className = 'movie-image';
        img.setAttribute('data-movie-id', movie.id);

        let overlay = document.createElement('div');
        overlay.className = 'overlay';

        let title = document.createElement('h1');
        title.className = 'movie-title';
        title.textContent = movie.original_title || movie.title;

        let button = document.createElement('button');
        button.className = 'details-button';
        button.setAttribute('data-movie-id', movie.id);
        button.textContent = 'Détails';

        overlay.appendChild(title);
        overlay.appendChild(button);
        movieItem.appendChild(img);
        movieItem.appendChild(overlay);
        movieGrid.appendChild(movieItem);
    });
}

// Fonction pour configurer les événements des films
function setupMovieEvents(containerSelector) {
    addMovieDetailsEvent(`${containerSelector} .movie-image`, (movie) => toggleModal(true, movie));
    addMovieDetailsEvent(`${containerSelector} .details-button`, (movie) => toggleModal(true, movie));
}

async function loadTopRatedMovies(genre, containerSelector) {
    let container = document.querySelector(containerSelector);
    if (genre) container.querySelector('h2').textContent = genre;

    let movies = await fetchTopRatedMovies(genre);
    createMovieElements(movies, containerSelector);
    setupMovieEvents(containerSelector);
    updateMovieVisibility(containerSelector);
}

function addMovieDetailsEvent(selector, callback) {
    document.querySelectorAll(selector).forEach(element => {
        element.addEventListener('click', async (event) => {
            let movieId = event.target.getAttribute('data-movie-id');
            let movie = await fetchData(`${API_URLS.TITLES_URL}${movieId}`);
            callback(movie);
        });
    });
}

// Fonction pour récupérer les catégories depuis l'API
async function fetchCategories(url) {
    let categories = [];
    while (url) {
        try {
            let data = await fetchData(url);
            categories = [...categories, ...data.results];
            url = data.next;
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories :', error);
            return [];
        }
    }
    return categories;
}

// Fonction pour mettre à jour l'élément DOM avec les catégories
function updateCategorySelect(categories) {
    let categorySelect = document.getElementById('other-categories');
    categorySelect.textContent = '';
    categories.forEach(category => {
        let option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

// Fonction pour charger les catégories (combine les deux responsabilités)
async function loadCategories(url) {
    let categories = await fetchCategories(url);
    updateCategorySelect(categories);
}

// Fonction pour initialiser les événements de redimensionnement
function setupResizeEvents() {
    let containers = ['#top-rated-movies', '#categorie-1', '#categorie-2', '#other-category'];
    window.addEventListener('resize', () => {
        containers.forEach(updateMovieVisibility);
    });
}

// Fonction pour charger le meilleur film
async function loadBestMovieData() {
    let bestMovieUrl = `${API_URLS.TITLES_URL}?page=1&sort_by=-imdb_score`;
    await loadBestMovie(bestMovieUrl);
}

// Fonction pour charger les films les mieux notés
async function loadTopRatedMoviesData() {
    await loadTopRatedMovies('', '#top-rated-movies');
    await loadTopRatedMovies('Crime', '#categorie-1');
    await loadTopRatedMovies('Romance', '#categorie-2');
}

// Fonction pour charger les catégories
async function loadCategoriesData() {
    await loadCategories(API_URLS.GENRES_URL);
}

async function loadInitialData() {
    await loadBestMovieData();
    await loadTopRatedMoviesData();
    await loadCategoriesData();
}

// Fonction principale d'initialisation
async function initialize() {
    await loadInitialData();
    setupCategoryChangeEvent();
    setupModalEvents();
    setupResizeEvents();
}

function setupCategoryChangeEvent() {
    let categorySelect = document.getElementById('other-categories');
    if (categorySelect.value) {
        loadTopRatedMovies(categorySelect.value, '#other-category');
    }
    categorySelect.addEventListener('change', (event) => {
        let selectedCategory = event.target.value;
        if (selectedCategory) {
            loadTopRatedMovies(selectedCategory, '#other-category');
        }
    });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', initialize);