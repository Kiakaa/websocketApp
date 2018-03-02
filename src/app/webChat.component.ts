import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';

@Component({
    selector: 'web-chat',
    templateUrl: './webChat.component.html',
})

@Injectable()
export class WebChatComponent implements OnInit {
    nickName:string;
    isNotOnline = true;
    ws: WebSocket;
    SocketCreated: boolean;
    msg: string;             //消息

    nickNames: string[];    //在线数列表
    currentCounts:number;   //在线人数
    rooms: { url: string, name: string }[];//聊天室房间

    chatMSGs:{Auth:string,Type:number,Message:string,Action:number,SendTime?:string}[] =[];//消息格式
    selectedValue:string;//选中的房间

    constructor(private toastr: ToastrService) {

        this.nickName = "";
        console.log(this.nickName);

        this.isNotOnline = true;
        this.nickNames = [];

        this.rooms = [
            { "url": "ws://120.79.9.246:4141/chat", "name": "聊天室1" }
        ];
        this.selectedValue =this.rooms[0].url;
    }
    ngOnInit(): void {
    }
    roomSelected() {
        console.log(this.selectedValue);
    }
    check() {
        this.login();
    }
    login() {
        if (this.isNotOnline) {
            if(this.nickName.trim().length==0)
            {
                this.toastr.error("请输入昵称！");
                return;
            }

            this.ws = new WebSocket(this.selectedValue);
            this.SocketCreated = true;
            this.ws.onopen = (evt) => {
                this.ws.send("{Auth:'" + this.nickName + "',Type:'1',Message:'" + this.nickName + "',Action:'1'}");
            };
            this.ws.onmessage = (event) => {
                console.log(event.data);
                var data = JSON.parse(event.data);
                //Type=1:登录与退出
                if (data.Type === 1) {
                    //在线列表                    
                    let temp: string = data.Message;
                    //登录
                    if (data.Action == 1) {
                        //登录(昵称冲突..)或其他错误
                        if (!data.State) {
                            this.toastr.error(data.Message);
                            return;
                        }
                        temp.split(",").forEach(
                            (val, idx, array) => {
                                // val: 当前值
                                // idx：当前index
                                // array: Array
                                //加入新成员
                                console.log(idx.toString() + ":" + val);
                                if (this.nickNames.indexOf(val) < 0) {
                                    this.nickNames.push(val);
                                }
                            }
                        );
                    } else {//登出
                        temp.split(",")
                        this.nickNames.forEach(
                            (val, idx, array) => {
                                // val: 当前值
                                // idx：当前index
                                // array: Array
                                //移除离开的成员
                                console.log(idx.toString() + ":" + val);
                                if (temp.indexOf(val) < 0) {
                                    this.nickNames.splice(idx, 1)
                                }
                            }
                        );
                        //this.chatMSGs=[]; 退出记录不清空。
                    }
                    console.log("temp:" + temp);
                }
                else{//消息
                    //登录、消息失败
                    if(!data.State)
                    {
                        this.toastr.error("登录失败，请刷新再试！");
                        return;
                    }
                    this.chatMSGs.push(data);
                }
                this.currentCounts=this.nickNames.length;
                this.isNotOnline = false;
            }
            this.ws.onclose = this.onClose;
            this.ws.onerror = this.onError;
        }
        else
        {
            this.exit();
        }
    }
    onOpen(event: Event) { };
    onClose(event: CloseEvent) { };
    onError(event: Event) { }
    onMessage(event: MessageEvent) { }

    sendMessage(): void {
        if(this.msg.trim().length==0)
        {
            this.toastr.warning("不能发送空白消息！");
            return;
        }
        this.ws.send("{Auth:'" + this.nickName + "',Type:\"2\",Message:'" + this.msg + "',Action:\"3\"}");
        this.msg="";
    }
    exit(): void {
        if (this.SocketCreated && (this.ws.readyState == 0 || this.ws.readyState == 1)) {
            this.ws.close();
            this.isNotOnline=true;
            this.nickNames = [];
        }
        else{
            this.toastr.warning("您当前为离线状态，请刷新页面重新进入！");
        }
    }
    //Ctrl+Enter 发送消息
    onKeydown(event:KeyboardEvent) {
        if (event.key === "Enter"&& event.ctrlKey) {
          this.sendMessage();
        }
        if(event.keyCode===27)
        {
            this.exit();
        }
      }
}