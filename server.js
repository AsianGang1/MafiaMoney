var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var port = process.env.PORT || 5000;
app.set('port', port);
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
app.use('/static', express.static(__dirname + '/static'))
server.listen(port, function() {
  console.log('Starting server on port ' + port);
});
var players = []
var item_costs = {1:12,2:5}
io.on('connection', function(socket) {
	socket.on('new player',function(name){
		console.log(name + ' joined')
        player = new Object();
        player.id = socket.id;
        player.name = name;
        player.money = 10;
        player.henchmen = 0;
        player.wrenchmen = 0;
        player.search_candidates = []
        players.push(player);
	});

  socket.on('change',function(name){
		players.find(player => player.id === socket.id).name = name;
    console.log(players);
	});

  socket.on('disconnect', function(){
    if (players.find(player => player.id === socket.id)){
      console.log(players.find(player => player.id === socket.id).name + " left")
      players = players.filter(player => player.id !== socket.id)
    }
  });

  socket.on('buy', function(item_id){
    player = players.find(player => player.id === socket.id)
    if(player.money >= item_costs[item_id]){
      player.money -= item_costs[item_id]
      switch(item_id) {
        case 1:
          player.henchmen++
          break;
        case 2:
          player.wrenchmen++
          break;
      }
      socket.emit('bought', player)
      socket.emit('update', player)
    }
  })
  socket.on("search", function(){
    player = players.find(player => player.id === socket.id)
    if(player.henchmen == 0) {
      socket.emit('results', 1)
    }
    else if(player.money >= 1){
      var candidate_nums = []
      if(players.length > 1){
        for(var i = 0; i < Math.min(players.length-1, 3); i ++){
          rand = Math.floor(Math.random()*players.length)
          if (!candidate_nums.includes(rand) && rand != players.indexOf(player)){
            candidate_nums.push(rand)
          }
          else{
            i--
          }
        }
      }
      if (candidate_nums != []){
        player.money-=1
      }
      player.search_candidates = []
      candidate_nums.forEach(num => {
        var opponent = players[num]
        var search_item = JSON.parse(JSON.stringify(opponent));
        search_item.money = Math.floor(opponent.money/10)
        search_item.win_chance = player.henchmen/(opponent.henchmen+player.henchmen)*100
        if(search_item.money > 2){
          player.search_candidates.push(search_item)
        }
      });
      socket.emit('results', player.search_candidates)
    }
    socket.emit('update', player)
  })
  socket.on('attack', function(attack_id){
    player = players.find(player => player.id === socket.id)
    opponent = players.find(e => e.id == player.search_candidates[attack_id].id)
    rand = Math.random() * 100
    if(rand < player.search_candidates[attack_id].win_chance){
      var loot = player.search_candidates[attack_id].money
      player.money+=loot
      opponent.money-=loot
      deaths = Math.floor(Math.random()*Math.floor(opponent.henchmen/4))
      opponent.henchmen-=deaths
      io.to(opponent.id).emit('raid', 0, loot, deaths, player)
      socket.emit('raid', 1, loot, deaths, opponent)
    }
    else{
      deaths = Math.ceil(Math.random()*Math.ceil(player.henchmen/4))
      player.henchmen-=deaths
      io.to(opponent.id).emit('raid', 2, loot, deaths, player)
      socket.emit('raid', 3, loot, deaths, opponent)
    }
    player.search_candidates = []
    socket.emit('results', 2)
    socket.emit('update', player)
    io.to(opponent.id).emit('update', opponent)
  })
});
setInterval(() => {
  players.forEach(e => {
    e.money+=e.wrenchmen
    io.to(e.id).emit('update', e)
  });
}, 1000 );
