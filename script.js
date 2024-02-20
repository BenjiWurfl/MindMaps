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
let mindMaps = [];

// Authentifizierungsstatus beibehalten
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in with UID:", user.uid);
        showMindMapListPage();
    } else {
        console.log("No user is signed in.");
        redirectToLogin();
    }
});

function redirectToLogin() {
    window.location.href = 'https://benjiwurfl.github.io/Login/';
}


// Zeigt die MindMap-Liste an und versteckt die Editor-Seite
function showMindMapListPage() {
    document.getElementById("mindmap-list-page").style.display = "block";
    document.getElementById("mindmap-editor-page").style.display = "none";
    loadMindMapList();
}

//Lädt die Liste der MindMaps des angemeldeten Benutzers aus Firestore
function loadMindMapList() {
    const user = auth.currentUser; 
    if (user) { 
        const mindMapsRef = collection(db, "users", user.uid, "mindmaps"); // Definiert den Pfad zur Sammlung der MindMaps des Benutzers in Firestore
        getDocs(mindMapsRef).then(querySnapshot => { // Ruft alle Dokumente aus der MindMap-Sammlung ab
            mindMaps = querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })); // Wandelt die Dokumentensnapshot in ein Array von Objekten um, jedes Objekt enthält die ID und die Daten des Dokuments
            updateMindMapListUI(); 
        });
    }
}

//Aktualisiert die Benutzeroberfläche der MindMap-Liste
function updateMindMapListUI() {
    const listContainer = document.getElementById("mindmap-list"); // Greift auf den Container zu, der die MindMap-Liste anzeigt
    listContainer.innerHTML = '';
    mindMaps.forEach(mindMap => { 
        const listItem = document.createElement("div"); 
        listItem.textContent = mindMap.data.name || "Unbenannte MindMap"; // Setzt den Text des Elements auf den Namen der MindMap, oder einen Platzhalter, wenn kein Name vorhanden ist
        listItem.addEventListener("click", () => navigateToMindMap(mindMap.id)); 
        listContainer.appendChild(listItem); // Fügt das neu erstellte Element zum Container hinzu
    });
}

//Event-Listener für den Klick auf die Schaltfläche zum Erstellen einer neuen MindMap
document.getElementById('create-new-mindmap').addEventListener('click', async () => {
    console.log("--Aufruf der intializeMindWired Funktion--");
    initializeMindWired();
    let mindMapName = prompt("Bitte geben Sie den Namen der neuen MindMap ein:");
    while (mindMapName === "") { // Prüft, ob der Eingabestring leer ist
        alert("Bitte geben Sie einen Namen für die MindMap ein."); 
        mindMapName = prompt("Bitte geben Sie den Namen der neuen MindMap ein:"); 
    }
    if (mindMapName === null) { // Prüft, ob der Benutzer auf "Abbrechen" geklickt hat
        return; 
    }
    if (mindMapName && auth.currentUser) {
        const defaultMindMapData = initializeDefaultMindMap();
        const mindMapData = {
            name: mindMapName,
            data: defaultMindMapData
        };

        try {
            const docRef = await addDoc(collection(db, "users", auth.currentUser.uid, "mindmaps"), mindMapData);    // Fügt eine neue MindMap zur Firestore-Datenbank des aktuellen Benutzers hinzu
            console.log("Neue MindMap erstellt mit ID:", docRef.id);
            currentMindMapId = docRef.id;
            let isNewMindMap = true;
            showMindMapEditorPage(mindMapName, defaultMindMapData, isNewMindMap);
        } catch (error) {
            console.error("Fehler beim Erstellen der MindMap:", error);
        }   
    }
});

//Navigiert bei klicken zur entsprechenden MindMap
function navigateToMindMap(mindMapId) {
    console.log("--Aufruf der intializeMindWired Funktion--"); 
    initializeMindWired(); 
    const selectedMindMap = mindMaps.find(map => map.id === mindMapId); // Sucht die angeklickte MindMap anhand ihrer ID im Array der MindMaps
    if (selectedMindMap) { 
        currentMindMapId = selectedMindMap.id; // Aktualisiert die aktuelle MindMap-ID mit der ID der ausgewählten MindMap

        if (currentMindMapId) {
            loadMindMapFromFirestore(currentMindMapId); 
        }
    }
}

