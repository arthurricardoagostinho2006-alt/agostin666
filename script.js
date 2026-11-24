
const STORAGE_KEY = "agostin666_profile";

const defaultProfile = {
    nickname: "agostin666",
    avatar: "",
    elo: 20,
    questions: 10,
    correct: 8,
    maps: 1,

    mapStats: {
        "Mirage": {
            attempts: 1,
            questions: 10,
            correct: 8,
            elo: 20
        }
    },

    history: []
};

const mapPool = [
    { name: "Mirage", subject: "RLM" },
    { name: "Ancient", subject: "Informática" },
    { name: "Dust II", subject: "Português" },
    { name: "Nuke", subject: "Conhecimentos Específicos" },
    { name: "Cache", subject: "Conhecimentos Gerais" }
];

function loadProfile() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(defaultProfile);
        }

        const data = JSON.parse(saved);

        return {
            ...structuredClone(defaultProfile),
            ...data,
            mapStats: {
                ...defaultProfile.mapStats,
                ...(data.mapStats || {})
            },
            history: Array.isArray(data.history) ? data.history : []
        };
    } catch {
        return structuredClone(defaultProfile);
    }
}

let profile = loadProfile();

function saveProfile() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
        alert("Não foi possível salvar os dados. Tente usar uma imagem menor.");
    }
}

// SISTEMA DE RANKS
const levels = [
    { name: "LEVEL 1", min: 0 },
    { name: "LEVEL 2", min: 501 },
    { name: "LEVEL 3", min: 751 },
    { name: "LEVEL 4", min: 901 },
    { name: "LEVEL 5", min: 1051 },
    { name: "LEVEL 6", min: 1201 },
    { name: "LEVEL 7", min: 1351 },
    { name: "LEVEL 8", min: 1531 },
    { name: "LEVEL 9", min: 1751 },
    { name: "LEVEL 10", min: 2001 }
];

// ATUALIZAR PERFIL
function updateProfile() {
    const elo = profile.elo;

    document.getElementById("nickname").value = profile.nickname;
    document.getElementById("elo").textContent = elo;
    document.getElementById("totalElo").textContent = elo;

    document.getElementById("questions").textContent =
        profile.questions;

    document.getElementById("correct").textContent =
        profile.correct;

    document.getElementById("maps").textContent =
        Object.keys(profile.mapStats).length;

    const accuracy = profile.questions > 0
        ? Math.round((profile.correct / profile.questions) * 100)
        : 0;

    document.getElementById("accuracy").textContent =
        accuracy + "%";

    let currentLevel = levels[0];

    for (const level of levels) {
        if (elo >= level.min) {
            currentLevel = level;
        }
    }

    const rankName = currentLevel.name.replace("LEVEL ", "RANK ");

    document.getElementById("rank").textContent = rankName;

    const levelIndex = levels.indexOf(currentLevel);

    const rankEmblem = document.getElementById("rankEmblem");
    const rankEmblemLevel = document.getElementById("rankEmblemLevel");

    rankEmblem.className =
        "rank-emblem rank-" + (levelIndex + 1);

    rankEmblemLevel.textContent = levelIndex + 1;

    const rankFill = (levelIndex + 1) * 10;

    rankEmblem.style.setProperty(
        "--rank-fill",
        rankFill + "%"
    );

    // PROGRESSO PARA O PRÓXIMO NÍVEL
    const nextLevel = levels.find(level => level.min > elo);

    let progress = 100;
    let remaining = 0;

    if (nextLevel) {
        const range = nextLevel.min - currentLevel.min;

        remaining = nextLevel.min - elo;
        progress = ((elo - currentLevel.min) / range) * 100;
    }

    document.getElementById("progressBar").style.width =
        Math.max(0, Math.min(progress, 100)) + "%";

    document.getElementById("remaining").textContent =
        remaining + " ELO RESTANTES";

    if (profile.avatar) {
        document.getElementById("avatar").src = profile.avatar;
    }

    document.title = profile.nickname + " | Player Profile";

    renderEloChart();
}

