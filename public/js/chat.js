const socket = io()  // important to make connection

// elements
const $messageForm = document.querySelector('#chatForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// options
const {username, room } = Qs.parse(location.search, {ignoreQueryPrefix:true})


// ============================for basic counter project=======================
// name of the socket.on should match exactkly with the socket.emit
// here we are listing for the event created on server side
// it is sharing count value to all cliets
// socket.on('countUpdated', (count)=>{
//     console.log("The count has been updated", count)
// })

// document.querySelector('#inc').addEventListener('click', () => {
//     console.log("Clicked")
//     // here we are making event from client side
//     // here we dont need to send back coubt value since server kniws the count value . it woll update 
//     socket.emit("increment") 
// })

// ============================for chat app ==============================

// server(emit) => client (receive)  --acknowledgement--> server
// client(emit) => server (receive)  --acknowledgement--> client

const autoScroll = () =>{
    // new mesg element
    const $newMessage = $messages.lastElementChild

    // get the height of the new messages
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight =$newMessage.offsetHeight + newMessageMargin

    // console.log(newMessageMargin)
    // console.log(newMessageHeight)

    const visibleHeight = $messages.offsetHeight

    // heifht of messages container
    const containerHeight = $messages.scrollHeight

    // how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

}
socket.on("message", (message) =>{
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoScroll()
})

// new emit handler for location
socket.on("locationMessage", (message) =>{
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoScroll()

})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html

})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    // disable the form 
    $messageFormButton.setAttribute('disabled', 'disabled')

    message = e.target.elements.chat.value
    // while emitting event..we can send as many data we want seprated by comma, and at last we will have fuction that will run after acknowledgement at the server side
    socket.emit('sendMessage', message, (error)=>{

        // enable the form for next mesg..in between ..we are not allowing user to send mesg
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }

        console.log("Message delivered")
    }) 

})


$sendLocationButton.addEventListener('click', ()=>{
    // every things we need for geolocation lives in "navigaotr.geolocation". If this exist it means browser is supported for geolocation
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
        
    }
    
    $sendLocationButton.setAttribute('disabled','disabled')
    // currently it does support promise..but this is asyn in nature
    navigator.geolocation.getCurrentPosition((position)=>{


        socket.emit('location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, ()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })


})


socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href ='/'
    }
})