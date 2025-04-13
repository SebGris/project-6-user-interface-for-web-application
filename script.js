let categories = []; // Variable globale pour stocker les catégories
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
/**
 * @description
* Si `display` est vrai et qu'un objet `movie` est fourni, le contenu de la modale 
* est mis à jour avec les détails du film (titre, année, genres, affiche, description et acteurs).
* Sinon, la modale est simplement cachée ou affichée sans que son contenu soit mis à jour.
 */
function toggleModal(display, movie = null) {
    const modal = document.getElementById('movie-modal');
    if (display && movie) {
        // Déstructuration {} de l'objet movie pour extraire ses propriétés
        const { title, year, genres, image_url, description, actors } = movie;
        modal.querySelector('.modal-title h2').textContent = title;
        modal.querySelector('.modal-title p').textContent = `${year} - ${genres.join(', ')}`;
        modal.querySelector('.modal-poster img').src = image_url;
        modal.querySelector('.modal-poster img').alt = `Affiche du film ${title}`;
        modal.querySelector('.modal-synopsis .movie-synopsis').textContent = description;
        modal.querySelector('.modal-actors .actors-list').textContent = actors.join(', ');
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
        console.log('Bouton Détails cliqué'); // Vérifie si le clic est détecté
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
        const bestMovieElement = document.querySelector('#best-movie');
        bestMovieElement.querySelector('.movie-poster').src = movie.image_url;
        bestMovieElement.querySelector('.movie-poster').alt = `Affiche du film ${movie.title}`;
        bestMovieElement.querySelector('.movie-details h3').textContent = movie.title;
        bestMovieElement.querySelector('.movie-synopsis').textContent = movie.description;
        bestMovieElement.querySelector('.details-button').addEventListener('click', () => toggleModal(true, movie));
    } catch (error) {
        console.error('Erreur lors du chargement du meilleur film :', error);
    }
}

// Fonction pour charger les 6 films les mieux notés
async function loadTopRatedMovies(genre, containerSelector) {
    const topRatedUrls = [`${baseUrl}?sort_by=-imdb_score`, `${baseUrl}?page=2&sort_by=-imdb_score`];
    if (genre) {
        const container = document.querySelector(containerSelector);
        container.querySelector('h2').textContent = genre;
        urls = topRatedUrls.map(url => `${url}&genre=${genre}`);
    }
    else {
        urls = topRatedUrls;
    }
    // Récupérer les films à partir des URLs
    try {
        const results = (await Promise.all(urls.map(fetchData)))
            .flatMap(data => data.results)
            .slice(0, 6);
        const movieGrid = document.querySelector(`${containerSelector} .movie-grid`);
        movieGrid.innerHTML = results.map(movie => `
            <div class="movie-item">
                <img src="${movie.image_url}" alt="Affiche du film ${movie.title}">
                <div class="overlay">
                    <p class="movie-title">${movie.title}</p>
                    <button class="button details-button" data-movie-id="${movie.id}">Détails</button>
                </div>
            </div>
        `).join('');
        document.querySelectorAll('.details-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const movieId = event.target.getAttribute('data-movie-id');
                console.log(`Bouton Détails cliqué pour le film ID : ${movieId}`);
                const movie = fetchData(`${baseUrl}${movieId}`);
                toggleModal(true, movie);
            });
        });
    } catch (error) {
        console.error('Erreur lors du chargement des films les mieux notés :', error);
    }
}

// Gestionnaire d'événements pour le menu déroulant des catégories
document.getElementById('other-categories').addEventListener('change', (event) => {
    const selectedCategory = event.target.value;
    if (selectedCategory) {
        loadTopRatedMovies(selectedCategory, '#categorie-3');
    }
});

// Fonction pour remplir la liste déroulante des catégories
function populateOtherCategories() {
    const categorySelect = document.getElementById('other-categories');
    categorySelect.innerHTML = categories.map(category => `
        <option value="${category.name}">${category.name}</option>
    `).join('');
}

// Fonction pour charger les catégories
async function loadCategories(url) {
    try {
        while (url) {
            const data = await fetchData(url);
            categories = [...categories, ...data.results];
            url = data.next;
        }
        populateOtherCategories();
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
    await loadTopRatedMovies('Comedy', '#categorie-2');
    await loadCategories(genresUrl);
});