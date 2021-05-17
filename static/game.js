socket = io()
var player_name = Math.random().toString().slice(2,11);
socket.emit('new player', player_name)
document.getElementById('name').value = player_name
function change(){
    socket.emit('change', document.getElementById('name').value)
}
function buy(id){
    socket.emit('buy', id)
}
socket.on('update', function(player){
    document.getElementById('name').innerHTML = player.name
    document.getElementById('money').innerHTML = "Money: $"+player.money
    document.getElementById('henchmen').innerHTML = "Henchmen ($12): "+player.henchmen
    document.getElementById('wrenchmen').innerHTML = "Wrenchmen [$1 per second] ($5): "+player.wrenchmen
})
socket.on('results', function(candidates){
    if(candidates.length == 0){
        document.getElementById('results').innerHTML = "No results"
    }
    else if(candidates == 1){
        document.getElementById('results').innerHTML = "Need henchmen to fight"
    }
    else if(candidates == 2){
        document.getElementById('results').innerHTML = ""
    }
    else{
        document.getElementById('results').innerHTML = ""
        candidates.forEach(element => {
            document.getElementById('results').innerHTML += `<div class='border-box'>
            <h4>${element.name}</h4>
            <h5>Money Available: ${element.money}</h5>
            <h5>Henchmen: ${element.henchmen}</h5>
            <h5>Win Chance: ${element.win_chance}%</h5>
            <button onclick="socket.emit('attack', ${candidates.indexOf(element)})">Attack</button>
            </div>`
        });
    }
})
socket.on('raid', function(outcome, amount, deaths, player){
    switch(outcome){
        case 0:
            document.getElementById('log').innerHTML+=`<div class='border-box'>You were raided by ${player.name} for $${amount}! You suffered a loss of ${deaths} men!</div>`
            break
        case 1:
            document.getElementById('log').innerHTML+=`<div class='border-box'>You successfully raided ${player.name} for $${amount}!`
            break
        case 2:
            document.getElementById('log').innerHTML+=`<div class='border-box'>You were successfully defended the raid against ${player.name}!`
            break
        case 3:
            document.getElementById('log').innerHTML+=`<div class='border-box'>Your poor leadership lead to the deaths of ${deaths} of your men in the unsuccessful raid against ${player.name}!`
            break
    }
    if(hidden){
        unseen ++
        document.getElementById('log-button').innerHTML = `Show Log <strong>${unseen}</strong>`
    }
})
hidden = true
unseen = 0
function toggle_log(){
    if(hidden){
        document.getElementById('log').style.display="block"
        document.getElementById('log-button').innerHTML = "Hide Log"
        unseen = 0
        hidden = false
    }
    else{
        document.getElementById('log').style.display="none"
        document.getElementById('log-button').innerHTML = "Show Log"
        hidden = true
    }
}