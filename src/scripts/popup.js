import ext from './utils/ext';
import storage from './utils/storage';

const popup           = document.getElementById('app');
const troovyLoginForm = document.getElementById('troovyLoginForm');

let userToken;
let __requestCode;
let __accessTokenString;

window.onload = () => {
  checkAuth();
};

storage.get('color', resp => {
  let color = resp.color;

  if (color) {
    popup.style.backgroundColor = color;
  }
});

function checkAuth() {
  storage.get('token', resp => {
    let token = resp.token;

    console.log('token found: ' + token);

    if (token) {

      // @ToDo: Figure out what this is for and if it is needed.
      //get_categories();

      scanPage();

      userToken = token;
    } else {
      // Show login form
      console.log('no token found');

      let displayContainer = document.getElementById('display-container');
      let tmpl             = loginForm();

      displayContainer.innerHTML = tmpl;
    }
  });
}

const renderBookmark = data => {
  let displayContainer = document.getElementById('display-container');
  let titleContainer   = document.getElementById('title-container');

  if (data) {
    let tmpl = template(data);

    titleContainer.innerHTML = '<h3 class=\'title\'>' + data.title + '</h3>';

    getCategories();

    displayContainer.innerHTML = tmpl;
  } else {
    renderMessage('Sorry, could not extract this page\'s title and URL');
  }
};

const renderMessage = message => {
  let displayContainer = document.getElementById('display-container');

  displayContainer.innerHTML = `<p class='message'>${message}</p>`;
};

function getCategories() {
  storage.get('token', function (resp) {
    let token = resp.token;

    if (token) {
      let xmlhttp = makeXMLHttpRequest('GET', 'http://troovy.app/api/categories', true, token);

      xmlhttp.send();
      xmlhttp.onreadystatechange = () => {
        //console.log('readystate run');

        if (xmlhttp.readyState === 4) {
          if (xmlhttp.status === 200) {
            let response = xmlhttp.responseText;
            let t        = JSON.parse(response);

            storage.set({cacheCategories: t, cacheTime: Date.now()}, function () {
              //callback(t);
            });

            renderCategorySelect(t);
          }
        }
      };
    }
  });
}

const renderCategorySelect = t => {
  let categoryForm = document.getElementById('category-form');
  let formHTML;

  for (let i = 0, len = t.length; i < len; i++) {
    formHTML += '<option value="' + t[i]['id'] + '">' + t[i]['name'] + '</option>';
  }

  // @ToDo: Move this into the templates module.
  categoryForm.innerHTML = `
        <form name="categories">
            <!--<label>Category</label>-->
            <select name="category" id="cat-select">
            ${formHTML}
            </select>
        </form>
    `;
};

function scanPage() {
  ext.tabs.query({active: true, currentWindow: true}, tabs => {

    let activeTab = tabs[0];

    chrome.tabs.sendMessage(activeTab.id, {action: 'process-page'}, renderBookmark);
  });
}

function makeXMLHttpRequest(method, url, flag, token = false) {
  let xmlhttp = new XMLHttpRequest();

  xmlhttp.open(method, url, flag);
  xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

  if (token) {
    xmlhttp.setRequestHeader('Authorization', `Bearer ${token}`);
    xmlhttp.setRequestHeader('Accept', 'application/json');
  }

  return xmlhttp;
}

function getTroovyToken(username, password) {
  console.log('getting troovy token...');
  console.log('username: ' + username + ' , password: ' + password);

  let xmlhttp = makeXMLHttpRequest('POST', 'http://app.troovy-stage.com/oauth/token', true);
  //let params = 'email=' + encodeURIComponent(formLogin.username.value) + '&password=' + encodeURIComponent(formLogin.password.value);
  let params  = `username=${encodeURIComponent(username)}
                &password=${encodeURIComponent(password)}
                &grant_type=password
                &client_id=2
                &client_secret=urV13VyBFn65JZL8Ckwe1VBDc38bPXtjGI4WJwM8
                &scope=*`;

  xmlhttp.send(params);
  xmlhttp.onreadystatechange = () => {

    //console.log('readystate run');
    if (xmlhttp.readyState === 4) {
      if (xmlhttp.status === 200) {
        let response = xmlhttp.responseText;
        //console.log('made it!');
        console.log(response);
        let t     = JSON.parse(response);
        let value = t.access_token;

        // Store our access token in local storage
        storage.set({
          'token': value
        }, () => {
          console.log(`The value stores was: ${value}`);
        });

        ext.tabs.query({active: true, currentWindow: true}, function (tabs) {
          let activeTab = tabs[0];

          chrome.tabs.sendMessage(activeTab.id, {action: 'process-page'}, renderBookmark);
        });
      }
      else {
        document.getElementById('progress-icon').innerHTML = '<img height=\'50px\' width=\'50px\' src=\'failed.png\'>';
        document.getElementById('progress-text').innerHTML = 'Authentication failed!!';
      }
    }
  };
}

ext.tabs.query({active: true, currentWindow: true}, tabs => {
  let activeTab = tabs[0];
  //chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, renderBookmark);
});

popup.addEventListener('click', event => {
  if (event.target && event.target.matches('#save-btn')) {
    event.preventDefault();

    let data   = event.target.getAttribute('data-bookmark');
    let sel    = document.getElementById('cat-select');
    let cat_id = Number(sel.options[sel.selectedIndex].value);

    let json_obj         = JSON.parse(data);
    json_obj.category_id = cat_id;
    data                 = JSON.stringify(json_obj);

    ext.runtime.sendMessage({action: 'perform-save', data: data}, response => {
      console.log('message sent');
      if (response && response.action === 'saved') {
        renderMessage('Your bookmark was saved successfully.');
      } else {
        console.log(response.action);
        //renderMessage("Sorry, there was an error while saving your bookmark.");
      }
    });
  }
});

popup.addEventListener('click', event => {
  if (event.target && event.target.matches('#btn-login')) {
    event.preventDefault();

    let username = document.getElementById('troovyLoginForm').username.value;
    let password = document.getElementById('troovyLoginForm').password.value;
    getTroovyToken(username, password);
  }
});

const optionsLink = document.querySelector('.js-options');

optionsLink.addEventListener('click', event => {
  event.preventDefault();
  ext.tabs.create({'url': ext.extension.getURL('options.html')});
});

// ----------------------------------------------------------------------------
// @ToDo: Move templates to a separate module to keep code clean and organized.
// ----------------------------------------------------------------------------
const loginForm = () => {
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
};

const template = data => {
  let json = JSON.stringify(data);

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
};

const templateOG = data => {
  let json = JSON.stringify(data);

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
};
