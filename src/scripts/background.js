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

function sendSuccessMessage(request, sender, sendResponse) {
    console.log('DO SOMETHING DAMMIT');
    var resp = sendResponse;
    resp({ action: "saved" });
}

ext.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.action === "perform-save") {
        //chrome.extension.getBackgroundPage().console.log('foo');
        //console.log("Extension Type: ", "/* @echo extension */");
        console.log("PERFORM AJAX", request.data);

        storage.get('token', function(resp) {
            var token = resp.token;
            var data = JSON.parse(request.data);
            if(token) {
                var xmlhttp = new XMLHttpRequest();
                xmlhttp.open('POST', 'http://troovy.app/api/bookmarks/save', true);
                xmlhttp.setRequestHeader( "Authorization","Bearer " + token );
                xmlhttp.setRequestHeader( "Accept","application/json" );
                xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                var params = 'title=' + encodeURIComponent(data['title'])
                    + '&description=' + encodeURIComponent(data['description'])
                    + '&url=' + encodeURIComponent(data['url'])
                    + '&category_id=' + data['category_id']
                    + '&grant_type=password'
                    + '&client_id=2'
                    + '&client_secret=urV13VyBFn65JZL8Ckwe1VBDc38bPXtjGI4WJwM8'
                    + '&scope=*';
                //console.log('params received, saving bookmark');

                xmlhttp.onload = function () {
                    console.log('DONE', xmlhttp.readyState); // readyState will be 4
                    console.log(xmlhttp.status);
                    if (xmlhttp.status === 200) {
                        //var response = xmlhttp.responseText;
                        //var t = JSON.parse(response);
                        sendResponse({ action: "saved" });
                        //sendSuccessMessage(request, sender, sendResponse);
                    }
                };

                xmlhttp.onreadystatechange = function () {

                }
                xmlhttp.send(params);
            }
        });
        return true;

    }
  }
);