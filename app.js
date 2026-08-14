"use strict";

// ==========================================
// HORROR SOLITAIRE
// app.js
// Klondike Solitaire + Drag & Drop
// ==========================================


// ==========================================
// GAME STATE
// ==========================================

const game = {
    deck: [],
    stock: [],
    waste: [],

    foundations: [
        [],
        [],
        [],
        []
    ],

    tableau: [
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],

    moves: 0,
    seconds: 0,

    timer: null,
    timerRunning: false,

    selected: null,

    dragging: null
};


// ==========================================
// CARD DEFINITIONS
// ==========================================

const suits = [
    "hearts",
    "diamonds",
    "clubs",
    "spades"
];

const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K"
];


// ==========================================
// CREATE DECK
// ==========================================

function createDeck() {

    game.deck = [];

    suits.forEach(suit => {

        ranks.forEach((rank, index) => {

            game.deck.push({
                suit,
                rank,
                value: index + 1,
                faceUp: false
            });

        });

    });
}


// ==========================================
// SHUFFLE
// ==========================================

function shuffleDeck() {

    for (let i = game.deck.length - 1; i > 0; i--) {

        const randomIndex =
            Math.floor(Math.random() * (i + 1));

        [
            game.deck[i],
            game.deck[randomIndex]
        ] = [
            game.deck[randomIndex],
            game.deck[i]
        ];
    }
}


// ==========================================
// NEW GAME
// ==========================================

function newGame() {

    stopTimer();

    game.moves = 0;
    game.seconds = 0;
    game.selected = null;
    game.dragging = null;

    game.stock = [];
    game.waste = [];

    game.foundations = [
        [],
        [],
        [],
        []
    ];

    game.tableau = [
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ];

    createDeck();
    shuffleDeck();
    dealCards();

    updateInterface();
    startTimer();
}


// ==========================================
// DEAL KLONDIKE
// ==========================================

function dealCards() {

    let cardIndex = 0;

    for (let column = 0; column < 7; column++) {

        for (let row = 0; row <= column; row++) {

            const card =
                game.deck[cardIndex];

            card.faceUp =
                row === column;

            game.tableau[column].push(card);

            cardIndex++;
        }
    }

    game.stock =
        game.deck.slice(cardIndex);
}


// ==========================================
// CARD COLOR
// ==========================================

function isRed(card) {

    return (
        card.suit === "hearts" ||
        card.suit === "diamonds"
    );
}


// ==========================================
// TABLEAU RULE
// ==========================================

function canPlaceOnTableau(
    movingCard,
    targetCard
) {

    if (!movingCard || !targetCard) {
        return false;
    }

    // Cards must alternate colors.

    if (
        isRed(movingCard) ===
        isRed(targetCard)
    ) {
        return false;
    }

    // Moving card must be one rank lower.

    return (
        movingCard.value ===
        targetCard.value - 1
    );
}


// ==========================================
// EMPTY TABLEAU RULE
// ==========================================

function canPlaceOnEmptyTableau(card) {

    return (
        card &&
        card.value === 13
    );
}


// ==========================================
// FOUNDATION RULE
// ==========================================

function canPlaceOnFoundation(
    card,
    foundation
) {

    if (!card) {
        return false;
    }

    // Empty foundation starts with Ace.

    if (foundation.length === 0) {

        return card.value === 1;
    }

    const topCard =
        foundation[
            foundation.length - 1
        ];

    return (
        card.suit === topCard.suit &&
        card.value === topCard.value + 1
    );
}


// ==========================================
// DRAW STOCK
// ==========================================

function drawCard() {

    clearSelection();

    if (game.stock.length > 0) {

        const card =
            game.stock.pop();

        card.faceUp = true;

        game.waste.push(card);

        game.moves++;

        updateInterface();

        return;
    }

    // Recycle waste.

    if (game.waste.length > 0) {

        while (game.waste.length > 0) {

            const card =
                game.waste.pop();

            card.faceUp = false;

            game.stock.push(card);
        }

        game.moves++;

        updateInterface();
    }
}


// ==========================================
// SELECT TABLEAU CARD
// ==========================================

function selectTableauCard(
    columnIndex,
    cardIndex
) {

    const column =
        game.tableau[columnIndex];

    const card =
        column[cardIndex];

    if (!card || !card.faceUp) {
        return;
    }

    if (!game.selected) {

        game.selected = {
            source: "tableau",
            column: columnIndex,
            cardIndex
        };

        updateInterface();

        return;
    }

    if (
        game.selected.source === "tableau" &&
        game.selected.column === columnIndex &&
        game.selected.cardIndex === cardIndex
    ) {

        clearSelection();

        return;
    }

    moveSelectedToTableau(
        columnIndex,
        cardIndex
    );
}


