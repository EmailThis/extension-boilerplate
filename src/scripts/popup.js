import ext from './utils/ext';
import storage from './utils/storage';
import * as Templates from './utils/templates';
import Auth from './utils/auth';

const auth = new Auth();

// DOM elements.
const popup            = document.getElementById('app');
const optionsLink      = document.querySelector('.js-options');
const contentWrapper   = document.querySelector('.content-wrapper');
const contentContainer = document.getElementById('display-container');
const loadingContainer = document.querySelector('.loading');
const feedbackMessage  = document.getElementById('feedback-message');

window.onload = () => {
  showLoading();
  setLoadingText('');

  auth.checkToken().then(() => {
    ext.tabs.query({active: true, currentWindow: true}, tabs => {

      let activeTab = tabs[0];

      chrome.tabs.sendMessage(activeTab.id, {action: 'process-page'}, renderBookmark);
    });
    hideLoading();
  }, () => {

    let displayContainer = document.getElementById('display-container');

    displayContainer.innerHTML = Templates.login();
    hideLoading();
  });
};

storage.get('color', resp => {
  let color = resp.color;

  if (color) {
    popup.style.backgroundColor = color;
  }
});

function renderBookmark(data) {
  let displayContainer = document.getElementById('display-container');
  let titleContainer   = document.getElementById('title-container');

  if (data) {
    let tmpl = Templates.main(data);

    titleContainer.innerHTML = '<h3 class=\'title\'>' + data.title + '</h3>';

    getCategories();

    displayContainer.innerHTML = tmpl;

    return false;
  }

  showFeedbackMessage('Sorry, could not extract this page\'s title and URL');
}

// @ToDo: Replace storage.get method with auth module authentication one.
function getCategories() {
  if (auth.isAuthenticated) {
    let token   = auth.token;
    let xmlhttp = new XMLHttpRequest();

    xmlhttp.open('GET', 'https://troovy-stage.com/api/categories', true);
    xmlhttp.setRequestHeader('Authorization', `Bearer ${token}`);
    xmlhttp.setRequestHeader('Accept', 'application/json');

    xmlhttp.send();
    xmlhttp.onreadystatechange = () => {

      if (xmlhttp.readyState === 4) {
        if (xmlhttp.status === 200) {
          let response = xmlhttp.responseText;
          let t        = JSON.parse(response);

          storage.set({cacheCategories: t, cacheTime: Date.now()}, function () {
            //callback(t);
          });

          let categoryForm = document.getElementById('category-form');

          categoryForm.innerHTML = Templates.categorySelect(t);
        }
      }
    };
  }
}

ext.tabs.query({active: true, currentWindow: true}, tabs => {
  let activeTab = tabs[0];
  //chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, renderBookmark);
});

popup.addEventListener('click', event => {
  if (event.target && event.target.matches('#save-btn')) {
    event.preventDefault();

    let data   = {
      title      : document.getElementById('bookmark-title').value,
      url        : document.getElementById('bookmark-url').value,
      description: document.getElementById('bookmark-description').value
    };
    let sel    = document.getElementById('cat-select');

    data.category_id = Number(sel.options[sel.selectedIndex].value);

    console.log('Sending request...');

    showLoading();
    setLoadingText('Saving bookmark');

    ext.runtime.sendMessage({action: 'perform-save', data: data, auth: auth, secret: auth.secret}, response => {

      let message = 'Sorry, there was an error while saving your bookmark.';
      if (response && response.action === 'saved') {
        message = 'Your bookmark was saved successfully.';
      } else {
        console.log(response.action);
      }

      showFeedbackMessage(message);
    });

    return;
  }

  if (event.target && event.target.matches('#btn-login')) {
    event.preventDefault();

    let username = document.getElementById('troovyLoginForm').username.value;
    let password = document.getElementById('troovyLoginForm').password.value;

    showLoading();
    setLoadingText('Authenticating...');

    auth.getToken(username, password, () => {
      ext.tabs.query({active: true, currentWindow: true}, tabs => {
        let activeTab = tabs[0];

        chrome.tabs.sendMessage(activeTab.id, {action: 'process-page'}, renderBookmark);
      });

      hideLoading();
    });
  }
});

optionsLink.addEventListener('click', event => {
  event.preventDefault();
  ext.tabs.create({'url': ext.extension.getURL('options.html')});
});

/**
 * Helper Classes.
 * Handle showing/hiding of loading, content and feedback message elements.
 * This classes are handled separately due to the use of transitions on the styling, to wait for them
 * and avoid overlapping.
 */
function setFeedbackMessage(message) {
  feedbackMessage.innerHTML = `<p class='message'>${message}</p>`;
}

function showFeedbackMessage(message) {
  contentWrapper.classList.add('hide');
  loadingContainer.classList.add('hide');
  setTimeout(() => {
    contentWrapper.style.display   = 'none';
    loadingContainer.style.display = 'none';

    setFeedbackMessage(message);
    feedbackMessage.classList.remove('hide');
  }, 500);
}

function showLoading() {
  contentWrapper.classList.add('hide');

  setTimeout(() => {
    contentWrapper.style.display   = 'none';
    loadingContainer.style.display = 'block';
    loadingContainer.classList.remove('hide');
  }, 500);
}

function hideLoading() {
  loadingContainer.classList.add('hide');

  setTimeout(() => {
    contentWrapper.style.display   = 'block';
    loadingContainer.style.display = 'none';
    contentWrapper.classList.remove('hide');

    setLoadingText(''); // Resets text to avoid jumps when showing loading again.
  }, 500);
}

function setLoadingText(message = false) {
  if (message !== false) {
    loadingContainer.children['progress-text'].innerHTML = message;
  }
}

