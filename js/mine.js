'use strict'
const MINE = '💣'
const FLAG = '🚩'
var gBoard
var clickCount = 0
var stopwatchInterval
var startTime

const gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0

}

const gLevel = {
    SIZE: 4,
    MINES: 2,
}

function onInit() {
    gGame.isOn = true
    gBoard = buildBoard(gLevel.SIZE)
    renderBoard(gBoard)
    var minesLocationsArray = setMines(gBoard)
    setMinesNegsCount(gBoard, minesLocationsArray)
    //This is called when page loads
}

function setBoardSize(elButton) {
    console.log('click');
    if (elButton.innerText === 'Easy') {
        gLevel.SIZE = 4
        gLevel.MINES = 2
        restartGame()
    } else if (elButton.innerText === 'Medium') {
        gLevel.SIZE = 8
        gLevel.MINES = 14
        restartGame()
    } else if (elButton.innerText === 'Expert') {
        gLevel.SIZE = 12
        gLevel.MINES = 32
        restartGame()
    }
}

function updateStopwatch() {
    // Calculate elapsed time
    var currentTime = new Date().getTime();
    var elapsedTime = currentTime - startTime;

    // Convert milliseconds to minutes and seconds
    var minutes = Math.floor(elapsedTime / (1000 * 60));
    var seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);

    // Format the time (add leading zeros if needed)
    var formattedTime = padZero(minutes) + ":" + padZero(seconds);

    // Update the stopwatch display
    document.getElementById("stopwatch").innerText = formattedTime;
}

function padZero(num) {
    return (num < 10) ? "0" + num : num;
}

function restartGame() {
    gGame.shownCount = 0
    gGame.markedCount = 0
    clickCount = 0
    const elGameOver = document.querySelector('h2')
    elGameOver.classList += 'gameOver hidden'
    // Stop the stopwatch interval
    clearInterval(stopwatchInterval);
    onInit()
}

function buildBoard(size) {
    //Builds the board Set the mines Call setMinesNegsCount() Return the created board
    var board = []
    for (var i = 0; i < size; i++) {
        board[i] = []
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCell: 4,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
        }
    }
    return board
}

function setMinesNegsCount(board) {
    //Count mines around each cell
    // and set the cell's minesAroundCount.
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var minesAroundCount = 0

            for (var a = (i - 1); a <= (i + 1); a++) {
                if (a < 0 || a >= board.length) continue

                for (var b = (j - 1); b <= (j + 1); b++) {
                    if (board[i][j].isMine) continue
                    if (b < 0 || b >= board[i].length) continue
                    if (a === i && b === j) continue
                    if (board[a][b].isMine) minesAroundCount++

                    var cellName = '.' + getClassName({ i: i, j: j })
                    var elCell = document.querySelector(`${cellName} span`)
                    elCell.innerText = minesAroundCount
                }
            }
            board[i][j].minesAroundCell = minesAroundCount
        }
    }
}

function renderBoard(board) {
    var strHtml = `<tbody>`
    for (var i = 0; i < board.length; i++) {
        strHtml += '<tr>'
        for (var j = 0; j < board[i].length; j++) {
            var cellClass = getClassName({ i: i, j: j })
            strHtml += `<td class="cell ${cellClass}"
            oncontextmenu="onCellMarked(this,${i},${j}); return false;"
                onclick="onCellClicked(this,${i},${j})">
                <span class="hidden"></span></td>`
        }
        strHtml += '</tr>'
    }
    strHtml += '</tbody>'

    const elContainer = document.querySelector('table')
    elContainer.innerHTML = strHtml; // Append the generated HTML to the DOM
}

function onCellClicked(elCell, i, j) {
    // Called when a cell is clicked
    if (!gGame.isOn) return
    if (gBoard[i][j].isShown || gBoard[i][j].isMarked) return
    //check if game over:
    if (clickCount > 0 && gBoard[i][j].isMine) {
        //DOM
        toOpenCell(elCell, i, j)
        //model
        gGame.isOn = false
        //show text: DOM
        const elGameOver = document.querySelector('h2')
        elGameOver.innerText = 'Game Over, You LOST...'
        elGameOver.classList.remove('hidden')
        console.log('Game Over, You LOST...');
        // clear stopwatch
        clearInterval(stopwatchInterval);
        //audio
        const explosionAudio = new Audio('js/explosion.mp3')
        explosionAudio.play()
        return
    }
    //first cell cant be the mine:
    if (clickCount === 0 && gBoard[i][j].isMine) {
        while (gBoard[i][j].isMine) {
            onInit()
            if (gBoard[i][j].minesAroundCell === 0 && !gBoard[i][j].isMine) {
                expandShown(gBoard, elCell, i, j)
            }
        }
    }
    //DOM
    if (gBoard[i][j].minesAroundCell === 0 && !gBoard[i][j].isMine) {
        expandShown(gBoard, elCell, i, j)
    } else toOpenCell(elCell, i, j)
    clickCount++
    checkGameOver()
}

function onCellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    if (gBoard[i][j].isShown) return

    if (gBoard[i][j].isMarked) {
        //remove flag model
        gBoard[i][j].isMarked = false
        gGame.markedCount--
        //remove flag DOM
        elCell.innerText = ''
        elCell.innerHTML = `<span class="hidden">${gBoard[i][j].minesAroundCell}</span>`
    } else {
        // set flag model
        gBoard[i][j].isMarked = true
        gGame.markedCount++
        //set flag DOM
        elCell.innerText += FLAG
    }
    //Called when a cell is right-clicked 
    checkGameOver()
}

function checkGameOver() {
    //Game ends when all mines are marked, and all the other cells are shown    
    const boardSize = gLevel.SIZE
    if (gGame.markedCount === gLevel.MINES && gGame.shownCount === boardSize * boardSize - gLevel.MINES) {
        //update text DOM:
        const elGameOver = document.querySelector('h2')
        elGameOver.innerText = 'Congratulations, You WON!'
        elGameOver.classList.remove('hidden')
        console.log('Congratulations, You WON!')
        //model
        gGame.isOn = false
        // clear stopwatch
        clearInterval(stopwatchInterval);
        //sound
        const victoryAudio = new Audio('js/victory.mp3')
        victoryAudio.play()
    } else {
        return
    }
}

function expandShown(board, elCell, row, coll) {
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = coll - 1; j <= coll + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            if (i === row && j === coll) continue

            toOpenCell(elCell, i, j)
            if (gBoard[i][j].minesAroundCell === 0 && !gBoard[i][j].isMine) {
                checkNeighbors(i, j, elCell, board)
            }
        }
    }
}

function checkNeighbors(i, j, elCell, board) {
    for (var a = i - 1; a <= i + 1; a++) {
        if (a < 0 || a >= board.length) continue
        for (var b = j - 1; b <= j + 1; b++) {
            if (b < 0 || b >= board[a].length) continue
            if (a === i && b === j) continue
            toOpenCell(elCell, a, b)
        }
    }
}


function toOpenCell(elCell, i, j) {
    //model
    if (gBoard[i][j].isShown) return
    gBoard[i][j].isShown = true
    gGame.shownCount++
    console.log(gGame.shownCount);
    const getCellName = '.' + getClassName({ i: i, j: j })
    //DOM
    const elTextSpan = document.querySelector(`${getCellName} span`)
    const elStyleCell = document.querySelector(` ${getCellName} `)
    elTextSpan.classList.remove('hidden')
    //change style
    elCell.style = `box-shadow: inset 3px -4px 16px rgb(255, 194, 156)`
    elStyleCell.style = `box-shadow: inset 3px -4px 16px rgb(255, 194, 156)`
    if (gBoard[i][j].minesAroundCell === 0 && !gBoard[i][j].isMine) {
        elTextSpan.innerText = ''
    }
    //start stopwatch
    if (clickCount === 0)
        startTime = new Date().getTime();
    stopwatchInterval = setInterval(updateStopwatch, 1000);
    //add audio
    var clickAudio = new Audio('js/onClick.mp3')
    clickAudio.play()
}


function setMines(board) {
    var size = gLevel.SIZE
    for (var i = 0; i < gLevel.MINES; i++) {
        var row = getRandomInt(0, size)
        var coll = getRandomInt(0, size)
        if (board[row][coll].isMine) {
            i--
            continue
        }
        else {
            //model
            board[row][coll].isMine = true
            //dom
            var cellName = '.' + getClassName({ i: row, j: coll })
            var elCell = document.querySelector(`${cellName} span`)
            elCell.innerText = MINE
        }
    }
}

function getClassName(position) {
    const cellClass = `cell-${position.i}-${position.j}`
    return cellClass
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}