// GRÁFICO DE EVOLUÇÃO DO ELO
function renderEloChart() {
    const svg = document.getElementById("eloChart");
    const tooltip = document.getElementById("chartTooltip");
    const container = document.getElementById("eloChartContainer");

    if (!svg || !tooltip || !container) return;

    svg.replaceChildren();
    tooltip.style.display = "none";

    const NS = "http://www.w3.org/2000/svg";

    function createSvgElement(tag, attributes = {}) {
        const element = document.createElementNS(NS, tag);

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        return element;
    }

    // PONTO INICIAL: ELO ATUAL DO PERFIL ANTES DAS NOVAS PARTIDAS
    const startingElo = profile.elo -
        profile.history.reduce((sum, match) => sum + match.eloDelta, 0);

    const points = [{ elo: startingElo, initial: true }];

    let runningElo = startingElo;

    profile.history.forEach((match, index) => {
        runningElo += match.eloDelta;

        points.push({
            elo: runningElo,
            map: match.map,
            eloDelta: match.eloDelta,
            date: match.date,
            matchNumber: index + 1,
            initial: false
        });
    });

    document.getElementById("chartCurrentElo").textContent = profile.elo;

    document.getElementById("chartMatchCount").textContent =
        profile.history.length +
        (profile.history.length === 1 ? " PARTIDA REGISTRADA" : " PARTIDAS REGISTRADAS");

    const width = 800;
    const height = 260;

    const left = 55;
    const right = 20;
    const top = 25;
    const bottom = 35;

    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    const values = points.map(point => point.elo);

    let minElo = Math.min(...values);
    let maxElo = Math.max(...values);

    if (minElo === maxElo) {
        minElo -= 20;
        maxElo += 20;
    }

    const padding = Math.max(20, (maxElo - minElo) * 0.2);

    minElo = Math.max(0, minElo - padding);
    maxElo += padding;

    function getX(index) {
        if (points.length === 1) {
            return left + chartWidth / 2;
        }

        return left + (index / (points.length - 1)) * chartWidth;
    }

    function getY(elo) {
        return top +
            ((maxElo - elo) / (maxElo - minElo)) * chartHeight;
    }

    // LINHAS DE REFERÊNCIA
    for (let i = 0; i <= 4; i++) {
        const y = top + (chartHeight / 4) * i;

        const line = createSvgElement("line", {
            x1: left,
            y1: y,
            x2: width - right,
            y2: y,
            stroke: "#41484f",
            "stroke-width": "1",
            "stroke-dasharray": "4 5"
        });

        svg.appendChild(line);

        const value = Math.round(
            maxElo - ((maxElo - minElo) / 4) * i
        );

        const label = createSvgElement("text", {
            x: left - 10,
            y: y + 4,
            fill: "#9299a1",
            "font-size": "12",
            "text-anchor": "end"
        });

        label.textContent = value;

        svg.appendChild(label);
    }

    // LINHA DO GRÁFICO
    const coordinates = points.map((point, index) => ({
        x: getX(index),
        y: getY(point.elo)
    }));

    const linePath = coordinates
        .map((point, index) =>
            (index === 0 ? "M" : "L") +
            point.x + " " + point.y
        )
        .join(" ");

    // ÁREA PREENCHIDA ABAIXO DA LINHA
    const areaPath = linePath +
        " L " + coordinates[coordinates.length - 1].x + " " + (height - bottom) +
        " L " + coordinates[0].x + " " + (height - bottom) +
        " Z";

    const area = createSvgElement("path", {
        d: areaPath,
        fill: "rgba(255, 106, 0, 0.10)"
    });

    svg.appendChild(area);

    const line = createSvgElement("path", {
        d: linePath,
        fill: "none",
        stroke: "#ff792c",
        "stroke-width": "3",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
    });

    svg.appendChild(line);

    // PONTOS INTERATIVOS
    coordinates.forEach((coordinate, index) => {
        const point = points[index];

        const circle = createSvgElement("circle", {
            cx: coordinate.x,
            cy: coordinate.y,
            r: point.initial ? 5 : 6,
            fill: "#ff792c",
            stroke: "#191d21",
            "stroke-width": "3",
            class: "elo-chart-point"
        });

        circle.style.cursor = point.initial ? "default" : "pointer";

        if (!point.initial) {
            circle.addEventListener("mouseenter", () => {
                tooltip.replaceChildren();

                const mapTitle = document.createElement("strong");
                mapTitle.textContent = point.map;

                const matchNumber = document.createElement("p");
                matchNumber.textContent =
                    "PARTIDA #" + point.matchNumber;

                const change = document.createElement("p");
                change.className = point.eloDelta >= 0
                    ? "chart-positive"
                    : "chart-negative";

                change.textContent =
                    (point.eloDelta > 0 ? "+" : "") +
                    point.eloDelta + " ELO";

                const total = document.createElement("strong");
                total.textContent = point.elo + " ELO";

                const totalLabel = document.createElement("p");
                totalLabel.textContent = "ELO APÓS A PARTIDA";

                const date = document.createElement("p");
                date.textContent = point.date || "";

                tooltip.append(
                    mapTitle,
                    matchNumber,
                    change,
                    totalLabel,
                    total,
                    date
                );

                const rect = container.getBoundingClientRect();

                const xPosition = (coordinate.x / width) * rect.width;
                const yPosition = (coordinate.y / height) * rect.height;

                tooltip.style.display = "block";
                tooltip.style.left = Math.min(
                    Math.max(xPosition, 75),
                    rect.width - 75
                ) + "px";

                tooltip.style.top = Math.max(yPosition - 10, 5) + "px";
            });

            circle.addEventListener("mouseleave", () => {
                tooltip.style.display = "none";
            });
        }

        svg.appendChild(circle);
    });

    // RÓTULOS DO EIXO HORIZONTAL
    const startLabel = createSvgElement("text", {
        x: left,
        y: height - 8,
        fill: "#9299a1",
        "font-size": "12",
        "text-anchor": "start"
    });

    startLabel.textContent = "INÍCIO";

    const endLabel = createSvgElement("text", {
        x: width - right,
        y: height - 8,
        fill: "#9299a1",
        "font-size": "12",
        "text-anchor": "end"
    });

    endLabel.textContent = "ATUAL";

    svg.append(startLabel, endLabel);
}

