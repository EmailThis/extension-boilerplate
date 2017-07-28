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

function checkAuth() {
  storage.get('token', resp => {
    let token = resp.token;

    console.log('token found: ' + token);

    if (token) {

      // @ToDo: Figure out what this is for and if it is needed.
      //get_categories();

      // @ToDo: Implement this.
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

function scanPage() {
  ext.tabs.query({active: true, currentWindow: true}, tabs => {

    let activeTab = tabs[0];

    chrome.tabs.sendMessage(activeTab.id, {action: 'process-page'}, renderBookmark);
  });
}

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
