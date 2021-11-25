let saveBtn = document.getElementById("saveButton");
let getLocationBtn = document.getElementById("getLocation");
let puzzleContainer = document.getElementById("puzzle-container");
let puzzleTable = document.getElementById("table");
let targets = document.querySelectorAll(".drag-target");
let leafletMap = L.map('map').setView([53.430127, 14.564802], 18);
L.tileLayer.provider('Esri.WorldImagery').addTo(leafletMap);

window.onload = () => {
    // sprawdzam uprawnienia do wyświetlania powiadomień
    if (!("Notification" in window)) {
        alert("Ta przeglądarka nie obsługuje powiadomień!");
    } else if(Notification.permission !== "denied") {
        Notification.requestPermission();
    }


    // obsługa możliwości upuszczania puzzli na stole i style przy dragenter
    for (let target of targets) {
        target.addEventListener("dragover", function (event) {
            event.preventDefault();
        });
        target.addEventListener("drop", function (event) {
            if (!target.hasChildNodes()) {
                let myElement = document.querySelector("#" + event.dataTransfer.getData('text'));
                this.appendChild(myElement)
                this.style.width = myElement.clientWidth + "px";
                this.style.height = myElement.clientHeight + "px";
            }
        }, false);
        target.addEventListener("dragenter", function (event) {
            event.preventDefault();
            this.style.backgroundColor = "rgba(255,255,255,0.2)";
        });

        target.addEventListener("dragleave", function (event) {
            event.preventDefault();
            this.style.backgroundColor = "";
        });
    }
}

// obsługa kliknięcia w przycisk "Pobierz mapę"
saveBtn.addEventListener("click", function(event) {
    let puzzleContainer = document.getElementById("puzzle-container");

    if(puzzleContainer.innerHTML === "") {
        let mapDiv = document.getElementById("map");

        // tworzę nowy niewidoczny na stronie canvas
        let fullCanvas = document.createElement("canvas");
        let rasterContext = fullCanvas.getContext("2d");
        fullCanvas.width = mapDiv.clientWidth;
        fullCanvas.height = mapDiv.clientHeight;

        // pobranie i podział mapy na puzzle
        leafletImage(leafletMap, function (err, canvas) {
            // zapisanie całego widoku mapy do canvas
            rasterContext.drawImage(canvas, 0, 0, mapDiv.clientWidth, mapDiv.clientHeight);

            let width = mapDiv.clientWidth / 4;
            let height = mapDiv.clientHeight / 4;

            let puzzleList = []; // lista puzzli do pomieszania później...
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    // console.log("element" + i + j);
                    let puzzle = document.createElement("canvas");
                    puzzle.setAttribute("width", width.toString());
                    puzzle.setAttribute("height", height.toString());
                    puzzle.setAttribute("draggable", "true");
                    puzzle.id = 'puzzle' + i + j;
                    puzzle.dataset.id = '' + i + j;
                    puzzle.className = 'puzzle';
                    puzzle.style.margin = "10px";
                    puzzle.addEventListener("dragstart", function(event) {
                        Array.from(this.parentElement.classList).indexOf("drag-target") === 1
                            ? this.style.margin = "-1px" : this.style.margin = "8px";
                        this.style.border = "2px dashed #D8D8FF";
                        event.dataTransfer.setData("text", this.id);
                    });
                    puzzle.addEventListener("dragend", function(event) {
                        if(Array.from(this.parentElement.classList).indexOf("drag-target") === 1) {
                            this.style.margin = "-1px";
                            this.style.border = "1px solid white";
                        } else {
                            this.style.margin = "10px";
                            this.style.borderWidth = "0";
                        }
                    });

                    let puzzleContext = puzzle.getContext("2d");
                    puzzleContext.drawImage(canvas, width * i, height * j, width, height, 0, 0, width, height);
                    puzzleList.push(puzzle);
                }
            }

            // mieszanie puzzli
            let mixedPuzzleList = puzzleList.sort(() => Math.random() - 0.5);
            for(let puzzle of mixedPuzzleList) {
                puzzleContainer.appendChild(puzzle);
            }
        });
    }
});

// obsługa kliknięcia w przycisk "Moja lokalizacja"
getLocationBtn.addEventListener("click", function(event) {
    if (! navigator.geolocation) {
        console.log("No geolocation.");
    }

    navigator.geolocation.getCurrentPosition(position => {
        console.log(position);
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;

        leafletMap.setView([lat, lon]);
    }, positionError => {
        console.error(positionError);
    });
});

// obsługa możliwości upuszczania puzzli do "worka"
puzzleContainer.addEventListener("dragover", function (event) {
    event.preventDefault();
});
puzzleContainer.addEventListener("drop", function (event) {
    let myElement = document.querySelector("#" + event.dataTransfer.getData('text'));
    this.appendChild(myElement)
}, false);

// sprawdzanie czy puzzle są prawidłowo ułożone po każdym umieszczeniu puzzla
puzzleTable.addEventListener("drop", function () {
    let items = document.getElementsByClassName("item");
    let countCorrect = 0;
    for(let item of items) {
        if(!item.hasChildNodes()){
            console.log("No children");
            break;
        } else {
            if(item.dataset.id !== item.firstElementChild.dataset.id) {
                console.log("Bad placing");
                break;
            } else countCorrect++;
            if(countCorrect === items.length) {
                if(Notification.permission === "granted") {
                    new Notification("Brawo! Puzzle ułożone! 😅");
                }
                let badge = document.createElement("h2");
                badge.innerHTML = "Brawo! Puzzle ułożone! 😅";
                badge.className = "win-badge";
                puzzleContainer.appendChild(badge);

                let restartBtn = document.createElement("button");
                restartBtn.innerHTML = "Zagraj ponownie";
                restartBtn.className = "restart-btn";
                puzzleContainer.appendChild(restartBtn);
                restartBtn.addEventListener("click", () => {
                    window.location.reload();
                });

                let puzzles = document.getElementsByClassName("puzzle");
                for(let puzzle of puzzles) {
                    puzzle.setAttribute("draggable", "false");
                }
            }
        }
    }
});