// ==========================================
// SELECT WASTE
// ==========================================

function selectWasteCard() {

    if (game.waste.length === 0) {
        return;
    }

    if (!game.selected) {

        game.selected = {
            source: "waste"
        };

        updateInterface();

        return;
    }

    clearSelection();
}


// ==========================================
// GET SELECTED CARDS
// ==========================================

function getSelectedCards() {

    if (!game.selected) {
        return [];
    }

    if (
        game.selected.source === "waste"
    ) {

        if (game.waste.length === 0) {
            return [];
        }

        return [
            game.waste[
                game.waste.length - 1
            ]
        ];
    }

    if (
        game.selected.source === "tableau"
    ) {

        const column =
            game.tableau[
                game.selected.column
            ];

        return column.slice(
            game.selected.cardIndex
        );
    }

    return [];
}


// ==========================================
// MOVE SELECTED TO TABLEAU
// ==========================================

function moveSelectedToTableau(
    targetColumnIndex,
    targetCardIndex = null
) {

    if (!game.selected) {
        return false;
    }

    const targetColumn =
        game.tableau[targetColumnIndex];

    const targetCard =
        targetColumn.length > 0
            ? targetColumn[
                targetCardIndex ??
                targetColumn.length - 1
            ]
            : null;


    // --------------------------------------
    // FROM TABLEAU
    // --------------------------------------

    if (
        game.selected.source ===
        "tableau"
    ) {

        const sourceColumnIndex =
            game.selected.column;

        const sourceCardIndex =
            game.selected.cardIndex;

        if (
            sourceColumnIndex ===
            targetColumnIndex
        ) {

            clearSelection();

            return false;
        }

        const sourceColumn =
            game.tableau[
                sourceColumnIndex
            ];

        const movingCards =
            sourceColumn.slice(
                sourceCardIndex
            );

        if (movingCards.length === 0) {
            clearSelection();
            return false;
        }

        const movingCard =
            movingCards[0];


        if (targetColumn.length === 0) {

            if (
                !canPlaceOnEmptyTableau(
                    movingCard
                )
            ) {

                clearSelection();

                return false;
            }

        } else {

            if (
                !canPlaceOnTableau(
                    movingCard,
                    targetCard
                )
            ) {

                clearSelection();

                return false;
            }
        }


        sourceColumn.splice(
            sourceCardIndex
        );

        targetColumn.push(
            ...movingCards
        );

        flipExposedCard(
            sourceColumn
        );

        finishMove();

        return true;
    }


    // --------------------------------------
    // FROM WASTE
    // --------------------------------------

    if (
        game.selected.source ===
        "waste"
    ) {

        const movingCard =
            game.waste[
                game.waste.length - 1
            ];

        if (!movingCard) {
            clearSelection();
            return false;
        }


        if (targetColumn.length === 0) {

            if (
                !canPlaceOnEmptyTableau(
                    movingCard
                )
            ) {

                clearSelection();

                return false;
            }

        } else {

            if (
                !canPlaceOnTableau(
                    movingCard,
                    targetCard
                )
            ) {

                clearSelection();

                return false;
            }
        }


        game.waste.pop();

        targetColumn.push(
            movingCard
        );

        finishMove();

        return true;
    }

    return false;
}


// ==========================================
// MOVE TO FOUNDATION
// ==========================================

function moveSelectedToFoundation(
    foundationIndex
) {

    if (!game.selected) {
        return false;
    }

    const foundation =
        game.foundations[
            foundationIndex
        ];


    // --------------------------------------
    // FROM WASTE
    // --------------------------------------

    if (
        game.selected.source ===
        "waste"
    ) {

        const card =
            game.waste[
                game.waste.length - 1
            ];

        if (
            !canPlaceOnFoundation(
                card,
                foundation
            )
        ) {

            clearSelection();

            return false;
        }

        game.waste.pop();

        foundation.push(card);

        finishMove();

        return true;
    }


    // --------------------------------------
    // FROM TABLEAU
    // --------------------------------------

    if (
        game.selected.source ===
        "tableau"
    ) {

        const column =
            game.tableau[
                game.selected.column
            ];

        const card =
            column[
                game.selected.cardIndex
            ];


        // Only the top card may move
        // directly to a foundation.

        if (
            game.selected.cardIndex !==
            column.length - 1
        ) {

            clearSelection();

            return false;
        }


        if (
            !canPlaceOnFoundation(
                card,
                foundation
            )
        ) {

            clearSelection();

            return false;
        }

        column.pop();

        foundation.push(card);

        flipExposedCard(column);

        finishMove();

        return true;
    }

    return false;
}


