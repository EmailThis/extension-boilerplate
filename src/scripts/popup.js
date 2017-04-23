import ext from "./utils/ext";
import storage from "./utils/storage";

var __request_code;
var __access_token_string;

var popup = document.getElementById("app");
var troovyLoginForm = document.getElementById("troovyLoginForm");
var userToken;

window.onload = function(){
    check_auth();
    //get_categories();
};

storage.get('color', function(resp) {
  var color = resp.color;
  if(color) {
    popup.style.backgroundColor = color
  }
});

function check_auth() {
    storage.get('token', function(resp) {
        var token = resp.token;
        console.log('token found: ' + token);
        if(token) {
            //get_categories();
            scan_page();
            userToken = token;
        } else {
            // Show login form
            console.log('no token found');
            var displayContainer = document.getElementById("display-container");
            var tmpl = login_form();
            displayContainer.innerHTML = tmpl;
        }
    });
}

function scan_page() {
    ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, renderBookmark);
    });
}

function make_xmlhttprequest (method, url, flag) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open(method, url, flag);
    xmlhttp.setRequestHeader( "Content-type","application/x-www-form-urlencoded" );
    return xmlhttp;
}

function make_xmlhttprequest_with_token (method, url, flag, token) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open(method, url, flag);
    xmlhttp.setRequestHeader( "Authorization","Bearer " + token );
    xmlhttp.setRequestHeader( "Accept","application/json" );
    return xmlhttp;
}

function get_troovy_token(username,password) {
    console.log('getting troovy token...');
    console.log('username: ' + username + ' , password: ' + password);
    var xmlhttp = make_xmlhttprequest ('POST', 'http://app.troovy.app/oauth/token', true);
    //var params = 'email=' + encodeURIComponent(formLogin.username.value) + '&password=' + encodeURIComponent(formLogin.password.value);
    var params = 'username=' + encodeURIComponent(username)
        + '&password=' + encodeURIComponent(password)
        + '&grant_type=password'
        + '&client_id=2'
        + '&client_secret=urV13VyBFn65JZL8Ckwe1VBDc38bPXtjGI4WJwM8'
        + '&scope=*';
    xmlhttp.send( params );
    xmlhttp.onreadystatechange = function () {
        //console.log('readystate run');
        if ( xmlhttp.readyState === 4 ) {
            if (xmlhttp.status === 200){
                var response = xmlhttp.responseText;
                //console.log('made it!');
                console.log(response);
                var t = JSON.parse(response);
                var value = t['access_token'];

                // Store our access token in local storage
                chrome.storage.local.set({
                    'token': value
                }, function() {
                    console.log("The value stored was: " + value);
                });

                ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    var activeTab = tabs[0];
                    chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, renderBookmark);
                });
            }
            else {
                document.getElementById("progress-icon").innerHTML = "<img height='50px' width='50px' src='failed.png'></img>";
                document.getElementById("progress-text").innerHTML = "Authentication failed!!";
            }
        }
    }
}

function get_categories() {
    storage.get('token', function(resp) {
        var token = resp.token;
        if(token) {
            var xmlhttp = make_xmlhttprequest_with_token('GET', 'http://troovy.app/api/categories', true, token);
            xmlhttp.send();
            xmlhttp.onreadystatechange = function () {
                //console.log('readystate run');
                if (xmlhttp.readyState === 4) {
                    if (xmlhttp.status === 200) {
                        var response = xmlhttp.responseText;
                        var t = JSON.parse(response);
                        chrome.storage.local.set({cacheCategories: t, cacheTime: Date.now()}, function() {
                            //callback(t);
                        });
                        renderCategorySelect(t);
                    }
                }
            }
        }
    });
};

// function scan_this_page () {
//     document.getElementById("progress-icon").innerHTML = "<img height='50px' width='50px' src='images/authenticating.gif'></img>";
//     document.getElementById("progress-text").innerHTML = "Authenticating with Troovy";
//     get_troovy_token();
// }

var templateOG = (data) => {
  var json = JSON.stringify(data);
  return (`
  <div class="site-description">
    <h3 class="title">${data.title}</h3>
    <p class="description">${data.description}</p>
    <a href="${data.url}" target="_blank" class="url">${data.url}</a>
  </div>
  <div class="action-container">
    <button data-bookmark='${json}' id="save-btn" class="btn btn-primary">Save</button>
  </div>
  `);
}

var template = (data) => {
    var json = JSON.stringify(data);
    return (`
  <form name="save-page" id="formSavePage">
  <div class="site-description">
        <input type="hidden" name="url" value="${data.url}">
        <input type="hidden" name="title" value="${data.title}">
        <textarea name="description" style="display:block;width:100%;height:75px;background-color:#444";border:1px #efefef;">${data.description}</textarea>
  </div>
  <div class="action-container">
    <button data-bookmark='${json}' id="save-btn" class="btn btn-primary">Save</button>
  </div>
  </form>
  `);
}

var login_form = () => {
    return (`
  <div>
    <form id="troovyLoginForm" name="troovyLoginForm">
        <label>Email</label>
        <div class="form-group" style="margin-bottom: 15px">
            <input type="text" name="username" id="username" value="" placeholder="email"/>
        </div>
        <label>Password</label>
        <div class="form-group" style="margin-bottom: 15px">
            <input type="password" name="password" value="" placeholder="password"/>
        </div>
        <button class="btn btn-primary" id="btn-login" type="submit" style="margin-bottom: 15px">Login</button>
    </form>
  </div>
  `);
}

var renderCategorySelect = (t) => {
    var categoryForm = document.getElementById("category-form");
    var formHTML;
    for (var i = 0, len = t.length; i < len; i++) {
        formHTML += '<option value="' + t[i]['id'] + '">' + t[i]['name'] + '</option>';
    }
    categoryForm.innerHTML = `
        <form name="categories">
            <!--<label>Category</label>-->
            <select name="category">
            ${formHTML}
            </select>
        </form>
    `;
}

var renderMessage = (message) => {
  var displayContainer = document.getElementById("display-container");
  displayContainer.innerHTML = `<p class='message'>${message}</p>`;
}

var renderBookmark = (data) => {
    var displayContainer = document.getElementById("display-container");
    var titleContainer = document.getElementById("title-container");
  if(data) {
    var tmpl = template(data);
      titleContainer.innerHTML = "<h3 class='title'>" + data.title + "</h3>";
      get_categories();
      displayContainer.innerHTML = tmpl;
  } else {
    renderMessage("Sorry, could not extract this page's title and URL");
  }
}

ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
  var activeTab = tabs[0];
  //chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, renderBookmark);
});

popup.addEventListener("click", function(e) {
  if(e.target && e.target.matches("#save-btn")) {
    e.preventDefault();
    var data = e.target.getAttribute("data-bookmark");
    //console.log(data);
    ext.runtime.sendMessage({ action: "perform-save", data: data }, function(response) {
        //console.log('message sent');
        if(response && response.action === "saved") {
        renderMessage("Your bookmark was saved successfully.");
      } else {
        renderMessage("Sorry, there was an error while saving your bookmark.");
      }
    })
  }
});

popup.addEventListener("click", function(e) {
    if(e.target && e.target.matches("#btn-login")) {
        e.preventDefault();
        var username = document.getElementById("troovyLoginForm").username.value;
        var password = document.getElementById("troovyLoginForm").password.value;
        get_troovy_token(username,password);
    }
});

var optionsLink = document.querySelector(".js-options");
optionsLink.addEventListener("click", function(e) {
  e.preventDefault();
  ext.tabs.create({'url': ext.extension.getURL('options.html')});
})
