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
        // Mettre à jour le contenu de la modale
        modal.querySelector('.modal-title h2').textContent = movie.title;
        modal.querySelector('.modal-title p').textContent = `${movie.year} - ${movie.genres.join(', ')}`;
        modal.querySelector('.modal-poster img').src = movie.image_url;
        modal.querySelector('.modal-poster img').alt = `Affiche du film ${movie.title}`;
        modal.querySelector('.modal-synopsis .movie-synopsis').textContent = movie.description;
        modal.querySelector('.modal-actors .actors-list').textContent = movie.actors.join(', ');
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
    const firstMovieId = await getFirstMovieId(url);
    if (firstMovieId) {
        const movieDetailsUrl = `http://localhost:8000/api/v1/titles/${firstMovieId}`;
        try {
            const movie = await fetchData(movieDetailsUrl);
            document.querySelector('#best-movie .movie-poster').src = movie.image_url;
            document.querySelector('#best-movie .movie-poster').alt = `Affiche du film ${movie.title}`;
            document.querySelector('#best-movie .movie-details h3').textContent = movie.title;
            document.querySelector('#best-movie .movie-synopsis').textContent = movie.description;

            // Ajouter un événement au bouton "Détails"
            document.querySelector('#best-movie .details-button').addEventListener('click', () => toggleModal(true, movie));
        } catch (error) {
            console.error('Erreur lors du chargement du meilleur film :', error);
        }
    }
}

// Fonction pour récupérer l'ID du premier film dans les résultats
async function getFirstMovieId(url) {
    try {
        const data = await fetchData(url);
        // Vérifier si des résultats existent
        if (data.results && data.results.length > 0) {
            return data.results[0].id; // Retourner l'ID du premier film
        } else {
            throw new Error("Aucun film trouvé dans les résultats.");
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du premier film :', error);
    }
}

// Fonction pour charger les 6 films les mieux notés
async function loadTopRatedMovies(url) {
    try {
        const data = await fetchData(url);
        // Sélectionner le conteneur des films
        const movieGrid = document.querySelector('#top-rated-movies .movie-grid');
        // Effacer les films existants (si nécessaire)
        movieGrid.innerHTML = '';
        // Ajouter les 6 premiers films
        data.results.slice(0, 6).forEach(movie => {
            const movieItem = document.createElement('div');
            movieItem.classList.add('movie-item');
            movieItem.innerHTML = `
                <img src="${movie.image_url}" alt="Affiche du film ${movie.title}">
                <div class="overlay">
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
            categories = categories.concat(data.results);
            url = data.next; // Passer à la page suivante
        }
        // Appeler la fonction pour remplir la liste déroulante
        populateOtherCategories();
    } catch (error) {
        console.error('Erreur lors du chargement des catégories :', error);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    const genresUrl = 'http://localhost:8000/api/v1/genres/';
    const bestMovieUrl = 'http://localhost:8000/api/v1/titles/?page=1&sort_by=-imdb_score';
    const topRatedMoviesUrl = 'http://localhost:8000/api/v1/titles/?sort_by=-imdb_score';
    await loadCategories(genresUrl); // Charger les catégories
    await loadBestMovie(bestMovieUrl); // Charger le meilleur film
    await loadTopRatedMovies(topRatedMoviesUrl); // Charger les films les mieux notés
});