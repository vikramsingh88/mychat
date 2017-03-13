jQuery(function($){
       var socket=io.connect();
       var $users=$('#users');
       var $messageForm=$('#message-box');
       var $messageBox=$('#message');
       var $chat=$('#chat');

       var chatOuter=$('#chatWrap');
       var chatInner=$('#chat');
       var buddy = '';

       var user_msg = {};
       var user_msg_map = [];
       var conversation_id;

       var chatname = localStorage.getItem("chatname"); //'<%= chatname %>'
       console.log("Local storage get ",chatname);

       $( "#dialog" ).dialog({
        autoOpen: false,
        position:['middle',20],
        width: 500,
        height: 400,
      });

       $('#message').emojiPicker({
          width: '300px',
          height: '200px'
        });

       $('#message').keydown(function(event) {
          if (event.keyCode == 13) {
               $(this.form).submit()
              return false;
             }
       });

       $('#search').keydown(function(event) {
          if (event.keyCode == 13) {
               socket.emit('search buddy',$("#search").val(),function(data) {
                  $( "#dialog" ).dialog( "open" );
                  var out = '<ul class="list-group" id="search_result">';
                  $(data).each(function(index, value) {
                      out += "<li class='list-group-item'>" + value + "</li>";
                  });
                  out += "</ul>";
                  $('#searchlist').html(out);
                  $('#search_result li').click(function(e) { 
                    var contact = $(this).text();
                    $( "#dialog" ).dialog("close");
                    //adding contact to buddylist to db
                    socket.emit('add to buddy',chatname, contact,function(data) {
                        socket.emit('get Buddy Presence Status', data, function(buddy, status){
                          console.log('search and add addBuddyToListWithStatus ',data);
                          addBuddyToListWithStatus(buddy, status);
                        });
                    });
                  });
               });
              return false;
             }
       });

       //fetch buddies
       socket.emit('fetch buddies',chatname, function(data) {
          console.log('fetch buddies ',data);
          for(i=0;i<data.length;i++){
              //onload check buddies status
              console.log('addBuddyToListWithStatus before ',data[i]);
              socket.emit('get Buddy Presence Status', data[i], function(buddy, status){
                console.log('addBuddyToListWithStatus ',data[i]);
                addBuddyToListWithStatus(buddy, status);
              });              
          }
       });

       //new buddy available
       socket.on('new buddy available', function(user){
          socket.emit('fetch buddies',user, function(data) {
          console.log('fetch buddies ',data);
          for(i=0;i<data.length;i++){
              //onload check buddies status
              console.log('addBuddyToListWithStatus before ',data[i]);
              socket.emit('get Buddy Presence Status', data[i], function(buddy, status){
                console.log('addBuddyToListWithStatus ',data[i]);
                addBuddyToListWithStatus(buddy, status);
              });              
          }
       });
       });
      
      socket.emit('new user',chatname, function(data) {
                
      });

      //create user list dynamically and add element id
      var addBuddyToList= function(buddy) {
          var ul = document.getElementById("users");
          var li = document.createElement("li");
          li.setAttribute("id", buddy);
          li.setAttribute("class", "list-group-item");
          li.appendChild(document.createTextNode(buddy));
          ul.appendChild(li)
      }

      var addBuddyToListWithStatus= function(buddy, status) {
          var ul = document.getElementById("users");
          var li = document.createElement("li");
          li.setAttribute("id", buddy);
          li.setAttribute("class", "list-group-item list-item-background");

          var div = document.createElement("div");

          if(status){
            div.setAttribute("class", "online-buddy");
          } else{
            div.setAttribute("class", "offline-buddy");
          }

          li.appendChild(div);

          var div2 = document.createElement("div");
          div2.appendChild(document.createTextNode(buddy));
          li.appendChild(div2);

          //li.appendChild(document.createTextNode(buddy));
          ul.appendChild(li)
      }

      var updateBuddyOnlineStatus = function(id) {
        var thirdItem = document.getElementById(id);        
        console.log('online buddy', thirdItem);
        if(thirdItem != null){
          var divStatus = thirdItem.childNodes[0];
          divStatus.setAttribute("class", "online-buddy");
        }        
      };
      var updateBuddyOfflineStatus = function(id) {
        var thirdItem = document.getElementById(id);
        if(thirdItem != null){
          var divStatus = thirdItem.childNodes[0];
          divStatus.setAttribute("class", "offline-buddy");
        }        
      };

       socket.on('chatusers',function(data){            
            for(i=0;i<data.length;i++){
              console.log('chatusers', data[i]);
              updateBuddyOnlineStatus(data[i]);
            }          
        });

       //when buddy goes offline
       socket.on('buudy status offline', function(data) {
          console.log('buudy status offline', data);
          updateBuddyOfflineStatus(data);
       });

       // when user click on his/her buddy from buddylist
       $(document).ready(function() {
           $('#users').on('click', 'li',function(e) { 
              buddy = $(this).text();
              $("#chat").empty();
              var thirdItem = document.getElementById(buddy);
              thirdItem.setAttribute("class", "list-group-item list-item-background");

              $('#f-name').text(buddy);
              var m = user_msg[buddy];
              console.log("m :",m);
                if(m != null){  
                  for(i = 0;i<m.length;i++) {                  
                   // $chat.append("<p align='left' class='whisper'><b>&nbsp;&nbsp;&nbsp;"+buddy+" : </b>"+m[i]+"</p><br/>");
                    console.log('Inside for loop');
                    scrollCorrect();
                  } 
                } 

                var tempChatId1 = chatname+"_"+buddy; 
                var tempChatId2 = buddy+"_"+chatname; 
                var myChatId; 
                for(i = 0 ; i < user_msg_map.length; i++){
                    var temp = user_msg_map[i];
                    //console.log("tempChatId1",tempChatId1);
                    //console.log("tempChatId2",tempChatId2);
                    console.log("tempChatId1 Property",temp.hasOwnProperty(tempChatId1));
                    console.log("tempChatId2 Property",temp.hasOwnProperty(tempChatId2));
                    if (temp.hasOwnProperty(tempChatId1)) {
                        myChatId = tempChatId1;
                    }else if (temp.hasOwnProperty(tempChatId2)) {
                      myChatId = tempChatId2;
                    }else {
                      myChatId = tempChatId1;
                    }
                    flag = temp.hasOwnProperty(tempChatId1) || temp.hasOwnProperty(tempChatId2);    
                    if (flag) {
                      break;
                    }                
                  }
                for(i = 0 ; i < user_msg_map.length; i++){
                    var temp = user_msg_map[i];
                    //{"vikram_puja":[]}
                    console.log("conversation_id on list item click ",myChatId);
                    var chatID = myChatId;
                    var map = temp[chatID];
                    console.log('Map',map);
                    if (typeof map != 'undefined') {
                      for(x=0;x<map.length;x++){
                        var m = map[x];
                        if(m[buddy]!=null){
                          var left = "<li class='other'><div class='avatar'><img src='/images/left.png' draggable='false'></div><div class='msg'><p><b>&nbsp;&nbsp;&nbsp;"+buddy+" : </b>"+m[buddy]+"</p><br/><time>00:00</time></div></li>"
                          //$chat.append("<p align='left' class='whisper'><b>&nbsp;&nbsp;&nbsp;"+buddy+" : </b>"+m[buddy]+"</p><br/>");
                          $chat.append(left);
                        }else if(m[chatname]!=null){
                          var right = "<li class='self'><div class='avatar'><img src='/images/right.png' draggable='false'/></div><div class='msg'><p><b>"+chatname+": </b>"+m[chatname]+"&nbsp;&nbsp;</p><br/><time>00:00</time></div></li>";
                          $chat.append(right);
                          //$chat.append("<p align='right' class='whisper'><b>"+chatname+": </b>"+m[chatname]+"&nbsp;&nbsp;</p><br/>");
                        }
                      }         
                      break;
                    }                
                  }

                delete user_msg[buddy];
                console.log("in list loop :",user_msg);
              });
        });

       //key press event to know typing indication
       $( "#message").keydown(function() {
          socket.emit('keydown-client', {'buddy':buddy,'loginuser':chatname});
       });

       socket.on('keydown-server', function(data) {
          if(data.from == buddy) {
            $("#typing").text(data.from+" is typing ...");
          }
       });

       $( "#message").keyup(function() {
          socket.emit('keyup-client', {'buddy':buddy,'loginuser':chatname});
       });

       socket.on('keyup-server', function(data) {
          if(data.from == buddy) {
            $("#typing").text("");
          }
       });



       $messageForm.submit(function(e){
            e.preventDefault();
            if ($("#message").val() == '') {
              alert('no message');
              return;
            }
            var flag = false    
            var tempChatId1 = chatname+"_"+buddy; 
            var tempChatId2 = buddy+"_"+chatname; 
            var myChatId;
            if(user_msg_map.length > 0){  
                for(i = 0 ; i < user_msg_map.length; i++){
                    var temp = user_msg_map[i];
                    //console.log("tempChatId1",tempChatId1);
                    //console.log("tempChatId2",tempChatId2);
                    console.log("tempChatId1 Property",temp.hasOwnProperty(tempChatId1));
                    console.log("tempChatId2 Property",temp.hasOwnProperty(tempChatId2));
                    if (temp.hasOwnProperty(tempChatId1)) {
                        myChatId = tempChatId1;
                    }else if (temp.hasOwnProperty(tempChatId2)) {
                      myChatId = tempChatId2;
                    }else {
                      myChatId = tempChatId1;
                    }
                    flag = temp.hasOwnProperty(tempChatId1) || temp.hasOwnProperty(tempChatId2);    
                    if (flag) {
                      break;
                    }                
                  }
            } else {
              myChatId = tempChatId1;
            }
            socket.emit('send message',{msg:$messageBox.val(),buddy:buddy,chatname:chatname,conversation_id:myChatId},function(data){
              $chat.append("<p align='right' class='error'>"+data+"&nbsp;&nbsp;</p><br/>");
              scrollCorrect();
            });
            $messageBox.val('');
       });

       socket.on('whisper',function(data){
        console.log("conversation_id : "+data.conversation_id);
        conversation_id = data.conversation_id;
        var flag = false        
        for(i = 0 ; i < user_msg_map.length; i++){
            var temp = user_msg_map[i];
            flag = temp.hasOwnProperty(data.conversation_id);    
            if (flag) {
              break;
            }                
          }

          if (!flag) {
            var obj = {};
            obj[data.conversation_id] = [];
              user_msg_map.push(obj);
          }

         for(i = 0 ; i < user_msg_map.length; i++){
              var temp = user_msg_map[i];
              //{"vikram_puja":[]}
              var chatID = data.conversation_id;//chatname+"_"+buddy;
              var map = temp[chatID];
              console.log('Map',map);
              if (typeof map != 'undefined') {
                var obj={};
                obj[data.chatname] = data.msg;
                map.push(obj);   
                //console.log('temp',temp);               
                break;
              }                
            }

            console.log('user_msg_map',user_msg_map);

         if(!(data.chatname in user_msg)){
            user_msg[data.chatname] = [data.msg];
          } else{
            user_msg[data.chatname].push(data.msg);
          }
        if (buddy===data.chatname) {
          //$("#count").empty();
          var left = "<li class='other'><div class='avatar'><img src='/images/left.png' draggable='false'></div><div class='msg'><p><b>&nbsp;&nbsp;&nbsp;"+data.chatname+" : </b>"+data.msg+"</p><br/><time>00:00</time></div></li>"
          $chat.append(left);
          //$chat.append("<p align='left' class='whisper'><b>&nbsp;&nbsp;&nbsp;"+data.chatname+" : </b>"+data.msg+"</p><br/>"); 
          $("#typing").text("");
           scrollCorrect();
        } else {
            //$("#count").append("<p><b>"+"Unread message from "+data.chatname+" </b>"+"</p><br/>");
             var thirdItem = document.getElementById(data.chatname);
             thirdItem.setAttribute("class", "list-group-item unread");
        }  
        console.log("on receive : ",user_msg);    
       });

       socket.on('private',function(data){
        var right = "<li class='self'><div class='avatar'><img src='/images/right.png' draggable='false'/></div><div class='msg'><p><b>"+data.chatname+": </b>"+data.msg+"&nbsp;&nbsp;</p><br/><time>00:00</time></div></li>";
           $chat.append(right);
           //$chat.append("<p align='right' class='whisper'><b>"+data.chatname+": </b>"+data.msg+"&nbsp;&nbsp;</p><br/>");
            conversation_id = data.conversation_id;
            var flag = false        
            for(i = 0 ; i < user_msg_map.length; i++){
                var temp = user_msg_map[i];
                flag = temp.hasOwnProperty(data.conversation_id);    
                if (flag) {
                  break;
                }                
              }

              if (!flag) {
                var obj = {};
                obj[data.conversation_id] = [];
                  user_msg_map.push(obj);
              }

             for(i = 0 ; i < user_msg_map.length; i++){
                  var temp = user_msg_map[i];
                  //{"vikram_puja":[]}
                  var chatID = data.conversation_id;//chatname+"_"+buddy;
                  var map = temp[chatID];
                  console.log('Map',map);
                  if (typeof map != 'undefined') {
                    var obj={};
                    obj[data.chatname] = data.msg;
                    map.push(obj);   
                    //console.log('temp',temp);               
                    break;
                  }                
                }

            console.log('user_msg_map',user_msg_map);
           scrollCorrect();
       });

       function scrollCorrect(){
             chatOuter.scrollTop(chatInner.outerHeight());
      }
    });