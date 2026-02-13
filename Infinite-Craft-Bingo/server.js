const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 9090;

// Shared state
let gameState = {
    board: [],
    crossed: Array.from({ length: 25 }, () => []) // Array of arrays to store user colors
};

const infiniteCraftWords = [
    "Obsidian", "Phoenix", "Tsunami", "Earthquake", "Dragon",
    "Unicorn", "Electricity", "Internet", "Zombie", "Vampire",
    "Werewolf", "Atlantis", "Dinosaur", "Mummy", "Pirate",
    "Ninja", "Samurai", "Wizard", "Spaceship", "Galaxy",
    "Cyberpunk", "Steampunk", "Bonsai", "Alcohol", "Wine",
    "Beer", "Glass", "Sand", "Metal", "Steel",
    "Sword", "Gun", "Bomb", "Nuclear", "God",
    "Angel", "Devil", "Titan", "Kraken", "Cyborg",
    "Android", "Nanobot", "Black Hole", "Supernova", "Excalibur",
    "Pandora's Box", "Philosopher's Stone", "Alchemy", "Time Machine", "Mars",
    "Supervolcano", "Cthulhu", "Exoskeleton", "Dark Matter", "Multiverse",
    "Quantum Computer", "Teleportation", "Invisibility", "Lightsaber", "Death Star",
    "Exoplanet", "Terraforming", "Singularity", "Artificial Intelligence", "Big Bang",
    "Parallel Universe", "Time Loop", "Wormhole", "Antimatter", "Quasar",
    "Norse Mythology", "Greek Mythology", "Egyptian Mythology", "Ragnarok", "Valhalla",
    "Olympus", "Sphinx", "Hydra", "Chimera", "Griffin",
    "Basilisk", "Leviathan", "Behemoth", "Yggdrasil", "Mjolnir",
    "Poseidon", "Zeus", "Hades", "Anubis", "Ra",
    "Osiris", "Thor", "Loki", "Odin", "Freya",
    "Holy Grail", "Merlin", "King Arthur", "Round Table", "Camelot",
    "El Dorado", "Shangri-La", "Bermuda Triangle", "Area 51", "Roswell",
    "Bigfoot", "Loch Ness Monster", "Chupacabra", "Mothman", "Jersey Devil",
    "Yeti", "Wendigo", "Skinwalker", "Krakatoa", "Pompeii",
    "Titanic", "Hindenburg", "Chernobyl", "Fukushima", "Hiroshima",
    "Nagasaki", "Cold War", "Iron Curtain", "Space Race", "Moon Landing",
    "Mars Rover", "Voyager", "Hubble", "James Webb", "ISS",
    "SpaceX", "Cybernetic", "Genetic Engineering", "Cloning", "Dystopia",
    "Utopia", "Post-Apocalypse", "Mad Max", "Matrix", "Tron",
    "Blade Runner", "Star Wars", "Star Trek", "Doctor Who", "Interstellar",
    "Gravity", "Inception", "Tenet", "Dune", "Foundation",
    "Cyberdragon", "Mecha", "Raijin", "Fujin", "Kitsune",
    "Tanuki", "Oni", "Baba Yaga", "Bifrost",
    "Fenrir", "Jormungandr", "Sleipnir", "Valkyrie", "Necronomicon",
    "Cthulhu Mythos", "Nyarlathotep", "Hastur", "Azathoth", "R'lyeh",
    "Steampunk Airship", "Clockwork", "Aether", "Alchemical Gold", "Homunculus",
    "Transmutation", "Quicksilver", "Prometheus", "Pandora",
    "Icarus", "Daedalus", "Medusa", "Minotaur", "Cyclops",
    "Centaur", "Pegasus", "Cerberus", "Styx", "Tartarus",
    "Asgard", "Midgard", "Niflheim", "Muspelheim", "Jotunheim",
    "Event Horizon", "Spaghettification", "Neutron Star", "Pulsar", "Nebula",
    "Andromeda", "Milky Way", "Lightyear", "Parsec", "Red Giant",
    "White Dwarf", "Supermassive Black Hole", "Hawking Radiation", "String Theory", "Quantum Entanglement",
    "Schrodinger's Cat", "Heisenberg Uncertainty", "Relative Time", "Grandfather Paradox", "Bootstrap Paradox",
    "Dyson Sphere", "Kardashev Scale", "Great Filter", "Fermi Paradox", "Von Neumann Probe",
    "Nanotechnology", "Grey Goo", "Transhumanism", "Mind Uploading", "Virtual Reality",
    "Augmented Reality", "Metaverse", "Blockchain", "Cryptocurrency", "NFT",
    "Deepfake", "Algorithm", "Simulation Theory", "Glitched Reality", "Backrooms",
    "SCP Foundation", "Creepypasta", "Slender Man", "The Rake", "Smile Dog",
    "Herobrine", "Among Us", "Sus", "Amogus", "Skibidi Toilet",
    "Entropy", "Heat Death", "Big Crunch", "Big Rip", "Dark Energy",
    "Large Hadron Collider", "Higgs Boson", "Particle Accelerator", "Antimatter Rocket", "Fusion Reactor",
    "Cybernetic Brain", "Technological Singularity", "Cyborg Uprising", "Robot Revolution",
    "Deep Blue", "AlphaGo", "ChatGPT", "Stable Diffusion", "Midjourney",
    "Harbingers of Doom", "Four Horsemen", "Apocalypse", "Armageddon", "Doomsday Clock",
    "Cthulhu Awakening", "The Old Ones", "Elder God", "Void", "Abyss",
    "Dark Souls", "Elden Ring", "Skyrim", "Minecraft", "Roblox",
    "Fortnite", "League of Legends", "Dota 2", "Counter-Strike", "Half-Life",
    "Portal", "GLaDOS", "Wheatley", "Aperture Science", "Black Mesa",
    "Rickroll", "Trollface", "Nyan Cat", "Harambe", "Ugandan Knuckles",
    "Big Chungus", "Shrek", "Donkey", "Bee Movie", "Steamed Hams",
    "JoJo's Bizarre Adventure", "Dio Brando", "Jotaro Kujo", "Death Note", "Ryuk",
    "Light Yagami", "One Piece", "Luffy", "Zoro", "Gum-Gum Fruit",
    "Naruto", "Sasuke", "Rasengan", "Chidori", "Dragon Ball Z",
    "Goku", "Vegeta", "Super Saiyan", "Kamehameha", "Pokémon",
    "Pikachu", "Charizard", "Mewtwo", "Marvel", "Iron Man",
    "Captain America", "Thor's Hammer", "Thanos", "Infinity Gauntlet", "Infinity Stones",
    "DC Comics", "Batman", "The Joker", "Superman", "Wonder Woman",
    "Harry Potter", "Hogwarts", "Voldemort", "Dumbledore", "Lord of the Rings",
    "Sauron", "Gandalf", "Frodo Baggins", "One Ring", "Game of Thrones",
    "Iron Throne", "Winter is Coming", "The Witcher", "Geralt of Rivia",
    "Cyberpunk 2077", "Night City", "Johnny Silverhand", "Breaking Bad", "Walter White",
    "Heisenberg", "Jesse Pinkman", "Better Call Saul", "Saul Goodman", "The Boys",
    "Homelander", "Billy Butcher", "Stranger Things", "Demogorgon", "Eleven",
    "Upside Down", "Squid Game", "Red Light Green Light", "The Last of Us", "Joel",
    "Ellie", "Fallout", "Vault Boy", "Pip-Boy", "Nuka-Cola",
    "Grand Theft Auto", "Red Dead Redemption", "Arthur Morgan", "The Legend of Zelda", "Link",
    "Zelda", "Master Sword", "Triforce", "Julius Caesar", "Alexander the Great", "Napoleon Bonaparte",
    "Cleopatra", "Leonardo da Vinci", "Albert Einstein", "Nikola Tesla", "Marie Curie",
    "Stephen Hawking", "Charles Darwin", "Isaac Newton", "Socrates", "Plato",
    "Aristotle", "Sun Tzu", "The Art of War", "Magna Carta", "Great Wall of China",
    "Eiffel Tower", "Statue of Liberty", "Pyramids of Giza", "Colosseum", "Taj Mahal",
    "Machu Picchu", "Mount Everest", "Amazon Rainforest", "Sahara Desert", "Grand Canyon",
    "Great Barrier Reef", "Mariana Trench", "Easter Island", "Stonehenge", "Aurora Borealis",
    "Solar Eclipse", "Lunar Eclipse", "Meteor Shower", "Halley's Comet", "Cosmic Microwave Background",
    "Event Horizon", "Accretion Disk", "Gravitational Wave", "Spacetime Fabric", "Butterfly Effect",
    "Multiverse Theory", "Simulation Hypothesis", "Great Filter", "Matrioshka Brain", "Mind Uploading",
    "Neural Link", "Kaiju", "Godzilla", "King Kong", "Pacific Rim",
    "Evangelion", "Gundam", "Transformers", "Optimus Prime", "Megatron"
];