// ==========================================
// FLIP EXPOSED CARD
// ==========================================

function flipExposedCard(column) {

    if (column.length === 0) {
        return;
    }

    const card =
        column[column.length - 1];

    if (!card.faceUp) {

        card.faceUp = true;
    }
}


// ==========================================
// FINISH MOVE
// ==========================================

function finishMove() {

    game.moves++;

    clearSelection();

    updateInterface();

    checkWin();
}


// ==========================================
// CLEAR SELECTION
// ==========================================

function clearSelection() {

    game.selected = null;

    updateInterface();
}


// ==========================================
// DRAG START
// ==========================================

function startDragging(
    event,
    source,
    columnIndex = null,
    cardIndex = null
) {

    if (event.button !== undefined &&
        event.button !== 0) {

        return;
    }

    let cards = [];


    if (source === "tableau") {

        const column =
            game.tableau[columnIndex];

        const card =
            column[cardIndex];

        if (!card || !card.faceUp) {
            return;
        }

        cards =
            column.slice(cardIndex);

    }


    if (source === "waste") {

        if (game.waste.length === 0) {
            return;
        }

        cards = [
            game.waste[
                game.waste.length - 1
            ]
        ];
    }


    if (cards.length === 0) {
        return;
    }


    game.dragging = {
        source,
        columnIndex,
        cardIndex,
        cards,
        startX: event.clientX,
        startY: event.clientY
    };


    game.selected = {
        source,
        column: columnIndex,
        cardIndex
    };


    event.currentTarget.setPointerCapture(
        event.pointerId
    );

    event.currentTarget.classList.add(
        "dragging"
    );

    updateInterface();
}


// ==========================================
// DRAG MOVE
// ==========================================

function dragMove(event) {

    if (!game.dragging) {
        return;
    }

    const deltaX =
        event.clientX -
        game.dragging.startX;

    const deltaY =
        event.clientY -
        game.dragging.startY;


    // Slight visual movement while dragging.

    const draggedCards =
        document.querySelectorAll(
            ".card.selected"
        );

    draggedCards.forEach(card => {

        card.style.transform =
            `translate(${deltaX}px, ${deltaY}px)`;

    });
}


// ==========================================
// DRAG END
// ==========================================

function endDragging(event) {

    if (!game.dragging) {
        return;
    }


    const dragging =
        game.dragging;


    game.dragging = null;


    document
        .querySelectorAll(".card")
        .forEach(card => {

            card.classList.remove(
                "dragging"
            );

            card.style.transform = "";

        });


    // Find what is underneath the pointer.

    const target =
        document.elementFromPoint(
            event.clientX,
            event.clientY
        );


    if (!target) {

        clearSelection();

        return;
    }


    // Look for a tableau pile.

    const tableauElement =
        target.closest(".tableau-pile");


    if (tableauElement) {

        const columnIndex =
            Number(
                tableauElement.id
                    .replace("tableau-", "")
            ) - 1;


        const targetColumn =
            game.tableau[columnIndex];


        if (
            targetColumn.length === 0
        ) {

            moveSelectedToTableau(
                columnIndex,
                null
            );

            return;
        }


        moveSelectedToTableau(
            columnIndex,
            targetColumn.length - 1
        );

        return;
    }


    // Look for a foundation pile.

    const foundationElement =
        target.closest(".card-pile");


    if (
        foundationElement &&
        foundationElement.id.startsWith(
            "foundation-"
        )
    ) {

        const foundationIndex =
            Number(
                foundationElement.id
                    .replace(
                        "foundation-",
                        ""
                    )
            ) - 1;


        moveSelectedToFoundation(
            foundationIndex
        );

        return;
    }


    clearSelection();
}


// ==========================================
// RENDER STOCK
// ==========================================

function renderStock() {

    const element =
        document.getElementById("stock");

    if (!element) {
        return;
    }

    element.innerHTML = "";

    if (game.stock.length === 0) {

        element.classList.add("empty");

        return;
    }

    element.classList.remove("empty");

    const card =
        createCardElement(
            game.stock[
                game.stock.length - 1
            ],
            true
        );

    element.appendChild(card);
}


// ==========================================
// RENDER WASTE
// ==========================================

