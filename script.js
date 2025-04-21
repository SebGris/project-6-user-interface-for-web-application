const API_URLS = {
    TITLE_URL: 'http://localhost:8000/api/v1/titles/',
    GENRE_URL: 'http://localhost:8000/api/v1/genres/',
};

// Lance la fonction d'initialisation lorsque le DOM est prêt
document.addEventListener('DOMContentLoaded', initialize);

// Configure les événements et charge les données initiales
function initialize() {
    loadInitialData();
    initializeModalEventListeners();
    setupResizeListeners();
}

// Charge le meilleur film, les films les mieux notés et les catégories
async function loadInitialData() {
    loadBestMovieData();
    loadCategories(API_URLS.GENRE_URL);
    // Attendre le chargement des films avant de configurer les événements
    await loadTopRatedMoviesData();
    initializeCategoryListener();
}

// Fonction pour charger le meilleur film
async function loadBestMovieData() {
    let sortedMovieListUrl = `${API_URLS.TITLE_URL}?page=1&sort_by=-imdb_score`;
    let movie = await fetchBestMovieData(sortedMovieListUrl);
    updateBestMovieUI(movie);
}

// Combine la récupération des catégories et la mise à jour de la liste déroulante
async function loadCategories(url) {
    let categories = await fetchCategories(url);
    updateCategorySelect(categories);
}

// Fonction utilitaire pour mettre à jour le contenu d'un élément HTML
function updateElementContent(selector, content, parent = document) {
    const element = parent.querySelector(selector);
    if (element) element.textContent = content;
}

// Remplit les éléments de la modale avec les informations d'un film
function updateModalContent(movie) {
    const modal = document.getElementById('movie-modal');
    const movieTitle = movie.original_title || movie.title;
    const worldwideGross = movie.worldwide_gross_income 
        ? `$${(movie.worldwide_gross_income / 1_000_000).toFixed(1)}m` 
        : 'non renseigné';

    const modalElements = {
        '.modal-title h2': movieTitle,
        '#year-genre': `${movie.year} - ${movie.genres.join(', ')}`,
        '#rating-duration': `PG-${movie.rated} - ${movie.duration} minutes (${movie.countries.join(' / ')})`,
        '#score': `Score IMDB: ${movie.imdb_score}/10`,
        '#box-office': `Recettes au box-office: ${worldwideGross}`,
        '#directors': movie.directors.join(', '),
        '.modal-synopsis .movie-synopsis': movie.description,
        '.modal-actors .actors-list': movie.actors.join(', ')
    };

    Object.entries(modalElements).forEach(([selector, content]) => updateElementContent(selector, content, modal));

    const poster = modal.querySelector('.modal-poster img');
    poster.src = movie.image_url;
    poster.alt = `Affiche du film ${movieTitle}`;
}

// Récupère les données du meilleur film
async function fetchBestMovieData(sortedMovieUrl) {
    let { results: sortedMovieList } = await fetchData(sortedMovieUrl);
    if (!sortedMovieList || sortedMovieList.length === 0) {
        throw new Error("Aucun film trouvé.");
    }
    return fetchData(`${API_URLS.TITLE_URL}${sortedMovieList[0].id}`);
}

// Prend une URL en paramètre et retourne les données JSON de la réponse
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        return null;
    }
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

// Affiche la modale si "display" est true, sinon la masque
function toggleModal(display, movie = null) {
    if (display && movie) {
        updateModalContent(movie);
    }
    let modal = document.getElementById('movie-modal');
    modal.style.display = display ? 'flex' : 'none';
}

// Charge les films d'une catégorie et met à jour l'affichage
async function loadTopRatedMovies(genre, container) {
    let movies = await fetchTopRatedMovies(genre);
    createMovieElements(movies, container);
    updateMovieVisibility(container);
    addMovieDetailsEvent(['.movie-image', '.details-button'], (movie) => toggleModal(true, movie));
}

// Retourne une liste des films triés par score IMDB, avec ou sans filtre de genre
async function fetchTopRatedMovies(genre) {
    const DEFAULT_MOVIE_COUNT = 6;
    let sortedUrl = `${API_URLS.TITLE_URL}?sort_by=-imdb_score`;
    let finalUrl = genre ? `${sortedUrl}&genre=${genre}` : sortedUrl;
    return fetchMovies(finalUrl, DEFAULT_MOVIE_COUNT);
}

