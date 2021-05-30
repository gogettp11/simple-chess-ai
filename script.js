var board = null
var game = new Chess()

var pieces_values = new Map()
pieces_values.set(game.PAWN, 2)
pieces_values.set(game.KNIGHT, 3)
pieces_values.set(game.BISHOP, 4)
pieces_values.set(game.ROOK, 5)
pieces_values.set(game.QUEEN, 12)
pieces_values.set(game.KING , 20)

temp_data = new Map()


function monteCarloSearch(game_state, max_time, is_maximizing){
  temp_data = new Map() //stored data - key: fen , value: tuple(score_sum, simulations_num)
  exec_time = new Date().getTime() + max_time
  while(exec_time > new Date().getTime()){
    state_list = []
    leaf = selection(is_maximizing, game_state, state_list) // keep track on path
    leaf = expand(leaf, state_list)
    //value = simulation(leaf) omit because js is not appropiate for such hard computing tasks
    backpropagation(leaf)
  }

  function selection(is_maximizing, game_state, state_list){
    moves = game_state.moves()
    move_val_tuple = []
    // choose best route
    for(i=0;i<moves.length;i++){
      game_state.move(moves[i])
      value = temp_data.get(game_state.fen())
      if(typeof value == "undefined")
        value = evalBoard(game_state)
      else
        move_val_tuple.push((moves[i], value))
    }
  }
}

function randomMonteCarlo(game_state, max_time, is_maximizing, depth){
  //temp_data = new Map() //stored data - key: fen , value: tuple(score_sum, simulations_num)
  exec_time = new Date().getTime() + max_time
  while(exec_time > new Date().getTime()){
    randomSelection(game_state, depth)
  }

  //select best move
  moves = game_state.moves()
  temp_value = -100
  move = null
  for(i=0;i<moves.length;i++){
    game_state.move(moves[i])
    if(temp_data.has(game_state.fen())){
      temp_node = temp_data.get(game_state.fen())
      if(is_maximizing){
        if(temp_node.value/temp_node.sim_num > temp_value){
          temp_value = temp_node.value/temp_node.sim_num
          move = moves[i]
        }
      }else{
        if(temp_node.value/temp_node.sim_num < temp_value){
          temp_value = temp_node.value/temp_node.sim_num
          move = moves[i]
        }
      }
    }
    game_state.undo()
  }
  return {"move":move , "score": temp_value}

  function randomSelection(game_state, depth){

    if(game_state.game_over() || depth < 1){
      /* if(game_state.in_checkmate()){
        if(game_state.fen().includes('w')){
          return 100
        }else{
          return -100
        }
      }else if(game_state.in_draw()){
        if(game_state.fen().includes('w')){
          return -50
        }else{
          return 50
        }
      }else{ */
        return evalBoard(game_state)
      // }
    }

    moves = game_state.moves()
    var randomIdx = Math.floor(Math.random() * moves.length)
    move = moves[randomIdx]
    game_state.move(move)

    final_value = randomSelection(game_state, depth-1)

    if(temp_data.has(game_state.fen())){
      temp_node = temp_data.get(game_state.fen())
      temp_data.set(game_state.fen(), {"value":temp_node.value+final_value.score,"sim_num":temp_node.sim_num+1})
    }else{
      temp_data.set(game_state.fen(), {"value":final_value.score,"sim_num":1})
    }
    game_state.undo()

    return final_value
  }
}

function evalBoard(game_state_v){
  let value = 0
  game_state = game_state_v.fen()
  let max = game_state.indexOf(' ')

  if(game_state_v.in_checkmate()){
    if(game_state.includes('w'))
      return {"score": -500}
    else
      return {"score": 500}
  }
  else if(game_state_v.in_draw()){
    if(game_state.includes('w'))
      return {"score": 200}
    else
      return {"score": -200}
  }
  else{
    for(let i = 0; i < max; i++){
      if(/[A-Z]/.test(game_state[i]))
        value += pieces_values.get(game_state[i].toLowerCase())
      else if(/[a-z]/.test(game_state[i]))
        value -= pieces_values.get(game_state[i])
    }
  }
  return {"score":value}
}

function minimax(depth, game, alfa,beta, isMaximisingPlayer) {
  if (depth === 0 || game.game_over()) {
      return evalBoard(game);
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

  var possibleMoves = game.moves()
  let move
  let depth = 3

  if(round_counter > -1){
    if(round_counter%2) //minimize score
      move = minimax(depth,game,-9999,9999, false)
    else                // maximize score
      move = randomMonteCarlo(game, 50000, true, 10)
  game.move(move.move)
  }else{
    var randomIdx = Math.floor(Math.random() * possibleMoves.length)
    move = possibleMoves[randomIdx]
    game.move(move)
  }
  console.log("score: " + move.score + " move: " + move.move + "round: " + round_counter)
  round_counter++
  board.position(game.fen())

  window.setTimeout(makeRandomMove, 500)
}

board = Chessboard('myBoard', 'start')

window.setTimeout(makeRandomMove, 500)