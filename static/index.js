document.addEventListener('DOMContentLoaded', () => {
    let roomname = localStorage.getItem("prev_room")
    // if(roomname){
        // window.location.replace("/room/" + roomname);
    // }

    document.querySelector(".search").onclick = () => {
        query = document.querySelector(".new_room_name").value;
    
        if(query){
            const request = new XMLHttpRequest();
            request.open("POST" , "/search");
    
            request.onload = () => {
                let res = JSON.parse(request.response);
                let results = res.results;
                const rooms = document.querySelector(".rooms");
                rooms.innerHTML = "";

                
                if(results.length == 0){
                    rooms.innerHTML = "Not found : (";
                }

                i = 0;
                while(i < results.length){
                    const room = document.createElement("div");
                    room.className = "room";
                    room.innerHTML = results[i];

                    const link = document.createElement("a");
                    link.className = "roomlinks";
                    link.href = "/room/" + results[i];
                    link.append(room)

                    rooms.append(link);

                    i++;
                }
            }
    
            const data  = new FormData();
            data.append("query" , query)
            request.send(data);

        }else{
            console.log("empty query");
        }
    }
})