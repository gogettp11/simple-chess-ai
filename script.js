var board = null
var game = new Chess()

var pieces_values = new Map()
pieces_values.set(game.PAWN, 2)
pieces_values.set(game.KNIGHT, 3)
pieces_values.set(game.BISHOP, 4)
pieces_values.set(game.ROOK, 5)
pieces_values.set(game.QUEEN, 12)
pieces_values.set(game.KING , 40)

function customExp(base, x){return Math.pow(base,x)}

MCTS_CONST = 1

temp_data = new Map() //stored data - key: sliced fen , value: tuple(score_sum, simulations_num)
temp_data2 = new Map() //stored data - key: sliced fen , value: tuple(score_sum, simulations_num)
temp_data3 = new Map() //stored data - key: sliced fen , value: tuple(score_sum, simulations_num)

function fenConversion(fen_string){
  max = fen_string.indexOf(' ') //search for space
  return fen_string.slice(0,max)
}

function weightedChoice(array, weights, base) {
  new_weights = weights.map(function(e){return customExp(base, e)})
  let s = new_weights.reduce((a, e) => a + e);
  let r = Math.random() * s;
  return array.find((e, i) => (r -= new_weights[i]) < 0);
}

function customMonteCarlo(game_state, max_time, is_maximizing, max_depth){
  exec_time = new Date().getTime() + max_time
  current_state_fen = game_state.fen()
  while(exec_time > new Date().getTime()){
    path = []
    value = selection(is_maximizing, game_state, path, max_depth) // selection, extend, and simulation step
    game_state.load(current_state_fen)
    backpropagation(path, value, game_state)
    game_state.load(current_state_fen)
  }

  moves = game_state.moves()
  temp_value = 0
  if(is_maximizing)
    temp_value = -9999
  else
    temp_value = 9999

  move = null
  for(i=0;i<moves.length;i++){
    game_state.move(moves[i])
    if(temp_data3.has(fenConversion(game_state.fen()))){
      temp_node = temp_data3.get(fenConversion(game_state.fen()))
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

  function backpropagation(path, value, game_state){
    for(i=0;i<path.length;i++){
      game_state.move(path[i])
      if(!temp_data3.has(fenConversion(game_state.fen()))) // add new 
        temp_data3.set(fenConversion(game_state.fen()), {"value":evalBoard(game_state).score,"sim_num":1})
      else{  //update existing
        temp_node = temp_data3.get(fenConversion(game_state.fen()))
        temp_data3.set(fenConversion(game_state.fen()), {"value":temp_node.value+value,"sim_num":temp_node.sim_num+1})
      }
    }
  }

  function selection(is_maximizing, game_state, path, max_depth){

    if(max_depth < 1 || game_state.game_over()){
      return evalBoard(game_state).score
    }

    moves = game_state.moves()
    weight_array = []
    move_array = []
    //calculate probabilty distribution
    for(i=0;i<moves.length;i++){
      game_state.move(moves[i])
      move_array.push(moves[i])
      if(temp_data3.has(fenConversion(game_state.fen()))){ // value based on history
        temp_node = temp_data3.get(fenConversion(game_state.fen()))
        weight_array.push(temp_node.value/temp_node.sim_num)
      } // new value
      else
        weight_array.push(evalBoard(game_state).score)
      game_state.undo()
    }
    //choose one node randomly from distribution
    base = Math.E
    if(!is_maximizing)
      base = 0.5
    best_move = weightedChoice(move_array, weight_array, base)
    path.push(best_move)
    game_state.move(best_move)
    //loop
    return selection(!is_maximizing, game_state, path, max_depth-1)
  }
}

function monteCarloSearch(game_state, max_time, is_maximizing, max_depth){
  exec_time = new Date().getTime() + max_time
  current_state_fen = game_state.fen()
  while(exec_time > new Date().getTime()){
    path = []
    value = selection(is_maximizing, game_state, path, max_depth) // selection, extend, and simulation step
    game_state.load(current_state_fen)
    backpropagation(path, value, game_state)
    game_state.load(current_state_fen)
  }
  //select best move
  moves = game_state.moves()
  temp_value = 0
  if(is_maximizing)
    temp_value = -9999
  else
    temp_value = 9999

  move = null
  for(i=0;i<moves.length;i++){
    game_state.move(moves[i])
    if(temp_data.has(fenConversion(game_state.fen()))){
      temp_node = temp_data.get(fenConversion(game_state.fen()))
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

  function backpropagation(path, value, game_state){
    for(i=0;i<path.length;i++){
      game_state.move(path[i])
      if(!temp_data.has(fenConversion(game_state.fen()))) // add new 
        temp_data.set(fenConversion(game_state.fen()), {"value":evalBoard(game_state).score,"sim_num":1})
      else{  //update existing
        temp_node = temp_data.get(fenConversion(game_state.fen()))
        temp_data.set(fenConversion(game_state.fen()), {"value":temp_node.value+value,"sim_num":temp_node.sim_num+1})
      }
    }
  }

  function selection(is_maximizing, game_state, path, max_depth){
    moves = game_state.moves()
    unknown_terrain = true
    is_checkmate = false
    if(is_maximizing)
      value = -9999
    else
      value = 9999
    move = null
    if(!temp_data.has(fenConversion(game_state.fen())))
      temp_data.set(fenConversion(game_state.fen()), {"value":evalBoard(game_state).score,"sim_num":1})
    current_node_data = temp_data.get(fenConversion(game_state.fen()))
    // choose best route
    for(i=0;i<moves.length;i++){
      game_state.move(moves[i])
      if(temp_data.has(fenConversion(game_state.fen()))){
        node_data = temp_data.get(fenConversion(game_state.fen()))
        temp_value = node_data.value/node_data.sim_num + (MCTS_CONST*(Math.sqrt(Math.log(current_node_data.sim_num)/node_data.sim_num)))
        unknown_terrain = false
      }
      else
        temp_value = evalBoard(game_state).score

      if(is_maximizing){
        if(temp_value > value){
          move = moves[i]
          value = temp_value
        }
      }else{
        if(temp_value < value){
          move = moves[i]
          value = temp_value
        }
      }
      game_state.undo()
    }
    game_state.move(move)
    is_checkmate = game_state.game_over()
    if(is_checkmate){
      return evalBoard(game_state)
    }
    else if(unknown_terrain){ //exapand step
      game_state.undo()
      moves = game_state.moves()
      var randomIdx = Math.floor(Math.random() * moves.length)
      random_move = moves[randomIdx]
      game_state.move(random_move)
      path.push(random_move)
      //simulation
      counter = 0
      while(counter <= max_depth && !game_state.game_over()){
        moves = game_state.moves()
        var randomIdx = Math.floor(Math.random() * moves.length)
        random_move = moves[randomIdx]
        game_state.move(random_move)
        counter++
      }
      return evalBoard(game_state).score
    }
    else{
      path.push(move)
      return selection(!is_maximizing, game_state, path, max_depth)
    }
  }
}

function randomMonteCarlo(game_state, max_time, is_maximizing, depth){
  exec_time = new Date().getTime() + max_time
  while(exec_time > new Date().getTime()){
    randomSelection(game_state, depth) //all steps are here
  }

  //select best move
  moves = game_state.moves()
  temp_value = 0
  if(is_maximizing)
    temp_value = -9999
  else
    temp_value = 9999

  move = null
  for(i=0;i<moves.length;i++){
    game_state.move(moves[i])
    if(temp_data2.has(fenConversion(game_state.fen()))){
      temp_node = temp_data2.get(fenConversion(game_state.fen()))
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

    if(game_state.game_over() || depth < 1)
        return evalBoard(game_state)
    

    moves = game_state.moves()
    var randomIdx = Math.floor(Math.random() * moves.length)
    move = moves[randomIdx]
    game_state.move(move)

    final_value = randomSelection(game_state, depth-1)

    if(temp_data2.has(fenConversion(game_state.fen()))){
      temp_node = temp_data2.get(fenConversion(game_state.fen()))
      temp_data2.set(fenConversion(game_state.fen()), {"value":temp_node.value+final_value.score,"sim_num":temp_node.sim_num+1})
    }else{
      temp_data2.set(fenConversion(game_state.fen()), {"value":final_value.score,"sim_num":1})
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

  if(round_counter > 4){
    if(round_counter%2){ //minimize score
      //move = minimax(depth,game,-9999,9999, false)
      //move = monteCarloSearch(game, 3000, false, 2)
      move = customMonteCarlo(game, 4000, false, 3)
    }
    else{                // maximize score
      move = minimax(depth,game,-9999,9999, true)
      //move = randomMonteCarlo(game, 2000, true, 3)
      //move = monteCarloSearch(game, 4000, true, 3)
    }
  game.move(move.move)
  }else{
    var randomIdx = Math.floor(Math.random() * possibleMoves.length)
    move = possibleMoves[randomIdx]
    game.move(move)
  }
  console.log("score: " + move.score + " move: " + move.move + " round: " + round_counter)
  round_counter++
  board.position(game.fen())

  window.setTimeout(makeRandomMove, 500)
}

board = Chessboard('myBoard', 'start')

window.setTimeout(makeRandomMove, 500)