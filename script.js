const API = {
    baseUrl: 'http://localhost:8000/api/v1/titles/',
    genresUrl: 'http://localhost:8000/api/v1/genres/',
};

// Fonction générique pour effectuer une requête API
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
    }
    return response.json();
}

// Fonction pour afficher ou cacher la modale
function toggleModal(display, movie = null) {
    const modal = document.getElementById('movie-modal');
    if (display && movie) {
        const movieTitle = movie.original_title || movie.title;
        const worldwide_gross_income = movie.worldwide_gross_income 
            ? `$${(movie.worldwide_gross_income / 1_000_000).toFixed(1)}m` 
            : 'non renseigné';
        const modalElements = {
            '.modal-title h2': movieTitle,
            '#year-genre': `${movie.year} - ${movie.genres.join(', ')}`,
            '#rating-duration': `PG-${movie.rated} - ${movie.duration} minutes (${movie.countries.join(' / ')})`,
            '#score': `Score IMDB: ${movie.imdb_score}/10`,
            '#box-office': `Recettes au box-office: ${worldwide_gross_income}`,
            '#directors': movie.directors.join(', '),
            '.modal-synopsis .movie-synopsis': movie.description,
            '.modal-actors .actors-list': movie.actors.join(', ')
        };

        for (const [selector, textContent] of Object.entries(modalElements)) {
            modal.querySelector(selector).textContent = textContent;
        }

        const poster = modal.querySelector('.modal-poster img');
        poster.src = movie.image_url;
        poster.alt = `Affiche du film ${movieTitle}`;
    }
    modal.style.display = display ? 'flex' : 'none';
}

// Fonction pour configurer les événements de la modale
function setupModalEvents() {
    const modal = document.getElementById('movie-modal');
    const closeModalButton = document.querySelector('.modal-x-close');
    const closeButton = document.querySelector('.close-button');

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
        const { results } = await fetchData(url);
        if (!results || results.length === 0) {
            throw new Error("Aucun film trouvé.");
        }
        const movie = await fetchData(`${API.baseUrl}${results[0].id}`);
        const movieTitle = movie.original_title || movie.title;
        const bestMovieElement = document.querySelector('#best-movie');
        bestMovieElement.querySelector('.movie-poster').src = movie.image_url;
        bestMovieElement.querySelector('.movie-poster').alt = `Affiche du film ${movieTitle}`;
        bestMovieElement.querySelector('.movie-details h3').textContent = movieTitle;
        bestMovieElement.querySelector('.movie-synopsis').textContent = movie.description;
        bestMovieElement.querySelector('.details-button').addEventListener('click', () => toggleModal(true, movie));
    } catch (error) {
        console.error('Erreur lors du chargement du meilleur film :', error);
    }
}

// Fonction pour configurer les événements des boutons "Voir plus" et "Voir moins"
function setupVisibilityButtons(containerSelector, movies, visibleCount) {
    const container = document.querySelector(containerSelector);
    const seeMoreButton = container.querySelector('.see-more-button');
    const seeLessButton = container.querySelector('.see-less-button');

    seeMoreButton.addEventListener('click', () => {
        movies.forEach(movie => (movie.style.display = 'block'));
        seeMoreButton.style.display = 'none';
        seeLessButton.style.display = 'block';
    });

    seeLessButton.addEventListener('click', () => {
        movies.forEach((movie, index) => {
            movie.style.display = index < visibleCount ? 'block' : 'none';
        });
        seeMoreButton.style.display = 'block';
        seeLessButton.style.display = 'none';
    });
}

// Fonction pour gérer l'affichage des films en fonction de la taille de l'écran
function updateMovieVisibility(containerSelector) {
    const container = document.querySelector(containerSelector);
    const movies = container.querySelectorAll('.movie-item');

    const isTablet = window.matchMedia('(max-width: 768px)').matches;
    const isMobile = window.matchMedia('(max-width: 480px)').matches;

    let visibleCount = movies.length;
    if (isMobile) {
        visibleCount = 2; // Affiche les 2 premiers films
    } else if (isTablet) {
        visibleCount = 4; // Affiche les 4 premiers films
    }

    movies.forEach((movie, index) => {
        movie.style.display = index < visibleCount ? 'block' : 'none';
    });

    setupVisibilityButtons(containerSelector, movies, visibleCount);
}

