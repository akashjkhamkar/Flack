import os
import requests

import datetime

from flask import Flask, jsonify, session , render_template, request , redirect , flash
from flask_socketio import SocketIO, emit , leave_room , join_room

from helpers import login_required


app = Flask(__name__)
app.config['SESSION_TYPE'] = 'filesystem'
app.config["SECRET_KEY"] = "my secret key"  


socketio = SocketIO(app)

active = []
users = dict()
roominfo = dict()
privroominfo = dict()

def addmessages(data , isfile , storein):
    room = session["current_room"]
    user = session["username"]

    message = dict()

    message["user"] = user
    message["created"] = datetime.datetime.now().strftime("%c")
    
    if isfile:
        message["extention"] = data["name"].split(".")[-1]
        message["name"] = data["name"]
        message["type"] = data["type"]
        message["size"] = data["size"]
        message["binary"] = data["binary"]
    else:
        message["content"] = data["msg"]
    

    storein["messages"].append(message)
    # print(storein["messages"])
    storein["messages"] = storein["messages"][-100:]

    return message

def createroom(room , storein , isprivate , members=None):
    storein[room] = dict()
    storein[room]["created"] = datetime.datetime.now().strftime("%c")
    storein[room]["messages"] = []
    storein[room]["owner"] = session["username"]

@app.route("/signin" , methods=["POST" , "GET"])
def signin():
    session.clear()
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        if username and password:
            if username in users:
                if password == users[username]["password"]:
                    session["username"] = username

                    for i in range(10):
                        createroom("room" + str("#"*i) , roominfo , False)

                    return redirect("/")
            else:
                #create user
                session["username"] = username
                users[username] = dict()
                users[username]["password"] = password


                return redirect("/")

        flash("username or password is wrong")
        return render_template("signin.html")


    else:
        return render_template("signin.html")

@app.route("/")
@login_required
def index():
    return render_template("index.html" , username = session["username"] , rooms = list(roominfo.keys()))

@app.route("/create" , methods=["POST"])
@login_required
def create():
    room = request.form.get("roomname")
    
    if room and room not in roominfo:
        createroom(room , roominfo , False)
    return redirect("/room/" + room)

@app.route("/room/<string:roomname>" , methods=["POST" , "GET"])
@login_required
def room(roomname):
    session["current_room"] = roomname
    return render_template("chat.html" , username = session["username"] , owner = roominfo[roomname]["owner"] , roomname = roomname , messages = roominfo[roomname]["messages"])

@app.route("/delete/<string:roomname>" , methods=["POST"])
@login_required
def delete(roomname):
    if roomname in roominfo and roominfo[roomname]["owner"] == session["username"]:
        roominfo.pop(roomname)
        return "deleted"
    else:
        return "you are not authorized"

@socketio.on("joined")
@login_required
def joined():
    room = session.get("current_room")
    join_room(room)
    print(session["username"] , "joined")
    emit("status" , {"name" : session["username"] , "status":"joined"} , room = room)

@socketio.on("left")
@login_required
def left():
    room = session.get("current_room")
    leave_room(room)
    print(session["username"] , "left")
    emit("status" , {"name" : session["username"] , "status":"left"} , room = room)

@socketio.on("send msg")
@login_required
def msg(data):
    room = session.get("current_room")

    isfile = None

    if "name" in data.keys():
        isfile = True
    else:
        isfile = False

    storage = roominfo[room]
    
    message = addmessages(data , isfile , storage)

    emit("announce msg", message , room = room)

@app.route("/search" , methods=["POST"])
@login_required
def search():
    query = request.form.get("query")
    results = []

    for i in roominfo:
        if query in i :
            results.append(i)

    return jsonify({"results":results})