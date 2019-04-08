var express = require('express');
var app = express();
var server = app.listen(8000, listen);

var rooms = [];

function listen() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://' + host + ':' + port);
}

app.use(express.static('public'));

var io = require('socket.io')(server);

setInterval(update, 5000);

function update() {

}

io.sockets.on('connection',
	function(socket) {

		console.log("We have a new client: " + socket.id);


		socket.on('start',
			function(data) {
				for (var i = 0; i < rooms.length; i++) {
					if (data.roomID == rooms[i].roomID) {
						rooms[i].numUsers += 1;
						rooms[i].users[rooms[i].users.length] = {
							id: socket.id,
							name: data.name
						};
						if (rooms[i].messages.length > 0) {
							io.to(socket.id).emit('messageList', {
								messages: rooms[i].messages
							});
						}
						io.to(socket.id).emit('connected', {});
						return;
					}
				}
				var temp = {
					roomID: data.roomID,
					numUsers: 1,
					users: [{
						id: socket.id,
						name: data.name
					}],
					messages: []
				}
				rooms.push(temp);
				io.to(socket.id).emit('connected', {});
			}
		);

		socket.on('message', function(data) {
			var id;
			for (var i = 0; i < rooms.length; i++) {
				if (data.roomID == rooms[i].roomID) {
					id = i;
					for (var j = 0; j < rooms[i].users.length; j++) {
						if (socket.id == rooms[i].users[j].id) {
							var x = rooms[i].messages.length;
							rooms[i].messages[x] = rooms[i].users[j].name + ": " + data.message;
						}
					}
				}
			}
			for (var k = 0; k < rooms[id].users.length; k++) {
				io.to(rooms[id].users[k].id).emit('message', data);
			}
		});

		socket.on('disconnect', function() {
			console.log("Client has disconnected");
			for (var i = 0; i < rooms.length; i++) {
				for (var j = 0; j < rooms[i].users.length; j++) {
					if (socket.id == rooms[i].users[j].id) {
						rooms[i].users.splice(j, 1);
						rooms[i].numUsers--;
					}
				}
			}
		});
	}
);