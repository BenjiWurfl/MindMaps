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

function redirectToLogin() {
    window.location.href = 'https://benjiwurfl.github.io/Login/';
  }

// Authentifizierungsstatus beibehalten
onAuthStateChanged(auth, (user) => {
    if (user) {
      // Der Benutzer ist angemeldet und `user.uid` ist verfügbar.
      console.log("User is signed in with UID:", user.uid);
      // Hier können Sie Funktionen aufrufen, die die UID verwenden.
      //loadUserEvents();
    } else {
      // Kein Benutzer ist angemeldet.
      console.log("No user is signed in.");
      redirectToLogin();
    }
  });

  let mwd; 
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
              text: "Mind-Wired",
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
                model: {text: "Configuration"},
                view: {x: 160, y: 80}
              },
              {
                model: { text: "Node" },
                view: { x: -140, y: -80 },
                subs: [
                  {
                    model: { text: "text" },
                    view: { x: -100, y: -40 }
                  },
                  {
                    model: { text: "badge" },
                    view: { x: -100, y: 0 }
                  },
                  {
                    model: { text: "thumnail" },
                    view: { x: -100, y: 40 }
                  },
                ],
              },
              {
                model: { text: "Edge" },
                view: { x: -140, y: 80 },
                subs: [
                  {
                    model: { text: "LINE" },
                    view: { x: -100, y: -40 }
                  },
                  {
                    model: { text: "mustache_lr" },
                    view: { x: -100, y: 0 }
                  },
                  {
                    model: { text: "mustache_tb" },
                    view: { x: -100, y: 40 }
                  },
                ],
              },
              {
                model: { text: "Layout" },
                view: { x: 140, y: -80 },
                subs: [
                  {
                    model: { text: "DEFAULT" },
                    view: { x: 100, y: -40 }
                  },
                  {
                    model: { text: "X-AXIS" },
                    view: { x: 100, y: 0 }
                  },
                  {
                    model: { text: "Y-AXIS" },
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