function renderWaste() {

    const element =
        document.getElementById("waste");

    if (!element) {
        return;
    }

    element.innerHTML = "";

    if (game.waste.length === 0) {
        return;
    }

    const card =
        game.waste[
            game.waste.length - 1
        ];

    const cardElement =
        createCardElement(
            card,
            false
        );

    if (
        game.selected &&
        game.selected.source === "waste"
    ) {

        cardElement.classList.add(
            "selected"
        );
    }

    element.appendChild(
        cardElement
    );
}


// ==========================================
// RENDER TABLEAU
// ==========================================

function renderTableau() {

    game.tableau.forEach(
        (column, columnIndex) => {

            const element =
                document.getElementById(
                    `tableau-${columnIndex + 1}`
                );

            if (!element) {
                return;
            }

            element.innerHTML = "";


            column.forEach(
                (card, cardIndex) => {

                    const cardElement =
                        createCardElement(
                            card,
                            !card.faceUp
                        );


                    if (
                        game.selected &&
                        game.selected.source ===
                            "tableau" &&
                        game.selected.column ===
                            columnIndex &&
                        cardIndex >=
                            game.selected.cardIndex
                    ) {

                        cardElement.classList.add(
                            "selected"
                        );
                    }


                    // ----------------------------------
                    // Click handling
                    // ----------------------------------

                    cardElement.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            if (!card.faceUp) {
                                return;
                            }

                            selectTableauCard(
                                columnIndex,
                                cardIndex
                            );

                        }
                    );


                    // ----------------------------------
                    // Pointer drag handling
                    // ----------------------------------

                    cardElement.addEventListener(
                        "pointerdown",
                        event => {

                            event.stopPropagation();

                            startDragging(
                                event,
                                "tableau",
                                columnIndex,
                                cardIndex
                            );

                        }
                    );


                    cardElement.addEventListener(
                        "pointermove",
                        dragMove
                    );


                    cardElement.addEventListener(
                        "pointerup",
                        endDragging
                    );


                    element.appendChild(
                        cardElement
                    );

                }
            );


            // Empty pile click.

            element.addEventListener(
                "click",
                () => {

                    if (
                        column.length === 0 &&
                        game.selected
                    ) {

                        moveSelectedToTableau(
                            columnIndex,
                            null
                        );
                    }

                }
            );

        }
    );
}


// ==========================================
// RENDER FOUNDATIONS
// ==========================================

function renderFoundations() {

    game.foundations.forEach(
        (foundation, index) => {

            const element =
                document.getElementById(
                    `foundation-${index + 1}`
                );

            if (!element) {
                return;
            }

            element.innerHTML = "";


            if (foundation.length === 0) {

                element.classList.add(
                    "empty"
                );

            } else {

                element.classList.remove(
                    "empty"
                );

                const card =
                    foundation[
                        foundation.length - 1
                    ];

                element.appendChild(
                    createCardElement(
                        card,
                        false
                    )
                );
            }


            element.onclick = () => {

                if (game.selected) {

                    moveSelectedToFoundation(
                        index
                    );
                }

            };


            element.onpointerdown =
                event => {

                    event.stopPropagation();

                };

        }
    );
}


// ==========================================
// CREATE CARD ELEMENT
// ==========================================

function createCardElement(
    card,
    faceDown = false
) {

    const element =
        document.createElement("div");

    element.classList.add("card");


    if (faceDown) {

        element.classList.add(
            "face-down"
        );

        element.setAttribute(
            "aria-label",
            "Face-down card"
        );

        return element;
    }


    element.classList.add(
        card.suit
    );

    element.dataset.suit =
        card.suit;

    element.dataset.rank =
        card.rank;

    element.innerHTML = `

        <span class="card-rank">
            ${card.rank}
        </span>

        <span class="card-suit">
            ${getSuitSymbol(card.suit)}
        </span>

    `;

    return element;
}


// ==========================================
// SUIT SYMBOLS
// ==========================================

function getSuitSymbol(suit) {

    const symbols = {

        hearts: "♥",
        diamonds: "♦",
        clubs: "♣",
        spades: "♠"

    };

    return symbols[suit] || "";
}


// ==========================================
// TIMER
// ==========================================

function startTimer() {

    stopTimer();

    game.timerRunning = true;

    game.timer =
        setInterval(() => {

            if (!game.timerRunning) {
                return;
            }

            game.seconds++;

            updateTimer();

        }, 1000);
}


function stopTimer() {

    game.timerRunning = false;

    if (game.timer !== null) {

        clearInterval(
            game.timer
        );

        game.timer = null;
    }
}