const userColors = [
    '#e67e22', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f',
    '#e74c3c', '#1abc9c', '#d35400', '#27ae60', '#2980b9'
];
let availableColors = [...userColors];

function generateBoard() {
    const shuffled = [...infiniteCraftWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 25);
}

// Initial generation
gameState.board = generateBoard();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'wordGenerator.html'));
});

io.on('connection', (socket) => {
    // Assign a unique color if available, otherwise a random one
    let userColor;
    if (availableColors.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        userColor = availableColors.splice(randomIndex, 1)[0];
    } else {
        userColor = userColors[Math.floor(Math.random() * userColors.length)];
    }
    
    socket.userColor = userColor;
    
    console.log(`A user connected: ${socket.id} with color ${userColor}`);
    
    // Send current state, assigned color, and their own ID to new user
    socket.emit('init', { ...gameState, myColor: userColor, myId: socket.id });

    socket.on('toggle', (index) => {
        if (index >= 0 && index < 25) {
            const existingIndex = gameState.crossed[index].findIndex(item => item.id === socket.id);
            if (existingIndex === -1) {
                gameState.crossed[index].push({ id: socket.id, color: socket.userColor });
            } else {
                // If already marked by this user, remove it
                gameState.crossed[index].splice(existingIndex, 1);
            }
            io.emit('update', { index, ticks: gameState.crossed[index] });
        }
    });

    socket.on('reset', () => {
        gameState.board = generateBoard();
        gameState.crossed = Array.from({ length: 25 }, () => []);
        io.emit('init', { ...gameState }); 
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Return color to pool if it's a standard color
        if (userColors.includes(socket.userColor)) {
            availableColors.push(socket.userColor);
        }

        // Clean up this user's ticks
        gameState.crossed.forEach((ticks, index) => {
            const idx = ticks.findIndex(t => t.id === socket.id);
            if (idx > -1) {
                ticks.splice(idx, 1);
                io.emit('update', { index, ticks: ticks });
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
