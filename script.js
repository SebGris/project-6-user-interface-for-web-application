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

// Fermer la modale en cliquant en dehors du contenu
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Fonction pour charger le meilleur film
async function loadBestMovie(url) {
    try {
        // Récupérer les données de l'API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        const movie = await response.json();

        // Sélectionner les éléments de la section "Meilleur film"
        const bestMoviePoster = document.querySelector('#best-movie .movie-poster');
        const bestMovieTitle = document.querySelector('#best-movie .movie-details h3');
        const bestMovieSynopsis = document.querySelector('#best-movie .movie-synopsis');

        // Mettre à jour le contenu avec les données de l'API
        bestMoviePoster.src = movie.image_url;
        bestMoviePoster.alt = `Affiche du film ${movie.title}`;
        bestMovieTitle.textContent = movie.title;
        bestMovieSynopsis.textContent = movie.description;
    } catch (error) {
        console.error('Erreur lors du chargement du meilleur film :', error);
    }
}

// Fonction pour récupérer l'ID du premier film dans les résultats
async function getFirstMovieId(url) {
    try {
        // Récupérer les données de l'API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        const data = await response.json();

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
        // Récupérer les données de l'API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        const data = await response.json();

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
            `;
            movieGrid.appendChild(movieItem);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des films les mieux notés :', error);
    }
}

// Charger le meilleur film au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    const topRatedMoviesUrl = 'http://localhost:8000/api/v1/titles/?sort_by=-imdb_score';
    // Charger les 6 films les mieux notés
    loadTopRatedMovies(topRatedMoviesUrl);
    const firstMovieId = await getFirstMovieId(topRatedMoviesUrl);
    console.log("ID du premier film :", firstMovieId);

    // Charger les détails du film avec cet ID
    if (firstMovieId) {
        const movieDetailsUrl = `http://localhost:8000/api/v1/titles/${firstMovieId}`;
        loadBestMovie(movieDetailsUrl);
    }
});