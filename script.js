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
        updateMindMapList(); 
        document.getElementById("mindmap-list-page").style.display = "block";
        document.getElementById("mindmap-editor-page").style.display = "none";
    } else {
        console.log("No user is signed in.");
        redirectToLogin();
    }
});

function updateMindMapList() {
    const user = auth.currentUser;
    if (user) {
        const mindMapsRef = collection(db, "users", user.uid, "mindmaps");
        getDocs(mindMapsRef).then(querySnapshot => {
            const mindMapListElement = document.getElementById("mindmap-list");
            mindMapListElement.innerHTML = ""; // Liste leeren, um sie zu aktualisieren

            querySnapshot.forEach(doc => {
                const mindMapData = doc.data();
                const mindMapItem = document.createElement("div");
                mindMapItem.textContent = mindMapData.name; // Angenommen, jeder MindMap-Datensatz hat ein 'name'-Feld
                mindMapItem.classList.add("mindmap-list-item");

                // Klicken auf ein MindMap-Listenelement lädt die entsprechende MindMap
                mindMapItem.onclick = () => {
                    loadMindMap(doc.id);
                    // Wechsel zur MindMap-Editor-Seite
                    document.getElementById("mindmap-list-page").style.display = "none";
                    document.getElementById("mindmap-editor-page").style.display = "block";
                };

                mindMapListElement.appendChild(mindMapItem);
            });
        }).catch(error => {
            console.error("Error loading mindmaps: ", error);
        });
    }
}

document.getElementById("create-new-mindmap").addEventListener("click", () => {
    const mindMapName = prompt("Enter the name of the new MindMap:");
    if (mindMapName) {
        createNewMindMap(mindMapName);
    }
});

function createNewMindMap(mindMapName) {
    const user = auth.currentUser;
    if (user) {
        // Erzeuge die Struktur mit dem gegebenen Namen.
        const mindMapStructure = defaultMindMapStructure(mindMapName);

        // Erzeuge das zu speichernde Objekt.
        const mindMapData = {
            name: mindMapName, // Der Name der MindMap.
            ...mindMapStructure // Die Struktur der MindMap, ausgebreitet auf der obersten Ebene des Objekts.
        };

        // Logge das zu speichernde Objekt, um sicherzustellen, dass es korrekt ist.
        console.log("MindMap Data to be saved:", mindMapData);

        // Referenz auf die MindMaps in Firestore.
        const mindMapsRef = collection(db, "users", user.uid, "mindmaps");

        // Füge das neue Dokument zu Firestore hinzu.
        addDoc(mindMapsRef, mindMapData).then(docRef => {
            console.log("New MindMap created with ID: ", docRef.id);
            // Aktualisiere die Liste der MindMaps.
            updateMindMapList();
            // Lade die neue MindMap.
            loadMindMap(docRef.id);
        }).catch(error => {
            console.error("Error creating new mindmap: ", error);
        });
    }
}

function loadMindMap(mindMapId) {
    const user = auth.currentUser;
    if (user) {
        initializeMindWired(); // MindWired initialisieren, bevor die MindMap geladen wird
        const mindMapDocRef = doc(db, "users", user.uid, "mindmaps", mindMapId);
        getDoc(mindMapDocRef).then(doc => {
            if (doc.exists()) {
                const mindMapData = doc.data();
                mwd.nodes(mindMapData);
                currentMindMapId = doc.id;
                isMindMapLoaded = true;
                // Ansicht wechseln, um die MindMap anzuzeigen
            } else {
                console.log("MindMap not found");
            }
        }).catch(error => {
            console.error("Error loading mindmap: ", error);
        });
    }
}

document.getElementById("back-to-list").addEventListener("click", () => {
    // Wechseln Sie zur MindMap-Listenseite
    document.getElementById("mindmap-list-page").style.display = "block";
    document.getElementById("mindmap-editor-page").style.display = "none";
    updateMindMapList(); // Liste aktualisieren
});

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

function defaultMindMapStructure(mindMapName) {
    return {
        model: {
            type: "text",
            text: mindMapName,
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
}

// Modifizierte initializeDefaultMindMap, die die Standard-Daten zurückgibt
function initializeDefaultMindMap(mindMapName = "Unbenannte MindMap") {
    console.log("initializeDefaultMindMap - Called", { mindMapName });

    const defaultMindMapData = defaultMindMapStructure(mindMapName);
    console.log("initializeDefaultMindMap - Default data obtained", { defaultMindMapData });

    mwd.nodes(defaultMindMapData); // Verwende die Standard-Daten, um die MindMap zu initialisieren
    console.log("initializeDefaultMindMap - MindWired nodes initialized");
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