function formatTime(totalSeconds) {

    const minutes =
        Math.floor(totalSeconds / 60)
            .toString()
            .padStart(2, "0");

    const seconds =
        (totalSeconds % 60)
            .toString()
            .padStart(2, "0");

    return `${minutes}:${seconds}`;
}


function updateTimer() {

    const element =
        document.getElementById(
            "timer"
        );

    if (element) {

        element.textContent =
            formatTime(
                game.seconds
            );
    }
}


// ==========================================
// UPDATE INTERFACE
// ==========================================

function updateInterface() {

    const movesElement =
        document.getElementById(
            "moves"
        );

    if (movesElement) {

        movesElement.textContent =
            game.moves;
    }

    updateTimer();

    renderStock();
    renderWaste();
    renderTableau();
    renderFoundations();
}


// ==========================================
// SETTINGS
// ==========================================

function openSettings() {

    const dialog =
        document.getElementById(
            "settings-dialog"
        );

    if (
        dialog &&
        typeof dialog.showModal ===
            "function"
    ) {

        dialog.showModal();
    }
}


function closeSettings() {

    const dialog =
        document.getElementById(
            "settings-dialog"
        );

    if (dialog) {

        dialog.close();
    }
}


// ==========================================
// HORROR THEMES
// ==========================================

function changeTheme(theme) {

    const validThemes = [
        "graveyard",
        "haunted",
        "bloodmoon"
    ];

    if (
        !validThemes.includes(theme)
    ) {

        theme = "bloodmoon";
    }

    document.body.dataset.theme =
        theme;

    localStorage.setItem(
        "horrorSolitaireTheme",
        theme
    );
}


function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "horrorSolitaireTheme"
        );

    const theme =
        savedTheme || "bloodmoon";

    changeTheme(theme);

    const selector =
        document.getElementById(
            "theme"
        );

    if (selector) {

        selector.value = theme;
    }
}


// ==========================================
// CARD BACK DESIGN
// ==========================================

function changeCardback(cardback) {

    const validCardbacks = [
        "cardback-1",
        "cardback-2",
        "cardback-3"
    ];

    if (
        !validCardbacks.includes(cardback)
    ) {

        cardback = "cardback-3";
    }

    document.body.dataset.cardback =
        cardback;

    localStorage.setItem(
        "horrorSolitaireCardback",
        cardback
    );
}


function loadCardback() {

    const savedCardback =
        localStorage.getItem(
            "horrorSolitaireCardback"
        );

    const cardback =
        savedCardback || "cardback-3";

    changeCardback(cardback);

    const selector =
        document.getElementById(
            "cardback"
        );

    if (selector) {

        selector.value = cardback;
    }
}


// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {

    // New game

    const newGameButton =
        document.getElementById(
            "new-game"
        );

    if (newGameButton) {

        newGameButton.addEventListener(
            "click",
            newGame
        );
    }


    // Stock

    const stockElement =
        document.getElementById(
            "stock"
        );

    if (stockElement) {

        stockElement.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                drawCard();

            }
        );
    }


    // Waste

    const wasteElement =
        document.getElementById(
            "waste"
        );

    if (wasteElement) {

        wasteElement.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                selectWasteCard();

            }
        );


        wasteElement.addEventListener(
            "pointerdown",
            event => {

                event.stopPropagation();

                startDragging(
                    event,
                    "waste"
                );

            }
        );


        wasteElement.addEventListener(
            "pointermove",
            dragMove
        );


        wasteElement.addEventListener(
            "pointerup",
            endDragging
        );
    }


    // Settings

    const settingsButton =
        document.getElementById(
            "settings"
        );

    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            openSettings
        );
    }


    // Close settings

    const closeSettingsButton =
        document.getElementById(
            "close-settings"
        );

    if (closeSettingsButton) {

        closeSettingsButton.addEventListener(
            "click",
            closeSettings
        );
    }


    // Theme selector

    const themeSelector =
        document.getElementById(
            "theme"
        );

    if (themeSelector) {

        themeSelector.addEventListener(
            "change",
            event => {

                changeTheme(
                    event.target.value
                );

            }
        );
    }


    // Card back selector

    const cardbackSelector =
        document.getElementById(
            "cardback"
        );

    if (cardbackSelector) {

        cardbackSelector.addEventListener(
            "change",
            event => {

                changeCardback(
                    event.target.value
                );

            }
        );
    }
}


// ==========================================
// START APPLICATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTheme();
        loadCardback();

        setupEventListeners();

        newGame();

    }
);