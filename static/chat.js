document.addEventListener('DOMContentLoaded', () => {
    
    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.on('connect', () => {

        document.querySelector(".filesend").style.display = "none";

        console.log(roomname , "is the stored room")
        localStorage.setItem("prev_room", roomname);
        console.log(username)
        socket.emit("joined")

        document.querySelector(".home").onclick = () => {
            socket.emit("left");
            localStorage.removeItem("prev_room");
            // window.location.replace("/room/" + roomname);
        }

        const request = new XMLHttpRequest();
        request.open("GET" , "/getMessages/"+roomname);
        request.onload = () => {
            if (JSON.parse(request.response)[0] == "success"){
                var messages = JSON.parse(request.response)[1];
                let i = 0 
                while(i < messages.length){
                    addmessage(messages[i]);
                    i++;
                }
            }
        }

        request.send();
        
        function timestamp(data){

            let div = document.createElement("div");

            if(data.user == username){
                div.classList.add("message1")
            }else{
                div.classList.add("message2");
            }

            const message_details = document.createElement('div');
            message_details.classList.add("message-details");
    
            const name = document.createElement("span");
            const date = document.createElement("span");
    
            date.className = "time"

            
            date.innerHTML = data.created
            
            message_details.append(date)
            
            if(data.user != username){
                name.className = "user"
                name.innerHTML = data.user
                message_details.append(name)
            }

            div.append(message_details)
            
            return div;
        }
    
        function createtextMessageDOM(data , div) {
            div.append(data["content"]);
        }

        function createlinkMessageDOM(data , div) {
            let a = document.createElement("a");
            a.download = data.name;
            a.href = data.binary;
            a.title = data.name;
            a.innerHTML = data.name;
            a.className = "linkmsgclass";

            let icon = document.createElement("img");
            icon.src = "/static/insert_drive_file-24px.svg";
            icon.className = "linkmsgicon";

            div.append(icon)

            div.append(a);

            div.classList.add("linkmsg");
        }

        function createImageMessageDOM(data , div) {
            var img = document.createElement("img");
            img.src = data.binary;
            img.className = "imgmsg"
            div.append(img)
        }
        
        
        function addmessage(data){
            let div = timestamp(data)
            if (data.extention) {
                extension = data.extention;

                
                if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
                    createImageMessageDOM(data , div)
                } else {
                    let sizediv = document.createElement("div");

                    sizediv.className = "size";
                    createlinkMessageDOM(data , div)


                    let size = parseInt(data.size);
                    
                    if(size<1000){
                        size = " " + String(size) + " bytes"; 
                    }else if(size > 1000 && size < 1000000){
                        size = " " + String(size/1000) + " kb"; 
                    }else if(size > 1000000){
                        size = " " + String((size/1000000).toFixed(2)) + " mb"; 
                    }
    
                    sizediv.append(size);
                    div.append(sizediv)
                }
                
            } else {
                createtextMessageDOM(data , div)
            }
            document.querySelector(".messages-container").append(div)
        }

        document.querySelector(".filesend").onclick = () => {
            document.querySelector(".filename").innerHTML = "Sending the file.. please wait, text messages will be queued after the image"
            file = document.querySelector(".file_select").files[0];
            document.querySelector(".file_select").value = "";

            var fileReader = new FileReader();
            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
                var arrayBuffer = fileReader.result;
                socket.emit('send msg', {
                    route: window.location.pathname,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    binary: arrayBuffer
                }, () => {
                    document.querySelector(".filename").style.display = "none"
                })
            }
        };

        document.querySelector(".send").onclick = () => {
            let msg = document.querySelector(".fresh_message").value;
            
            console.log("sending .. " , msg)

            if(msg){
                socket.emit('send msg', {
                    'msg': document.querySelector(".fresh_message").value
                });
                document.querySelector(".fresh_message").value = "";
            }
        }


        document.querySelector(".file_select").onchange = () => {
            filename = document.querySelector(".filename");
            filename.innerHTML = document.querySelector(".file_select").files[0].name + " file is selected "; 
            
            filename.style.display = "block";
            document.querySelector(".send").style.display = "none";
            document.querySelector(".filesend").style.display = "block";
        }

        document.querySelector(".fresh_message").onclick = () => {
            document.querySelector(".send").style.display = "block"
            document.querySelector(".filesend").style.display = "none"
            
            document.querySelector(".file_select").innerHTML = ""
        }

        if(document.querySelector(".delete")){
            document.querySelector(".delete").onclick = () => {
                if(confirm("you are about to delete this room ! , shall we proceed ?")==true){
                    const request = new XMLHttpRequest();
                    request.open("POST" , "/delete/"+roomname);
                    
                    request.onload = () => {
                        if(request.response == "deleted"){
                            window.location.replace("/");
                        }
                    }

                    request.send();

                }
            }
        } 

        socket.on("announce msg", data => {
            console.log(data);
            addmessage(data);
            document.querySelector(".messages-container").scrollTo(0,document.querySelector(".messages-container").scrollHeight);
        })
    })

})