//Zeigt den Namen der MindMap dynamisch im h1 an
function setMindMapTitle(mindMapName) {
    const titleElement = document.querySelector('#mindmap-editor-page h1');
    if (titleElement) {
        titleElement.textContent = mindMapName + ": Mind Map"; // Aktualisiert den Titel basierend auf dem MindMap-Namen
    }
}

//Schlüssel Funktion: Neu erstellte MindMap wird angezeigt und bereits vorhandene wird geladen
function showMindMapEditorPage(mindMapName, mindMapData = null, isNewMindMap) {
    console.log("Showing Mind Map Editor Page");

    setMindMapTitle(mindMapName);

    document.getElementById('mindmap-list-page').style.display = 'none';
    document.getElementById('mindmap-editor-page').style.display = 'block';
    if (mindMapData) {
        if (isNewMindMap === true) {
            console.log("Loading Mind Map Data for a Newly Created Mind Map");
            // Übergebene MindMap-Daten für eine neu erstellte MindMap laden
            mwd.nodes(mindMapData);
        } else if (currentMindMapId) {
            console.log("Loading Mind Map Data from Firestore");
            // Lade die MindMap-Daten aus Firestore, falls keine Daten übergeben wurden, aber eine ID vorhanden ist
            const mindMapDocRef = doc(db, "users", auth.currentUser.uid, "mindmaps", currentMindMapId);
            getDoc(mindMapDocRef).then(doc => {
                if (doc.exists()) {
                    console.log("MindMap Data Loaded Successfully:", doc.data().data);
                    mwd.nodes(doc.data().data);
                } else {
                    console.log("MindMap Does Not Exist");
                }
            }).catch(error => {
                console.error("Error Loading MindMap:", error);
            });
        }
    }
}

//Initialisiert die MindWired Instanz (Aufruf der MindWired Library)
function initializeMindWired() {
    const mmapRoot = document.getElementById("mmap-root"); 
    mmapRoot.innerHTML = ''; 
    window.mindwired.init({ // Initialisiert die MindWired-Bibliothek mit dem Container-Element und den UI-Einstellungen
        el: "#mmap-root", // Bestimmt, wo die MindMap im DOM angezeigt wird
        ui: {width: 1200, height: 800}, 
    }).then((instance) => {
        mwd = instance; // Speichert die Instanz der MindMap, die von der Bibliothek zurückgegeben wurde, in einer Variablen, damit sie später verwendet werden kann
        console.log("MindWired initialisiert"); 

    }).catch(error => {
        console.error("Fehler bei der Initialisierung von MindWired:", error); 
    });
}

//Lädt MindMap-Daten aus Firestore basierend auf der übergebenen MindMap-ID
function loadMindMapFromFirestore(mindMapId) {
    console.log("--Aufruf der loadMindMapFromFirestore Funktion--"); 
    if (!auth.currentUser || !mindMapId) { 
        console.log("Benutzer nicht angemeldet oder keine MindMap-ID angegeben.");
        return; 
    }

    const mindMapDocRef = doc(db, "users", auth.currentUser.uid, "mindmaps", mindMapId); // Erstellt einen Referenzpfad zur spezifischen MindMap im Firestore
    getDoc(mindMapDocRef).then(doc => { // Versucht, das Dokument (die MindMap) von Firestore zu holen
        if (!doc.exists()) { 
            console.log("MindMap existiert nicht."); 
            return; 
        }

        const mindMapData = doc.data().data; // Extrahiert die Daten der MindMap aus dem Dokument
        if (!mindMapData) { 
            console.error("MindMap-Daten sind undefiniert."); 
            return; 
        }

        let isNewMindMap = false; 
        showMindMapEditorPage(doc.data().name, mindMapData, isNewMindMap); // Ruft die Funktion auf, um die MindMap im Editor anzuzeigen, mit den geladenen Daten
    }).catch(error => {
        console.error("Fehler beim Laden der MindMap:", error); 
    });
}

