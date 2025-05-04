const firebaseURL = "https://fir-felling-rist-default-rtdb.firebaseio.com/";
let selectedIndex = 0;
let lastSelectedIndex = -1;
let reservations = [];

async function setCustomUUID() {
    const uuid = document.getElementById("uuidInput").value.trim();
    if (!uuid) {
        alert("UUIDを入力してください。");
        return;
    }

    try {
        const response = await fetch(`${firebaseURL}reservations.json?orderBy="uuid"&equalTo="${uuid}"`);
        const data = await response.json();

        if (Object.keys(data).length === 0) {
            alert("データが見つかりませんでした。");
        } else {
            alert("データが見つかりました！");
            localStorage.setItem("selectedUUID", uuid);
            window.location.href = "queue.html";
        }
    } catch (error) {
        console.error("エラー:", error);
        alert("データの取得に失敗しました。");
    }
}

async function loadQueue() {
    const selectedUUID = localStorage.getItem("selectedUUID");
    let url = `${firebaseURL}reservations.json`;

    if (selectedUUID) {
        url = `${firebaseURL}reservations/${selectedUUID}.json`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (selectedUUID) {
        reservations = [data];
    } else {
        reservations = Object.values(data || {});
    }

    renderReservations(objectify(reservations));
}

function formatQueue(data, queueType) {
    return Object.values(data)
        .filter(item => item.queue === queueType)
        .map(item => `<li>${item.name} - ${item.content}</li>`)
        .join("");
}

function renderReservations(reservationMap) {
    const normalList = document.getElementById("normalList");
    const priorityList = document.getElementById("priorityList");

    normalList.innerHTML = "";
    priorityList.innerHTML = "";

    reservations.forEach((r, index) => {
        const li = document.createElement("li");
        li.textContent = `${r.name} - ${r.content}`;
        li.style.background = index === selectedIndex ? "#ffeecc" : "transparent";

        if (r.queue === "通常枠💗") {
            normalList.appendChild(li);
        } else if (r.queue === "優先") {
            priorityList.appendChild(li);
        }
    });
}

function deleteReservation(type) {
    if (!reservations[selectedIndex]) return;
    const res = reservations[selectedIndex];
    if ((type === "normal" && res.queue === "通常枠💗") ||
        (type === "priority" && res.queue === "優先")) {
        // Firebaseからも削除
        fetch(`${firebaseURL}reservations/${res.uuid}.json`, { method: "DELETE" })
            .then(() => {
                reservations.splice(selectedIndex, 1);
                selectedIndex = 0;
                renderReservations(objectify(reservations));
            })
            .catch(err => console.error("削除エラー:", err));
    }
}

function moveToPriority() {
    if (reservations[selectedIndex]) {
        reservations[selectedIndex].queue = "優先";
        updateReservation(reservations[selectedIndex]);
    }
}

function moveAllToPriority() {
    reservations.forEach(r => {
        r.queue = "優先";
        updateReservation(r);
    });
}

function updateReservation(reservation) {
    fetch(`${firebaseURL}reservations/${reservation.uuid}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservation)
    }).then(() => renderReservations(objectify(reservations)))
      .catch(err => console.error("更新エラー:", err));
}

function fetchReservations() {
    fetch(`${firebaseURL}reservations.json`)
        .then(response => response.json())
        .then(data => {
            reservations = Object.values(data || {});
            renderReservations(objectify(reservations));
        });
}

function objectify(arr) {
    return arr.reduce((obj, r) => { obj[r.uuid] = r; return obj; }, {});
}

document.addEventListener("keydown", function (event) {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") return;

    if (event.key >= "1" && event.key <= "9") {
        lastSelectedIndex = selectedIndex;
        selectedIndex = parseInt(event.key) - 1;
        renderReservations(objectify(reservations));
    } else if (event.key === "z") {
        deleteReservation("normal");
    } else if (event.key === "x") {
        deleteReservation("priority");
    } else if (event.key === "c") {
        moveToPriority();
    } else if (event.key === "v") {
        if (lastSelectedIndex >= 0) {
            selectedIndex = lastSelectedIndex;
            renderReservations(objectify(reservations));
        }
    } else if (event.key === "b") {
        moveAllToPriority();
    } else if (event.key === "r") {
        fetchReservations();
    } else if (event.key === "Escape") {
        window.location.href = "index.html";
    }
});

window.onload = function () {
    if (!localStorage.getItem("visitedBefore")) {
        window.location.href = "save.html";
        localStorage.setItem("visitedBefore", "true");
    } else {
        loadQueue();
    }
};