// Fonction pour charger les 6 films les mieux notés
async function loadTopRatedMovies(genre, containerSelector) {
    // La première URL récupère les 5 premiers films, la deuxième URL (avec page=2) récupère les 5 films suivants
    const baseUrls = [`${API.baseUrl}?sort_by=-imdb_score`, `${API.baseUrl}?page=2&sort_by=-imdb_score`];
    const urls = genre ? baseUrls.map(url => `${url}&genre=${genre}`) : baseUrls;

    try {
        const results = (await Promise.all(urls.map(fetchData)))
            .flatMap(data => data.results)
            .slice(0, 6);

        const container = document.querySelector(containerSelector);
        if (genre) container.querySelector('h2').textContent = genre;

        const movieGrid = container.querySelector('.movie-grid');
        movieGrid.textContent = ''; // Efface le contenu existant

        results.forEach(movie => {
            const movieItem = document.createElement('div');
            movieItem.className = 'movie-item';

            const img = document.createElement('img');
            img.src = movie.image_url;
            img.alt = `Affiche du film ${movie.original_title || movie.title}`;
            img.className = 'movie-image';
            img.setAttribute('data-movie-id', movie.id);

            const overlay = document.createElement('div');
            overlay.className = 'overlay';

            const title = document.createElement('p');
            title.className = 'movie-title';
            title.textContent = movie.original_title || movie.title;

            const button = document.createElement('button');
            button.className = 'button details-button';
            button.setAttribute('data-movie-id', movie.id);
            button.textContent = 'Détails';

            overlay.appendChild(title);
            overlay.appendChild(button);
            movieItem.appendChild(img);
            movieItem.appendChild(overlay);
            movieGrid.appendChild(movieItem);
        });

        // Ajout des événements pour les images des films
        addMovieDetailsEvent('.movie-image', (movie) => toggleModal(true, movie));
        addMovieDetailsEvent('.details-button', (movie) => toggleModal(true, movie));

        // Met à jour l'affichage des films en fonction de la taille de l'écran
        updateMovieVisibility(containerSelector);
    } catch (error) {
        console.error('Erreur lors du chargement des films les mieux notés :', error);
    }
}

function addMovieDetailsEvent(selector, callback) {
    document.querySelectorAll(selector).forEach(element => {
        element.addEventListener('click', async (event) => {
            const movieId = event.target.getAttribute('data-movie-id');
            const movie = await fetchData(`${API.baseUrl}${movieId}`);
            callback(movie);
        });
    });
}

// Fonction pour charger les catégories
async function loadCategories(url) {
    let categories = [];
    while (url) {
        try {
            const data = await fetchData(url);
            categories = [...categories, ...data.results];
            url = data.next;
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories :', error);
            return;
        }
    }

    const categorySelect = document.getElementById('other-categories');
    categorySelect.textContent = ''; // Efface les options existantes
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

// Fonction pour initialiser les événements de redimensionnement
function setupResizeEvents() {
    const containers = ['#top-rated-movies', '#categorie-1', '#categorie-2', '#other-category'];
    window.addEventListener('resize', () => {
        containers.forEach(updateMovieVisibility);
    });
}

// Fonction principale d'initialisation
async function initialize() {
    await loadInitialData();
    setupCategoryChangeEvent();
    setupModalEvents();
    setupResizeEvents();
}

async function loadInitialData() {
    // Est-ce que page 1 fait gagner de temps ???? TODO
    const bestMovieUrl = `${API.baseUrl}?page=1&sort_by=-imdb_score`;
    await loadBestMovie(bestMovieUrl);
    await loadTopRatedMovies('', '#top-rated-movies');
    await loadTopRatedMovies('Crime', '#categorie-1');
    await loadTopRatedMovies('Romance', '#categorie-2');
    await loadCategories(API.genresUrl);
}

function setupCategoryChangeEvent() {
    const categorySelect = document.getElementById('other-categories');
    if (categorySelect.value) {
        loadTopRatedMovies(categorySelect.value, '#other-category');
    }
    categorySelect.addEventListener('change', (event) => {
        const selectedCategory = event.target.value;
        if (selectedCategory) {
            loadTopRatedMovies(selectedCategory, '#other-category');
        }
    });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', initialize);