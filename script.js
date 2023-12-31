import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
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
let myDiagram;
let currentMindMapId = null;
let mwd;
let isMindMapLoaded = false;
let mindMaps = [];

function redirectToLogin() {
    window.location.href = 'https://benjiwurfl.github.io/Login/';
}

// Authentifizierungsstatus beibehalten
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in with UID:", user.uid);
        showMindMapListPage(); // Zeige die MindMap-Listenseite
    } else {
        console.log("No user is signed in.");
        redirectToLogin();
    }
});

function showMindMapListPage() {
    document.getElementById("mindmap-list-page").style.display = "block";
    document.getElementById("mindmap-editor-page").style.display = "none";
    loadMindMapList();
}

function showMindMapEditorPage() {
    document.getElementById("mindmap-list-page").style.display = "none";
    document.getElementById("mindmap-editor-page").style.display = "block";
    initializeMindWired();
}

function loadMindMapList() {
    const user = auth.currentUser;
    if (user) {
        const mindMapsRef = collection(db, "users", user.uid, "mindmaps");
        getDocs(mindMapsRef).then(querySnapshot => {
            mindMaps = querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
            updateMindMapListUI(); // Aktualisiere die UI mit der Liste der MindMaps
        });
    }
}

function updateMindMapListUI() {
    const listContainer = document.getElementById("mindmap-list");
    listContainer.innerHTML = '';

    mindMaps.forEach(mindMap => {
        const listItem = document.createElement("div");
        listItem.textContent = mindMap.data.name || "Unbenannte MindMap"; // Verwenden des MindMap-Namens
        listItem.addEventListener("click", () => navigateToMindMap(mindMap.id));
        listContainer.appendChild(listItem);
    });
}

function createNewMindMap() {
    const mindMapName = prompt("Bitte geben Sie einen Namen für die neue MindMap ein:");
    if (mindMapName) {
        currentMindMapId = null;
        showMindMapEditorPage();
        initializeDefaultMindMap(mindMapName); // Übergeben Sie den Namen hier
        saveMindMapToFirestore({ name: mindMapName, nodes: [] }); // Speichert die neue MindMap
    }
}

function navigateToMindMap(mindMapId) {
    const selectedMindMap = mindMaps.find(map => map.id === mindMapId);
    if (selectedMindMap) {
        currentMindMapId = selectedMindMap.id;
        showMindMapEditorPage();
        mwd.nodes(selectedMindMap.data);
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
    if (user && currentMindMapId) {
        const mindMapDocRef = doc(db, "users", user.uid, "mindmaps", currentMindMapId);
        getDoc(mindMapDocRef).then(docSnapshot => {
            if (docSnapshot.exists()) {
                const mindMapData = docSnapshot.data();
                mwd.nodes(mindMapData);
                isMindMapLoaded = true;
                console.log("MindMap erfolgreich geladen und gesetzt");
            } else {
                console.log("MindMap nicht gefunden, initialisiere Standard-MindMap");
                isMindMapLoaded = false;
                initializeDefaultMindMap();
            }
        }).catch(error => {
            console.error("Error loading mindmap: ", error);
            isMindMapLoaded = false;
        });
    } else {
        console.log("Benutzer nicht angemeldet oder keine MindMap-ID, initialisiere Standard-MindMap");
        isMindMapLoaded = false;
        initializeDefaultMindMap();
    }
}

function initializeDefaultMindMap(mindMapName = "Unbenannte MindMap") {
    // Installieren der Standardknoten hier
    mwd.nodes({
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
    });
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

// Event-Listener für die Interaktion
document.getElementById("create-new-mindmap").addEventListener("click", createNewMindMap);
document.getElementById("back-to-list").addEventListener("click", showMindMapListPage);

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