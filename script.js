import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDoc, getDocs, addDoc, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBe7d9bllq8RnmI6xxEBk3oub3qogPT2aM",
    authDomain: "thinkwise-c7673.firebaseapp.com",
    databaseURL: "https://thinkwise-c7673-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "thinkwise-c7673",
    storageBucket: "thinkwise-c7673.appspot.com",
    messagingSenderId: "37732571551",
    appId: "1:37732571551:web:9b90a849ac5454f33a85aa",
    measurementId: "G-8957WM4SB7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentMindMapId = null;
let mwd;
let isMindMapLoaded = false;

function redirectToLogin() {
    window.location.href = 'https://benjiwurfl.github.io/Login/';
}

// Authentifizierungsstatus beibehalten
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in with UID:", user.uid);
        initializeMindWired(); // Nach Initialisierung, zeige MindMap-Liste
        showMindMapList(); // Zeige die Liste der MindMaps an
    } else {
        console.log("No user is signed in.");
        redirectToLogin();
    }
});

function showMindMapList() {
    document.getElementById('mindmap-editor-page').style.display = 'none';
    document.getElementById('mindmap-list-page').style.display = 'block';
    const mindMapListElement = document.getElementById('mindmap-list');
    mindMapListElement.innerHTML = ''; // Vorhandene Einträge löschen

    const user = auth.currentUser;
    if (user) {
        const mindMapsRef = collection(db, "users", user.uid, "mindmaps");
        getDocs(mindMapsRef).then(querySnapshot => {
            querySnapshot.forEach(doc => {
                const mindMapData = doc.data();
                const listItem = document.createElement('div');
                listItem.textContent = mindMapData.name; // Angenommen, dass 'name' ein Feld im MindMap-Dokument ist
                listItem.classList.add('mindmap-list-item');
                listItem.addEventListener('click', () => loadMindMap(doc.id));
                mindMapListElement.appendChild(listItem);
            });
        }).catch(error => {
            console.error("Fehler beim Laden der MindMaps:", error);
        });
    }
}

function loadMindMap(mindMapId) {
    const user = auth.currentUser;
    const mindMapDocRef = doc(db, "users", user.uid, "mindmaps", mindMapId);
    getDoc(mindMapDocRef).then(doc => {
        if (doc.exists()) {
            showMindMapEditor(doc.data()); // Funktion, um die Editor-Seite mit Daten zu zeigen
            currentMindMapId = mindMapId; // Speichern der ID für spätere Operationen
        } else {
            console.log("MindMap existiert nicht");
        }
    }).catch(error => {
        console.error("Fehler beim Laden der MindMap:", error);
    });
}

function showMindMapEditor(mindMapData) {
    document.getElementById('mindmap-list-page').style.display = 'none';
    document.getElementById('mindmap-editor-page').style.display = 'block';

    // Prüfe, ob MindWired-Instanz vorhanden und Daten gültig sind
    if (mwd && mindMapData) {
        // Wenn mindMapData eine zusätzliche Ebene hat (z.B. einen 'data' Schlüssel)
        // mwd.nodes(mindMapData.data); // Angenommen, die eigentlichen MindMap-Daten sind unter 'data'
        
        // Wenn mindMapData direkt die benötigten Daten enthält
        mwd.nodes(mindMapData); // Direkte Nutzung, wenn mindMapData bereits die korrekte Struktur hat
    } else {
        console.error("MindWired-Instanz nicht initialisiert oder keine MindMap-Daten vorhanden.");
    }
}

function initializeMindWired() {
    window.mindwired.init({
        el: "#mmap-root",
        ui: {width: '100%', height: 500},
    }).then((instance) => {
        mwd = instance;
        console.log("MindWired initialisiert");
        loadMindMapFromFirestore(); // Versuche, die MindMap zu laden
    });
}

function loadMindMapFromFirestore() {
    const user = auth.currentUser;
    if (user) {
        const mindMapsRef = collection(db, "users", user.uid, "mindmaps");
        getDocs(mindMapsRef).then(querySnapshot => {
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const mindMapData = doc.data();
                currentMindMapId = doc.id;
                mwd.nodes(mindMapData);
                isMindMapLoaded = true;
                console.log("MindMap erfolgreich geladen und gesetzt");
            } else {
                console.log("Keine gespeicherte MindMap gefunden, initialisiere Standard-MindMap");
                isMindMapLoaded = false; // Da keine MindMap geladen wurde
                initializeDefaultMindMap();
            }
        }).catch(error => {
            console.error("Error loading mindmaps: ", error);
            isMindMapLoaded = false; // Im Fehlerfall auch keine MindMap geladen
            initializeDefaultMindMap();
        });
    } else {
        console.log("Benutzer nicht angemeldet, kann MindMap nicht laden");
        isMindMapLoaded = false; // Benutzer ist nicht angemeldet, also keine MindMap geladen
        initializeDefaultMindMap();
    }
}

