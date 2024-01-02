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

function loadMindMapFromFirestore() {
    const user = auth.currentUser;
    if (user) {
        const mindMapsRef = collection(db, "users", user.uid, "mindmaps");
        getDocs(mindMapsRef).then(querySnapshot => {
            if (!querySnapshot.empty) {
                // Nehmen Sie hier das erste Dokument (oder eine andere Logik, um eine spezifische MindMap auszuwählen)
                const doc = querySnapshot.docs[0];
                const mindMapData = doc.data();
                currentMindMapId = doc.id;
                mwd.nodes(mindMapData); // Laden der MindMap-Daten
            } else {
                console.log("Keine MindMaps gefunden.");
                // Initialisieren Sie hier die MindMap mit Standarddaten, falls gewünscht
            }
        }).catch(error => {
            console.error("Error loading mindmaps: ", error);
        });
    }
}

function redirectToLogin() {
    window.location.href = 'https://benjiwurfl.github.io/Login/';
  }

// Authentifizierungsstatus beibehalten
onAuthStateChanged(auth, (user) => {
    if (user) {
      // Der Benutzer ist angemeldet und `user.uid` ist verfügbar.
      console.log("User is signed in with UID:", user.uid);
    } else {
      // Kein Benutzer ist angemeldet.
      console.log("No user is signed in.");
      redirectToLogin();
    }
});
 
  window.onload = () => {
  window.mindwired
        .init({
        el: "#mmap-root",
        ui: {width: '100%', height: 500},
      })
        .then((instance) => {
          mwd = instance;
          // install nodes here
          mwd.nodes({
            model: {
              type: "text",
              text: "Thinkwise",
            },
            view: {
              x: 0,
              y: 0,
              layout: {type: 'X-AXIS'},
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
                view: {x: 0, y: -150, edge: {
                  name: 'line',
                  color: '#9a9c12',
                  width: 1
                }},
                
              },
              {
                model: {text: "Subtopic D"},
                view: {x: 160, y: 80}
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
        });
    }
  
  /* START: out of box code */
  const el = document.querySelector('.ctrl');
  el.addEventListener('click', (e) => {
    const {cmd} = e.target.dataset
    if(cmd === 'export') {
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

// Event-Listener zum Laden der MindMap beim Start
window.addEventListener('load', loadMindMapFromFirestore);

// Event-Listener zum Löschen der MindMap
const deleteBtn = document.querySelector('[data-cmd="delete"]');
deleteBtn.addEventListener('click', deleteMindMapFromFirestore);