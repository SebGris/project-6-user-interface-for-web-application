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

// URL de l'API pour le meilleur film
const bestMovieUrl = 'http://localhost:8000/api/v1/titles/499549';

// Fonction pour charger le meilleur film
async function loadBestMovie() {
    try {
        // Récupérer les données de l'API
        const response = await fetch(bestMovieUrl);
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

// Charger le meilleur film au chargement de la page
document.addEventListener('DOMContentLoaded', loadBestMovie);