// Génère dynamiquement les éléments HTML pour afficher les films dans un conteneur
function createMovieElements(movies, container) {
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

// Configure les clics sur les images ou boutons pour ouvrir la modale
function addMovieDetailsEvent(selectors, callback) {
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            element.addEventListener('click', async (event) => {
                const movieId = event.target.getAttribute('data-movie-id');
                const movie = await fetchData(`${API_URLS.TITLE_URL}${movieId}`);
                callback(movie);
            });
        });
    });
}

// Retourne une liste de toutes les catégories disponibles
async function fetchCategories(url) {
    let categories = [];
    while (url) {
        try {
            let { results, next } = await fetchData(url); // Extrait les propriétés `results` et `next`
            categories = [...categories, ...results];
            url = next;
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories :', error);
            return [];
        }
    }
    return categories;
}

// Retourne une liste des films d'une URL donnée, avec un nombre maximum de films
async function fetchMovies(url, numberOfMovies) {
    let movies = [];
    while (url && movies.length < numberOfMovies) {
        try {
            let { results, next } = await fetchData(url); // Extrait les propriétés `results` et `next`
            movies = [...movies, ...results];
            url = next;
        } catch (error) {
            console.error('Erreur lors de la récupération des films :', error);
            return [];
        }
    }
    return movies.slice(0, numberOfMovies);
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

// Charge les films de la catégorie sélectionnée dans la liste déroulante
async function initializeCategoryListener() {
    let categorySection = document.getElementById('other-category');
    let categorySelect = document.getElementById('other-categories');
    if (categorySelect.value) {
        await loadTopRatedMovies(categorySelect.value, categorySection).catch(error => {
            console.error('Erreur lors du chargement des films de la catégorie sélectionnée :', error);
        });
    }
    categorySelect.addEventListener('change', async (event) => {
        let selectedCategory = event.target.value;
        if (selectedCategory) {
            await loadTopRatedMovies(selectedCategory, categorySection).catch(error => {
                console.error('Erreur lors du chargement des films de la catégorie sélectionnée :', error);
            });
        }
    });
}

// Charge les films pour la section principale et les catégories
async function loadTopRatedMoviesData() {
    try {
        let categories = document.querySelectorAll('.category');
        for (let category of categories) {
            let genre = category.id === 'top-rated-movies' 
                ? '' 
                : category.querySelector('h2').textContent.trim();
            await loadTopRatedMovies(genre, category);
        };
    } catch (error) {
        console.error('Erreur lors du chargement des films les mieux notés :', error);
    }
}

// Ajoute des écouteurs pour fermer la modale via les boutons ou un clic extérieur
function initializeModalEventListeners() {
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

// Met à jour la visibilité des films lorsque la taille de l'écran change
function setupResizeListeners() {
    let containers = document.querySelectorAll('.category');
    window.addEventListener('resize', () => {
        containers.forEach(container => updateMovieVisibility(container));
    });
}

// Adapte le nombre de films visibles selon la taille de l'écran
function updateMovieVisibility(container) {
    const movies = container.querySelectorAll('.movie-item');
    const isMobile = window.matchMedia('(max-width: 480px)').matches;
    const isTablet = window.matchMedia('(max-width: 768px)').matches;
    const visibleCount = isMobile ? 2 : isTablet ? 4 : movies.length;

    movies.forEach((movie, index) => {
        movie.style.display = index < visibleCount ? 'block' : 'none';
    });

    setupVisibilityButtons(container, movies, visibleCount);
}

// Permet de basculer entre l'affichage complet ou partiel des films
function setupVisibilityButtons(container, movies, visibleCount) {
    const seeMoreButton = container.querySelector('.see-more-button');
    const seeLessButton = container.querySelector('.see-less-button');

    const toggleVisibility = (showAll) => {
        movies.forEach((movie, index) => {
            movie.style.display = showAll || index < visibleCount ? 'block' : 'none';
        });
        seeMoreButton.style.display = showAll ? 'none' : 'block';
        seeLessButton.style.display = showAll ? 'block' : 'none';
    };

    seeMoreButton.addEventListener('click', () => toggleVisibility(true));
    seeLessButton.addEventListener('click', () => toggleVisibility(false));
}