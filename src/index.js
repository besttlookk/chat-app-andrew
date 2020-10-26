// with the use of socket we need to change how we set-up express..though the functionality remains the same
const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')

const app = express()
const server = http.createServer(app) // usually express do this behind the scenes but since we are using socket.io(for that we need server), we need to include this
const io = socketio(server)

const PORT = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))

// let count = 0


// ============================for counter aPP =====
// socket is the object which contains information about new connection
// io.on('connection', (socket)=>{
//     console.log("new websocket connection")

//     // emittning initial count value
//     socket.emit('countUpdated', count)  // emit is used to send any event // after the first argument(which is the name) all the parameter is available to the callback function is server side (order matters)

//     socket.on('increment', ()=>{
//         count += 1
//         // socket.emit("countUpdated", count) /// with socket.emit we are emitting event to a particular connection..and not all the connections..
//         io.emit("countUpdated", count)
//     })
// })


// =======================FOR CHAT app ====================================================
const { generateMessage} = require('./utils/messages')
const { generateLocationMessage} = require('./utils/messages')
const {addUser,removeUser, getUser, getUsersInRoom} = require('./utils/users')
// connection and disconnection are built-in event.
io.on('connection', (socket)=>{
    console.log("new websocket connection")

    // socket.emit("message", generateMessage("WELCOME!"))  // "socket.emit" will emit to that particular user

    // socket.broadcast.emit("message", generateMessage("A new user has joined!"))  // it will emit to everyone excet to this user

    socket.on('join', (options, callback)=>{

        const {error, user} = addUser({id: socket.id, ...options})

        if(error){
            return callback(error)
        }
        // socket.join can only be usd on server side
        // socket.join(room)
        socket.join(user.room)  // bcoz this is trimmed

        socket.emit("message", generateMessage(user.username, "WELCOME!"))  // "socket.emit" will emit to that particular user

        socket.broadcast.to(user.room).emit("message", generateMessage(`${user.username} has joined!`))  // it will emit to everyone excet to this user

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit , socket.broadcast.io.emit  : these two are for room
    })
    // allongwith message we are also getting callback function
    socket.on('sendMessage', (message, callback)=>{
        // before emitting msg we will verify the profanity of the message
        const filter = new Filter

        if(filter.isProfane(message)){
            return callback("Profanity is not allowed")
        }

        const user = getUser(socket.id)

        if(user){
                io.to(user.room).emit('message', generateMessage(user.username, message))
                // callback("Delivered") // for acknowledgement with some message
                callback() // for acknowledgement

        }
    })

    socket.on('location', (position, callback)=>{
        // socket.broadcast.emit("message", position)
        // io.emit("message", `https://www.google.com/maps?q=${position.latitude},${position.longitude}`)
        // callback()

        const user = getUser(socket.id)
        if(user){
            // different emit for 
            io.to(user.room).emit("locationMessage", generateLocationMessage(user.username,`https://www.google.com/maps?q=${position.latitude},${position.longitude}`))
            callback()

        }

    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)

        if(user){
            // socket.broadcast.emit("message", "User left the chat")  // this is not correct because this socket is already disconnected
            io.to(user.room).emit("message", generateMessage(`${user.username} has left the room`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })

        }

        

    })
})


// its not app.listen
server.listen(PORT, ()=>{
    console.log(`Server Is Running At ${PORT}`)
})
