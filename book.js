let fallbackData = [
    {
        "Bezeichnung": "Beschaffung",
        "Von": "Grassistr. 10, 04105 Leipzig",
        "Nach": "Grassistr. 25, 04105 Leipzig",
        "KmStart": 10234,
        "KmEnde": 10236,
        "Datum": "2023-10-19T16:40"
    },
    {
        "Bezeichnung": "Privat",
        "Von": "Privat",
        "Nach": "Privat",
        "KmStart": 10236,
        "KmEnde": 10312,
        "Datum": "2023-10-15T18:00"
    },
    {
        "Bezeichnung": "Unterricht anderer Standort",
        "Von": "Grassistr. 10, 04105 Leipzig",
        "Nach": "Andere Str. 25, 12345 Halle",
        "KmStart": 10312,
        "KmEnde": 10336,
        "Datum": "2023-10-19T12:20"
    }
];
// set up our global variables
var data = [];
var maxKm = 0;
var filterMin = new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-CA');
var filterMax = new Date().toLocaleDateString('en-CA');
data = loadFromLocalStorate();
renderfilterdData(data);

document.querySelector("#abFilterInput").value =  filterMin;
document.querySelector("#bisFilterInput").value =  filterMax;

document.querySelector("#abFilterInput").onchange = (event) => {
    filterMin = event.target.value;
    renderfilterdData(data);
}

document.querySelector("#bisFilterInput").onchange = (event) => {
    filterMax = event.target.value;
    renderfilterdData(data);
}

function renderfilterdData(data) {
    let filteredData = data.filter((entry) => {
        if (entry["Datum"] < filterMin) return false;
        if (entry["Datum"] > filterMax) return false;
        return true;
    })
    render(filteredData)
}

// submit form == btn hinzufuegen. Add one entry to our data
const inputform = document.querySelector("#inputform")
inputform.onsubmit = function(event){
    event.preventDefault();
    const formEntries = new FormData(event.target).entries();
    let submitData = {};
    for(const entry of formEntries) {
        submitData[entry[0]] = entry[1]=== "" ? null : entry[1];
    }
    data.push(submitData);
    saveToLocalStorage(data);
    render(data);
}

// load from local storage and renders it out 
function loadFromLocalStorate() {
    return JSON.parse(localStorage.getItem("data"));
}

// saves current data to local storage
function saveToLocalStorage(data) {
    localStorage.setItem("data", JSON.stringify(data));
}

// import json button
document.querySelector("#loadBtn").onchange = (event) => {
    try {
        let files = event.target.files;
        if(!files || files.length==0) {
            alert("no files selected");
            return;
        }
        let file = files[0];
        let reader = new FileReader();
        //const self = this;
        reader.onload = (fileEvent) => {
            const jsonObj = JSON.parse(fileEvent.target.result);
            data = jsonObj;
            saveToLocalStorage(data);
            renderfilterdData(data)
            
        }
        reader.readAsText(file);
    } catch (error) {
        alert(error);
    } finally {
        event.target.files = null;
    }
}

// export json button
function OnDownloadFile() {
    const link = document.createElement("a");
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const file = new Blob([bom, JSON.stringify(data)]);
    link.href = URL.createObjectURL(file);
    let now = new Date();
    let month = (now.getMonth()+1)<9 ? "0"+(now.getMonth()+1) : (now.getMonth()+1); // month is 0 indexed!
    let day = (now.getDay())<10 ? "0"+now.getDay() : now.getMonth();
    link.download = `fahrtenbuch_${now.getFullYear()}_${month}_${day}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// creates the html table from the data object
function render(data) {
    let container = document.querySelector("#tablecontainer");
    container.innerHTML = "";
    if (!data || !data.length || data.length == 0) {
        data = fallbackData;
    }
    let table = document.createElement("table");
    container.appendChild(table);
    createTHead(table, data);
    let tbody = createTBody(table, data);
    createInputs(tbody, data);


    function createTHead(table, data) {
        const thead = document.createElement("thead");
        table.appendChild(thead);
        const tr = document.createElement("tr");
        thead.appendChild(tr)
        // we assume all rows share the same structure -> we get the names of the rows from only the first
        for(let key in data[0]) { 
            const td = document.createElement("td");
            tr.appendChild(td);
            td.textContent = key;
        }
    }

    function createTBody(table, data) {
        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        for (let row of data) {
            const tr = document.createElement("tr");
            tbody.append(tr);
            for(const key in row) {
                const td = document.createElement("td");
                tr.appendChild(td);
                td.textContent = row[key] || "-"
                td.dataset.label = key;
            }
        }
        return tbody;
    }

    function createInputs(tbody, data) {
        const tr = document.createElement("tr");
        tbody.appendChild(tr);
        for (let key in data[0]) {
            let td = document.createElement("td");
            tr.appendChild(td);
            let input = document.createElement("input");
            input.placeholder = key;
            td.appendChild(input);
            input.type = "text";
            // check non text inputs
            if(key.includes("Datum")) {
                input.type = "datetime-local"
                let now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                input.value = now.toISOString().slice(0,16);
            }
            if(key.includes("Km")) {
                input.type = "number";
                input.value = Math.max(... data.map((el) => el["KmEnde"]));
                input.id=key;
                // keep start end end km values in logical state (start < end)
                if(key.includes("Start")) {
                    input.onchange = (event) => {
                        let newval = event.target.value;
                        let other = document.querySelector("#KmEnde");
                        if (newval>other.value) other.value = newval;
                    }
                } else if (key.includes("Ende")) {
                    input.onchange = (event) => {
                        let newval = event.target.value;
                        let other = document.querySelector("#KmStart");
                        if (newval<other.value) other.value = newval;
                    }
                }
            }
            input.name = key;
            input.required = true;
        }
    }
}