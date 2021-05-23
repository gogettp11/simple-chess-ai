var board = null
var game = new Chess()

var pieces_values = new Map()
pieces_values.set(game.PAWN, 2)
pieces_values.set(game.KNIGHT, 3)
pieces_values.set(game.BISHOP, 4)
pieces_values.set(game.ROOK, 5)
pieces_values.set(game.QUEEN, 12)
pieces_values.set(game.KING , 20)

var board_state_history = []


function evalBoard(game_state){
  let max = game_state.indexOf(' ')
  let value = 0
  for(let i = 0; i < board_state_history.length; i++){
    if(board_state_history[i].slice(0, max) == game_state.slice(0, max)){
      console.log("repetition")
      if(game_state.includes('w'))
        value -= 30
      else
        value += 30
    }
  }
  for(let i = 0; i < max; i++){
    if(/[A-Z]/.test(game_state[i]))
      value += pieces_values.get(game_state[i].toLowerCase())
    else if(/[a-z]/.test(game_state[i]))
      value -= pieces_values.get(game_state[i])
  }
  return {"score":value}
}

function minimax(depth, game, alfa,beta, isMaximisingPlayer) {
  if (depth === 0 || game.game_over()) {
      return evalBoard(game.fen());
  }
  var newGameMoves = game.moves();
  var temp_score = 0

  if (isMaximisingPlayer) {
      var bestMove = {"score": -9999, "move": null}
      for (var i = 0; i < newGameMoves.length; i++) {
          game.move(newGameMoves[i]);
          temp_score = minimax(depth - 1, game, alfa,beta,!isMaximisingPlayer).score;
          alfa = Math.max(alfa, temp_score)
          if(temp_score > bestMove.score){
            bestMove.score = temp_score
            bestMove.move = newGameMoves[i]
          }else if(alfa >= beta){
            game.undo();
            break
          }
          game.undo();
      }
      return bestMove;
  } else {
      var bestMove = {"score": 9999, "move": null}
      for (var i = 0; i < newGameMoves.length; i++) {
          game.move(newGameMoves[i]);
          temp_score = minimax(depth - 1, game, alfa,beta,!isMaximisingPlayer).score;
          beta = Math.min(beta, temp_score)
          if(temp_score < bestMove.score){
            bestMove.score = temp_score
            bestMove.move = newGameMoves[i]
          }else if(beta <= alfa){
            game.undo();
            break
          }
          game.undo();
      }
      return bestMove;
  }
}
let round_counter = 0

function makeRandomMove () {
  // exit if the game is over
  if (game.game_over()) return

  board_state_history.push(game.fen())
  var possibleMoves = game.moves()
  let move
  if(round_counter > 24){
    if(round_counter%2) //minimize score
      move = minimax(3,game,-9999,9999, false)
    else                // maximize score
      move = minimax(2,game,-9999,9999, true)
  game.move(move.move)
  }else{
    var randomIdx = Math.floor(Math.random() * possibleMoves.length)
    move = possibleMoves[randomIdx]
    game.move(move)
  }
  console.log("score: " + move.score + " move: " + move.move)
  round_counter++
  board.position(game.fen())

  window.setTimeout(makeRandomMove, 500)
}

board = Chessboard('myBoard', 'start')

window.setTimeout(makeRandomMove, 500)