//Initialisiert und gibt die Struktur der Standard-MindMap zurück
function initializeDefaultMindMap() {
    // Definition der Struktur von der Default-MindMap
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

//Event-Handler für den Export-Button: aktuelle MindMap exportiert und in einem Dimmer angezeigt
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

//Event-Handler für den Close-Button: Dimmer wird wieder ausgeblendet
const btnClose = document.querySelector('[data-cmd="close"]');
btnClose.addEventListener('click', () => {
    document.querySelector('.dimmer').style.display = 'none'
})

//Speichert die MindMap-Daten in der Firestore-Datenbank
function saveMindMapToFirestore(mindMapData) {
    const user = auth.currentUser; 
    if (!user) { 
        alert("You must be logged in to save mind maps."); 
        return; 
    }

    const mindMapsRef = collection(db, "users", user.uid, "mindmaps"); // Definiert den Referenzpfad zu den MindMaps des Benutzers in Firestore
    if (currentMindMapId) { 
        const mindMapDocRef = doc(mindMapsRef, currentMindMapId); // Erstellt eine Referenz zu einem spezifischen Dokument (MindMap)
        updateDoc(mindMapDocRef, mindMapData).then(() => { // Aktualisiert das Dokument mit den neuen Daten
            console.log("MindMap updated with ID: ", currentMindMapId); 
        }).catch(error => {
            console.error("Error updating mindmap: ", error); 
        });
    } else { 
        addDoc(mindMapsRef, mindMapData).then(docRef => { // Fügt ein neues Dokument mit den MindMap-Daten hinzu
            console.log("MindMap added with ID: ", docRef.id); 
            currentMindMapId = docRef.id; // Speichert die ID der neu erstellten MindMap
        }).catch(error => {
            console.error("Error adding mindmap: ", error); 
        });
    }
}

//Löscht die aktuelle MindMap aus der Firestore-Datenbank
function deleteMindMapFromFirestore() {
    const user = auth.currentUser; 
    if (!user) { 
        alert("You must be logged in to delete mind maps."); 
        return; 
    }

    if (currentMindMapId) { 
        const mindMapDocRef = doc(db, "users", user.uid, "mindmaps", currentMindMapId); // Erstellt eine Referenz zu einem spezifischen Dokument (MindMap)
        deleteDoc(mindMapDocRef) // Löscht das spezifizierte Dokument (MindMap)
            .then(() => {
                console.log("MindMap successfully deleted!"); 
                currentMindMapId = null; 

                showMindMapListPage();

                alert("MindMap erfolgreich gelöscht!");     // Alert nach dem Löschen
            })
            .catch(error => {
                console.error("Error removing mindmap: ", error); 
            });
    }
}

//Event-Listener für den "Back to list" Button
document.getElementById('back-to-list').addEventListener('click', showMindMapListPage);

// Event-Listener zum Speichern der MindMap
const saveBtn = document.querySelector('[data-cmd="save"]');
saveBtn.addEventListener('click', () => {
    mwd.export().then(json => {
        const mindMapData = JSON.parse(json);
        saveMindMapToFirestore({
            data: mindMapData // Speichern der exportierten Daten
        });

        // Alert beim Speichern
        alert("MindMap erfolgreich gespeichert!");
    });
});

// Event-Listener zum Löschen der MindMap
const deleteBtn = document.querySelector('[data-cmd="delete"]');
deleteBtn.addEventListener('click', () => {
    // Vor dem Löschen einen Bestätigungs-Alert anzeigen
    const confirmDelete = confirm("Möchten Sie diese MindMap wirklich löschen?");
    if (confirmDelete) {
        deleteMindMapFromFirestore();
    }
});

//Navbar

const body = document.querySelector('body'),
      sidebar = body.querySelector('nav'),
      toggle = body.querySelector(".toggle"),
      modeSwitch = body.querySelector(".toggle-switch"),
      modeText = body.querySelector(".mode-text");


toggle.addEventListener("click" , () =>{
    sidebar.classList.toggle("close");
})

modeSwitch.addEventListener("click" , () =>{
    body.classList.toggle("dark");
    
    if(body.classList.contains("dark")){
        modeText.innerText = "Light mode";
    }else{
        modeText.innerText = "Dark mode";
        
    }
});