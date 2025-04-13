const baseUrl = 'http://localhost:8000/api/v1/titles/';
 
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

// Sélection des éléments
const modal = document.getElementById('movie-modal');
const openModalButtons = document.querySelectorAll('.details-button');
const closeButton = document.querySelector('.close-button');

// Ouvrir la modale
openModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        modal.style.display = 'flex'; // Affiche la modale
    });
});

// Fermer la modale
closeButton.addEventListener('click', () => {
    modal.style.display = 'none'; // Cache la modale
});

// Sélectionner le bouton de fermeture (croix)
const closeModalButton = document.querySelector('.modal-close');

// Ajouter un événement pour fermer la modale
closeModalButton.addEventListener('click', () => {
    modal.style.display = 'none'; // Cache la modale
});

// Fermer la modale en cliquant en dehors du contenu
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Fonction pour charger le meilleur film
async function loadBestMovie(url) {
    try {
        const { results } = await fetchData(url);
        if (!results || results.length === 0) {
            throw new Error("Aucun film trouvé.");
        }
        const movie = await fetchData(`${baseUrl}${results[0].id}`);
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

// Fonction pour gérer l'affichage des films en fonction de la taille de l'écran
function updateMovieVisibility(containerSelector) {
    const container = document.querySelector(containerSelector);
    const movies = container.querySelectorAll('.movie-item');
    const seeMoreButton = container.querySelector('.see-more-button');
    const seeLessButton = container.querySelector('.see-less-button');

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

    seeMoreButton.style.display = visibleCount < movies.length ? 'block' : 'none';
    seeLessButton.style.display = 'none';

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

// Fonction pour charger les 6 films les mieux notés
async function loadTopRatedMovies(genre, containerSelector) {
    const baseUrls = [`${baseUrl}?sort_by=-imdb_score`, `${baseUrl}?page=2&sort_by=-imdb_score`];
    const urls = genre ? baseUrls.map(url => `${url}&genre=${genre}`) : baseUrls;

    try {
        const results = (await Promise.all(urls.map(fetchData)))
            .flatMap(data => data.results)
            .slice(0, 6);

        const container = document.querySelector(containerSelector);
        if (genre) container.querySelector('h2').textContent = genre;

        const movieGrid = container.querySelector('.movie-grid');
        movieGrid.innerHTML = results.map(movie => `
            <div class="movie-item">
                <img src="${movie.image_url}" alt="Affiche du film ${movie.original_title || movie.title}">
                <div class="overlay">
                    <p class="movie-title">${ movie.original_title || movie.title}</p>
                    <button class="button details-button" data-movie-id="${movie.id}">Détails</button>
                </div>
            </div>
        `).join('');

        movieGrid.querySelectorAll('.details-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const movieId = event.target.getAttribute('data-movie-id');
                const movie = await fetchData(`${baseUrl}${movieId}`);
                toggleModal(true, movie);
            });
        });

        // Met à jour l'affichage des films en fonction de la taille de l'écran
        updateMovieVisibility(containerSelector);
    } catch (error) {
        console.error('Erreur lors du chargement des films les mieux notés :', error);
    }
}

// Fonction pour charger les catégories
async function loadCategories(url) {
    let categories = [];
    try {
        while (url) {
            const data = await fetchData(url);
            categories = [...categories, ...data.results];
            url = data.next;
        }
        const categorySelect = document.getElementById('other-categories');
        categorySelect.innerHTML = categories.map(category => `
            <option value="${category.name}">${category.name}</option>
        `).join('');
    } catch (error) {
        console.error('Erreur lors du chargement des catégories :', error);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    const bestMovieUrl = `${baseUrl}?page=1&sort_by=-imdb_score`;
    const genresUrl = 'http://localhost:8000/api/v1/genres/';
    await loadBestMovie(bestMovieUrl);
    await loadTopRatedMovies('', '#top-rated-movies');
    await loadTopRatedMovies('Action', '#categorie-1');
    await loadTopRatedMovies('Romance', '#categorie-2');
    await loadCategories(genresUrl);
    document.getElementById('other-categories').addEventListener('change', (event) => {
        const selectedCategory = event.target.value;
        if (selectedCategory) {
            loadTopRatedMovies(selectedCategory, '#categorie-3');
        }
    });   
});

// Réagir aux changements de taille de l'écran
window.addEventListener('resize', () => {
    updateMovieVisibility('#top-rated-movies');
    updateMovieVisibility('#categorie-1');
    updateMovieVisibility('#categorie-2');
    updateMovieVisibility('#categorie-3');
});