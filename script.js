let categories = []; // Variable globale pour stocker les catégories
 
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
        const movie = await fetchData(`http://localhost:8000/api/v1/titles/${results[0].id}`);
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
async function loadTopRatedMovies(url1, url2) {
    try {
        // Récupérer les données des deux pages en parallèle
        const [data1, data2] = await Promise.all([fetchData(url1), fetchData(url2)]);
        // Combiner les résultats des deux pages dans un seul tableau
        const combinedResults = [...data1.results, ...data2.results].slice(0, 6); // avec l'opérateur de décomposition
        // Sélectionner le conteneur des films
        const movieGrid = document.querySelector('#top-rated-movies .movie-grid');
        // Effacer les films existants (si nécessaire)
        movieGrid.innerHTML = '';
        // Ajouter les films
        combinedResults.forEach(movie => {
            const movieItem = document.createElement('div');
            movieItem.classList.add('movie-item');
            movieItem.innerHTML = `
                <img src="${movie.image_url}" alt="Affiche du film ${movie.title}">
                <div class="overlay">
                    <p class="movie-title">${movie.title}</p>
                    <button class="button details-button" data-movie-id="${movie.id}">Détails</button>
                </div>
            `;
            movieGrid.appendChild(movieItem);
        });
        // Ajouter des événements aux boutons "Détails"
        const detailButtons = document.querySelectorAll('.details-button');
        detailButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const movieId = event.target.getAttribute('data-movie-id');
                console.log(`Bouton Détails cliqué pour le film ID : ${movieId}`);
                // Appeler une fonction pour afficher les détails du film
                loadMovieDetails(movieId);
            });
        });
    } catch (error) {
        console.error('Erreur lors du chargement des films les mieux notés :', error);
    }
}

// Fonction pour remplir la liste déroulante des catégories
function populateOtherCategories() {
    const categorySelect = document.getElementById('other-categories');
    // Effacer les options existantes
    categorySelect.innerHTML = '';
    // Ajouter les catégories à la liste déroulante
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name.toLowerCase(); // Utiliser le nom comme valeur
        option.textContent = category.name; // Afficher le nom dans la liste
        categorySelect.appendChild(option);
    });
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
    const bestMovieUrl = 'http://localhost:8000/api/v1/titles/?page=1&sort_by=-imdb_score';
    const topRatedMoviesUrl1 = 'http://localhost:8000/api/v1/titles/?sort_by=-imdb_score';
    const topRatedMoviesUrl2 = 'http://localhost:8000/api/v1/titles/?page=2&sort_by=-imdb_score';
    const genresUrl = 'http://localhost:8000/api/v1/genres/';
    await loadBestMovie(bestMovieUrl); // Charger le meilleur film
    await loadTopRatedMovies(topRatedMoviesUrl1, topRatedMoviesUrl2); // Charger les films les mieux notés
    await loadCategories(genresUrl); // Charger les catégories
});