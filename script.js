const API_URLS = {
    TITLE_URL: 'http://localhost:8000/api/v1/titles/',
    GENRE_URL: 'http://localhost:8000/api/v1/genres/',
};

// Prend une URL en paramètre et retourne les données JSON de la réponse
async function fetchData(url) {
    let response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
    }
    return response.json();
}

// Remplit les éléments de la modale avec les informations d'un film
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

// Affiche la modale si "display" est true, sinon la masque
function toggleModal(display, movie = null) {
    let modal = document.getElementById('movie-modal');
    if (display && movie) {
        updateModalContent(movie);
    }
    modal.style.display = display ? 'flex' : 'none';
}

// Récupère les données du meilleur film
async function fetchBestMovieData(sortedMovieUrl) {
    let { results: sortedMovieList } = await fetchData(sortedMovieUrl);
    if (!sortedMovieList || sortedMovieList.length === 0) {
        throw new Error("Aucun film trouvé.");
    }
    return fetchData(`${API_URLS.TITLE_URL}${sortedMovieList[0].id}`);
}

// Met à jour l'interface utilisateur avec les données du meilleur film
function updateBestMovieUI(movie) {
    let movieTitle = movie.original_title || movie.title;
    let bestMovieElement = document.querySelector('#best-movie');
    bestMovieElement.querySelector('.movie-poster').src = movie.image_url;
    bestMovieElement.querySelector('.movie-poster').alt = `Affiche du film ${movieTitle}`;
    bestMovieElement.querySelector('.movie-details h3').textContent = movieTitle;
    bestMovieElement.querySelector('.movie-synopsis').textContent = movie.description;
    bestMovieElement.querySelector('.best-details-button').addEventListener('click', () => toggleModal(true, movie));
}

// Contrôle la visibilité des films en fonction du nombre visible ou de l'état "voir tout"
function updateMovieDisplay(movies, visibleCount, showAll) {
    movies.forEach((movie, index) => {
        movie.style.display = showAll || index < visibleCount ? 'block' : 'none';
    });
}

// Permet de basculer entre l'affichage complet ou partiel des films
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

// Adapte le nombre de films visibles selon la taille de l'écran
function updateMovieVisibility(containerSelector) {
    let container = document.querySelector(containerSelector);
    let movies = container.querySelectorAll('.movie-item');
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
    let seeMoreButton = container.querySelector('.see-more-button');
    let seeLessButton = container.querySelector('.see-less-button');
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

// Retourne une liste des films triés par score IMDB, avec ou sans filtre de genre
async function fetchTopRatedMovies(genre) {
    const DEFAULT_MOVIE_COUNT = 6;
    let sortedUrl = `${API_URLS.TITLE_URL}?sort_by=-imdb_score`;
    let finalUrl = genre ? `${sortedUrl}&genre=${genre}` : sortedUrl;
    return fetchMovies(finalUrl, DEFAULT_MOVIE_COUNT);
}

// Génère dynamiquement les éléments HTML pour afficher les films dans un conteneur
function createMovieElements(movies, containerSelector) {
    let container = document.querySelector(containerSelector);
    let movieGrid = container.querySelector('.movie-grid');
    movieGrid.textContent = '';

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

// Ajoute des écouteurs pour afficher les détails des films dans la modale
function setupMovieEvents(containerSelector) {
    addMovieDetailsEvent(`${containerSelector} .movie-image`, (movie) => toggleModal(true, movie));
    addMovieDetailsEvent(`${containerSelector} .details-button`, (movie) => toggleModal(true, movie));
}

// Charge les films d'une catégorie spécifique et met à jour l'affichage
async function loadTopRatedMovies(genre, containerSelector) {
    let container = document.querySelector(containerSelector);
    if (genre) container.querySelector('h2').textContent = genre;

    let movies = await fetchTopRatedMovies(genre);
    createMovieElements(movies, containerSelector);
    setupMovieEvents(containerSelector);
    updateMovieVisibility(containerSelector);
}

// Configure les clics sur les images ou boutons pour ouvrir la modale
function addMovieDetailsEvent(selector, callback) {
    document.querySelectorAll(selector).forEach(element => {
        element.addEventListener('click', async (event) => {
            let movieId = event.target.getAttribute('data-movie-id');
            let movie = await fetchData(`${API_URLS.TITLE_URL}${movieId}`);
            callback(movie);
        });
    });
}

// Retourne une liste de toutes les catégories disponibles
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

async function fetchMovies(url, numberOfMovies) {
    let movies = [];
    while (url) {
        try {
            let data = await fetchData(url);
            movies = [...movies, ...data.results];
            if (movies.length >= numberOfMovies) {
                movies = movies.slice(0, numberOfMovies);
                break;
            }
            url = data.next;
        } catch (error) {
            console.error('Erreur lors de la récupération des films :', error);
            return [];
        }
    }
    return movies;
}

// Remplit la liste déroulante avec les catégories récupérées
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

// Combine la récupération des catégories et la mise à jour de la liste déroulante
async function loadCategories(url) {
    let categories = await fetchCategories(url);
    updateCategorySelect(categories);
}

// Met à jour la visibilité des films lorsque la taille de l'écran change
function setupResizeListeners() {
    let containers = ['#top-rated-movies', '#categorie-1', '#categorie-2', '#other-category'];
    window.addEventListener('resize', () => {
        containers.forEach(updateMovieVisibility);
    });
}

// Ajoute des écouteurs pour fermer la modale via les boutons ou un clic extérieur
function setupModalHandlers() {
    let closeModalButton = document.querySelector('.modal-x-close');
    closeModalButton.addEventListener('click', () => toggleModal(false));
    let closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', () => toggleModal(false));
    let modal = document.getElementById('movie-modal');
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            toggleModal(false);
        }
    });
}

// Charge les films de la catégorie sélectionnée dans la liste déroulante
function setupCategoryChangeListener() {
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

// Fonction pour charger le meilleur film
async function loadBestMovieData() {
    let sortedMovieListUrl = `${API_URLS.TITLE_URL}?page=1&sort_by=-imdb_score`;
    try {
        let movie = await fetchBestMovieData(sortedMovieListUrl);
        updateBestMovieUI(movie);
    } catch (error) {
        console.error('Erreur lors du chargement du meilleur film :', error);
    }
}

// Charge les films pour la section principale et les catégories
async function loadTopRatedMoviesData() {
    await loadTopRatedMovies('', '#top-rated-movies');
    await loadTopRatedMovies('Crime', '#categorie-1');
    await loadTopRatedMovies('Romance', '#categorie-2');
}

// Récupère et affiche les catégories dans la liste déroulante
async function loadCategoriesData() {
    await loadCategories(API_URLS.GENRE_URL);
}

// Charge le meilleur film, les films les mieux notés et les catégories
async function loadInitialData() {
    await loadBestMovieData();
    await loadTopRatedMoviesData();
    await loadCategoriesData();
}

// Configure les événements et charge les données initiales
async function initialize() {
    await loadInitialData();
    setupCategoryChangeListener();
    setupModalHandlers();
    setupResizeListeners();
}

// Lance la fonction d'initialisation lorsque le DOM est prêt
document.addEventListener('DOMContentLoaded', initialize);