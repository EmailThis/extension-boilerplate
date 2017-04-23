import ext from "./utils/ext";
import storage from "./utils/storage";

function setIcon() {
    if (oauth.hasToken()) {
        chrome.browserAction.setIcon({ 'path' : 'icons/icon-16.png'});
    } else {
        chrome.browserAction.setIcon({ 'path' : 'icons/icon-38.png'});
    }
};

function logout() {
    oauth.clearTokens();
    setIcon();
};

function saveBookmark() {
    storage.get('token', function(resp) {
        var token = resp.token;
        if(token) {
            var xmlhttp = make_xmlhttprequest_with_token('POST', 'http://troovy.app/api/bookmarks/save', true, token);
            xmlhttp.send();
            xmlhttp.onreadystatechange = function () {
                console.log('saveBookmark: saving bookmark');
                if (xmlhttp.readyState === 4) {
                    if (xmlhttp.status === 200) {
                        var response = xmlhttp.responseText;
                        var t = JSON.parse(response);
                    }
                }
            }
        }
    });
};

ext.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.action === "perform-save") {
        //chrome.extension.getBackgroundPage().console.log('foo');
        //console.log("Extension Type: ", "/* @echo extension */");
        console.log("PERFORM AJAX", request.data);
        //var token =  chrome.storage.local.get('token');
        //var token =  localStorage.getItem('token');
        console.log('token is' + token);
        var data = JSON.parse(request.data);
        //console.log("TITLE IS: " + data['title']);
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', 'http://troovy.app/api/bookmarks/save', true);
        xmlhttp.setRequestHeader( "Authorization","Bearer " + token );
        xmlhttp.setRequestHeader( "Accept","application/json" );
        var params = 'title=' + encodeURIComponent(data['title'])
            + '&description=' + encodeURIComponent(data['description'])
            + '&url=' + encodeURIComponent(data['url'])
            + '&grant_type=password'
            + '&client_id=2'
            + '&token=' + token
            + '&client_secret=urV13VyBFn65JZL8Ckwe1VBDc38bPXtjGI4WJwM8'
            + '&scope=*';
        xmlhttp.send(params);
        xmlhttp.onreadystatechange = function () {
            console.log('saving bookmark');
            if (xmlhttp.readyState === 4) {
                if (xmlhttp.status === 200) {
                    var response = xmlhttp.responseText;
                    var t = JSON.parse(response);
                    sendResponse({ action: "saved" });
                }
            } else {
                console.log(xmlhttp.responseText);
                sendResponse('ugh');
            }
        }

        // storage.get('token', function(resp) {
        //     var token = resp.token;
        //     console.log("dat data is: " +data);
        //     if(token) {
        //
        //     }
        // });

        //sendResponse({ action: "saved" });
    }
  }
);

//chrome.browserAction.onClicked.addListener(get_troovy_token);