function initializeDefaultMindMap() {
    // Definiere die Struktur der Default-MindMap
    const defaultMindMapStructure = {
        model: {
            type: "text",
            text: "Thinkwise",
        },
        view: {
            x: 0,
            y: 0,
            layout: { type: 'X-AXIS' },
            edge: {
                name: 'mustache_lr',
                color: '#9aabaf',
                width: 1
            }
        },
        subs: [
            {
                model: {
                    text: "Here is the right Place for some Notes!",
                    schema: 'memo'
                },
                view: {
                    x: 0, y: -150, edge: {
                        name: 'line',
                        color: '#9a9c12',
                        width: 1
                    }
                },

            },
            {
                model: { text: "Subtopic D" },
                view: { x: 160, y: 80 }
            },
            {
                model: { text: "Subtopic A" },
                view: { x: -140, y: -80 },
                subs: [
                    {
                        model: { text: "text1" },
                        view: { x: -100, y: -40 }
                    },
                    {
                        model: { text: "text2" },
                        view: { x: -100, y: 0 }
                    },
                    {
                        model: { text: "text3" },
                        view: { x: -100, y: 40 }
                    },
                ],
            },
            {
                model: { text: "Subtopic B" },
                view: { x: -140, y: 80 },
                subs: [
                    {
                        model: { text: "text1" },
                        view: { x: -100, y: -40 }
                    },
                    {
                        model: { text: "text2" },
                        view: { x: -100, y: 0 }
                    },
                    {
                        model: { text: "text3" },
                        view: { x: -100, y: 40 }
                    },
                ],
            },
            {
                model: { text: "Subtopic C" },
                view: { x: 140, y: -80 },
                subs: [
                    {
                        model: { text: "text1" },
                        view: { x: 100, y: -40 }
                    },
                    {
                        model: { text: "text2" },
                        view: { x: 100, y: 0 }
                    },
                    {
                        model: { text: "text3" },
                        view: { x: 100, y: 40 }
                    },
                ],
            },
        ],
    };
    return defaultMindMapStructure;
}

/* START: out of box code */
const el = document.querySelector('.ctrl');
el.addEventListener('click', (e) => {
    const { cmd } = e.target.dataset
    if (cmd === 'export') {
        mwd.export().then(json => {
            const dimmer = document.querySelector('.dimmer');
            dimmer.style.display = ''
            dimmer.querySelector('textarea').value = json;
        })
    }
})
const btnClose = document.querySelector('[data-cmd="close"]');
btnClose.addEventListener('click', () => {
    document.querySelector('.dimmer').style.display = 'none'
})
/* END: out of box code */


function saveMindMapToFirestore(mindMapData) {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to save mind maps.");
        return;
    }

    // Überprüfen, ob eine MindMap-ID existiert, um zu entscheiden, ob eine neue erstellt oder eine vorhandene aktualisiert werden soll
    const mindMapsRef = collection(db, "users", user.uid, "mindmaps");
    if (currentMindMapId) {
        const mindMapDocRef = doc(mindMapsRef, currentMindMapId);
        updateDoc(mindMapDocRef, mindMapData).then(() => {
            console.log("MindMap updated with ID: ", currentMindMapId);
        }).catch(error => {
            console.error("Error updating mindmap: ", error);
        });
    } else {
        addDoc(mindMapsRef, mindMapData).then(docRef => {
            console.log("MindMap added with ID: ", docRef.id);
            currentMindMapId = docRef.id; // Speichern der neuen ID
        }).catch(error => {
            console.error("Error adding mindmap: ", error);
        });
    }
}

function deleteMindMapFromFirestore() {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to delete mind maps.");
        return;
    }

    if (currentMindMapId) {
        const mindMapDocRef = doc(db, "users", user.uid, "mindmaps", currentMindMapId);
        deleteDoc(mindMapDocRef)
            .then(() => {
                console.log("MindMap successfully deleted!");
                currentMindMapId = null; // Zurücksetzen der MindMap-ID
                // Hier sollten Sie auch die Darstellung der MindMap im Frontend zurücksetzen
            })
            .catch(error => {
                console.error("Error removing mindmap: ", error);
            });
    }
}

document.getElementById('create-new-mindmap').addEventListener('click', async () => {
    const mindMapName = prompt("Bitte geben Sie den Namen der neuen MindMap ein:");
    if (mindMapName) {
        const user = auth.currentUser;
        if (user) {
            const mindMapsRef = collection(db, "users", user.uid, "mindmaps");
            // Initialisiere die Default-Struktur für die neue MindMap
            const defaultMindMapData = initializeDefaultMindMap(); // Diese Funktion muss die Struktur zurückgeben
            const mindMapData = {
                name: mindMapName,
                ...defaultMindMapData // Füge die Default-Struktur hinzu
            };
            try {
                const docRef = await addDoc(mindMapsRef, mindMapData);
                console.log("Neue MindMap erstellt mit ID:", docRef.id);
                currentMindMapId = docRef.id; // Aktualisiere die aktuelle MindMap-ID
                showMindMapEditor(mindMapData); // Zeige die MindMap im Editor
            } catch (error) {
                console.error("Fehler beim Erstellen der MindMap:", error);
            }
        }
    }
});

document.getElementById('back-to-list').addEventListener('click', showMindMapList);

// Event-Listener zum Speichern der MindMap
const saveBtn = document.querySelector('[data-cmd="save"]');
saveBtn.addEventListener('click', () => {
    mwd.export().then(json => {
        saveMindMapToFirestore(JSON.parse(json));
    });
});

// Event-Listener zum Löschen der MindMap
const deleteBtn = document.querySelector('[data-cmd="delete"]');
deleteBtn.addEventListener('click', deleteMindMapFromFirestore);