// ATUALIZAR TABELA DE MAPAS
function renderMapStats() {
    const tableBody = document.getElementById("mapStats");

    tableBody.replaceChildren();

    mapPool.forEach(mapInfo => {
        const stats = profile.mapStats[mapInfo.name] || {
            attempts: 0,
            questions: 0,
            correct: 0,
            elo: 0
        };

        const accuracy = stats.questions > 0
            ? Math.round((stats.correct / stats.questions) * 100)
            : 0;

        const row = document.createElement("tr");

        const values = [
            mapInfo.name,
            stats.attempts,
            stats.questions,
            stats.correct,
            stats.questions > 0 ? accuracy + "%" : "—",
            (stats.elo > 0 ? "+" : "") + stats.elo
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;

            if (index === 5 && stats.elo > 0) {
                cell.className = "elo-positive";
            } else if (index === 5 && stats.elo < 0) {
                cell.className = "elo-negative";
            }

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// HISTÓRICO
function renderHistory() {
    const historyContainer =
        document.getElementById("matchHistory");

    historyContainer.replaceChildren();

    if (profile.history.length === 0) {
        const message = document.createElement("p");
        message.textContent = "Nenhuma nova partida registrada.";
        historyContainer.appendChild(message);
        return;
    }

    [...profile.history].reverse().forEach(match => {
        const item = document.createElement("div");
        item.className = "match-item";

        const title = document.createElement("strong");

        title.textContent =
            match.map + " — " +
            match.correct + "/" +
            match.questions + " acertos";

        const details = document.createElement("p");
        details.textContent = match.date;

        const elo = document.createElement("p");

        elo.className = match.eloDelta >= 0
            ? "elo-positive"
            : "elo-negative";

        elo.textContent =
            (match.eloDelta > 0 ? "+" : "") +
            match.eloDelta + " ELO";

        item.append(title, details, elo);
        historyContainer.appendChild(item);
    });
}

// DESFAZER ÚLTIMA PARTIDA
const undoButton = document.createElement("button");

undoButton.type = "button";
undoButton.textContent = "DESFAZER ÚLTIMA PARTIDA";
undoButton.style.background = "#41484f";
undoButton.style.color = "#ffffff";
undoButton.style.marginTop = "15px";
undoButton.style.width = "100%";

document.getElementById("matchHistory").after(undoButton);

undoButton.addEventListener("click", function() {
    if (profile.history.length === 0) {
        alert("Não há partidas para desfazer.");
        return;
    }

    const confirmUndo = confirm(
        "Deseja realmente desfazer a última partida registrada?"
    );

    if (!confirmUndo) return;

    const match = profile.history.pop();

    profile.elo -= match.eloDelta;
    profile.questions -= match.questions;
    profile.correct -= match.correct;

    const map = profile.mapStats[match.map];

    if (map) {
        map.attempts--;
        map.questions -= match.questions;
        map.correct -= match.correct;
        map.elo -= match.eloDelta;

        if (map.attempts <= 0) {
            delete profile.mapStats[match.map];
        }
    }

    saveProfile();
    updateProfile();
    renderMapStats();
    renderHistory();

    alert("Última partida desfeita com sucesso.");
});

// REGISTRAR PARTIDA
document.getElementById("matchForm").addEventListener(
    "submit",
    function(event) {
        event.preventDefault();

        const map = document.getElementById("subject").value;

        const questions = Number(
            document.getElementById("totalQuestions").value
        );

        const correct = Number(
            document.getElementById("correctAnswers").value
        );

        const selectedElo = Number(
            document.getElementById("performance").value
        );

        if (
            !Number.isInteger(questions) ||
            !Number.isInteger(correct) ||
            questions < 1 ||
            correct < 0 ||
            correct > questions
        ) {
            alert("Confira a quantidade de questões e de acertos.");
            return;
        }

        const oldElo = profile.elo;
        const newElo = Math.max(0, oldElo + selectedElo);
        const appliedElo = newElo - oldElo;

        const match = {
            map,
            questions,
            correct,
            eloDelta: appliedElo,
            date: new Date().toLocaleString("pt-BR")
        };

        profile.elo = newElo;
        profile.questions += questions;
        profile.correct += correct;

        if (!profile.mapStats[map]) {
            profile.mapStats[map] = {
                attempts: 0,
                questions: 0,
                correct: 0,
                elo: 0
            };
        }

        profile.mapStats[map].attempts++;
        profile.mapStats[map].questions += questions;
        profile.mapStats[map].correct += correct;
        profile.mapStats[map].elo += appliedElo;

        profile.history.push(match);

        saveProfile();
        updateProfile();
        renderMapStats();
        renderHistory();

        this.reset();

        alert("Partida registrada! Seu perfil foi atualizado.");
    }
);

// SALVAR NICK
document.getElementById("nickname").addEventListener(
    "input",
    function() {
        profile.nickname = this.value;
        saveProfile();

        document.title =
            profile.nickname + " | Player Profile";
    }
);

// ALTERAR AVATAR
document.getElementById("photoInput").addEventListener(
    "change",
    function(event) {
        const file = event.target.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Selecione um arquivo de imagem.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            const image = new Image();

            image.onload = function() {
                const canvas = document.createElement("canvas");
                const maxSize = 512;

                const scale = Math.min(
                    1,
                    maxSize / Math.max(image.width, image.height)
                );

                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);

                const context = canvas.getContext("2d");

                context.drawImage(
                    image,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                profile.avatar =
                    canvas.toDataURL("image/jpeg", 0.8);

                saveProfile();
                updateProfile();
            };

            image.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }
);

// INICIALIZAÇÃO
updateProfile();
renderMapStats();
renderHistory();
